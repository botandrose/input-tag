/**
 * Taggle - dependency-less tagging library
 * @author Sean Coker <hello@sean.is>
 * @version 1.15.0 (modified)
 * @license MIT
 */

/////////////////////
// Default options //
/////////////////////

const BACKSPACE = 8;
const DELETE = 46;
const COMMA = 188;
const TAB = 9;
const ENTER = 13;

const DEFAULTS = {
  /**
   * Class added to the container div when focused
   * @type {String}
   */
  containerFocusClass: 'active',

  /**
   * Spaces will be removed from the tags by default
   * @type {Boolean}
   */
  trimTags: true,

  /**
   * Limit the number of tags that can be added
   * @type {Number}
   */
  maxTags: null,

  /**
   * Placeholder string to be placed in an empty taggle field
   * @type {String}
   */
  placeholder: 'Enter tags...',

  /**
   * Keycodes that will add a tag
   * @type {Array}
   */
  submitKeys: [COMMA, TAB, ENTER],

  /**
   * Preserve case of tags being added ie
   * "tag" is different than "Tag"
   * @type {Boolean}
   */
  preserveCase: false,

  /**
   * Function hook called when a tag is added
   * @param  {Event} event Event triggered when tag was added
   * @param  {String} tag The tag added
   */
  onTagAdd: () => {},

  /**
   * Function hook called when a tag is removed
   * @param  {Event} event Event triggered when tag was removed
   * @param  {String} tag The tag removed
   */
  onTagRemove: () => {}
};

//////////////////////
// Helper functions //
//////////////////////
function _clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Taggle ES6 Class - Modern tagging library
 */
class Taggle {
  /**
   * Constructor
   * @param {Mixed} el ID of an element or the actual element
   * @param {Object} options
   */
  constructor(el, options) {
    this.settings = Object.assign({}, DEFAULTS, options);
    this.measurements = {
      container: {
        rect: null,
        style: null,
        padding: null
      }
    };
    this.container = el;
    this.tag = {
      values: [],
      elements: []
    };
    this.inputContainer = options.inputContainer;
    this.input = document.createElement('input');
    this.sizer = document.createElement('div');
    this.pasting = false;
    this.placeholder = null;

    if (this.settings.placeholder) {
      this.placeholder = document.createElement('span');
    }

    this._backspacePressed = false;
    this._inputPosition = 0;
    this._setMeasurements();
    this._setupTextarea();
    this._attachEvents();
  }

  /**
   * Gets all the layout measurements up front
   */
  _setMeasurements() {
    this.measurements.container.rect = this.container.getBoundingClientRect();
    const style = window.getComputedStyle(this.container);
    this.measurements.container.style = style;

    const lpad = parseInt(style.paddingLeft, 10);
    const rpad = parseInt(style.paddingRight, 10);
    const lborder = parseInt(style.borderLeftWidth, 10);
    const rborder = parseInt(style.borderRightWidth, 10);

    this.measurements.container.padding = lpad + rpad + lborder + rborder;
  }

  /**
   * Setup the div container for tags to be entered
   */
  _setupTextarea() {
    this.input.type = 'text';
    // Make sure no left/right padding messes with the input sizing
    this.input.style.paddingLeft = 0;
    this.input.style.paddingRight = 0;
    this.input.className = 'taggle_input';
    this.input.tabIndex = 1;
    this.sizer.className = 'taggle_sizer';

    [...this.container.children].forEach(tagOption => {
      this.tag.values.push(tagOption.value);
      this.tag.elements.push(tagOption);
      this._inputPosition = _clamp(this._inputPosition + 1, 0, this.tag.values.length);
    })


    if (this.placeholder) {
      this._hidePlaceholder();
      this.placeholder.classList.add('taggle_placeholder');
      this.container.appendChild(this.placeholder);
      this.placeholder.textContent = this.settings.placeholder;

      if (!this.tag.values.length) {
        this._showPlaceholder();
      }
    }


    const div = document.createElement('div');
    div.appendChild(this.input);
    div.appendChild(this.sizer);
    this.inputContainer.appendChild(div);
    const fontSize = window.getComputedStyle(this.input).fontSize;
    this.sizer.style.fontSize = fontSize;
  }

