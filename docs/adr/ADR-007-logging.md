# ADR-007 — Logging & developer telemetry

- **Status**: Accepted
- **Date**: 2026-04-21
- **Deciders**: Miguel Soler (fancylab)
- **Phase**: F0
- **Related**: ADR-004 (tooling), ADR-006 (performance)

## Context

Miguel set three requirements:

1. **Console logs on client, clean and organized.** No noise in the merchant's browser console.
2. **Do NOT load client logic to support logging.** Production bundles must not carry development-only debug/trace code.
3. **Errors collected locally on the dev's machine, in a gitignored folder**, so the developer can review them without the frontend carrying the weight.

The threefold goal: **great DX during development, minimal weight in production, zero third-party telemetry on client stores**.

## Decision

### 1. A single logger module

All client-side logging flows through `fancyfy/shared/logger.ts`. No `console.log / warn / error` calls anywhere else in fancyfy code. Enforced by ESLint rule `no-restricted-syntax` targeting `CallExpression[callee.object.name='console']` outside this module.

### 2. API

```ts
// fancyfy/shared/logger.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: unknown, context?: Record<string, unknown>): void;
  time(label: string): () => void;     // returns a stop function
}

export function createLogger(namespace: string): Logger { /* ... */ }
```

Usage in sections:

```ts
import { createLogger } from '@fancyfy/shared/logger';
const log = createLogger('megamenu');

log.debug('panel opened', { itemId });
log.warn('fallback layout applied', { reason: 'too-many-columns' });
log.error('hydration failed', err, { itemId });
const stop = log.time('init');
// ...
stop(); // prints duration if level enabled
```

### 3. Levels & output format

- **debug**: dev-time verbose traces (events, state changes). Stripped in prod.
- **info**: notable lifecycle events (section initialized). Stripped in prod.
- **warn**: graceful degradations (fallback used, feature-detect miss). Kept in prod.
- **error**: uncaught/rethrown errors. Kept in prod.

Output format (development):

```
[fcy:megamenu] debug panel opened { itemId: "brands" } +3ms
```

Format pieces:
- `[fcy:<namespace>]` — fixed prefix for grepability.
- level in lowercase.
- message + structured context as a separate object (not interpolated, so devtools can expand it).
- time delta from previous log in same namespace.

In production, `warn` and `error` use the same format but without the time delta.

### 4. Dead-code elimination in production builds

The logger file contains compile-time checks gated by a constant:

```ts
// fancyfy/shared/logger.ts
declare const __FCY_DEV__: boolean;

export function createLogger(ns: string): Logger {
  return {
    debug: __FCY_DEV__ ? (m, c) => print(ns, 'debug', m, c) : noop,
    info:  __FCY_DEV__ ? (m, c) => print(ns, 'info',  m, c) : noop,
    warn:  (m, c) => print(ns, 'warn',  m, c),
    error: (m, e, c) => print(ns, 'error', m, { error: serializeError(e), ...c }),
    time:  __FCY_DEV__ ? (l) => startTimer(ns, l) : () => noop,
  };
}
```

Vite (ADR-004) defines `__FCY_DEV__` as a literal `true` in development and `false` in production. Combined with terser's dead-code elimination, `debug` / `info` / `time` branches collapse to `() => {}` and get removed — **zero bytes shipped for debug/info logic in prod**.

### 5. Error capture in production

In production, errors caught inside fancyfy sections go through `log.error()`. The logger:

- Prints once to `console.error` (merchants who open devtools see a structured error).
- Never re-throws (caller decides).
- Never ships data off the page.

Global window-level handlers (`error`, `unhandledrejection`) are NOT attached by fancyfy in production. The merchant's own analytics / error tracking owns that. Attaching global handlers risks duplicate reporting with the merchant's tools.

### 6. Developer-machine error log sink (dev-only)

