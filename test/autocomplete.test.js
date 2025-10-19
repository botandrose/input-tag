import { expect } from '@esm-bundle/chai'
import '../src/input-tag.js'
import {
  setupGlobalTestHooks,
  setupInputTag,
  waitForElement,
  waitForBasicInitialization,
  waitForUpdate,
  simulateInput,
  getTagElements,
  getTagValues
} from './lib/test-utils.js'

describe('Autocomplete', () => {
  setupGlobalTestHooks()

  describe('Datalist Integration', () => {
    it('should read options from associated datalist', async () => {
      document.body.innerHTML = `
        <input-tag name="frameworks" list="suggestions" multiple></input-tag>
        <datalist id="suggestions">
          <option value="react">React</option>
          <option value="vue">Vue</option>
          <option value="angular">Angular</option>
          <option value="svelte">Svelte</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForBasicInitialization(inputTag)

      expect(inputTag.options).to.deep.equal(['react', 'vue', 'angular', 'svelte'])
    })

    it('should return empty array when no datalist is associated', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      expect(inputTag.options).to.deep.equal([])
    })

    it('should return empty array when datalist does not exist', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" list="nonexistent" multiple></input-tag>')

      expect(inputTag.options).to.deep.equal([])
    })

    it('should handle empty datalist', async () => {
      document.body.innerHTML = `
        <input-tag name="tags" list="empty" multiple></input-tag>
        <datalist id="empty"></datalist>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForBasicInitialization(inputTag)

      expect(inputTag.options).to.deep.equal([])
    })

    it('should update options when datalist changes', async () => {
      document.body.innerHTML = `
        <input-tag name="frameworks" list="dynamic" multiple></input-tag>
        <datalist id="dynamic">
          <option value="initial">Initial</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')
      const datalist = document.querySelector('#dynamic')

      await waitForBasicInitialization(inputTag)

      expect(inputTag.options).to.deep.equal(['initial'])

      // Add option to datalist
      const newOption = document.createElement('option')
      newOption.value = 'added'
      datalist.appendChild(newOption)

      expect(inputTag.options).to.deep.equal(['initial', 'added'])
    })

    it('should handle datalist with option text different from value', async () => {
      document.body.innerHTML = `
        <input-tag name="languages" list="lang-list" multiple></input-tag>
        <datalist id="lang-list">
          <option value="js">JavaScript</option>
          <option value="ts">TypeScript</option>
          <option value="py">Python</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForBasicInitialization(inputTag)

      expect(inputTag.options).to.deep.equal(['js', 'ts', 'py'])
    })
  })

  describe('Autocomplete Suggestions Filtering', () => {
    async function setupAutocompleteTest() {
      document.body.innerHTML = `
        <input-tag name="frameworks" list="suggestions" multiple></input-tag>
        <datalist id="suggestions">
          <option value="react">React</option>
          <option value="vue">Vue</option>
          <option value="angular">Angular</option>
          <option value="svelte">Svelte</option>
          <option value="backbone">Backbone</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForBasicInitialization(inputTag)
      return inputTag
    }

    it('should filter suggestions based on input text', async () => {
      const inputTag = await setupAutocompleteTest()
      const input = inputTag._taggleInputTarget

      // Test 're' shows only 'React' (label)
      await simulateInput(input, 're')
      expect(inputTag._autocompleteSuggestions).to.deep.equal(['React'])

      // Test 'e' shows multiple matches (labels)
      await simulateInput(input, 'e')
      expect(inputTag._autocompleteSuggestions).to.include.members(['React', 'Vue', 'Svelte', 'Backbone'])

      // Test 'ang' shows only 'Angular' (label)
      await simulateInput(input, 'ang')
      expect(inputTag._autocompleteSuggestions).to.deep.equal(['Angular'])

      // Test 'xyz' shows no matches
      await simulateInput(input, 'xyz')
      expect(inputTag._autocompleteSuggestions).to.have.length(0)
    })

    it('should handle case-insensitive filtering', async () => {
      const inputTag = await setupAutocompleteTest()
      const input = inputTag._taggleInputTarget

      // Test uppercase 'REACT' shows 'React' (label)
      await simulateInput(input, 'REACT')
      expect(inputTag._autocompleteSuggestions).to.deep.equal(['React'])

      // Test mixed case 'VuE' shows 'Vue' (label)
      await simulateInput(input, 'VuE')
      expect(inputTag._autocompleteSuggestions).to.deep.equal(['Vue'])
    })

    it('should filter with partial matches', async () => {
      const inputTag = await setupAutocompleteTest()
      const input = inputTag._taggleInputTarget

      // Test 'a' shows tags containing 'a' (labels)
      await simulateInput(input, 'a')
      expect(inputTag._autocompleteSuggestions).to.include.members(['React', 'Angular', 'Backbone'])

      // Test 'ck' shows only 'Backbone' (label)
      await simulateInput(input, 'ck')
      expect(inputTag._autocompleteSuggestions).to.deep.equal(['Backbone'])
    })

    it('should exclude already-entered tags from autocomplete suggestions', async () => {
      const inputTag = await setupAutocompleteTest()
      const input = inputTag._taggleInputTarget

      // Add some existing tags
      inputTag.add('react')
      inputTag.add('vue')
      await waitForUpdate()

      expect(getTagValues(inputTag)).to.deep.equal(['react', 'vue'])

      // Type 'e' which should trigger autocomplete
      await simulateInput(input, 'e')

      // Should show 'Svelte' and 'Backbone' (labels) but NOT 'React' or 'Vue'
      expect(inputTag._autocompleteSuggestions).to.include('Svelte')
      expect(inputTag._autocompleteSuggestions).to.include('Backbone')
      expect(inputTag._autocompleteSuggestions).to.not.include('React')
      expect(inputTag._autocompleteSuggestions).to.not.include('Vue')
    })
  })

  describe('Autocomplete Selection Behavior', () => {
    it('should add selected suggestion as tag', async () => {
      document.body.innerHTML = `
        <input-tag name="frameworks" list="suggestions" multiple></input-tag>
        <datalist id="suggestions">
          <option value="react">React</option>
          <option value="vue">Vue</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      // Simulate selecting a suggestion (direct taggle.add simulates the autocomplete selection)
      inputTag.add('react')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['react'])
    })

    it('should clear input after selection', async () => {
      document.body.innerHTML = `
        <input-tag name="frameworks" list="suggestions" multiple></input-tag>
        <datalist id="suggestions">
          <option value="react">React</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      const input = inputTag._taggleInputTarget
      await simulateInput(input, 'react')

      // Simulate autocomplete selection
      inputTag.add('react')
      await waitForUpdate()

      expect(input.value).to.equal('')
    })

    it('should handle multiple autocomplete selections', async () => {
      document.body.innerHTML = `
        <input-tag name="frameworks" list="suggestions" multiple></input-tag>
        <datalist id="suggestions">
          <option value="react">React</option>
          <option value="vue">Vue</option>
          <option value="angular">Angular</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      // Simulate multiple selections
      inputTag.add('react')
      await waitForUpdate()
      inputTag.add('vue')
      await waitForUpdate()
      inputTag.add('angular')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(3)
      expect(getTagValues(inputTag)).to.deep.equal(['react', 'vue', 'angular'])
    })
  })

  describe('Multiple Datalist Scenarios', () => {
    it('should handle switching datalist association', async () => {
      document.body.innerHTML = `
        <input-tag name="items" list="list1" multiple></input-tag>
        <datalist id="list1">
          <option value="item1">Item 1</option>
          <option value="item2">Item 2</option>
        </datalist>
        <datalist id="list2">
          <option value="item3">Item 3</option>
          <option value="item4">Item 4</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForBasicInitialization(inputTag)

      expect(inputTag.options).to.deep.equal(['item1', 'item2'])

      // Switch to different datalist
      inputTag.setAttribute('list', 'list2')

      expect(inputTag.options).to.deep.equal(['item3', 'item4'])
    })

    it('should handle removing datalist association', async () => {
      document.body.innerHTML = `
        <input-tag name="items" list="suggestions" multiple></input-tag>
        <datalist id="suggestions">
          <option value="item1">Item 1</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForBasicInitialization(inputTag)

      expect(inputTag.options).to.deep.equal(['item1'])

      // Remove list attribute
      inputTag.removeAttribute('list')

      expect(inputTag.options).to.deep.equal([])
    })

    it('should handle multiple input-tags sharing same datalist', async () => {
      document.body.innerHTML = `
        <input-tag name="tags1" list="shared" multiple></input-tag>
        <input-tag name="tags2" list="shared" multiple></input-tag>
        <datalist id="shared">
          <option value="shared1">Shared 1</option>
          <option value="shared2">Shared 2</option>
        </datalist>
      `
      const inputTag1 = document.querySelector('input-tag[name="tags1"]')
      const inputTag2 = document.querySelector('input-tag[name="tags2"]')

      await waitForElement(inputTag1, '_taggle')
      await waitForElement(inputTag2, '_taggle')

      expect(inputTag1.options).to.deep.equal(['shared1', 'shared2'])
      expect(inputTag2.options).to.deep.equal(['shared1', 'shared2'])

      // They should work independently
      inputTag1.add('shared1')
      await waitForUpdate()

      expect(getTagValues(inputTag1)).to.deep.equal(['shared1'])
      expect(getTagValues(inputTag2)).to.deep.equal([])
    })
  })

  describe('Autocomplete UI Interaction', () => {
    it('should have autocomplete container in DOM', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      expect(inputTag.autocompleteContainerTarget).to.not.be.null
      expect(inputTag.autocompleteContainerTarget.tagName.toLowerCase()).to.equal('ul')
    })

    it('should position autocomplete correctly when input-tag wraps to multiple lines', async () => {
      document.body.innerHTML = `
        <div style="width: 200px;">
          <input-tag name="frameworks" list="suggestions" multiple></input-tag>
          <datalist id="suggestions">
            <option value="react">React</option>
            <option value="vue">Vue</option>
            <option value="angular">Angular</option>
          </datalist>
        </div>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForBasicInitialization(inputTag)
      const input = inputTag._taggleInputTarget

      // Add enough tags to force wrapping
      inputTag.add('very-long-tag-name-that-will-wrap')
      inputTag.add('another-very-long-tag-name')
      inputTag.add('yet-another-long-tag')
      await waitForUpdate()

      // Get the container height after tags are added
      const containerHeight = inputTag.containerTarget.getBoundingClientRect().height

      // Trigger autocomplete
      await simulateInput(input, 'r')

      // Check that autocomplete container is positioned correctly
      const autocompleteContainer = inputTag.autocompleteContainerTarget
      const computedStyle = window.getComputedStyle(autocompleteContainer)

      expect(computedStyle.position).to.equal('absolute')
      expect(computedStyle.top).to.equal(`${containerHeight}px`)
      expect(computedStyle.zIndex).to.equal('1000')
    })

    it('should dynamically reposition autocomplete when tags are added while open', async () => {
      document.body.innerHTML = `
        <div style="width: 200px;">
          <input-tag name="frameworks" list="suggestions" multiple></input-tag>
          <datalist id="suggestions">
            <option value="react">React</option>
            <option value="vue">Vue</option>
            <option value="angular">Angular</option>
          </datalist>
        </div>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForBasicInitialization(inputTag)
      const input = inputTag._taggleInputTarget

      // Get initial container height
      const initialHeight = inputTag.containerTarget.getBoundingClientRect().height

      // Open autocomplete
      await simulateInput(input, 'r')

      // Get initial autocomplete position
      const autocompleteContainer = inputTag.autocompleteContainerTarget
      let computedStyle = window.getComputedStyle(autocompleteContainer)
      expect(computedStyle.top).to.equal(`${initialHeight}px`)

      // Add a tag while autocomplete is open
      inputTag.add('very-long-tag-name-that-will-cause-wrapping')
      await waitForUpdate()

      // Wait for position update
      await new Promise(resolve => setTimeout(resolve, 10))

      // Get new container height and verify autocomplete repositioned
      const newHeight = inputTag.containerTarget.getBoundingClientRect().height
      computedStyle = window.getComputedStyle(autocompleteContainer)

      expect(newHeight).to.be.greaterThan(initialHeight)
      expect(computedStyle.top).to.equal(`${newHeight}px`)
    })

    xit('should position autocomplete container after button', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const button = inputTag.buttonTarget
      const autocompleteContainer = inputTag.autocompleteContainerTarget

      expect(button.nextElementSibling).to.equal(autocompleteContainer)
    })

    it('should have correct CSS classes on autocomplete elements', async () => {
      document.body.innerHTML = `
        <input-tag name="frameworks" list="suggestions" multiple></input-tag>
        <datalist id="suggestions">
          <option value="react">React</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      const container = inputTag.autocompleteContainerTarget

      // Check if the autocomplete setup has the right className
      // (This is set in the autocomplete configuration)
      expect(container.tagName.toLowerCase()).to.equal('ul')
    })
  })

  describe('Missing Datalist Handling', () => {
    it('should gracefully handle missing datalist element', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" list="missing" multiple></input-tag>')

      expect(inputTag.options).to.deep.equal([])

      // Should still work for adding tags manually
      inputTag.add('manual-tag')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['manual-tag'])
    })

    it('should handle datalist that gets removed from DOM', async () => {
      document.body.innerHTML = `
        <input-tag name="tags" list="temporary" multiple></input-tag>
        <datalist id="temporary">
          <option value="temp">Temporary</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')
      const datalist = document.querySelector('#temporary')

      await waitForBasicInitialization(inputTag)

      expect(inputTag.options).to.deep.equal(['temp'])

      // Remove datalist from DOM
      datalist.remove()

      expect(inputTag.options).to.deep.equal([])
    })

    it('should handle datalist that gets added to DOM after initialization', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" list="future" multiple></input-tag>')

      expect(inputTag.options).to.deep.equal([])

      // Add datalist to DOM
      const datalist = document.createElement('datalist')
      datalist.id = 'future'
      const option = document.createElement('option')
      option.value = 'future-option'
      datalist.appendChild(option)
      document.body.appendChild(datalist)

      expect(inputTag.options).to.deep.equal(['future-option'])
    })
  })

  describe('Autocomplete with Pre-existing Tags', () => {
    it('should work with pre-existing tags and autocomplete', async () => {
      document.body.innerHTML = `
        <input-tag name="frameworks" list="suggestions" multiple>
          <tag-option value="react">React</tag-option>
        </input-tag>
        <datalist id="suggestions">
          <option value="react">React</option>
          <option value="vue">Vue</option>
          <option value="angular">Angular</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      expect(getTagValues(inputTag)).to.deep.equal(['react'])
      expect(inputTag.options).to.deep.equal(['react', 'vue', 'angular'])

      // Should be able to add more from autocomplete
      inputTag.add('vue')
      await waitForUpdate()

      expect(getTagValues(inputTag)).to.deep.equal(['react', 'vue'])
    })

    it('should identify existing options correctly for isNew flag', async () => {
      document.body.innerHTML = `
        <input-tag name="frameworks" list="suggestions" multiple>
          <tag-option value="existing">Existing</tag-option>
        </input-tag>
        <datalist id="suggestions">
          <option value="existing">Existing</option>
          <option value="from-list">From List</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')

      await waitForElement(inputTag, '_taggle')

      let updateEvent = null
      inputTag.addEventListener('update', (e) => {
        updateEvent = e
      })

      // Add from datalist - should not be new
      inputTag.add('from-list')
      await waitForUpdate()

      expect(updateEvent.detail.isNew).to.be.false

      // Add custom tag - should be new
      inputTag.add('custom-tag')
      await waitForUpdate()

      expect(updateEvent.detail.isNew).to.be.true
    })
  })

  describe('Autocomplete in Single Mode', () => {
    // Helper to simulate autocomplete selection behavior
    function simulateAutocompleteSelection(inputTag, value, label) {
      // Autocomplete onSelect directly creates and appends tag-option element
      const tagOption = document.createElement('tag-option')
      tagOption.setAttribute('value', value)
      tagOption.textContent = label
      inputTag.appendChild(tagOption)
      inputTag._taggleInputTarget.value = ''
    }

    it('should hide input after selecting first autocomplete option in single mode', async () => {
      document.body.innerHTML = `
        <input-tag name="status" list="suggestions"></input-tag>
        <datalist id="suggestions">
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForBasicInitialization(inputTag)

      // Initially, input should be visible (no tags)
      const input = inputTag._taggleInputTarget
      const button = inputTag.buttonTarget

      expect(input.style.display).to.not.equal('none')
      expect(button.style.display).to.not.equal('none')

      // Select first option from autocomplete (simulating actual autocomplete behavior)
      simulateAutocompleteSelection(inputTag, 'option1', 'Option 1')
      await waitForUpdate()

      // Input should now be hidden (single mode with one tag)
      expect(input.style.display).to.equal('none')
      expect(button.style.display).to.equal('none')
      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['option1'])
    })

    it('should prevent adding multiple tags via autocomplete in single mode', async () => {
      document.body.innerHTML = `
        <input-tag name="status" list="suggestions"></input-tag>
        <datalist id="suggestions">
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </datalist>
      `
      const inputTag = document.querySelector('input-tag')
      await waitForBasicInitialization(inputTag)

      // Select first option (simulating actual autocomplete behavior)
      simulateAutocompleteSelection(inputTag, 'option1', 'Option 1')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['option1'])

      // Try to select second option - should fail in single mode
      simulateAutocompleteSelection(inputTag, 'option2', 'Option 2')
      await waitForUpdate()

      // Should still only have one tag (the first one)
      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['option1'])
    })
  })
})
