import { createLogger, type Logger } from './logger.js';

/**
 * Base class for every fancyfy web component.
 * See ADR-002 §7: sections MUST extend FcyElement (never raw HTMLElement).
 *
 * Provides:
 *   - a `log` property tied to the section's namespace
 *   - lifecycle hooks that funnel errors through the logger
 *   - a small `on()` helper for listener bookkeeping (auto-removed on disconnect)
 *
 * Usage:
 *   class FcyMegamenuElement extends FcyElement {
 *     static override sectionId = 'megamenu';
 *     protected override connected(): void {
 *       this.log.debug('connected');
 *       this.on(this, 'click', this.handleClick);
 *     }
 *   }
 *   customElements.define('fcy-megamenu', FcyMegamenuElement);
 */
export abstract class FcyElement extends HTMLElement {
  /** Override in subclass with the kebab-case section id (e.g., 'megamenu'). */
  static sectionId = 'unknown';

  protected readonly log: Logger;

  private readonly disposers: Array<() => void> = [];

  constructor() {
    super();
    const ctor = this.constructor as typeof FcyElement;
    this.log = createLogger(ctor.sectionId);
  }

  connectedCallback(): void {
    try {
      this.connected();
    } catch (err) {
      this.log.error('connectedCallback failed', err);
    }
  }

  disconnectedCallback(): void {
    try {
      for (const dispose of this.disposers.splice(0)) dispose();
      this.disconnected();
    } catch (err) {
      this.log.error('disconnectedCallback failed', err);
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    try {
      this.attributeChanged(name, oldValue, newValue);
    } catch (err) {
      this.log.error('attributeChangedCallback failed', err, { name });
    }
  }

  /** Override in subclass — connectedCallback wrapper. */
  protected connected(): void {
    /* no-op by default */
  }

  /** Override in subclass — disconnectedCallback wrapper. */
  protected disconnected(): void {
    /* no-op by default */
  }

  /** Override in subclass — attributeChangedCallback wrapper. */
  protected attributeChanged(_name: string, _oldValue: string | null, _newValue: string | null): void {
    /* no-op by default */
  }

  /**
   * Add an event listener that is automatically removed when this
   * element disconnects. Keeps sections from leaking listeners.
   */
  protected on<K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void;
  protected on(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions,
  ): void;
  protected on(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions,
  ): void {
    target.addEventListener(type, listener, options);
    this.disposers.push(() => target.removeEventListener(type, listener, options));
  }

  /** Register an arbitrary cleanup function. */
  protected disposer(fn: () => void): void {
    this.disposers.push(fn);
  }
}
