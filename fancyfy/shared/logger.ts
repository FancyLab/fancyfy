/**
 * fancyfy client-side logger — ADR-007.
 *
 * All fancyfy TypeScript MUST log through createLogger(). ESLint
 * (`no-restricted-syntax`) prevents direct `console.*` calls outside
 * this file.
 *
 * In production builds, Vite replaces `__FCY_DEV__` with `false` and
 * Rollup's DCE removes the debug/info/time branches entirely.
 * Only `warn` and `error` remain in the prod bundle.
 */

declare const __FCY_DEV__: boolean;

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: unknown, context?: Record<string, unknown>): void;
  /** Start a performance.mark; returns a stop function. No-op in prod. */
  time(label: string): () => void;
}

type LastTsMap = Map<string, number>;
const lastTs: LastTsMap = new Map();

// Small console-color map (devtools only renders these in %c mode).
const COLORS: Record<LogLevel, string> = {
  debug: 'color:#888;',
  info: 'color:#0bc;',
  warn: 'color:#d90; font-weight:bold;',
  error: 'color:#d33; font-weight:bold;',
};

function formatPrefix(ns: string, level: LogLevel): [string, string] {
  return [`%c[fcy:${ns}]%c ${level}`, COLORS[level] + 'font-weight:bold;'];
}

function tsDelta(ns: string): string {
  const now = performance.now();
  const last = lastTs.get(ns);
  lastTs.set(ns, now);
  if (last === undefined) return '';
  const d = Math.round(now - last);
  return ` +${d}ms`;
}

function serializeError(e: unknown): Record<string, unknown> {
  if (e instanceof Error) {
    return { name: e.name, message: e.message, stack: e.stack };
  }
  return { value: e };
}

function print(
  ns: string,
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): void {
  const [prefix, style] = formatPrefix(ns, level);
  const tail = __FCY_DEV__ ? tsDelta(ns) : '';
  const args: unknown[] = [prefix + ' ' + message + tail, style, 'color:inherit;font-weight:normal;'];
  if (context !== undefined) args.push(context);
  switch (level) {
    case 'debug':
      // eslint-disable-next-line no-restricted-syntax
      console.debug(...args);
      break;
    case 'info':
      // eslint-disable-next-line no-restricted-syntax
      console.info(...args);
      break;
    case 'warn':
      // eslint-disable-next-line no-restricted-syntax
      console.warn(...args);
      break;
    case 'error':
      // eslint-disable-next-line no-restricted-syntax
      console.error(...args);
      break;
  }
}

const noop = (): void => undefined;

export function createLogger(namespace: string): Logger {
  return {
    debug: __FCY_DEV__
      ? (message, context) => print(namespace, 'debug', message, context)
      : noop,
    info: __FCY_DEV__
      ? (message, context) => print(namespace, 'info', message, context)
      : noop,
    warn: (message, context) => print(namespace, 'warn', message, context),
    error: (message, error, context) =>
      print(namespace, 'error', message, {
        ...(error !== undefined ? { error: serializeError(error) } : {}),
        ...context,
      }),
    time: __FCY_DEV__
      ? (label: string): (() => void) => {
          const start = `fcy:${namespace}:${label}:start`;
          const end = `fcy:${namespace}:${label}:end`;
          const measure = `fcy:${namespace}:${label}`;
          performance.mark(start);
          return () => {
            performance.mark(end);
            try {
              performance.measure(measure, start, end);
              const entry = performance.getEntriesByName(measure).at(-1);
              if (entry) {
                print(namespace, 'debug', `${label} ${Math.round(entry.duration)}ms`);
              }
            } catch {
              // measure may fail if marks got cleared; ignore
            }
          };
        }
      : () => noop,
  };
}

// Dev-only: Long Animation Frames observer for INP diagnostics.
// Stripped in prod builds.
if (__FCY_DEV__ && typeof PerformanceObserver !== 'undefined') {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration >= 80) {
          const perf = createLogger('perf');
          perf.warn('long animation frame', {
            duration: Math.round(entry.duration),
            startTime: Math.round(entry.startTime),
          });
        }
      }
    });
    // 'long-animation-frame' is a newer entry type; guard against UAs that don't support it.
    observer.observe({ type: 'long-animation-frame', buffered: true });
  } catch {
    // UA doesn't support LoAF — ignore.
  }
}
