import { expect } from '@esm-bundle/chai'

export function setupGlobalTestHooks() {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })
}

export async function waitForElement(element, property, timeout = 1000) {
  const start = Date.now()
  while (!element[property] && (Date.now() - start) < timeout) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  return element[property]
}

export async function setupInputTag(html) {
  document.body.innerHTML = html
  const inputTag = document.querySelector('input-tag')

  await waitForElement(inputTag, '_taggle')

  return inputTag
}

// Wait for basic initialization without requiring internal access
export async function waitForBasicInitialization(inputTag, timeout = 1000) {
  const start = Date.now()
  while ((Date.now() - start) < timeout) {
    // Wait for the component to be ready by checking if basic properties work
    if (inputTag.tags !== undefined && typeof inputTag.add === 'function' && inputTag._taggle) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  throw new Error('InputTag failed basic initialization within timeout')
}

export async function waitForUpdate(ms = 50) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

export function simulateKeydown(element, keyCode, options = {}) {
  const event = new KeyboardEvent('keydown', {
    keyCode,
    which: keyCode,
    bubbles: true,
    ...options
  })
  element.dispatchEvent(event)
  return event
}

export function simulateKeyup(element, keyCode, options = {}) {
  const event = new KeyboardEvent('keyup', {
    keyCode,
    which: keyCode,
    bubbles: true,
    ...options
  })
  element.dispatchEvent(event)
  return event
}

export function simulateInput(element, value) {
  element.value = value
  const event = new Event('input', { bubbles: true })
  element.dispatchEvent(event)
  return event
}

// Simulate user typing in the input-tag's internal input
export function simulateUserInput(inputTag, value) {
  // Focus the element first (user would click/focus)
  inputTag.focus()

  // Find the actual input element by looking for it in the shadow DOM
  const input = findInternalInput(inputTag)
  if (input) {
    simulateInput(input, value)
  }
  return input
}

// Helper to find the internal input without using private properties
function findInternalInput(inputTag) {
  // Look for input elements in the shadow DOM
  const inputs = inputTag.shadowRoot?.querySelectorAll('input')
  // Return the first input that's not hidden
  return Array.from(inputs || []).find(input =>
    input.type !== 'hidden' &&
    getComputedStyle(input).display !== 'none'
  )
}

// Simulate user typing and pressing enter to add a tag
export async function simulateUserAddTag(inputTag, value) {
  const input = simulateUserInput(inputTag, value)
  if (input) {
    simulateKeydown(input, KEYCODES.ENTER)
  }
  await waitForUpdate()
}

// Simulate user typing and pressing specific key to add a tag
export async function simulateUserAddTagWithKey(inputTag, value, keyCode) {
  const input = simulateUserInput(inputTag, value)
  if (input) {
    simulateKeydown(input, keyCode)
  }
  await waitForUpdate()
  return input
}

export function simulateClick(element) {
  const event = new MouseEvent('click', { bubbles: true })
  element.dispatchEvent(event)
  return event
}

export function simulateFocus(element) {
  const event = new FocusEvent('focus', { bubbles: true })
  element.dispatchEvent(event)
  return event
}

export function simulateBlur(element) {
  const event = new FocusEvent('blur', { bubbles: true })
  element.dispatchEvent(event)
  return event
}

export function expectEventToFire(element, eventName) {
  return new Promise(resolve => {
    let eventFired = false
    let eventData = null

    const handler = (e) => {
      eventFired = true
      eventData = {
        type: e.type,
        target: e.target,
        detail: e.detail,
        bubbles: e.bubbles,
        composed: e.composed
      }
      element.removeEventListener(eventName, handler)
      resolve({ eventFired, eventData })
    }

    element.addEventListener(eventName, handler)

    // Resolve after a timeout if event doesn't fire
    setTimeout(() => {
      element.removeEventListener(eventName, handler)
      resolve({ eventFired, eventData })
    }, 100)
  })
}

export function getTagElements(inputTag) {
  return Array.from(inputTag.children).filter(el => el.tagName.toLowerCase() === 'tag-option')
}

export function getTagValues(inputTag) {
  return getTagElements(inputTag).map(el => el.value)
}

export function clickTagRemoveButton(tagElement) {
  const button = tagElement.shadowRoot.querySelector('button')
  simulateClick(button)
}

export const KEYCODES = {
  BACKSPACE: 8,
  TAB: 9,
  ENTER: 13,
  DELETE: 46,
  COMMA: 188,
  ARROW_LEFT: 37,
  ARROW_RIGHT: 39
}