  /**
   * Attaches neccessary events
   */
  _attachEvents() {
    if (this._eventsAttached) {
      return false;
    }
    this._eventsAttached = true;

    this._handleContainerClick = () => this.input.focus();
    this.container.addEventListener('click', this._handleContainerClick);

    this._handleFocus = this._setFocusStateForContainer.bind(this);
    this._handleBlur = this._blurEvent.bind(this);
    this._handleKeydown = this._keydownEvents.bind(this);
    this._handleKeyup = this._keyupEvents.bind(this);

    this.input.addEventListener('focus', this._handleFocus);
    this.input.addEventListener('blur', this._handleBlur);
    this.input.addEventListener('keydown', this._handleKeydown);
    this.input.addEventListener('keyup', this._handleKeyup);

    return true;
  }

  _detachEvents() {
    if (!this._eventsAttached) {
      return false;
    }
    this._eventsAttached = false;

    this.container.removeEventListener('click', this._handleContainerClick);
    this.input.removeEventListener('focus', this._handleFocus);
    this.input.removeEventListener('blur', this._handleBlur);
    this.input.removeEventListener('keydown', this._handleKeydown);
    this.input.removeEventListener('keyup', this._handleKeyup);

    return true;
  }

  /**
   * Returns whether or not the specified tag text can be added
   * @param {Event} e event causing the potentially added tag
   * @param {String} text tag value
   * @return {Boolean}
   */
  _canAdd(e, text) {
    if (!text) {
      return false;
    }
    const limit = this.settings.maxTags;
    if (limit !== null && limit <= this.getTagValues().length) {
      return false;
    }

    // Check for duplicates
    return this.tag.values.indexOf(text) === -1;
  }

  /**
   * Appends tag with its corresponding input to the list
   * @param {Event} e
   * @param {String} text
   * @param {Number} index
   */
  _add(e, text, index) {
    let values = text || '';
    const delimiter = ',';

    if (typeof text !== 'string') {
      values = this.input.value;

      if (this.settings.trimTags) {
        if (values[0] === delimiter) {
          values = values.replace(delimiter, '');
        }
        values = values.trim();
      }
    }

    values.split(delimiter).map(val => {
      if (this.settings.trimTags) {
        val = val.trim();
      }
      return this._formatTag(val);
    }).forEach(val => {
      if (!this._canAdd(e, val)) {
        return;
      }

      const currentTagLength = this.tag.values.length;
      const tagIndex = _clamp(index || currentTagLength, 0, currentTagLength);
      const tagOption = this._createTag(val, tagIndex);
      this.container.append(tagOption);

      val = this.tag.values[tagIndex];

      this.settings.onTagAdd(e, val);

      this.input.value = '';
      this._setMeasurements();
      this._setInputWidth();
      this._setFocusStateForContainer();
    });
  }

  /**
   * Removes last tag if it has already been probed
   * @param {Event} e
   */
  _checkPrevOrNextTag(e) {
    const taggles = this.container.querySelectorAll('tag-option');
    const prevTagIndex = _clamp(this._inputPosition - 1, 0, taggles.length - 1);
    const nextTagIndex = _clamp(this._inputPosition, 0, taggles.length - 1);
    let index = prevTagIndex;

    if (e.keyCode === DELETE) {
      index = nextTagIndex;
    }

    const targetTaggle = taggles[index];
    const hotClass = 'taggle_hot';
    const isDeleteOrBackspace = [BACKSPACE, DELETE].includes(e.keyCode);

    // prevent holding backspace from deleting all tags
    if (this.input.value === '' && isDeleteOrBackspace && !this._backspacePressed) {
      if (targetTaggle.classList.contains(hotClass)) {
        this._backspacePressed = true;
        this._remove(targetTaggle, e);
        this._setMeasurements();
        this._setInputWidth();
        this._setFocusStateForContainer();
      }
      else {
        targetTaggle.classList.add(hotClass);
      }
    }
    else if (targetTaggle.classList.contains(hotClass)) {
      targetTaggle.classList.remove(hotClass);
    }
  }

  /**
   * Setter for the hidden input.
   * @param {Number} width
   */
  _setInputWidth() {
    const width = this.sizer.getBoundingClientRect().width;
    const max = this.measurements.container.rect.width - this.measurements.container.padding;
    const size = parseInt(this.sizer.style.fontSize, 10);

    // 1.5 just seems to be a good multiplier here
    const newWidth = Math.round(_clamp(width + (size * 1.5), 10, max));

    this.input.style.width = `${newWidth}px`;
  }

  /**
   * Handles focus state of div container.
   */
  _setFocusStateForContainer() {
    this._setMeasurements();
    this._setInputWidth();

    if (!this.container.classList.contains(this.settings.containerFocusClass)) {
      this.container.classList.add(this.settings.containerFocusClass);
    }

    this._hidePlaceholder();
  }

