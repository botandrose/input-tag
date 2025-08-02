# @botandrose/input-tag

A declarative, framework-agnostic custom element for tag input with optional autocomplete functionality.

## Installation

```bash
npm install @botandrose/input-tag
```

## Usage

Import the custom element:

```javascript
import "@botandrose/input-tag"
```

Then use it in your HTML:

```html
<input-tag name="tags" multiple>
  <tag-option value="javascript">JavaScript</tag-option>
  <tag-option value="typescript">TypeScript</tag-option>
</input-tag>

<datalist id="suggestions">
  <option value="react">React</option>
  <option value="vue">Vue</option>
  <option value="angular">Angular</option>
</datalist>

<input-tag name="frameworks" list="suggestions" multiple></input-tag>
```

## Features

- Form-associated custom element with full form integration
- Autocomplete support via datalist or custom options
- Multiple/single value modes
- Real-time validation
- Accessible keyboard navigation
- Shadow DOM encapsulation
- Framework-agnostic

## API

### Attributes

- `name`: Form field name
- `multiple`: Allow multiple tags (default: single tag mode)
- `required`: Make field required
- `list`: ID of datalist for autocomplete suggestions

### Properties

- `value`: Get/set tag values as array
- `tags`: Get current tag values as array (read-only)
- `options`: Get available autocomplete options from datalist
- `form`: Reference to associated form element
- `name`: Get the name attribute value

### Events

- `change`: Fired when tag values change
- `update`: Fired when individual tags are added/removed with detail `{tag, isNew}`

### Methods

#### Tag Management
- `add(tag | tags[])`: Add single tag or array of tags
- `remove(tag)`: Remove specific tag by value
- `removeAll()`: Clear all tags
- `has(tag)`: Check if tag exists
- `addAt(tag, index)`: Add tag at specific position

#### Form Integration
- `reset()`: Clear all tags and input field
- `checkValidity()`: Check if field passes validation
- `reportValidity()`: Check validity and show validation UI

#### Interaction
- `focus()`: Focus the input field
- `disable()`: Disable the input
- `enable()`: Enable the input

### JavaScript API Example

```javascript
const inputTag = document.querySelector('input-tag')

// Add tags
inputTag.add('react')
inputTag.add(['vue', 'angular'])

// Check and manipulate tags
if (inputTag.has('react')) {
  inputTag.remove('react')
}

// Get current tags
console.log(inputTag.tags) // ['vue', 'angular']

// Set all tags at once
inputTag.value = ['new', 'tags']

// Form validation
if (!inputTag.checkValidity()) {
  inputTag.reportValidity()
}
```

## Testing

```bash
npm test
npm run test:all
```

## License

MIT