When a dev runs `npm run dev:logs`, a tiny Node service (`fancyfy/cli/log-collector.ts`) starts at `http://localhost:8787`. In dev builds only, the logger opens a WebSocket to it and streams `warn` + `error` entries.

The service writes entries to `.fancyfy-logs/errors-YYYY-MM-DD.jsonl` at the repo root. The folder is in `.gitignore`.

- Rotation: one file per day.
- Format: one JSON object per line, with fields `{ ts, level, namespace, message, context, userAgent, url }`.
- Retention: dev's own responsibility (folder is local-only).
- Security: the service binds to `127.0.0.1` only. It refuses connections with missing or incorrect origin header to prevent accidental leaks if another process guesses the port.

The WebSocket code in `logger.ts` is stripped in prod builds (same `__FCY_DEV__` mechanism), so production bundles never carry a network client for logging.

### 7. Performance marks as logs

The logger's `time(label)` integrates with Performance API:

- Start calls `performance.mark(\`fcy:${ns}:${label}:start\`)`.
- Stop calls `performance.mark(...:end)` and `performance.measure(\`fcy:${ns}:${label}\`, start, end)`.
- In dev, also logs the measured duration.
- In prod, `time` is a no-op.

This gives a consistent way to instrument sections for dev-only diagnostics without production cost.

### 8. Long Animation Frames subscription (dev-only)

In dev builds, the logger sets up a `PerformanceObserver` for `'long-animation-frame'` entries and logs any over 80ms with the offending script if identifiable.

```
[fcy:perf] warn long animation frame { duration: 124, blockingDuration: 98, scripts: [...] }
```

Useful for INP diagnostics during development. Stripped in prod.

### 9. What gets shipped to merchants

A production bundle of any fancyfy section contains:

- `warn` and `error` paths of the logger (small: a format function + `console.warn/error` wrappers).
- No debug/info code.
- No WebSocket / HTTP client for log shipping.
- No LoAF / PerformanceObserver for telemetry.
- Total estimated overhead: < 300 bytes gzipped per unique namespace, shared across all sections using the logger.

This satisfies Miguel's constraint: **"que no cargue la lógica del cliente."**

### 10. Developer ergonomics

- `window.__fcy_log?.setLevel('debug')` — runtime override (dev only; the setter doesn't exist in prod).
- `window.__fcy_perf?.()` — dumps a `console.table` of all `performance.measure` entries with `fcy:` prefix.
- Localized colors in dev output: warn = yellow, error = red, info = cyan, debug = grey — via the standard `%c` console formatting.

## Consequences

**Positive:**

- Consistent, greppable log format across all sections.
- Production bundles carry minimal overhead; debug paths are compile-eliminated.
- Dev gets a persistent local error log without the merchant's store shipping data anywhere.
- Performance timing is native (`performance.measure`), observable in DevTools Performance tab without our tooling.
- No vendor lock-in, no third-party telemetry surface on merchant stores — respects each client's own analytics choices.

**Negative / accepted costs:**

- ESLint rule enforcement means direct `console.*` calls are not allowed, which surprises newcomers. Mitigated by the lint error message pointing to `@fancyfy/shared/logger`.
- Devs have to start a separate process (`npm run dev:logs`) to capture local errors. Opt-in; most won't need it daily.
- The WebSocket client for the dev collector is a small feature to maintain. We accept it because it stays out of production.

## Alternatives considered

- **Ship an error tracker (Sentry, Bugsnag) in prod.** Rejected: adds bytes, privacy surface, and duplicates what merchants' own analytics may already do.
- **No logger at all, just `console.*` everywhere.** Rejected: no dev/prod gating, no structured format, no dead-code elimination.
- **A server-side log aggregator hosted by fancylab.** Rejected: operational overhead; still adds runtime bytes to ship data.
- **Browser-extension-based dev logging.** Rejected: requires users to install something; fragile across browsers.
- **Write logs to `localStorage` in prod as a buffer.** Rejected: doesn't move us anywhere useful if we're not shipping them off; pollutes merchants' storage.
