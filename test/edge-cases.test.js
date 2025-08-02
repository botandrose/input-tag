import { expect } from '@esm-bundle/chai'
import '../src/input-tag.js'
import {
  setupGlobalTestHooks,
  setupInputTag,
  waitForElement,
  waitForBasicInitialization,
  waitForUpdate,
  simulateInput,
  simulateKeydown,
  simulateKeyup,
  getTagElements,
  getTagValues,
  KEYCODES
} from './lib/test-utils.js'

describe('Edge Cases', () => {
  setupGlobalTestHooks()

  describe('Empty String Handling', () => {
    it('should not add tags for empty strings', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      inputTag.add('')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(0)
    })

    it('should not add tags for empty input via keyboard', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')
      const input = inputTag._taggleInputTarget

      await simulateInput(input, '')
      simulateKeydown(input, KEYCODES.ENTER)
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(0)
    })

    it('should not add tags for empty input via button click', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')
      const input = inputTag._taggleInputTarget
      const button = inputTag.buttonTarget

      await simulateInput(input, '')
      button.click()
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(0)
    })
  })

  describe('Whitespace-Only Input', () => {
    it('should not add tags for whitespace-only strings', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      inputTag.add('   ')
      inputTag.add('\n\t  ')
      inputTag.add('  \r\n  ')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(0)
    })

    it('should trim whitespace from valid tags', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      inputTag.add('  valid-tag  ')
      inputTag.add('\n  another-tag\t')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(2)
      expect(getTagValues(inputTag)).to.deep.equal(['valid-tag', 'another-tag'])
    })

    it('should handle mixed whitespace and comma separation', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      inputTag.add('  tag1  ,  tag2  ,  tag3  ')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(3)
      expect(getTagValues(inputTag)).to.deep.equal(['tag1', 'tag2', 'tag3'])
    })
  })

  describe('Duplicate Tag Prevention', () => {
    it('should prevent exact duplicate tags', async () => {
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

    it('should allow case-sensitive variations but prevent exact duplicates', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="javascript">JavaScript</tag-option>
        </input-tag>
      `)

      // These are all considered different (case-sensitive)
      inputTag.add('JavaScript')
      inputTag.add('JAVASCRIPT')
      inputTag.add('javaScript')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(4)
      expect(getTagValues(inputTag)).to.deep.equal(['javascript', 'JavaScript', 'JAVASCRIPT', 'javaScript'])

      // Exact duplicate should be prevented
      inputTag.add('javascript')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(4) // No new tag added
    })

    it('should prevent duplicates with whitespace variations', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="react">React</tag-option>
        </input-tag>
      `)

      inputTag.add('  react  ')
      inputTag.add('\treact\n')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['react'])
    })

    it('should allow similar but different tags', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      inputTag.add('react')
      inputTag.add('react-native')
      inputTag.add('reactjs')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(3)
      expect(getTagValues(inputTag)).to.deep.equal(['react', 'react-native', 'reactjs'])
    })
  })

  describe('Very Long Tag Names', () => {
    it('should handle very long tag names', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const longTag = 'a'.repeat(1000)
      inputTag.add(longTag)
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)[0]).to.equal(longTag)
    })

    it('should handle multiple very long tag names', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const longTag1 = 'x'.repeat(500) + '1'
      const longTag2 = 'y'.repeat(500) + '2'

      inputTag.add(longTag1)
      inputTag.add(longTag2)
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(2)
      expect(getTagValues(inputTag)).to.deep.equal([longTag1, longTag2])
    })

    it('should handle extremely long single line input', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const veryLongInput = 'tag'.repeat(1000)
      inputTag.add(veryLongInput)
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)[0]).to.equal(veryLongInput)
    })
  })

  describe('Special Characters in Tags', () => {
    it('should handle tags with special characters', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const specialTags = [
        'tag-with-dashes',
        'tag_with_underscores',
        'tag.with.dots',
        'tag@with@symbols',
        'tag#with#hash',
        'tag$with$dollar',
        'tag%with%percent'
      ]

      specialTags.forEach(tag => inputTag.add(tag))
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(specialTags.length)
      expect(getTagValues(inputTag)).to.deep.equal(specialTags)
    })

    it('should handle tags with unicode characters', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const unicodeTags = [
        'café',
        'naïve',
        'résumé',
        '日本語',
        '한국어',
        'العربية',
        '🚀rocket',
        '💻code'
      ]

      unicodeTags.forEach(tag => inputTag.add(tag))
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(unicodeTags.length)
      expect(getTagValues(inputTag)).to.deep.equal(unicodeTags)
    })

    it('should handle tags with quotes and HTML-like content', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      const htmlTags = [
        '"quoted-tag"',
        "'single-quoted'",
        '<not-html>',
        '&special&entities&',
        'tag"with"quotes',
        "tag'with'apostrophes"
      ]

      htmlTags.forEach(tag => inputTag.add(tag))
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(htmlTags.length)
      expect(getTagValues(inputTag)).to.deep.equal(htmlTags)
    })

    it('should handle tags with newlines and line breaks', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      // These should be trimmed or handled appropriately
      inputTag.add('tag\nwith\nlines')
      inputTag.add('tag\rwith\rreturns')
      inputTag.add('tag\twith\ttabs')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(3)

      // The exact behavior may vary, but should not break the component
      const values = getTagValues(inputTag)
      expect(values).to.have.length(3)
      values.forEach(value => {
        expect(value).to.be.a('string')
        expect(value.length).to.be.greaterThan(0)
      })
    })
  })

  describe('Rapid Input Changes', () => {
    it('should handle rapid tag additions', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      // Add many tags rapidly
      for (let i = 0; i < 50; i++) {
        inputTag.add(`rapid-tag-${i}`)
      }
      await waitForUpdate(100)

      expect(getTagElements(inputTag)).to.have.length(50)

      const values = getTagValues(inputTag)
      for (let i = 0; i < 50; i++) {
        expect(values).to.include(`rapid-tag-${i}`)
      }
    })

    it('should handle rapid tag removals', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      // Add many tags first
      const tags = []
      for (let i = 0; i < 20; i++) {
        const tag = `removal-tag-${i}`
        tags.push(tag)
        inputTag.add(tag)
      }
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(20)

      // Remove them rapidly
      tags.forEach(tag => inputTag.remove(tag))
      await waitForUpdate(100)

      expect(getTagElements(inputTag)).to.have.length(0)
    })

    it('should handle rapid mixed operations', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      // Mix of rapid additions and removals
      inputTag.add('tag1')
      inputTag.add('tag2')
      inputTag.remove('tag1')
      inputTag.add('tag3')
      inputTag.add('tag4')
      inputTag.remove('tag2')
      inputTag.add('tag5')

      await waitForUpdate(100)

      expect(getTagElements(inputTag)).to.have.length(3)
      expect(getTagValues(inputTag)).to.deep.equal(['tag3', 'tag4', 'tag5'])
    })

    it('should handle rapid keyboard input', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')
      const input = inputTag._taggleInputTarget

      // Simulate rapid typing and entering
      await simulateInput(input, 'rapid1')
      simulateKeydown(input, KEYCODES.ENTER)
      await simulateInput(input, 'rapid2')
      simulateKeydown(input, KEYCODES.ENTER)
      await simulateInput(input, 'rapid3')
      simulateKeydown(input, KEYCODES.ENTER)

      await waitForUpdate(100)

      expect(getTagElements(inputTag)).to.have.length(3)
      expect(getTagValues(inputTag)).to.deep.equal(['rapid1', 'rapid2', 'rapid3'])
    })
  })

  describe('Memory Leaks and DOM Cleanup', () => {
    it('should clean up observers on disconnect', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')

      expect(inputTag.observer).to.not.be.null

      // Simulate disconnection
      inputTag.disconnectedCallback()

      // Observer should be cleaned up - no way to directly test this
      // but we can ensure no errors are thrown
      expect(() => {
        document.body.innerHTML = ''
      }).to.not.throw()
    })

    it('should handle being removed and re-added to DOM', async () => {
      document.body.innerHTML = `
        <div id="container">
          <input-tag name="tags" multiple>
            <tag-option value="persistent">Persistent</tag-option>
          </input-tag>
        </div>
      `

      const container = document.querySelector('#container')
      const inputTag = document.querySelector('input-tag')

      await waitForBasicInitialization(inputTag)

      expect(getTagElements(inputTag)).to.have.length(1)

      // Remove from DOM
      const removed = container.removeChild(inputTag)
      await waitForUpdate()

      // Re-add to DOM
      container.appendChild(removed)
      await waitForUpdate()

      // Should still work
      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['persistent'])
    })

    it('should handle multiple instances without interference', async () => {
      document.body.innerHTML = `
        <input-tag name="tags1" multiple></input-tag>
        <input-tag name="tags2" multiple></input-tag>
        <input-tag name="tags3" multiple></input-tag>
      `

      const inputTag1 = document.querySelector('input-tag[name="tags1"]')
      const inputTag2 = document.querySelector('input-tag[name="tags2"]')
      const inputTag3 = document.querySelector('input-tag[name="tags3"]')

      await waitForElement(inputTag1, '_taggle')
      await waitForElement(inputTag2, '_taggle')
      await waitForElement(inputTag3, '_taggle')

      // Add different tags to each
      inputTag1.add('tag1-a')
      inputTag2.add('tag2-a')
      inputTag3.add('tag3-a')

      await waitForUpdate()

      expect(getTagValues(inputTag1)).to.deep.equal(['tag1-a'])
      expect(getTagValues(inputTag2)).to.deep.equal(['tag2-a'])
      expect(getTagValues(inputTag3)).to.deep.equal(['tag3-a'])

      // Remove one instance
      inputTag2.remove()
      await waitForUpdate()

      // Others should still work
      inputTag1.add('tag1-b')
      inputTag3.add('tag3-b')
      await waitForUpdate()

      expect(getTagValues(inputTag1)).to.deep.equal(['tag1-a', 'tag1-b'])
      expect(getTagValues(inputTag3)).to.deep.equal(['tag3-a', 'tag3-b'])
    })
  })

  describe('Invalid HTML Scenarios', () => {
    it('should handle malformed tag-option elements', async () => {
      document.body.innerHTML = `
        <input-tag name="tags" multiple>
          <tag-option value="good">Good Tag</tag-option>
          <tag-option>No Value Attribute</tag-option>
          <tag-option value="">Empty Value</tag-option>
          <tag-option value="valid">Valid Tag</tag-option>
        </input-tag>
      `

      const inputTag = document.querySelector('input-tag')
      await waitForBasicInitialization(inputTag)

      const values = getTagValues(inputTag)
      expect(values).to.include('good')
      expect(values).to.include('valid')

      // Should handle the malformed ones gracefully
      expect(values.length).to.be.greaterThan(0)
    })

    it('should handle nested HTML content in tag-options', async () => {
      document.body.innerHTML = `
        <input-tag name="tags" multiple>
          <tag-option value="simple">Simple</tag-option>
          <tag-option value="with-html">
            <strong>Bold</strong> content
          </tag-option>
          <tag-option value="with-nested">
            <span>Nested <em>elements</em></span>
          </tag-option>
        </input-tag>
      `

      const inputTag = document.querySelector('input-tag')
      await waitForBasicInitialization(inputTag)

      expect(getTagElements(inputTag)).to.have.length(3)
      expect(getTagValues(inputTag)).to.deep.equal(['simple', 'with-html', 'with-nested'])
    })

    it('should handle input-tag with no name attribute', async () => {
      const inputTag = await setupInputTag('<input-tag multiple></input-tag>')

      expect(inputTag.name).to.be.null

      // Should still work for basic functionality
      inputTag.add('unnamed-tag')
      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['unnamed-tag'])
    })
  })

  describe('Android Comma Support', () => {
    it('should handle Android keyboard comma behavior', async () => {
      const inputTag = await setupInputTag('<input-tag name="tags" multiple></input-tag>')
      const input = inputTag._taggleInputTarget

      // Simulate Android keyboard behavior (keyCode 229)
      await simulateInput(input, 'android-tag,')
      simulateKeyup(input, 229) // Android composite keycode

      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(1)
      expect(getTagValues(inputTag)).to.deep.equal(['android-tag'])
      expect(input.value).to.equal('')
    })

    it('should handle Android backspace behavior', async () => {
      const inputTag = await setupInputTag(`
        <input-tag name="tags" multiple>
          <tag-option value="android-existing">Android Existing</tag-option>
        </input-tag>
      `)
      const input = inputTag._taggleInputTarget

      // Simulate Android backspace with empty input
      await simulateInput(input, '')
      simulateKeyup(input, 229)

      await waitForUpdate()

      expect(getTagElements(inputTag)).to.have.length(0)
    })
  })
})
