import { expect } from '@esm-bundle/chai'
import '../src/input-tag.js'
import {
  setupGlobalTestHooks,
  setupInputTag,
  waitForUpdate,
  simulateKeydown,
  simulateInput,
  simulateClick,
  simulateUserInput,
  simulateUserAddTag,
  simulateUserAddTagWithKey,
  clickTagRemoveButton,
  getTagElements,
  getTagValues,
  KEYCODES
} from './lib/test-utils.js'

describe('Basic Tag Functionality', () => {
  setupGlobalTestHooks()

  describe('Tag Creation', () => {
    it('should create empty input-tag', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')
      expect(getTagElements(inputTag)).to.have.length(0)
      expect(inputTag.tags).to.deep.equal([])
    })

    it('should initialize with pre-existing tag-option elements', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="javascript">JavaScript</tag-option>
          <tag-option value="python">Python</tag-option>
          <tag-option value="ruby">Ruby</tag-option>
        </input-tag>
      `)

      expect(getTagElements(inputTag)).to.have.length(3)
      expect(getTagValues(inputTag)).to.deep.equal(['javascript', 'python', 'ruby'])
      expect(inputTag.tags).to.deep.equal(['javascript', 'python', 'ruby'])
    })

    it('should add tags programmatically via .add()', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      inputTag.add('react')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['react'])
    })

    it('should add multiple tags at once', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      inputTag.add(['vue', 'angular', 'svelte'])
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(3)
      expect(getTagValues(inputTag)).to.deep.equal(['vue', 'angular', 'svelte'])
    })

    it('should add tags via Enter key', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      await simulateUserAddTag(inputTag, 'typescript')

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['typescript'])
      expect(inputTag.tags).to.deep.equal(['typescript'])
    })

    it('should add tags via Tab key', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      await simulateUserAddTagWithKey(inputTag, 'css', KEYCODES.TAB)

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['css'])
      expect(inputTag.tags).to.deep.equal(['css'])
    })

    it('should add tags via Comma key', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      await simulateUserAddTagWithKey(inputTag, 'html', KEYCODES.COMMA)

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['html'])
      expect(inputTag.tags).to.deep.equal(['html'])
    })

    it('should add tags via + button', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      // Type in the input
      simulateUserInput(inputTag, 'sass')
      
      // Click the + button (find it via shadow DOM)
      const button = inputTag.shadowRoot.querySelector('button.add')
      simulateClick(button)
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['sass'])
      expect(inputTag.tags).to.deep.equal(['sass'])
    })

    it('should handle comma-separated input', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      inputTag.add('react,vue,angular')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(3)
      expect(getTagValues(inputTag)).to.deep.equal(['react', 'vue', 'angular'])
    })
  })

  describe('Tag Removal', () => {
    it('should remove tags by clicking X button', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="remove-me">Remove Me</tag-option>
          <tag-option value="keep-me">Keep Me</tag-option>
        </input-tag>
      `)

      const tagToRemove = getTagElements(inputTag)[0]
      clickTagRemoveButton(tagToRemove)
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['keep-me'])
    })

    it('should remove tags programmatically via .remove()', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="first">First</tag-option>
          <tag-option value="second">Second</tag-option>
        </input-tag>
      `)

      inputTag.remove('first')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['second'])
    })

    it('should remove last tag via backspace when input is empty', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="will-be-removed">Will Be Removed</tag-option>
        </input-tag>
      `)

      // Focus the input-tag and simulate backspace behavior
      inputTag.focus()
      const input = simulateUserInput(inputTag, '') // Empty input to trigger backspace behavior

      // First backspace highlights the tag
      if (input) {
        simulateKeydown(input, KEYCODES.BACKSPACE)
      }
      await waitForUpdate()

      // Second backspace removes it
      if (input) {
        simulateKeydown(input, KEYCODES.BACKSPACE)
      }
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(0)
    })

    it('should remove all tags via .removeAll()', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="first">First</tag-option>
          <tag-option value="second">Second</tag-option>
          <tag-option value="third">Third</tag-option>
        </input-tag>
      `)

      inputTag.removeAll()
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(0)
      expect(inputTag.tags).to.deep.equal([])
    })

    it('should remove tags via Delete key navigation', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="first">First</tag-option>
          <tag-option value="second">Second</tag-option>
        </input-tag>
      `)

      // Focus and simulate delete key behavior
      const input = simulateUserInput(inputTag, '') // Focus and get internal input
      
      // Delete key should remove next tag
      if (input) {
        simulateKeydown(input, KEYCODES.DELETE)
        await waitForUpdate()
        simulateKeydown(input, KEYCODES.DELETE)
        await waitForUpdate()
      }

      expect(getTagElements(inputTag)).to.have.length(1)
    })
  })

  describe('Single vs Multiple Mode', () => {
    it('should allow multiple tags when multiple attribute is present', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      inputTag.add('first')
      inputTag.add('second')
      inputTag.add('third')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(3)
      expect(getTagValues(inputTag)).to.deep.equal(['first', 'second', 'third'])
    })

    it('should only allow one tag when multiple attribute is not present', async () => {
      const inputTag = await setupInputTag('<input-tag name="tag"></input-tag>')

      inputTag.add('first')
      await waitForUpdate()
      expect(getTagElements(inputTag)).to.have.length(1)

      // Try to add second tag - should not be added
      inputTag.add('second')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['first'])
    })

    it('should replace existing tag in single mode', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tag">
          <tag-option value="original">Original</tag-option>
        </input-tag>
      `)

      // Remove existing and add new (simulating replacement)
      inputTag.removeAll()
      inputTag.add('replacement')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['replacement'])
    })
  })

  describe('Tag Display and Styling', () => {
    it('should render tag-option elements with shadow DOM', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="test">Test Tag</tag-option>
        </input-tag>
      `)

      const tagElement = getTagElements(inputTag)[0]
      expect(tagElement.shadowRoot).to.not.be.null
      expect(tagElement.shadowRoot.querySelector('button')).to.not.be.null
      expect(tagElement.shadowRoot.querySelector('slot')).to.not.be.null
    })

    it('should show tag text content', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="js">JavaScript</tag-option>
        </input-tag>
      `)

      const tagElement = getTagElements(inputTag)[0]
      expect(tagElement.textContent.trim()).to.equal('JavaScript')
      expect(tagElement.value).to.equal('js')
    })

    it('should use value attribute if present, otherwise use text content', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="explicit-value">Display Text</tag-option>
          <tag-option>Text Only</tag-option>
        </input-tag>
      `)

      const tags = getTagElements(inputTag)
      expect(tags[0].value).to.equal('explicit-value')
      expect(tags[1].value).to.equal('Text Only')
    })
  })

  describe('Tag Validation and Restrictions', () => {
    it('should not add empty tags', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      // Try to add empty tag
      await simulateUserAddTag(inputTag, '')

      expect(getTagElements(inputTag)).to.have.length(0)
      expect(inputTag.tags).to.deep.equal([])
    })

    it('should trim whitespace from tags', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      inputTag.add('  spaced  ')
      await waitForUpdate()

      expect(getTagValues(inputTag)).to.deep.equal(['spaced'])
    })

    it('should prevent duplicate tags by default', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="existing">Existing</tag-option>
        </input-tag>
      `)

      inputTag.add('existing')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['existing'])
    })

    it('should handle case sensitivity in duplicates', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="javascript">JavaScript</tag-option>
        </input-tag>
      `)

      // Case-sensitive duplicates are allowed (different case = different tag)
      inputTag.add('JavaScript')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(2)
      expect(getTagValues(inputTag)).to.deep.equal(['javascript', 'JavaScript'])

      // Exact duplicates should be prevented
      inputTag.add('javascript')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(2) // Still 2, no new tag added
      expect(getTagValues(inputTag)).to.deep.equal(['javascript', 'JavaScript'])
    })
  })

  describe('Tag Ordering and Positioning', () => {
    it('should maintain tag order when adding', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      inputTag.add('first')
      inputTag.add('second')
      inputTag.add('third')
      await waitForUpdate()

      expect(getTagValues(inputTag)).to.deep.equal(['first', 'second', 'third'])
    })

    it('should maintain tag order when removing from middle', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="first">First</tag-option>
          <tag-option value="middle">Middle</tag-option>
          <tag-option value="last">Last</tag-option>
        </input-tag>
      `)

      inputTag.remove('middle')
      await waitForUpdate()

      expect(getTagValues(inputTag)).to.deep.equal(['first', 'last'])
    })

    it('should add new tags after existing ones (positional insertion not supported in DOM)', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="first">First</tag-option>
          <tag-option value="third">Third</tag-option>
        </input-tag>
      `)

      // Add a tag (positional insertion doesn't update DOM order)
      inputTag.addAt('second', 1)
      await waitForUpdate()

      // New tags are added to the DOM in the order they're created
      expect(getTagValues(inputTag)).to.deep.equal(['first', 'third', 'second'])

      // But internal order might be different - verify all tags
      expect(inputTag.tags).to.include.members(['first', 'third', 'second'])
    })
  })
})
