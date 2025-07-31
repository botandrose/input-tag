import { expect } from '@esm-bundle/chai'
import '../src/input-tag.js'
import {
  setupGlobalTestHooks,
  waitForElement,
  waitForUpdate,
  getTagElements,
  getTagValues
} from './lib/test-utils.js'

describe('DOM Mutation Handling', () => {
  setupGlobalTestHooks()

  describe('Attribute Changes', () => {
    it('should update when name attribute changes', async () => {
      document.body.innerHTML = `
        <input-tag name="original-name" multiple>
          <tag-option value="test">Test</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      expect(inputTag.name).to.equal('original-name')

      // Simulate DOM morphing changing the name attribute
      inputTag.setAttribute('name', 'morphed-name')
      await waitForUpdate()

      expect(inputTag.name).to.equal('morphed-name')
      
      // Check that internal hidden input also updated
      const hiddenInput = inputTag.shadowRoot.querySelector('input[type="hidden"]')
      expect(hiddenInput.name).to.equal('morphed-name')
    })

    it('should update when multiple attribute is added', async () => {
      document.body.innerHTML = `
        <input-tag name="tags">
          <tag-option value="single">Single</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      expect(getTagElements(inputTag)).to.have.length(1)

      // Add multiple attribute via DOM mutation
      inputTag.setAttribute('multiple', '')
      await waitForUpdate()

      // Should be able to add more tags now
      inputTag.add('second')
      inputTag.add('third')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(3)
      expect(getTagValues(inputTag)).to.deep.equal(['single', 'second', 'third'])
    })

    it('should update when multiple attribute is removed', async () => {
      document.body.innerHTML = `
        <input-tag name="tags" multiple>
          <tag-option value="first">First</tag-option>
          <tag-option value="second">Second</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      expect(getTagElements(inputTag)).to.have.length(2)

      // Remove multiple attribute via DOM mutation
      inputTag.removeAttribute('multiple')
      await waitForUpdate()

      // Should now be limited to single tag mode
      expect(getTagElements(inputTag)).to.have.length(1)
      
      // Trying to add another should not work
      inputTag.add('third')
      await waitForUpdate()
      expect(getTagElements(inputTag)).to.have.length(1)
    })

    it('should update when required attribute changes', async () => {
      document.body.innerHTML = `
        <input-tag name="tags" multiple></input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      expect(inputTag.checkValidity()).to.be.true

      // Add required attribute via DOM mutation
      inputTag.setAttribute('required', '')
      await waitForUpdate()

      expect(inputTag.checkValidity()).to.be.false

      // Add a tag to make it valid
      inputTag.add('required-tag')
      await waitForUpdate()

      expect(inputTag.checkValidity()).to.be.true
    })

    it('should update when list attribute changes', async () => {
      document.body.innerHTML = `
        <input-tag name="tags" multiple></input-tag>
        <datalist id="options1">
          <option value="option1">Option 1</option>
        </datalist>
        <datalist id="options2">
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      expect(inputTag.options).to.deep.equal([])

      // Add list attribute via DOM mutation
      inputTag.setAttribute('list', 'options1')
      await waitForUpdate()

      expect(inputTag.options).to.deep.equal(['option1'])

      // Change list attribute to different datalist
      inputTag.setAttribute('list', 'options2')
      await waitForUpdate()

      expect(inputTag.options).to.deep.equal(['option2', 'option3'])
    })
  })

  describe('Tag Option Changes', () => {
    it('should update when tag-option elements are added', async () => {
      document.body.innerHTML = `
        <input-tag name="tags" multiple>
          <tag-option value="initial">Initial</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['initial'])

      // Add new tag-option via DOM mutation
      const newTagOption = document.createElement('tag-option')
      newTagOption.setAttribute('value', 'added')
      newTagOption.textContent = 'Added'
      inputTag.appendChild(newTagOption)
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(2)
      expect(getTagValues(inputTag)).to.deep.equal(['initial', 'added'])
    })

    it('should update when tag-option elements are removed', async () => {
      document.body.innerHTML = `
        <input-tag name="tags" multiple>
          <tag-option value="keep">Keep</tag-option>
          <tag-option value="remove">Remove</tag-option>
          <tag-option value="also-keep">Also Keep</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      expect(getTagElements(inputTag)).to.have.length(3)
      expect(getTagValues(inputTag)).to.deep.equal(['keep', 'remove', 'also-keep'])

      // Remove tag-option via DOM mutation
      const tagOptionToRemove = inputTag.querySelector('tag-option[value="remove"]')
      inputTag.removeChild(tagOptionToRemove)
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(2)
      expect(getTagValues(inputTag)).to.deep.equal(['keep', 'also-keep'])
    })

    it('should update when tag-option value attribute changes', async () => {
      document.body.innerHTML = `
        <input-tag name="tags" multiple>
          <tag-option value="original">Original</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      expect(getTagValues(inputTag)).to.deep.equal(['original'])

      // Change tag-option value via DOM mutation
      const tagOption = inputTag.querySelector('tag-option')
      tagOption.setAttribute('value', 'modified')
      await waitForUpdate()

      expect(getTagValues(inputTag)).to.deep.equal(['modified'])
      
      // Verify the tag visually updated too
      const tagElements = getTagElements(inputTag)
      expect(tagElements[0].getAttribute('data-value')).to.equal('modified')
    })

    it('should update when tag-option text content changes', async () => {
      document.body.innerHTML = `
        <input-tag name="tags" multiple>
          <tag-option value="test">Original Text</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      // Change tag-option text content via DOM mutation
      const tagOption = inputTag.querySelector('tag-option')
      tagOption.textContent = 'Modified Text'
      await waitForUpdate()

      // Verify the tag display updated
      const tagElements = getTagElements(inputTag)
      expect(tagElements[0].textContent.trim()).to.include('Modified Text')
    })
  })

  describe('Complex DOM Mutations', () => {
    it('should handle multiple simultaneous attribute changes', async () => {
      document.body.innerHTML = `
        <input-tag name="original" multiple>
          <tag-option value="test">Test</tag-option>
        </input-tag>
        <datalist id="new-options">
          <option value="option1">Option 1</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      // Simulate complex DOM morphing changing multiple attributes
      inputTag.setAttribute('name', 'morphed')
      inputTag.setAttribute('required', '')
      inputTag.setAttribute('list', 'new-options')
      await waitForUpdate()

      expect(inputTag.name).to.equal('morphed')
      expect(inputTag.hasAttribute('required')).to.be.true
      expect(inputTag.options).to.deep.equal(['option1'])
      
      // Should still be invalid due to having no valid tags for required field
      expect(inputTag.checkValidity()).to.be.true // has existing tag
    })

    it('should handle tag-option replacement via innerHTML', async () => {
      document.body.innerHTML = `
        <input-tag name="tags" multiple>
          <tag-option value="old1">Old 1</tag-option>
          <tag-option value="old2">Old 2</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      expect(getTagValues(inputTag)).to.deep.equal(['old1', 'old2'])

      // Replace all content via innerHTML (simulating morphing)
      inputTag.innerHTML = `
        <tag-option value="new1">New 1</tag-option>
        <tag-option value="new2">New 2</tag-option>
        <tag-option value="new3">New 3</tag-option>
      `
      await waitForUpdate()

      expect(getTagValues(inputTag)).to.deep.equal(['new1', 'new2', 'new3'])
      expect(getTagElements(inputTag)).to.have.length(3)
    })

    it('should handle mixed tag-option additions and removals', async () => {
      document.body.innerHTML = `
        <input-tag name="tags" multiple>
          <tag-option value="keep">Keep</tag-option>
          <tag-option value="remove">Remove</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      expect(getTagValues(inputTag)).to.deep.equal(['keep', 'remove'])

      // Remove one and add two new ones
      const removeOption = inputTag.querySelector('tag-option[value="remove"]')
      inputTag.removeChild(removeOption)

      const newOption1 = document.createElement('tag-option')
      newOption1.setAttribute('value', 'new1')
      newOption1.textContent = 'New 1'
      inputTag.appendChild(newOption1)

      const newOption2 = document.createElement('tag-option')
      newOption2.setAttribute('value', 'new2')
      newOption2.textContent = 'New 2'
      inputTag.appendChild(newOption2)

      await waitForUpdate()

      expect(getTagValues(inputTag)).to.deep.equal(['keep', 'new1', 'new2'])
      expect(getTagElements(inputTag)).to.have.length(3)
    })
  })

  describe('MutationObserver Integration', () => {
    it('should detect attribute mutations via MutationObserver', async () => {
      document.body.innerHTML = `
        <input-tag name="observer-test" multiple>
          <tag-option value="test">Test</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      // Verify MutationObserver is active
      expect(inputTag.observer).to.not.be.null

      // Make attribute change that should be observed
      inputTag.setAttribute('name', 'observed-change')
      await waitForUpdate()

      expect(inputTag.name).to.equal('observed-change')
    })

    it('should detect child node mutations via MutationObserver', async () => {
      document.body.innerHTML = `
        <input-tag name="child-observer" multiple>
          <tag-option value="original">Original</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      expect(getTagValues(inputTag)).to.deep.equal(['original'])

      // Add child that should be observed
      const newChild = document.createElement('tag-option')
      newChild.setAttribute('value', 'observed')
      newChild.textContent = 'Observed'
      inputTag.appendChild(newChild)
      await waitForUpdate()

      expect(getTagValues(inputTag)).to.deep.equal(['original', 'observed'])
    })

    it('should clean up MutationObserver on disconnect', async () => {
      document.body.innerHTML = `
        <input-tag name="cleanup-test" multiple>
          <tag-option value="test">Test</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      expect(inputTag.observer).to.not.be.null

      // Disconnect should clean up observer
      inputTag.disconnectedCallback()
      
      // Observer should be cleaned up (can't directly test this, but ensure no errors)
      expect(() => {
        inputTag.setAttribute('name', 'should-not-crash')
      }).to.not.throw()
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed tag-option mutations gracefully', async () => {
      document.body.innerHTML = `
        <input-tag name="malformed" multiple></input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      // Add malformed tag-option (no value attribute)
      const malformedOption = document.createElement('tag-option')
      malformedOption.textContent = 'No Value'
      inputTag.appendChild(malformedOption)
      await waitForUpdate()

      // Should handle gracefully without crashing
      expect(() => getTagValues(inputTag)).to.not.throw()
    })

    it('should handle rapid mutations without race conditions', async () => {
      document.body.innerHTML = `
        <input-tag name="rapid" multiple></input-tag>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      // Rapid mutations
      for (let i = 0; i < 10; i++) {
        const option = document.createElement('tag-option')
        option.setAttribute('value', `rapid-${i}`)
        option.textContent = `Rapid ${i}`
        inputTag.appendChild(option)
      }
      
      await waitForUpdate(100) // Give extra time for processing

      expect(getTagElements(inputTag)).to.have.length(10)
      expect(getTagValues(inputTag)).to.include('rapid-0')
      expect(getTagValues(inputTag)).to.include('rapid-9')
    })
  })

  describe('Form Integration with Mutations', () => {
    it('should update FormData when name attribute changes', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="original-form-name" multiple>
            <tag-option value="form-test">Form Test</tag-option>
          </input-tag>
        </form>
      `
      const form = document.querySelector('form')
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      let formData = new FormData(form)
      expect(formData.getAll('original-form-name')).to.deep.equal(['form-test'])

      // Change name via mutation
      inputTag.setAttribute('name', 'mutated-form-name')
      await waitForUpdate()

      formData = new FormData(form)
      expect(formData.getAll('mutated-form-name')).to.deep.equal(['form-test'])
      expect(formData.getAll('original-form-name')).to.deep.equal([])
    })

    it('should maintain form validity state through mutations', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="validity-test" multiple>
            <tag-option value="valid">Valid</tag-option>
          </input-tag>
        </form>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForElement(inputTag, '_taggle')

      expect(inputTag.checkValidity()).to.be.true

      // Add required attribute
      inputTag.setAttribute('required', '')
      await waitForUpdate()

      expect(inputTag.checkValidity()).to.be.true // Still valid due to existing tag

      // Remove all tags
      inputTag.innerHTML = ''
      await waitForUpdate()

      expect(inputTag.checkValidity()).to.be.false // Now invalid
    })
  })
})