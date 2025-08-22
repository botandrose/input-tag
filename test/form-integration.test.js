import { expect } from '@esm-bundle/chai'
import '../src/input-tag.js'
import {
  setupGlobalTestHooks,
  waitForElement,
  waitForUpdate,
  getTagElements,
  getTagValues
} from './lib/test-utils.js'

describe('Form Integration', () => {
  setupGlobalTestHooks()

  describe('Form Association', () => {
    it('should be associated with parent form', async () => {
      document.body.innerHTML = `
        <form id="test-form">
          <input-tag name="tags" multiple>
            <tag-option value="test">Test</tag-option>
          </input-tag>
        </form>
      `
      const form = document.querySelector('#test-form')
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      expect(inputTag.form).to.equal(form)
    })

    it('should be associated with form via form attribute', async () => {
      document.body.innerHTML = `
        <form id="external-form"></form>
        <input-tag name="tags" form="external-form" multiple>
          <tag-option value="test">Test</tag-option>
        </input-tag>
      `
      const form = document.querySelector('#external-form')
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      expect(inputTag.form).to.equal(form)
    })

    it('should return null when not associated with any form', async () => {
      document.body.innerHTML = `
        <input-tag name="tags" multiple>
          <tag-option value="test">Test</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      expect(inputTag.form).to.be.null
    })
  })

  describe('Form Data Submission', () => {
    it('should include tag values in FormData', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="technologies" multiple>
            <tag-option value="javascript">JavaScript</tag-option>
            <tag-option value="python">Python</tag-option>
            <tag-option value="go">Go</tag-option>
          </input-tag>
        </form>
      `
      const form = document.querySelector('form')
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      const formData = new FormData(form)
      const values = formData.getAll('technologies')

      expect(values).to.deep.equal(['javascript', 'python', 'go'])
    })

    it('should handle empty tag list in FormData', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="empty-tags" multiple></input-tag>
        </form>
      `
      const form = document.querySelector('form')
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      const formData = new FormData(form)
      const values = formData.getAll('empty-tags')

      expect(values).to.deep.equal([]) // Should be empty array for empty multiple input-tag
    })

    it('should update FormData when tags change', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="dynamic-tags" multiple>
            <tag-option value="initial">Initial</tag-option>
          </input-tag>
        </form>
      `
      const form = document.querySelector('form')
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      // Add a tag
      inputTag.add('added')
      await waitForUpdate()

      const formData = new FormData(form)
      const values = formData.getAll('dynamic-tags')

      expect(values).to.deep.equal(['initial', 'added'])
    })

    it('should handle single tag mode in FormData', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="single-tag">
            <tag-option value="only-one">Only One</tag-option>
          </input-tag>
        </form>
      `
      const form = document.querySelector('form')
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      const formData = new FormData(form)
      const values = formData.getAll('single-tag')

      expect(values).to.deep.equal(['only-one'])
    })
  })

  describe('Form Validation', () => {
    it('should be valid when not required and empty', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="optional-tags" multiple></input-tag>
        </form>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      expect(inputTag.checkValidity()).to.be.true
    })

    it('should be invalid when required and empty', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="required-tags" required multiple></input-tag>
        </form>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      expect(inputTag.checkValidity()).to.be.false
    })

    it('should be valid when required and has tags', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="required-tags" required multiple>
            <tag-option value="present">Present</tag-option>
          </input-tag>
        </form>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      expect(inputTag.checkValidity()).to.be.true
    })

    it('should update validity when tags are added to required field', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="required-tags" required multiple></input-tag>
        </form>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      expect(inputTag.checkValidity()).to.be.false

      inputTag.add('now-valid')
      await waitForUpdate()

      expect(inputTag.checkValidity()).to.be.true
    })

    it('should update validity when tags are removed from required field', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="required-tags" required multiple>
            <tag-option value="will-remove">Will Remove</tag-option>
          </input-tag>
        </form>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      expect(inputTag.checkValidity()).to.be.true

      inputTag.removeAll()
      await waitForUpdate()

      expect(inputTag.checkValidity()).to.be.false
    })

    it('should support reportValidity() method', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="required-tags" required multiple></input-tag>
        </form>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      // Should return false for invalid required field
      expect(inputTag.reportValidity()).to.be.false

      inputTag.add('valid-now')
      await waitForUpdate()

      // Should return true after adding a tag
      expect(inputTag.reportValidity()).to.be.true
    })
  })

  describe('Form Reset Behavior', () => {
    it('should clear all tags when form is reset', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="reset-tags" multiple>
            <tag-option value="will-be-cleared">Will Be Cleared</tag-option>
          </input-tag>
        </form>
      `
      const form = document.querySelector('form')
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      expect(getTagElements(inputTag)).to.have.length(1)

      form.reset()
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(0)
      expect(inputTag.tags).to.deep.equal([])
    })

    it('should clear input field when form is reset', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="reset-tags" multiple></input-tag>
        </form>
      `
      const form = document.querySelector('form')
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      // Set some value in the input
      inputTag._taggleInputTarget.value = 'pending-input'

      form.reset()
      await waitForUpdate()

      expect(inputTag._taggleInputTarget.value).to.equal('')
    })

    it('should handle multiple input-tags in form reset', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="tags1" multiple>
            <tag-option value="tag1">Tag 1</tag-option>
          </input-tag>
          <input-tag name="tags2" multiple>
            <tag-option value="tag2">Tag 2</tag-option>
          </input-tag>
        </form>
      `
      const form = document.querySelector('form')
      const inputTag1 = document.querySelector('input-tag[name="tags1"]')
      const inputTag2 = document.querySelector('input-tag[name="tags2"]')

      await waitForElement(inputTag1, '_taggle')
      await waitForElement(inputTag2, '_taggle')

      expect(getTagElements(inputTag1)).to.have.length(1)
      expect(getTagElements(inputTag2)).to.have.length(1)

      form.reset()
      await waitForUpdate()

      expect(getTagElements(inputTag1)).to.have.length(0)
      expect(getTagElements(inputTag2)).to.have.length(0)
    })
  })

  describe('Hidden Input Synchronization', () => {
    it('should have correct name attribute on hidden input', async () => {
      document.body.innerHTML = `
        <input-tag name="sync-test" multiple>
          <tag-option value="test">Test</tag-option>
        </input-tag>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      const hiddenInput = inputTag.shadowRoot.querySelector('input[type="hidden"]')
      expect(hiddenInput.name).to.equal('sync-test')
    })

    it('should sync hidden input value with tag values', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="sync-test" multiple>
            <tag-option value="initial">Initial</tag-option>
          </input-tag>
        </form>
      `
      const form = document.querySelector('form')
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      // Check initial FormData
      let formData = new FormData(form)
      expect(formData.getAll('sync-test')).to.deep.equal(['initial'])

      // Add a tag and check FormData updates
      inputTag.add('added')
      await waitForUpdate()

      formData = new FormData(form)
      expect(formData.getAll('sync-test')).to.deep.equal(['initial', 'added'])
    })
  })

  describe('Custom Validity States', () => {
    it('should support custom validation messages', async () => {
      document.body.innerHTML = `
        <form>
          <input-tag name="custom-valid" required multiple></input-tag>
        </form>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      // Set custom validity message
      inputTag._taggleInputTarget.setCustomValidity('Please select at least one technology')

      expect(inputTag.checkValidity()).to.be.false
      expect(inputTag._taggleInputTarget.validationMessage).to.equal('Please select at least one technology')

      // Clear custom validity
      inputTag._taggleInputTarget.setCustomValidity('')
      inputTag.add('valid')
      await waitForUpdate()

      expect(inputTag.checkValidity()).to.be.true
    })
  })

  describe('Name Property', () => {
    it('should return correct name from name attribute', async () => {
      document.body.innerHTML = `
        <input-tag name="test-name" multiple></input-tag>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      expect(inputTag.name).to.equal('test-name')
    })

    it('should return null when name attribute is not set', async () => {
      document.body.innerHTML = `
        <input-tag multiple></input-tag>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      expect(inputTag.name).to.be.null
    })

    it('should update when name attribute changes', async () => {
      document.body.innerHTML = `
        <input-tag name="original-name" multiple></input-tag>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      expect(inputTag.name).to.equal('original-name')

      inputTag.setAttribute('name', 'new-name')
      expect(inputTag.name).to.equal('new-name')
    })
  })
})
