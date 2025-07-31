import { expect } from '@esm-bundle/chai'
import { spy } from 'sinon'
import '../src/input-tag.js'
import {
  setupGlobalTestHooks,
  setupInputTag,
  waitForUpdate,
  expectEventToFire,
  simulateFocus,
  simulateBlur,
  getTagElements,
  getTagValues,
  clickTagRemoveButton
} from './lib/test-utils.js'

describe('Events', () => {
  setupGlobalTestHooks()

  describe('Change Events', () => {
    it('should fire change event when tags are added', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const eventPromise = expectEventToFire(inputTag, 'change')

      inputTag.add('new-tag')
      await waitForUpdate()

      const { eventFired, eventData } = await eventPromise
      expect(eventFired).to.be.true
      expect(eventData.bubbles).to.be.true
      expect(eventData.composed).to.be.true
    })

    it('should fire change event when tags are removed', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="remove-me">Remove Me</tag-option>
        </input-tag>
      `)

      const eventPromise = expectEventToFire(inputTag, 'change')

      inputTag.remove('remove-me')
      await waitForUpdate()

      const { eventFired } = await eventPromise
      expect(eventFired).to.be.true
    })

    it('should fire change event when value is set programmatically', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const eventPromise = expectEventToFire(inputTag, 'change')

      inputTag.value = ['programmatic-tag']
      await waitForUpdate()

      const { eventFired } = await eventPromise
      expect(eventFired).to.be.true
    })

    it('should not fire change event during initialization', async () => {
      let changeEventFired = false

      document.body.innerHTML = `
        <input-tag name="tags" multiple>
          <tag-option value="initial">Initial</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')

      inputTag.addEventListener('change', () => {
        changeEventFired = true
      })

      await waitForUpdate(200) // Wait longer for initialization

      expect(changeEventFired).to.be.false
    })

    it('should not fire change event when suppressEvents is true', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      let changeEventFired = false
      inputTag.addEventListener('change', () => {
        changeEventFired = true
      })

      inputTag.suppressEvents = true
      inputTag.add('suppressed-tag')
      await waitForUpdate()

      expect(changeEventFired).to.be.false
    })

    it('should not fire change event when values do not actually change', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="existing">Existing</tag-option>
        </input-tag>
      `)

      let changeEventFired = false
      inputTag.addEventListener('change', () => {
        changeEventFired = true
      })

      // Set the same value again
      inputTag.value = ['existing']
      await waitForUpdate()

      expect(changeEventFired).to.be.false
    })
  })

  describe('Update Events', () => {
    it('should fire update event when tag is added with correct detail', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const eventPromise = expectEventToFire(inputTag, 'update')

      inputTag.add('test-tag')
      await waitForUpdate()

      const { eventFired, eventData } = await eventPromise
      expect(eventFired).to.be.true
      expect(eventData.detail.tag).to.equal('test-tag')
      expect(eventData.bubbles).to.be.true
      expect(eventData.composed).to.be.true
    })

    it('should fire update event when tag is removed with correct detail', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="remove-me">Remove Me</tag-option>
        </input-tag>
      `)

      const eventPromise = expectEventToFire(inputTag, 'update')

      inputTag.remove('remove-me')
      await waitForUpdate()

      const { eventFired, eventData } = await eventPromise
      expect(eventFired).to.be.true
      expect(eventData.detail.tag).to.equal('remove-me')
    })

    it('should indicate if tag is new in update event detail', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="frameworks" list="suggestions" multiple></input-tag>
        <datalist id="suggestions">
          <option value="react">React</option>
          <option value="vue">Vue</option>
        </datalist>
      `)

      // Add a tag that exists in options (not new)
      let eventPromise = expectEventToFire(inputTag, 'update')
      inputTag.add('react')
      await waitForUpdate()

      let { eventData } = await eventPromise
      expect(eventData.detail.isNew).to.be.false

      // Add a tag that doesn't exist in options (is new)
      eventPromise = expectEventToFire(inputTag, 'update')
      inputTag.add('custom-framework')
      await waitForUpdate()

      const result = await eventPromise
      expect(result.eventData.detail.isNew).to.be.true
    })

    it('should not fire update event when suppressEvents is true', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      let updateEventFired = false
      inputTag.addEventListener('update', () => {
        updateEventFired = true
      })

      inputTag.suppressEvents = true
      inputTag.add('suppressed-tag')
      await waitForUpdate()

      expect(updateEventFired).to.be.false
    })

    it('should fire separate update events for multiple tag operations', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const updateEvents = []
      inputTag.addEventListener('update', (e) => {
        updateEvents.push(e.detail.tag)
      })

      inputTag.add('first')
      await waitForUpdate()
      inputTag.add('second')
      await waitForUpdate()

      expect(updateEvents).to.deep.equal(['first', 'second'])
    })
  })

  describe('Focus and Blur Events', () => {
    it('should handle focus on input-tag element', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const eventPromise = expectEventToFire(inputTag, 'focus')

      simulateFocus(inputTag)

      const { eventFired } = await eventPromise
      expect(eventFired).to.be.true
    })

    it('should focus internal input when input-tag is focused', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const focusSpy = spy(inputTag._taggleInputTarget, 'focus')

      inputTag.focus()
      await waitForUpdate()

      expect(focusSpy.called).to.be.true
      focusSpy.restore()
    })

    it('should handle blur events properly', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      inputTag.focus()
      await waitForUpdate()

      const eventPromise = expectEventToFire(inputTag._taggleInputTarget, 'blur')

      simulateBlur(inputTag._taggleInputTarget)

      const { eventFired } = await eventPromise
      expect(eventFired).to.be.true
    })
  })

  describe('Event Bubbling and Composition', () => {
    it('should have change events that bubble', async () => {
      document.body.innerHTML = `
        <div id="parent">
          <input-tag name="tags" multiple></input-tag>
        </div>
      `
      const parent = document.querySelector('#parent')
      const inputTag = document.querySelector('input-tag')

      await waitForUpdate(100) // Wait for initialization

      const eventPromise = expectEventToFire(parent, 'change')

      inputTag.add('bubbling-tag')
      await waitForUpdate()

      const { eventFired } = await eventPromise
      expect(eventFired).to.be.true
    })

    it('should have update events that bubble', async () => {
      document.body.innerHTML = `
        <div id="parent">
          <input-tag name="tags" multiple></input-tag>
        </div>
      `
      const parent = document.querySelector('#parent')
      const inputTag = document.querySelector('input-tag')

      await waitForUpdate(100) // Wait for initialization

      const eventPromise = expectEventToFire(parent, 'update')

      inputTag.add('bubbling-update')
      await waitForUpdate()

      const { eventFired } = await eventPromise
      expect(eventFired).to.be.true
    })

    it('should have composed events that cross shadow DOM boundaries', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      let composedEventReceived = false
      document.addEventListener('change', (e) => {
        if (e.target === inputTag) {
          composedEventReceived = true
        }
      })

      inputTag.add('composed-tag')
      await waitForUpdate()

      expect(composedEventReceived).to.be.true

      // Clean up
      document.removeEventListener('change', () => {})
    })
  })

  describe('Event Timing and Sequence', () => {
    it('should fire update event before change event', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const eventSequence = []

      inputTag.addEventListener('update', () => {
        eventSequence.push('update')
      })

      inputTag.addEventListener('change', () => {
        eventSequence.push('change')
      })

      inputTag.add('sequence-test')
      await waitForUpdate()

      expect(eventSequence).to.deep.equal(['update', 'change'])
    })

    it('should handle rapid event firing without issues', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const updateEvents = []
      const changeEvents = []

      inputTag.addEventListener('update', (e) => {
        updateEvents.push(e.detail.tag)
      })

      inputTag.addEventListener('change', () => {
        changeEvents.push('change')
      })

      // Rapid additions
      inputTag.add('rapid1')
      inputTag.add('rapid2')
      inputTag.add('rapid3')
      await waitForUpdate(100)

      expect(updateEvents).to.have.length(3)
      expect(changeEvents).to.have.length(3)
    })
  })

  describe('Event Cleanup and Memory Management', () => {
    it('should remove event listeners on disconnect', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const form = document.createElement('form')
      form.appendChild(inputTag)

      // Simulate disconnect
      inputTag.disconnectedCallback()

      // Should not throw or cause memory leaks
      expect(() => {
        form.reset()
      }).to.not.throw()
    })

    it('should handle form reset events properly after disconnect and reconnect', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="tags" multiple>
            <tag-option value="test">Test</tag-option>
          </input-tag>
        </form>
      `
      const form = document.querySelector('form')
      const inputTag = document.querySelector('input-tag')

      await waitForUpdate(100)

      // Remove and re-add to DOM
      form.removeChild(inputTag)
      await waitForUpdate()
      form.appendChild(inputTag)
      await waitForUpdate()

      // Should still work
      form.reset()
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(0)
    })
  })
})
