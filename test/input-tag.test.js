import { expect } from '@esm-bundle/chai'
import '../src/input-tag.js'
import {
  setupGlobalTestHooks,
  setupInputTag,
  waitForElement,
  waitForBasicInitialization,
  waitForUpdate,
  getTagElements
} from './lib/test-utils.js'

describe('Input Tag - Smoke Tests', () => {
  setupGlobalTestHooks()

  it('should define custom elements', () => {
    expect(customElements.get('input-tag')).to.not.be.undefined
    expect(customElements.get('tag-option')).to.not.be.undefined
  })

  it('should initialize with empty state', async () => {
    const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

    expect(getTagElements(inputTag)).to.have.length(0)
    expect(inputTag.tags).to.deep.equal([])
  })

  it('should initialize with pre-existing tags', async () => {
    const inputTag = await setupInputTag(`
      <input-tag name="tags" multiple>
        <tag-option value="javascript">JavaScript</tag-option>
        <tag-option value="typescript">TypeScript</tag-option>
      </input-tag>
    `)

    expect(getTagElements(inputTag)).to.have.length(2)
    expect(inputTag.tags).to.deep.equal(['javascript', 'typescript'])
  })

  it('should add tags programmatically', async () => {
    const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

    inputTag.add('react')
    await waitForUpdate()

    expect(getTagElements(inputTag)).to.have.length(1)
    expect(inputTag.children[0].value).to.equal('react')
  })

  it('should remove tags programmatically', async () => {
    const inputTag = await setupInputTag(`
      <input-tag name="tags" multiple>
        <tag-option value="javascript">JavaScript</tag-option>
      </input-tag>
    `)

    inputTag.remove('javascript')
    await waitForUpdate()

    expect(getTagElements(inputTag)).to.have.length(0)
  })

  it('should handle single tag mode', async () => {
    const inputTag = await setupInputTag('<input-tag name="tag"></input-tag>')

    inputTag.add('first')
    await waitForUpdate()
    expect(getTagElements(inputTag)).to.have.length(1)

    // Try to add second tag - should not be added due to maxTags: 1
    inputTag.add('second')
    await waitForUpdate()
    expect(getTagElements(inputTag)).to.have.length(1)
    expect(inputTag.children[0].value).to.equal('first')
  })

  it('should use datalist for autocomplete', async () => {
    document.body.innerHTML = `
      <input-tag name="frameworks" list="suggestions" multiple></input-tag>
      <datalist id="suggestions">
        <option value="react">React</option>
        <option value="vue">Vue</option>
      </datalist>
    `
    const inputTag = document.querySelector('input-tag')

    await waitForBasicInitialization(inputTag)

    expect(inputTag.options).to.deep.equal(['react', 'vue'])
  })
})
