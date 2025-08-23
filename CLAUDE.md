# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@botandrose/input-tag`, a declarative, framework-agnostic custom element for tag input with autocomplete functionality. The project consists of:

- A form-associated custom element (`input-tag`) with shadow DOM encapsulation
- Integration with the third-party `taggle` library (modified) for tag management
- Autocomplete functionality via the `autocompleter` library and HTML datalist elements
- Comprehensive cross-browser testing using Web Test Runner

## Key Commands

**Testing:**
```bash
npm test                 # Run tests once (default browser)
npm run test:watch       # Run tests in watch mode
npm run test:all         # Run tests across all browsers (chromium, firefox, webkit)
npm run test:chrome      # Run tests in Chrome/Chromium only
npm run test:firefox     # Run tests in Firefox only
npm run test:webkit      # Run tests in Safari/WebKit only
npm run test:coverage    # Run tests with coverage report
npm run test:ci          # CI mode with fail-only plugin
```

**Single test execution:**
Web Test Runner supports filtering via `--grep` flag:
```bash
npm test -- --grep "should add tags"
npm run test:watch -- --grep "autocomplete"
```

## Architecture

**Core Components:**
- `src/input-tag.js` - Main custom element class with form integration, event handling, and autocomplete setup
- `src/taggle.js` - Modified version of Taggle library for tag UI management and interactions
- `TagOption` class - Custom element for individual tag rendering with shadow DOM

**Key Architectural Patterns:**
- Form-associated custom elements using ElementInternals API for native form integration
- Shadow DOM encapsulation for both the main element and individual tags
- Event-driven architecture with `change` and `update` events
- Declarative configuration via HTML attributes (`multiple`, `required`, `list`)
- Integration with HTML datalist elements for autocomplete suggestions

**State Management:**
- Tags stored internally in the taggle instance
- Form value synchronized via ElementInternals
- Autocomplete suggestions managed by external `autocompleter` library
- Pre-existing `<tag-option>` elements parsed and converted to initial tags

## Testing Structure

Tests are categorized by functionality in separate files:
- `input-tag.test.js` - Smoke tests and basic element creation
- `basic-functionality.test.js` - Tag CRUD operations, single/multiple modes
- `form-integration.test.js` - Form association, validation, reset, FormData
- `events.test.js` - Event firing, bubbling, timing, and cleanup
- `autocomplete.test.js` - Datalist integration and suggestion behavior
- `edge-cases.test.js` - Empty inputs, duplicates, special characters, memory leaks
- `api-methods.test.js` - Public method validation and error handling
- `dom-mutation.test.js` - Dynamic DOM changes and element lifecycle
- `value-label-separation.test.js` - Handling value/label pairs in options
- `nested-datalist.test.js` - Complex datalist scenarios

**Test Utilities:**
- `test/lib/test-utils.js` - Shared helpers like `setupGlobalTestHooks()` and `waitForElement()`
- `test/lib/fail-only.mjs` - Plugin preventing `it.only` tests in CI

## Important Implementation Details

**Form Integration:**
Uses ElementInternals API for native form association, validation, and reset handling. The element automatically registers with forms and participates in form submission.

**Event System:**
- `change` events fire when tag collection changes (like native form elements)
- `update` events provide granular detail about individual tag additions/removals
- Events properly bubble through shadow DOM boundaries

**Browser Compatibility:**
Tested across Chromium, Firefox, and WebKit. Uses Web Test Runner with Playwright for cross-browser testing. Special handling for Android keyboards (comma key behavior).

**Memory Management:**
Tests include memory leak prevention checks, especially for autocomplete functionality and event listeners in shadow DOM.