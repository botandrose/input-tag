import { expect } from '@esm-bundle/chai'
import '../src/input-tag.js'
import {
  setupGlobalTestHooks,
  setupInputTag,
  waitForUpdate,
  waitForBasicInitialization,
  simulateInput,
  simulateUserAddTag,
  getTagElements,
  getTagValues,
} from './lib/test-utils.js'

describe('Value/Label Separation', () => {
  setupGlobalTestHooks()

  describe('Basic Value/Label Behavior (Zero API Changes)', () => {
    it('should work with value attribute different from display text', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="languages" multiple>
          <tag-option value="js">JavaScript</tag-option>
          <tag-option value="py">Python</tag-option>
        </input-tag>
      `)

      // API works with values (unchanged behavior)
      expect(inputTag.tags).to.deep.equal(['js', 'py'])
      expect(getTagValues(inputTag)).to.deep.equal(['js', 'py'])

      // But display shows labels
      const tagElements = getTagElements(inputTag)
      expect(tagElements[0].textContent.trim()).to.equal('JavaScript')
      expect(tagElements[1].textContent.trim()).to.equal('Python')

      // Values are still accessible
      expect(tagElements[0].value).to.equal('js')
      expect(tagElements[1].value).to.equal('py')
    })

    it('should fall back to text content when no value attribute', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="categories" multiple>
          <tag-option>Frontend</tag-option>
          <tag-option>Backend</tag-option>
        </input-tag>
      `)

      // Both value and display are the same
      expect(inputTag.tags).to.deep.equal(['Frontend', 'Backend'])
      expect(getTagValues(inputTag)).to.deep.equal(['Frontend', 'Backend'])

      const tagElements = getTagElements(inputTag)
      expect(tagElements[0].textContent.trim()).to.equal('Frontend')
      expect(tagElements[1].textContent.trim()).to.equal('Backend')
      expect(tagElements[0].value).to.equal('Frontend')
      expect(tagElements[1].value).to.equal('Backend')
    })

    it('should support mixed value/label and text-only tags', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="mixed" multiple>
          <tag-option value="1">Label A</tag-option>
          <tag-option>Text Only</tag-option>
          <tag-option value="3">Label C</tag-option>
        </input-tag>
      `)

      // Values array contains mix of explicit values and text
      expect(inputTag.tags).to.deep.equal(['1', 'Text Only', '3'])

      // Display shows appropriate text
      const tagElements = getTagElements(inputTag)
      expect(tagElements[0].textContent.trim()).to.equal('Label A')
      expect(tagElements[1].textContent.trim()).to.equal('Text Only')
      expect(tagElements[2].textContent.trim()).to.equal('Label C')

      // Values are correct
      expect(tagElements[0].value).to.equal('1')
      expect(tagElements[1].value).to.equal('Text Only')
      expect(tagElements[2].value).to.equal('3')
    })
  })

  describe('API Methods Work with Values (Backward Compatible)', () => {
    it('should add tags by value, display by label', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="languages" multiple>
          <tag-option value="js">JavaScript</tag-option>
        </input-tag>
      `)

      // Add by value (existing API)
      inputTag.add('js')
      await waitForUpdate()

      // Should not create duplicate since value already exists
      expect(inputTag.tags).to.deep.equal(['js'])
      expect(getTagElements(inputTag)).to.have.length(1)

      // Display still shows label
      expect(getTagElements(inputTag)[0].textContent.trim()).to.equal('JavaScript')
    })

    it('should remove tags by value', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="languages" multiple>
          <tag-option value="js">JavaScript</tag-option>
          <tag-option value="py">Python</tag-option>
        </input-tag>
      `)

      // Remove by value (existing API)
      inputTag.remove('js')
      await waitForUpdate()

      expect(inputTag.tags).to.deep.equal(['py'])
      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagElements(inputTag)[0].textContent.trim()).to.equal('Python')
    })

    it('should check tag existence by value', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="languages" multiple>
          <tag-option value="js">JavaScript</tag-option>
        </input-tag>
      `)

      // Check by value (existing API)
      expect(inputTag.has('js')).to.be.true
      expect(inputTag.has('JavaScript')).to.be.false  // Label doesn't work for has()
      expect(inputTag.has('nonexistent')).to.be.false
    })
  })

  describe('User-Entered Tags (Mixed Values)', () => {
    it('should handle user-typed tags alongside predefined value/label tags', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="mixed" multiple>
          <tag-option value="1">Predefined A</tag-option>
          <tag-option value="2">Predefined B</tag-option>
        </input-tag>
      `)

      // User types custom tag
      await simulateUserAddTag(inputTag, 'CustomTag')

      // Values array contains mix of predefined values and user text
      expect(inputTag.tags).to.deep.equal(['1', '2', 'CustomTag'])

      // Display shows appropriate text
      const tagElements = getTagElements(inputTag)
      expect(tagElements[0].textContent.trim()).to.equal('Predefined A')
      expect(tagElements[1].textContent.trim()).to.equal('Predefined B')
      expect(tagElements[2].textContent.trim()).to.equal('CustomTag')

      // User-entered tag has same value and label
      expect(tagElements[2].value).to.equal('CustomTag')
    })

    it('should allow removing user-entered tags by their text value', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="mixed" multiple>
          <tag-option value="1">Predefined</tag-option>
        </input-tag>
      `)

      await simulateUserAddTag(inputTag, 'UserTag')
      expect(inputTag.tags).to.deep.equal(['1', 'UserTag'])

      // Remove user-entered tag by its value (which is the text)
      inputTag.remove('UserTag')
      await waitForUpdate()

      expect(inputTag.tags).to.deep.equal(['1'])
      expect(getTagElements(inputTag)).to.have.length(1)
    })
  })

  describe('Form Integration', () => {
    it('should submit values array to form, not labels', async () => {
      const form = document.createElement('form')
      form.innerHTML = `
        <input-tag name="test" multiple>
          <tag-option value="val1">Label 1</tag-option>
          <tag-option value="val2">Label 2</tag-option>
        </input-tag>
      `
      document.body.appendChild(form)

      const inputTag = form.querySelector('input-tag')
      await waitForUpdate()

      // Wait for component initialization
      while (!inputTag._taggle) {
        await waitForUpdate()
      }

      // Add user-entered tag
      await simulateUserAddTag(inputTag, 'UserInput')

      // Form data should contain values, not labels
      const formData = new FormData(form)
      const values = formData.getAll('test')
      expect(values).to.deep.equal(['val1', 'val2', 'UserInput'])

      document.body.removeChild(form)
    })
  })

  describe('TagOption Label Getter', () => {
    it('should provide label getter that returns innerText', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="test" multiple>
          <tag-option value="short">Long Display Name</tag-option>
          <tag-option>Text Only</tag-option>
        </input-tag>
      `)

      const tagElements = getTagElements(inputTag)

      // First tag: value !== label
      expect(tagElements[0].value).to.equal('short')
      expect(tagElements[0].label).to.equal('Long Display Name')

      // Second tag: value === label
      expect(tagElements[1].value).to.equal('Text Only')
      expect(tagElements[1].label).to.equal('Text Only')
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain exact same behavior for tags without value attributes', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="legacy" multiple>
          <tag-option>JavaScript</tag-option>
          <tag-option>Python</tag-option>
        </input-tag>
      `)

      // Existing behavior unchanged
      expect(inputTag.tags).to.deep.equal(['JavaScript', 'Python'])
      expect(getTagValues(inputTag)).to.deep.equal(['JavaScript', 'Python'])

      const tagElements = getTagElements(inputTag)
      expect(tagElements[0].value).to.equal('JavaScript')
      expect(tagElements[1].value).to.equal('Python')
      expect(tagElements[0].textContent.trim()).to.equal('JavaScript')
      expect(tagElements[1].textContent.trim()).to.equal('Python')
    })

    it('should work with existing add/remove/has API exactly as before', async () => {
      const inputTag = await setupInputTag('<input-tag name="test" multiple></input-tag>')

      // All existing API behavior unchanged
      inputTag.add('test1')
      inputTag.add(['test2', 'test3'])
      expect(inputTag.tags).to.deep.equal(['test1', 'test2', 'test3'])

      expect(inputTag.has('test1')).to.be.true
      expect(inputTag.has('nonexistent')).to.be.false

      inputTag.remove('test2')
      expect(inputTag.tags).to.deep.equal(['test1', 'test3'])

      inputTag.removeAll()
      expect(inputTag.tags).to.deep.equal([])
    })
  })

  describe('Autocomplete with Value/Label Separation', () => {
    it('should create tag-option with correct value and label when selecting from autocomplete', async () => {
      // Set up input-tag with datalist that has value/label separation
      document.body.innerHTML = `
        <input-tag name="frameworks" list="suggestions" multiple></input-tag>
        <datalist id="suggestions">
          <option value="vue">Vue.js Framework</option>
          <option value="react">React Library</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForBasicInitialization(inputTag)

      // Simulate typing "vue" to trigger autocomplete
      const input = inputTag._taggleInputTarget
      await simulateInput(input, 'vue')

      // Verify autocomplete shows the label
      expect(inputTag._autocompleteSuggestions).to.deep.equal(['Vue.js Framework'])

      // Simulate clicking on the autocomplete suggestion
      // This should add a tag with value="vue" but display "Vue.js Framework"
      const autocompleteItems = inputTag.autocompleteContainerTarget.querySelectorAll('.ui-menu-item')
      expect(autocompleteItems.length).to.equal(1)

      // Click the autocomplete item
      autocompleteItems[0].click()

      // Wait for tag to be added
      await new Promise(resolve => setTimeout(resolve, 10))

      // The bug: Currently this creates <tag-option value="vue">vue</tag-option>
      // But it should create <tag-option value="vue">Vue.js Framework</tag-option>

      const tagElements = getTagElements(inputTag)
      expect(tagElements.length).to.equal(1)

      // Value should be the short form
      expect(tagElements[0].value).to.equal('vue')


      // BUT display text should be the full label
      expect(tagElements[0].textContent.trim()).to.equal('Vue.js Framework')

      // Form submission should use the value
      expect(inputTag.tags).to.deep.equal(['vue'])
    })

    it('should work with mixed value/label and simple options', async () => {
      document.body.innerHTML = `
        <input-tag name="frameworks" list="suggestions" multiple></input-tag>
        <datalist id="suggestions">
          <option value="vue">Vue.js Framework</option>
          <option value="simple">simple</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForBasicInitialization(inputTag)

      const input = inputTag._taggleInputTarget

      // Add Vue.js via autocomplete
      await simulateInput(input, 'vue')
      const autocompleteItems1 = inputTag.autocompleteContainerTarget.querySelectorAll('.ui-menu-item')
      autocompleteItems1[0].click()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Add simple via autocomplete
      await simulateInput(input, 'simple')
      const autocompleteItems2 = inputTag.autocompleteContainerTarget.querySelectorAll('.ui-menu-item')
      autocompleteItems2[0].click()
      await new Promise(resolve => setTimeout(resolve, 10))

      const tagElements = getTagElements(inputTag)
      expect(tagElements.length).to.equal(2)

      // First tag: value/label separation
      expect(tagElements[0].value).to.equal('vue')
      expect(tagElements[0].textContent.trim()).to.equal('Vue.js Framework')

      // Second tag: simple case where value equals label
      expect(tagElements[1].value).to.equal('simple')
      expect(tagElements[1].textContent.trim()).to.equal('simple')

      expect(inputTag.tags).to.deep.equal(['vue', 'simple'])
    })
  })
})