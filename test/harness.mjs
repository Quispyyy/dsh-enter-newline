// Offline harness for client.js: stubs just enough DOM to exercise the keydown logic.
import assert from 'node:assert'

class HTMLElement {}
class FakeRoot extends HTMLElement {}

const listeners = []
let menuBoxes = []

globalThis.HTMLElement = HTMLElement
globalThis.window = {
  addEventListener: (type, fn, capture) => listeners.push({ type, fn, capture }),
  removeEventListener: () => {},
}
globalThis.document = {
  querySelectorAll: (selector) => (selector === '[role="listbox"]' ? menuBoxes : []),
}

let moduleExports = null
globalThis.window.__ModuleLoader__ = {
  load: ({ id, factory }) => {
    moduleExports = factory(() => ({}))
  },
}

await import('../client.js')
assert.ok(moduleExports && typeof moduleExports.apply === 'function', 'client exports apply()')

const registered = []
const ctx = { effect: (fn) => registered.push(fn()) }
moduleExports.apply(ctx)
assert.equal(listeners.length, 1, 'one keydown listener registered')
assert.equal(listeners[0].capture, true, 'capture phase')
const handle = listeners[0].fn

function editor() {
  const root = new FakeRoot()
  root.closest = (sel) => (sel === '[data-lexical-editor="true"]' ? root : null)
  return root
}

function keyEvent(target, init = {}) {
  return {
    key: 'Enter',
    keyCode: 13,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    isComposing: false,
    defaultPrevented: false,
    target,
    getModifierState: () => false,
    ...init,
  }
}

function visibleBox() {
  return { getClientRects: () => [{ width: 10 }], querySelector: (s) => (s === '[role="option"]' ? {} : null) }
}

// 1. plain Enter inside the composer -> re-labelled as Shift+Enter
{
  const e = keyEvent(editor())
  handle(e)
  assert.equal(e.shiftKey, true, 'plain Enter becomes Shift+Enter')
}

// 2. modified Enter is left alone
for (const mod of ['ctrlKey', 'metaKey', 'altKey', 'shiftKey']) {
  const e = keyEvent(editor(), { [mod]: true })
  handle(e)
  assert.equal(e.shiftKey, mod === 'shiftKey', `${mod} path untouched`)
}

// 3. IME composition is left alone
{
  const e = keyEvent(editor(), { isComposing: true })
  handle(e)
  assert.equal(e.shiftKey, false, 'IME untouched')
  const e2 = keyEvent(editor(), { keyCode: 229 })
  handle(e2)
  assert.equal(e2.shiftKey, false, 'keyCode 229 untouched')
}

// 4. open composer menu keeps its own Enter handling
{
  menuBoxes = [visibleBox()]
  const e = keyEvent(editor())
  handle(e)
  assert.equal(e.shiftKey, false, 'menu-open Enter untouched')
  menuBoxes = []
}

// 5. Enter outside the composer is untouched
{
  const e = keyEvent({ closest: () => null })
  handle(e)
  assert.equal(e.shiftKey, false, 'outside composer untouched')
}

console.log('all client.js keydown checks passed')
