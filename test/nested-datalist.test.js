import { expect } from '@esm-bundle/chai'
import '../src/input-tag.js'
import {
  setupGlobalTestHooks,
  setupInputTag,
  waitForUpdate,
  waitForBasicInitialization,
  simulateInput,
  getTagElements,
  getTagValues,
} from './lib/test-utils.js'

describe('Nested Datalist Support', () => {
  setupGlobalTestHooks()

  describe('Bug Reproduction', () => {
    it('should not include null values from datalist elements in tags array', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="test" multiple>
          <datalist>
            <option value="js">JavaScript</option>
            <option value="py">Python</option>
          </datalist>
        </input-tag>
      `)

      // Should have no tags initially (datalist should not be converted to tags)
      expect(inputTag.tags).to.deep.equal([])
      expect(inputTag.tags).to.not.include(null)
      expect(inputTag.tags).to.not.include(undefined)
    })

    it('should not add null when selecting from nested datalist autocomplete', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="frameworks" multiple>
          <datalist>
            <option value="nextjs">Next.js Framework</option>
          </datalist>
        </input-tag>
      `)

      // Initially should be empty
      expect(inputTag.tags).to.deep.equal([])

      const input = inputTag._taggleInputTarget
      await simulateInput(input, 'next')

      // Click the autocomplete suggestion
      const autocompleteItems = inputTag.autocompleteContainerTarget.querySelectorAll('.ui-menu-item')
      expect(autocompleteItems.length).to.equal(1)
      autocompleteItems[0].click()

      await new Promise(resolve => setTimeout(resolve, 10))

      // Should only have the selected value, no nulls
      expect(inputTag.tags).to.deep.equal(['nextjs'])
      expect(inputTag.tags).to.not.include(null)
      expect(inputTag.tags).to.not.include(undefined)
    })
  })

  describe('Basic Nested Datalist Functionality', () => {
    it('should read options from nested datalist element', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="languages" multiple>
          <datalist>
            <option value="js">JavaScript</option>
            <option value="py">Python</option>
            <option value="rb">Ruby</option>
          </datalist>
        </input-tag>
      `)

      // Options should be available from nested datalist
      expect(inputTag.options).to.deep.equal(['js', 'py', 'rb'])
    })

    it('should support value/label separation with nested datalist', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="frameworks" multiple>
          <datalist>
            <option value="react">React - Component Library</option>
            <option value="vue">Vue.js - Progressive Framework</option>
            <option value="angular">Angular - Full Framework</option>
          </datalist>
        </input-tag>
      `)

      const optionsWithLabels = inputTag._getOptionsWithLabels()
      expect(optionsWithLabels).to.deep.equal([
        { value: 'react', label: 'React - Component Library' },
        { value: 'vue', label: 'Vue.js - Progressive Framework' },
        { value: 'angular', label: 'Angular - Full Framework' }
      ])
    })

    it('should prioritize external datalist over nested datalist', async () => {
      document.body.innerHTML = `
        <input-tag name="test" list="external-datalist" multiple>
          <datalist>
            <option value="nested">Nested Option</option>
          </datalist>
        </input-tag>
        <datalist id="external-datalist">
          <option value="external">External Option</option>
        </datalist>
      `

      const inputTag = document.querySelector('input-tag')
      await waitForBasicInitialization(inputTag)

      // Should use external datalist, not nested one
      expect(inputTag.options).to.deep.equal(['external'])
    })

    it('should fall back to nested datalist when external datalist not found', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="test" list="nonexistent-datalist" multiple>
          <datalist>
            <option value="nested">Nested Option</option>
          </datalist>
        </input-tag>
      `)

      // Should fall back to nested datalist
      expect(inputTag.options).to.deep.equal(['nested'])
    })
  })

  describe('Nested Datalist with Autocomplete', () => {
    it('should work with autocomplete using nested datalist', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="languages" multiple>
          <datalist>
            <option value="js">JavaScript Framework</option>
            <option value="py">Python Language</option>
            <option value="rb">Ruby Language</option>
          </datalist>
        </input-tag>
      `)

      const input = inputTag._taggleInputTarget

      // Simulate typing to trigger autocomplete
      await simulateInput(input, 'java')

      // Should find JavaScript by label
      expect(inputTag._autocompleteSuggestions).to.deep.equal(['JavaScript Framework'])
    })

    it('should create correct tag-option when selecting from nested datalist autocomplete', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="frameworks" multiple>
          <datalist>
            <option value="vue">Vue.js Framework</option>
            <option value="react">React Library</option>
          </datalist>
        </input-tag>
      `)

      const input = inputTag._taggleInputTarget
      await simulateInput(input, 'vue')

      // Click the autocomplete suggestion
      const autocompleteItems = inputTag.autocompleteContainerTarget.querySelectorAll('.ui-menu-item')
      expect(autocompleteItems.length).to.equal(1)
      autocompleteItems[0].click()

      await new Promise(resolve => setTimeout(resolve, 10))

      const tagElements = getTagElements(inputTag)
      expect(tagElements.length).to.equal(1)
      expect(tagElements[0].value).to.equal('vue')
      expect(tagElements[0].textContent.trim()).to.equal('Vue.js Framework')
      expect(inputTag.tags.filter(tag => tag !== undefined)).to.deep.equal(['vue'])
    })
  })

  describe('Dynamic Nested Datalist Changes', () => {
    it('should update autocomplete when nested datalist is added dynamically', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="test" multiple></input-tag>
      `)

      // Initially no options
      expect(inputTag.options).to.deep.equal([])

      // Add nested datalist dynamically
      const datalist = document.createElement('datalist')
      datalist.innerHTML = `
        <option value="new">New Option</option>
      `
      inputTag.appendChild(datalist)

      // Wait for mutation observer
      await waitForUpdate()

      // Should now have options
      expect(inputTag.options).to.deep.equal(['new'])
    })

    it('should update autocomplete when nested datalist options are modified', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="test" multiple>
          <datalist id="nested-list">
            <option value="original">Original Option</option>
          </datalist>
        </input-tag>
      `)

      expect(inputTag.options).to.deep.equal(['original'])

      // Add new option to existing nested datalist
      const datalist = inputTag.querySelector('datalist')
      const newOption = document.createElement('option')
      newOption.value = 'added'
      newOption.textContent = 'Added Option'
      datalist.appendChild(newOption)

      // Wait for mutation observer
      await waitForUpdate()

      // Should include new option
      expect(inputTag.options).to.deep.equal(['original', 'added'])
    })

    it('should remove autocomplete when nested datalist is removed', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="test" multiple>
          <datalist>
            <option value="temp">Temporary Option</option>
          </datalist>
        </input-tag>
      `)

      expect(inputTag.options).to.deep.equal(['temp'])

      // Remove nested datalist
      const datalist = inputTag.querySelector('datalist')
      datalist.remove()

      // Wait for mutation observer
      await waitForUpdate()

      // Should have no options
      expect(inputTag.options).to.deep.equal([])
    })
  })

  describe('Nested Datalist Edge Cases', () => {
    it('should handle multiple nested datalists (use first one)', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="test" multiple>
          <datalist>
            <option value="first">First Datalist</option>
          </datalist>
          <datalist>
            <option value="second">Second Datalist</option>
          </datalist>
        </input-tag>
      `)

      // Should use the first datalist found
      expect(inputTag.options).to.deep.equal(['first'])
    })

    it('should handle empty nested datalist', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="test" multiple>
          <datalist></datalist>
        </input-tag>
      `)

      expect(inputTag.options).to.deep.equal([])
    })

    it('should handle nested datalist with options without values', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="test" multiple>
          <datalist>
            <option>Option Without Value</option>
            <option value="">Empty Value</option>
            <option value="valid">Valid Option</option>
          </datalist>
        </input-tag>
      `)

      // Should include all options - option without value attribute uses textContent as value
      expect(inputTag.options).to.deep.equal(['Option Without Value', '', 'valid'])
    })
  })

  describe('Backward Compatibility', () => {
    it('should not break existing external datalist functionality', async () => {
      document.body.innerHTML = `
        <input-tag name="test" list="external-list" multiple></input-tag>
        <datalist id="external-list">
          <option value="external">External Option</option>
        </datalist>
      `

      const inputTag = document.querySelector('input-tag')
      await waitForBasicInitialization(inputTag)

      // Should still work with external datalist
      expect(inputTag.options).to.deep.equal(['external'])
    })

    it('should work correctly with mixed tag-options and nested datalist', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="mixed" multiple>
          <tag-option value="preset">Preset Tag</tag-option>
          <datalist>
            <option value="option1">Autocomplete Option 1</option>
            <option value="option2">Autocomplete Option 2</option>
          </datalist>
        </input-tag>
      `)

      // Should have preset tags (filter out any undefined values)
      expect(inputTag.tags.filter(tag => tag !== undefined)).to.deep.equal(['preset'])
      expect(getTagElements(inputTag).filter(el => el.value !== undefined)).to.have.length(1)

      // And autocomplete options available
      expect(inputTag.options).to.deep.equal(['option1', 'option2'])
    })
  })
})