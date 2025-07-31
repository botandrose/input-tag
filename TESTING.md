# Testing Guide

This project uses Web Test Runner for testing across multiple browsers.

## Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests in specific browsers
npm run test:chrome
npm run test:firefox
npm run test:webkit

# Run tests in all browsers
npm run test:all

# Run tests with coverage
npm run test:coverage

# CI mode (fail-only)
npm run test:ci
```

## Test Structure

Tests are organized in the `test/` directory with one file per category:

- `test/input-tag.test.js` - Smoke tests for basic functionality
- `test/basic-functionality.test.js` - Tag creation, removal, single/multiple modes
- `test/form-integration.test.js` - Form association, validation, reset behavior
- `test/events.test.js` - Change and update event handling, bubbling, timing
- `test/autocomplete.test.js` - Datalist integration, filtering, selection
- `test/edge-cases.test.js` - Empty strings, duplicates, special characters, memory leaks
- `test/api-methods.test.js` - Public methods, validation, property getters
- `test/lib/test-utils.js` - Shared test utilities and helpers
- `test/lib/fail-only.mjs` - Plugin to prevent `it.only` in CI

## Test Categories

### Basic Tag Functionality (`basic-functionality.test.js`)
- Adding and removing tags programmatically
- Single vs multiple tag mode behavior
- Tag display and value management
- Pre-existing tag-option initialization
- Maximum tag limits and validation

### Form Integration (`form-integration.test.js`)
- Form association with ElementInternals
- HTML validation (required attribute, checkValidity)
- Form reset behavior and event handling
- FormData integration for form submission
- Custom validity and validation messages

### Events (`events.test.js`)
- Change event firing on tag modifications
- Update events with detailed tag information
- Event bubbling and composition across shadow DOM
- Focus and blur event handling
- Event timing, sequence, and cleanup

### Autocomplete (`autocomplete.test.js`)
- Datalist integration and option reading
- Suggestion filtering and selection behavior
- Multiple datalist scenarios and switching
- Missing datalist handling
- Autocomplete UI interaction and positioning

### Edge Cases (`edge-cases.test.js`)
- Empty string and whitespace-only input handling
- Duplicate tag prevention (exact, case-insensitive, whitespace)
- Very long tag names and input handling
- Special characters, Unicode, and HTML-like content
- Rapid input changes and memory leak prevention
- Invalid HTML scenarios and malformed elements
- Android keyboard support (comma behavior)

### API Methods (`api-methods.test.js`)
- Focus method and input targeting
- Reset method and state clearing
- Validation methods (checkValidity, reportValidity)
- Value getter and setter with event handling
- Property getters (form, name, options)
- Error handling for invalid parameters

## Browser Compatibility

Tests run on:
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)

## Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.