  /**
   * Runs all the events that need to happen on a blur
   * @param {Event} e
   */
  _blurEvent(e) {
    if (this.container.classList.contains(this.settings.containerFocusClass)) {
      this.container.classList.remove(this.settings.containerFocusClass);
    }

    if (!this.tag.values.length && !this.input.value) {
      this._showPlaceholder();
    }
  }

  /**
   * Runs all the events that need to run on keydown
   * @param {Event} e
   */
  _keydownEvents(e) {
    const key = e.keyCode;
    this.pasting = false;

    this._setInputWidth();

    if (key === 86 && e.metaKey) {
      this.pasting = true;
    }

    if (this.settings.submitKeys.includes(key) && this.input.value !== '') {
      this._confirmValidTagEvent(e);
      return;
    }

    if (this.tag.values.length) {
      this._checkPrevOrNextTag(e);
    }
  }

  /**
   * Runs all the events that need to run on keyup
   * @param {Event} e
   */
  _keyupEvents(e) {
    this._backspacePressed = false;

    this.sizer.textContent = this.input.value;

    // If we break to a new line because the text is too long
    // and decide to delete everything, we should resize the input
    // so it falls back inline
    if (!this.input.value) {
      this._setInputWidth();
    }

    if (this.pasting && this.input.value !== '') {
      this._add(e);
      this.pasting = false;
    }
  }

  /**
   * Confirms the inputted value to be converted to a tag
   * @param {Event} e
   */
  _confirmValidTagEvent(e) {
    // prevents from jumping out of textarea
    e.preventDefault();

    this._add(e, null, this._inputPosition);
  }

  _createTag(text, index) {
    const tagOption = document.createElement('tag-option');

    text = this._formatTag(text);
    tagOption.textContent = text;
    tagOption.setAttribute('value', text);

    this.tag.values.splice(index, 0, text);
    this.tag.elements.splice(index, 0, tagOption);
    this._inputPosition = _clamp(this._inputPosition + 1, 0, this.tag.values.length);

    return tagOption;
  }

  _showPlaceholder() {
    if (this.placeholder) {
      this.placeholder.style.opacity = 1;
      this.placeholder.setAttribute('aria-hidden', 'false');
    }
  }

  _hidePlaceholder() {
    if (this.placeholder) {
      this.placeholder.style.opacity = 0;
      this.placeholder.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Removes tag from the tags collection
   * @param {HTMLElement} tagOption List item to remove
   * @param {Event} e
   */
  _remove(tagOption, e) {
    const index = this.tag.elements.indexOf(tagOption);
    if (index === -1) return;

    const text = this.tag.values[index];

    tagOption.remove();
    this.tag.elements.splice(index, 1);
    this.tag.values.splice(index, 1);
    this.settings.onTagRemove(e, text);

    if (index < this._inputPosition) {
      this._inputPosition = _clamp(this._inputPosition - 1, 0, this.tag.values.length);
    }

    this._setFocusStateForContainer();
  }

  /**
   * Format the text for a tag
   * @param {String} text Tag text
   * @return {String}
   */
  _formatTag(text) {
    return this.settings.preserveCase ? text : text.toLowerCase();
  }

  // @todo
  // @deprecated use getTags().values
  getTagValues() {
    return [...this.tag.values];
  }

  getInput() {
    return this.input;
  }

  add(text, index) {
    const isArr = Array.isArray(text);

    if (isArr) {
      text.forEach((tag, i) => {
        if (typeof tag === 'string') {
          this._add(null, tag, index ? index + i : index);
        }
      });
    }
    else {
      this._add(null, text, index);
    }

    return this;
  }

  remove(text) {
    const index = this.tag.values.indexOf(text);
    if (index > -1) {
      this._remove(this.tag.elements[index]);
    }
    return this;
  }

  removeAll() {
    [...this.tag.elements].forEach(element => this._remove(element));
    this._showPlaceholder();
    return this;
  }

  _setDisabledState(disabled) {
    const elements = [
      ...this.container.querySelectorAll('button'),
      ...this.container.querySelectorAll('input')
    ];

    elements.forEach((el) => {
      if (disabled) {
        el.setAttribute('disabled', '');
      } else {
        el.removeAttribute('disabled');
      }
    });

    return this;
  }

  enable() {
    return this._setDisabledState(false);
  }

  disable() {
    return this._setDisabledState(true);
  }

  destroy() {
    this._detachEvents();
  }
}

export default Taggle;
