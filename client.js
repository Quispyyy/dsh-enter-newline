/**
 * dsh-enter-newline — browser half.
 *
 * Goal: plain Enter inserts a line break in the composer, while Ctrl/Cmd+Enter
 * keeps sending (that gesture already sends in stock DSH).
 *
 * How: DSH's composer keymap treats Shift+Enter as "let the editor handle it"
 * (line break) and everything else as "submit". We intercept the keydown in the
 * capture phase before the editor sees it and re-label a plain Enter as
 * Shift+Enter, so the untouched built-in handler does the right thing.
 *
 * Skipped on purpose: Ctrl/Cmd/Alt/Shift combos (native behaviour), IME
 * composition, and open composer menus (`/` commands, `@` mentions) where Enter
 * must pick an item.
 */
window.__ModuleLoader__.load({
  id: 'dsh-enter-newline',
  factory: (require) => {
    const module = { exports: {} }

    const COMPOSER = '[data-lexical-editor="true"]'
    const REPLAYED = '__dshEnterNewlineReplay'

    function composerOf(target) {
      if (target === null || target === undefined) return null
      if (typeof target.closest !== 'function') return null
      const root = target.closest(COMPOSER)
      return root instanceof HTMLElement ? root : null
    }

    function menuIsOpen() {
      const boxes = document.querySelectorAll('[role="listbox"]')
      for (const box of boxes) {
        if (box.getClientRects().length === 0) continue
        if (box.querySelector('[role="option"]') !== null) return true
      }
      return false
    }

    function isPlainEnter(event) {
      if (event.key !== 'Enter') return false
      if (event.isComposing === true || event.keyCode === 229) return false
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false
      if (typeof event.getModifierState === 'function' && event.getModifierState('AltGraph')) return false
      if (composerOf(event.target) === null) return false
      return true
    }

    function onKeyDown(event) {
      if (event[REPLAYED] === true) return
      if (event.defaultPrevented) return
      if (!isPlainEnter(event)) return
      if (menuIsOpen()) return

      // Re-label this very event as Shift+Enter. The built-in keymap sees
      // shiftKey === true, declines to submit, and the editor inserts a break.
      try {
        Object.defineProperty(event, 'shiftKey', {
          configurable: true,
          enumerable: true,
          value: true,
        })
        return
      } catch (error) {
        // Fall through: replay as a synthetic Shift+Enter instead.
      }

      const root = composerOf(event.target)
      if (root === null) return
      event.preventDefault()
      const replay = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
        composed: true,
      })
      Object.defineProperty(replay, REPLAYED, { value: true })
      root.dispatchEvent(replay)
    }

    function apply(ctx) {
      const attach = () => {
        window.addEventListener('keydown', onKeyDown, true)
        return () => window.removeEventListener('keydown', onKeyDown, true)
      }
      if (ctx !== null && ctx !== undefined && typeof ctx.effect === 'function') {
        ctx.effect(attach, 'dsh-enter-newline: composer Enter inserts line break')
        return
      }
      attach()
    }

    module.exports = { apply }
    return module.exports
  },
})
