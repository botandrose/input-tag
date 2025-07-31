import { expect } from '@esm-bundle/chai'
import { spy } from 'sinon'
import '../src/input-tag.js'
import {
  setupGlobalTestHooks,
  setupInputTag,
  waitForUpdate,
  getTagElements,
  getTagValues
} from './lib/test-utils.js'

describe('API Methods', () => {
  setupGlobalTestHooks()

  describe('Focus Method', () => {
    it('should focus the internal input when focus() is called', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const focusSpy = spy(inputTag._taggleInputTarget, 'focus')

      inputTag.focus()
      await waitForUpdate()

      expect(focusSpy.called).to.be.true
      focusSpy.restore()
    })

    it('should work when called multiple times', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const focusSpy = spy(inputTag._taggleInputTarget, 'focus')

      inputTag.focus()
      inputTag.focus()
      inputTag.focus()
      await waitForUpdate()

      expect(focusSpy.callCount).to.be.at.least(3)
      focusSpy.restore()
    })

    it('should work even when element is not visible', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple style="display: none;"></input-tag>')

      // Should not throw error
      expect(() => {
        inputTag.focus()
      }).to.not.throw()
    })

    it('should handle focus when input-tag is disabled', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      // Disable the component
      inputTag.disable()

      // Focus should still work at the API level
      expect(() => {
        inputTag.focus()
      }).to.not.throw()
    })
  })

  describe('Reset Method', () => {
    it('should clear all tags when reset() is called', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="tag1">Tag 1</tag-option>
          <tag-option value="tag2">Tag 2</tag-option>
          <tag-option value="tag3">Tag 3</tag-option>
        </input-tag>
      `)

      expect(getTagElements(inputTag)).to.have.length(3)

      inputTag.reset()
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(0)
      expect(getTagValues(inputTag)).to.deep.equal([])
    })

    it('should clear input field when reset() is called', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      inputTag._taggleInputTarget.value = 'pending input'

      inputTag.reset()
      await waitForUpdate()

      expect(inputTag._taggleInputTarget.value).to.equal('')
    })

    it('should work on empty input-tag', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      expect(() => {
        inputTag.reset()
      }).to.not.throw()

      expect(getTagElements(inputTag)).to.have.length(0)
    })

    it('should work multiple times', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="test">Test</tag-option>
        </input-tag>
      `)

      inputTag.reset()
      inputTag.reset()
      inputTag.reset()
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(0)
    })

    it('should allow adding tags after reset', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="original">Original</tag-option>
        </input-tag>
      `)

      inputTag.reset()
      await waitForUpdate()

      inputTag.add('after-reset')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['after-reset'])
    })
  })

  describe('Validation Methods', () => {
    describe('checkValidity()', () => {
      it('should return true for valid non-required field', async () => {
        const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

        expect(inputTag.checkValidity()).to.be.true
      })

      it('should return false for empty required field', async () => {
        const inputTag = await setupInputTag('<input-tag name="tags" required multiple></input-tag>')

        expect(inputTag.checkValidity()).to.be.false
      })

      it('should return true for required field with tags', async () => {
        const inputTag = await setupInputTag(`
          <input-tag name="tags" required multiple>
            <tag-option value="present">Present</tag-option>
          </input-tag>
        `)

        expect(inputTag.checkValidity()).to.be.true
      })

      it('should update validity when tags are added to required field', async () => {
        const inputTag = await setupInputTag('<input-tag name="tags" required multiple></input-tag>')

        expect(inputTag.checkValidity()).to.be.false

        inputTag.add('new-tag')
        await waitForUpdate()

        expect(inputTag.checkValidity()).to.be.true
      })

      it('should update validity when tags are removed from required field', async () => {
        const inputTag = await setupInputTag(`
          <input-tag name="tags" required multiple>
            <tag-option value="only-tag">Only Tag</tag-option>
          </input-tag>
        `)

        expect(inputTag.checkValidity()).to.be.true

        inputTag.removeAll()
        await waitForUpdate()

        expect(inputTag.checkValidity()).to.be.false
      })

      it('should delegate to internal input validation', async () => {
        const inputTag = await setupInputTag('<input-tag name="tags" required multiple></input-tag>')

        // Set custom validity on internal input
        inputTag._taggleInputTarget.setCustomValidity('Custom error message')

        expect(inputTag.checkValidity()).to.be.false

        // Clear custom validity
        inputTag._taggleInputTarget.setCustomValidity('')
        inputTag.add('valid-tag')
        await waitForUpdate()

        expect(inputTag.checkValidity()).to.be.true
      })
    })

    describe('reportValidity()', () => {
      it('should return true for valid field', async () => {
        const inputTag = await setupInputTag(`
          <input-tag name="tags" required multiple>
            <tag-option value="valid">Valid</tag-option>
          </input-tag>
        `)

        expect(inputTag.reportValidity()).to.be.true
      })

      it('should return false for invalid field', async () => {
        const inputTag = await setupInputTag('<input-tag name="tags" required multiple></input-tag>')

        expect(inputTag.reportValidity()).to.be.false
      })

      it('should show validation message for invalid field', async () => {
        const inputTag = await setupInputTag('<input-tag name="tags" required multiple></input-tag>')

        // This would normally show browser validation UI
        const result = inputTag.reportValidity()

        expect(result).to.be.false
        expect(inputTag._taggleInputTarget.validationMessage).to.not.be.empty
      })

      it('should delegate to internal input reportValidity', async () => {
        const inputTag = await setupInputTag('<input-tag name="tags" required multiple></input-tag>')

        inputTag._taggleInputTarget.setCustomValidity('Custom validation message')

        const result = inputTag.reportValidity()

        expect(result).to.be.false
        expect(inputTag._taggleInputTarget.validationMessage).to.equal('Custom validation message')
      })
    })
  })

  describe('Value Getter and Setter', () => {
    describe('Value Getter', () => {
      it('should return array of tag values', async () => {
        const inputTag = await setupInputTag(`
          <input-tag name="tags" multiple>
            <tag-option value="tag1">Tag 1</tag-option>
            <tag-option value="tag2">Tag 2</tag-option>
          </input-tag>
        `)

        expect(inputTag.value).to.deep.equal(['tag1', 'tag2'])
      })

      it('should return empty array for no tags', async () => {
        const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

        expect(inputTag.value).to.deep.equal([])
      })

      it('should return current values after modifications', async () => {
        const inputTag = await setupInputTag(`
          <input-tag name="tags" multiple>
            <tag-option value="initial">Initial</tag-option>
          </input-tag>
        `)

        expect(inputTag.value).to.deep.equal(['initial'])

        inputTag.add('added')
        await waitForUpdate()

        expect(inputTag.value).to.deep.equal(['initial', 'added'])

        inputTag.remove('initial')
        await waitForUpdate()

        expect(inputTag.value).to.deep.equal(['added'])
      })
    })

    describe('Value Setter', () => {
      it('should set tag values from array', async () => {
        const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

        inputTag.value = ['new1', 'new2', 'new3']
        await waitForUpdate()

        expect(getTagElements(inputTag)).to.have.length(3)
        expect(getTagValues(inputTag)).to.deep.equal(['new1', 'new2', 'new3'])
      })

      it('should replace existing tags when setting value', async () => {
        const inputTag = await setupInputTag(`
          <input-tag name="tags" multiple>
            <tag-option value="old1">Old 1</tag-option>
            <tag-option value="old2">Old 2</tag-option>
          </input-tag>
        `)

        inputTag.value = ['replacement1', 'replacement2']
        await waitForUpdate()

        expect(getTagElements(inputTag)).to.have.length(2)
        expect(getTagValues(inputTag)).to.deep.equal(['replacement1', 'replacement2'])
      })

      it('should clear tags when setting empty array', async () => {
        const inputTag = await setupInputTag(`
          <input-tag name="tags" multiple>
            <tag-option value="will-be-cleared">Will Be Cleared</tag-option>
          </input-tag>
        `)

        inputTag.value = []
        await waitForUpdate()

        expect(getTagElements(inputTag)).to.have.length(0)
        expect(getTagValues(inputTag)).to.deep.equal([])
      })

      it('should handle single value in single-tag mode', async () => {
        const inputTag = await setupInputTag('<input-tag name="tag"></input-tag>')

        inputTag.value = ['single-value']
        await waitForUpdate()

        expect(getTagElements(inputTag)).to.have.length(1)
        expect(getTagValues(inputTag)).to.deep.equal(['single-value'])
      })

      it('should trigger change event when value is set programmatically', async () => {
        const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

        let changeEventFired = false
        inputTag.addEventListener('change', () => {
          changeEventFired = true
        })

        inputTag.value = ['programmatic']
        await waitForUpdate()

        expect(changeEventFired).to.be.true
      })

      it('should not trigger change event when value is set to same value', async () => {
        const inputTag = await setupInputTag(`
          <input-tag name="tags" multiple>
            <tag-option value="same">Same</tag-option>
          </input-tag>
        `)

        let changeEventFired = false
        inputTag.addEventListener('change', () => {
          changeEventFired = true
        })

        inputTag.value = ['same']
        await waitForUpdate()

        expect(changeEventFired).to.be.false
      })
    })
  })

  describe('Property Getters', () => {
    describe('Form Property', () => {
      it('should return associated form element', async () => {
        document.body.innerHTML = `
          <form id="test-form">
            <input-tag name="tags" multiple></input-tag>
          </form>
        `
        const form = document.querySelector('#test-form')
        const inputTag = document.querySelector('input-tag')

        await waitForUpdate(100)

        expect(inputTag.form).to.equal(form)
      })

      it('should return null when not in a form', async () => {
        const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

        expect(inputTag.form).to.be.null
      })
    })

    describe('Name Property', () => {
      it('should return name attribute value', async () => {
        const inputTag = await setupInputTag('<input-tag name="test-name" multiple></input-tag>')

        expect(inputTag.name).to.equal('test-name')
      })

      it('should return null when name attribute is not set', async () => {
        const inputTag = await setupInputTag('<input-tag multiple></input-tag>')

        expect(inputTag.name).to.be.null
      })

      it('should update when name attribute changes', async () => {
        const inputTag = await setupInputTag('<input-tag name="original-name" multiple></input-tag>')

        expect(inputTag.name).to.equal('original-name')

        inputTag.setAttribute('name', 'updated-name')
        expect(inputTag.name).to.equal('updated-name')
      })
    })

    describe('Options Property', () => {
      it('should return options from associated datalist', async () => {
        document.body.innerHTML = `
          <input-tag name="tags" list="test-list" multiple></input-tag>
          <datalist id="test-list">
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
          </datalist>
        `
        const inputTag = document.querySelector('input-tag')

        await waitForUpdate(100)

        expect(inputTag.options).to.deep.equal(['option1', 'option2'])
      })

      it('should return empty array when no datalist is associated', async () => {
        const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

        expect(inputTag.options).to.deep.equal([])
      })

      it('should update when datalist changes', async () => {
        document.body.innerHTML = `
          <input-tag name="tags" list="dynamic-list" multiple></input-tag>
          <datalist id="dynamic-list">
            <option value="initial">Initial</option>
          </datalist>
        `
        const inputTag = document.querySelector('input-tag')
        const datalist = document.querySelector('#dynamic-list')

        await waitForUpdate(100)

        expect(inputTag.options).to.deep.equal(['initial'])

        const newOption = document.createElement('option')
        newOption.value = 'added'
        datalist.appendChild(newOption)

        expect(inputTag.options).to.deep.equal(['initial', 'added'])
      })
    })
  })

  describe('Public API Methods', () => {
    it('should provide add/remove/removeAll methods', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      expect(typeof inputTag.add).to.equal('function')
      expect(typeof inputTag.remove).to.equal('function')
      expect(typeof inputTag.removeAll).to.equal('function')
      expect(typeof inputTag.has).to.equal('function')
    })

    it('should allow manipulation via public API methods', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      // Test add
      inputTag.add('public-api-tag')
      await waitForUpdate()

      expect(getTagValues(inputTag)).to.deep.equal(['public-api-tag'])

      // Test tags getter
      expect(inputTag.tags).to.deep.equal(['public-api-tag'])

      // Test has
      expect(inputTag.has('public-api-tag')).to.be.true
      expect(inputTag.has('nonexistent')).to.be.false

      // Test remove
      inputTag.remove('public-api-tag')
      await waitForUpdate()

      expect(getTagValues(inputTag)).to.deep.equal([])
    })

    it('should support disable and enable methods', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      expect(typeof inputTag.disable).to.equal('function')
      expect(typeof inputTag.enable).to.equal('function')
      
      // These should not throw
      expect(() => {
        inputTag.disable()
        inputTag.enable()
      }).to.not.throw()
    })

    it('should support addAt method for positional insertion', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="first">First</tag-option>
          <tag-option value="third">Third</tag-option>
        </input-tag>
      `)

      expect(typeof inputTag.addAt).to.equal('function')
      
      inputTag.addAt('second', 1)
      await waitForUpdate()

      expect(inputTag.tags).to.include.members(['first', 'third', 'second'])
    })
  })

  describe('Error Handling in API Methods', () => {
    it('should handle invalid parameters gracefully', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      // These should not throw errors
      expect(() => {
        inputTag.focus(null)
        inputTag.reset(undefined)
        inputTag.checkValidity('invalid-param')
        inputTag.reportValidity({})
      }).to.not.throw()
    })

    it('should handle API calls before initialization', async () => {
      document.body.innerHTML = '<input-tag name="tags" multiple></input-tag>'
      const inputTag = document.querySelector('input-tag')

      // These should not throw before internals are initialized
      expect(() => {
        inputTag.focus()
        inputTag.checkValidity()
        inputTag.reportValidity()
      }).to.not.throw()
    })

    it('should handle API calls after disconnect', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      inputTag.disconnectedCallback()

      // Basic API methods should still work or fail gracefully
      expect(() => {
        inputTag.focus()
        inputTag.checkValidity()
        inputTag.reportValidity()
      }).to.not.throw()
    })
  })
})
