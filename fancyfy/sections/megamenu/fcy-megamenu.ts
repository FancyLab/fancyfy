import { FcyElement } from '@fancyfy/shared';

type OpenOn = 'hover' | 'click';

const BP_MD_QUERY = '(min-width: 48em)';
const MOUSE_LEAVE_CLOSE_MS = 120;

class FcyMegamenuElement extends FcyElement {
  static override sectionId = 'megamenu';

  private openOn: OpenOn = 'hover';
  private hoverOpenDelay = 120;
  private openTimer: number | null = null;
  private closeTimer: number | null = null;
  private mediaQuery: MediaQueryList | null = null;
  private triggers: HTMLButtonElement[] = [];

  protected override connected(): void {
    const on = (this.dataset['openOn'] ?? 'hover') as OpenOn;
    this.openOn = on === 'click' ? 'click' : 'hover';
    this.hoverOpenDelay = Number.parseInt(this.dataset['hoverDelay'] ?? '120', 10) || 0;

    this.mediaQuery = window.matchMedia(BP_MD_QUERY);
    this.on(this.mediaQuery as unknown as EventTarget, 'change', this.handleMediaChange);

    this.triggers = Array.from(
      this.querySelectorAll<HTMLButtonElement>('.fcy-megamenu__trigger[aria-haspopup="true"]'),
    );

    for (const trigger of this.triggers) {
      this.on(trigger, 'click', this.handleTriggerClick);
      this.on(trigger, 'keydown', this.handleTriggerKeydown);
    }

    const items = this.querySelectorAll<HTMLLIElement>('.fcy-megamenu__item.has-panel');
    for (const item of items) {
      this.on(item, 'mouseenter', () => this.handleItemMouseEnter(item));
      this.on(item, 'mouseleave', () => this.handleItemMouseLeave(item));
      this.on(item, 'focusout', (event) => this.handleItemFocusOut(item, event as FocusEvent));
    }

    this.on(document, 'click', this.handleDocumentClick);
    this.on(document, 'keydown', this.handleDocumentKeydown);

    this.log.debug('connected', {
      triggers: this.triggers.length,
      openOn: this.openOn,
      hoverDelay: this.hoverOpenDelay,
    });
  }

  protected override disconnected(): void {
    this.clearTimers();
  }

  // ──────────────────────────────────────────────
  // Event handlers (bound as arrow properties
  // so `this` is stable and `on()` can remove them)
  // ──────────────────────────────────────────────

  private readonly handleTriggerClick = (event: Event): void => {
    event.preventDefault();
    const trigger = event.currentTarget as HTMLButtonElement;
    const item = trigger.closest<HTMLLIElement>('.fcy-megamenu__item');
    if (!item) return;
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      this.close(item);
    } else {
      this.closeAll();
      this.open(item);
    }
  };

  private readonly handleTriggerKeydown = (event: Event): void => {
    const kb = event as KeyboardEvent;
    const trigger = kb.currentTarget as HTMLButtonElement;
    const item = trigger.closest<HTMLLIElement>('.fcy-megamenu__item');
    if (!item) return;

    switch (kb.key) {
      case 'ArrowRight':
      case 'ArrowLeft': {
        kb.preventDefault();
        this.focusSibling(trigger, kb.key === 'ArrowRight' ? 1 : -1);
        break;
      }
      case 'ArrowDown': {
        kb.preventDefault();
        this.closeAll();
        this.open(item);
        this.focusFirstInPanel(item);
        break;
      }
      case 'ArrowUp': {
        kb.preventDefault();
        this.closeAll();
        this.open(item);
        this.focusLastInPanel(item);
        break;
      }
      case 'Escape': {
        kb.preventDefault();
        this.closeAll();
        trigger.focus();
        break;
      }
      case 'Home': {
        kb.preventDefault();
        this.triggers[0]?.focus();
        break;
      }
      case 'End': {
        kb.preventDefault();
        this.triggers[this.triggers.length - 1]?.focus();
        break;
      }
    }
  };

  private readonly handleDocumentClick = (event: Event): void => {
    const target = event.target as Node | null;
    if (target && !this.contains(target)) {
      this.closeAll();
    }
  };

  private readonly handleDocumentKeydown = (event: Event): void => {
    if ((event as KeyboardEvent).key === 'Escape') {
      this.closeAll();
    }
  };

  private readonly handleMediaChange = (): void => {
    // Close any open panel when crossing breakpoints — layouts change.
    this.closeAll();
    this.clearTimers();
  };

  private handleItemMouseEnter(item: HTMLLIElement): void {
    if (!this.isDesktop() || this.openOn !== 'hover') return;
    this.cancelCloseTimer();
    if (this.openTimer !== null) window.clearTimeout(this.openTimer);
    this.openTimer = window.setTimeout(() => {
      this.closeAll();
      this.open(item);
      this.openTimer = null;
    }, this.hoverOpenDelay);
  }

  private handleItemMouseLeave(item: HTMLLIElement): void {
    if (!this.isDesktop() || this.openOn !== 'hover') return;
    if (this.openTimer !== null) {
      window.clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    this.cancelCloseTimer();
    this.closeTimer = window.setTimeout(() => {
      if (!item.matches(':hover') && !item.contains(document.activeElement)) {
        this.close(item);
      }
      this.closeTimer = null;
    }, MOUSE_LEAVE_CLOSE_MS);
  }

  private handleItemFocusOut(item: HTMLLIElement, event: FocusEvent): void {
    // If focus leaves the entire item (not moving to a child), close.
    const related = event.relatedTarget as Node | null;
    if (related && item.contains(related)) return;
    // Delay to let other handlers process (e.g., a focus transferring to a sibling).
    window.setTimeout(() => {
      if (!item.contains(document.activeElement)) {
        this.close(item);
      }
    }, 0);
  }

  // ──────────────────────────────────────────────
  // Open/close
  // ──────────────────────────────────────────────

  private open(item: HTMLLIElement): void {
    const trigger = item.querySelector<HTMLButtonElement>('.fcy-megamenu__trigger');
    const panel = item.querySelector<HTMLElement>('.fcy-megamenu__panel');
    if (!trigger || !panel) return;
    trigger.setAttribute('aria-expanded', 'true');
    panel.removeAttribute('hidden');
    this.log.debug('panel opened', { handle: item.dataset['handle'] });
  }

  private close(item: HTMLLIElement): void {
    const trigger = item.querySelector<HTMLButtonElement>('.fcy-megamenu__trigger');
    const panel = item.querySelector<HTMLElement>('.fcy-megamenu__panel');
    if (!trigger || !panel) return;
    trigger.setAttribute('aria-expanded', 'false');
    panel.setAttribute('hidden', '');
  }

  private closeAll(): void {
    const items = this.querySelectorAll<HTMLLIElement>('.fcy-megamenu__item.has-panel');
    for (const item of items) this.close(item);
  }

  // ──────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────

  private isDesktop(): boolean {
    return this.mediaQuery?.matches === true;
  }

  private focusSibling(current: HTMLButtonElement, direction: 1 | -1): void {
    const siblings = this.triggers;
    const idx = siblings.indexOf(current);
    if (idx < 0) return;
    const nextIdx = (idx + direction + siblings.length) % siblings.length;
    siblings[nextIdx]?.focus();
  }

  private focusFirstInPanel(item: HTMLLIElement): void {
    const panel = item.querySelector<HTMLElement>('.fcy-megamenu__panel');
    const first = panel?.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    first?.focus();
  }

  private focusLastInPanel(item: HTMLLIElement): void {
    const panel = item.querySelector<HTMLElement>('.fcy-megamenu__panel');
    const candidates = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const last = candidates?.[candidates.length - 1];
    last?.focus();
  }

  private cancelCloseTimer(): void {
    if (this.closeTimer !== null) {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private clearTimers(): void {
    if (this.openTimer !== null) {
      window.clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    this.cancelCloseTimer();
  }
}

if (!customElements.get('fcy-megamenu')) {
  customElements.define('fcy-megamenu', FcyMegamenuElement);
}
