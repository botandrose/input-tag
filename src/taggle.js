/**
 * Taggle - dependency-less tagging library
 * @author Sean Coker <hello@sean.is>
 * @version 1.15.0 (modified)
 * @license MIT
 */

/////////////////////
// Default options //
/////////////////////

var noop = function() {};
var retTrue = function() {
  return true;
};
var BACKSPACE = 8;
var DELETE = 46;
var COMMA = 188;
var TAB = 9;
var ENTER = 13;

var DEFAULTS = {



  /**
   * Clear the input value when blurring.
   *
   * @type {Boolean}
   */
  clearOnBlur: true,


  /**
   * Class added to the container div when focused
   * @type {String}
   */
  containerFocusClass: 'active',

  /**
   * Tags that should be preloaded in the div on load
   * @type {Array}
   */
  tags: [],




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

  // @todo bind callback hooks to instance

  /**
   * Function hook called with the to-be-added input DOM element.
   *
   * @param  {HTMLElement} input The input element to be added
   */
  inputFormatter: noop,

  /**
   * Function hook called with the to-be-added tag DOM element.
   * Use this function to edit the list item before it is appended
   * to the DOM
   * @param  {HTMLElement} li The list item to be added
   */
  tagFormatter: noop,

  /**
   * Function hook called before a tag is added. Return false
   * to prevent tag from being added
   * @param  {String} tag The tag to be added
   */
  onBeforeTagAdd: noop,

  /**
   * Function hook called when a tag is added
   * @param  {Event} event Event triggered when tag was added
   * @param  {String} tag The tag added
   */
  onTagAdd: noop,

  /**
   * Function hook called before a tag is removed. Return false
   * to prevent tag from being removed
   * @param  {String} tag The tag to be removed
   */
  onBeforeTagRemove: retTrue,

  /**
   * Function hook called when a tag is removed
   * @param  {Event} event Event triggered when tag was removed
   * @param  {String} tag The tag removed
   */
  onTagRemove: noop
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

    if (typeof el === 'string') {
      this.container = document.getElementById(el);
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
    this.measurements.container.style = window.getComputedStyle(this.container);

    var style = this.measurements.container.style;
    var lpad = parseInt(style['padding-left'] || style.paddingLeft, 10);
    var rpad = parseInt(style['padding-right'] || style.paddingRight, 10);
    var lborder = parseInt(style['border-left-width'] || style.borderLeftWidth, 10);
    var rborder = parseInt(style['border-right-width'] || style.borderRightWidth, 10);

    this.measurements.container.padding = lpad + rpad + lborder + rborder;
  }

  /**
   * Setup the div container for tags to be entered
   */
  _setupTextarea() {
    var fontSize;

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

    if (this.settings.tags.length) {
      for (var i = 0, len = this.settings.tags.length; i < len; i++) {
        var taggle = this._createTag(this.settings.tags[i], this.tag.values.length);
        this.container.appendChild(taggle);
      }
    }

    if (this.placeholder) {
      this._hidePlaceholder();
      this.placeholder.classList.add('taggle_placeholder');
      this.container.appendChild(this.placeholder);
      this.placeholder.textContent = this.settings.placeholder;

      if (!this.tag.values.length) {
        this._showPlaceholder();
      }
    }

    var formattedInput = this.settings.inputFormatter(this.input);
    if (formattedInput) {
      this.input = formattedInput;
    }

    const div = document.createElement('div');
    div.appendChild(this.input);
    div.appendChild(this.sizer);
    this.inputContainer.appendChild(div);
    fontSize = window.getComputedStyle(this.input).fontSize;
    this.sizer.style.fontSize = fontSize;
  };

  /**
   * Attaches neccessary events
   */
  _attachEvents() {
    var self = this;

    if (this._eventsAttached) {
      return false;
    }

    this._eventsAttached = true;

    function containerClick() {
      self.input.focus();
    }

    this._handleContainerClick = containerClick.bind(this);
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
  };

  _detachEvents() {
    if (!this._eventsAttached) {
      return false;
    }

    var self = this;

    this._eventsAttached = false;

    this.container.removeEventListener('click', this._handleContainerClick);
    this.input.removeEventListener('focus', this._handleFocus);
    this.input.removeEventListener('blur', this._handleBlur);
    this.input.removeEventListener('keydown', this._handleKeydown);
    this.input.removeEventListener('keyup', this._handleKeyup);

    return true;
  };

  /**
   * Resizes the hidden input where user types to fill in the
   * width of the div
   */
  _fixInputWidth() {
    this._setMeasurements();
    this._setInputWidth();
  };

  /**
   * Returns whether or not the specified tag text can be added
   * @param  {Event} e event causing the potentially added tag
   * @param  {String} text tag value
   * @return {Boolean}
   */
  _canAdd(e, text) {
    if (!text) {
      return false;
    }
    var limit = this.settings.maxTags;
    if (limit !== null && limit <= this.getTagValues().length) {
      return false;
    }

    if (this.settings.onBeforeTagAdd(e, text) === false) {
      return false;
    }

    // Check for duplicates
    if (this.tag.values.indexOf(text) !== -1) {
      return false;
    }

    return true;
  };


  /**
   * Appends tag with its corresponding input to the list
   * @param  {Event} e
   * @param  {String} text
   * @param  {Number} index
   */
  _add(e, text, index) {
    var self = this;
    var values = text || '';
    var delimiter = ',';

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

      var currentTagLength = this.tag.values.length;
      var tagIndex = _clamp(index || currentTagLength, 0, currentTagLength);
      var tagOption = this._createTag(val, tagIndex);
      var tagOptions = this.container.children;
      this.container.append(tagOption);

      val = this.tag.values[tagIndex];

      this.settings.onTagAdd(e, val);

      this.input.value = '';
      this._fixInputWidth();
      this._setFocusStateForContainer();
    });
  };

  /**
   * Removes last tag if it has already been probed
   * @param  {Event} e
   */
  _checkPrevOrNextTag(e) {

    var taggles = this.container.querySelectorAll('tag-option');
    var prevTagIndex = _clamp(this._inputPosition - 1, 0, taggles.length - 1);
    var nextTagIndex = _clamp(this._inputPosition, 0, taggles.length - 1);
    var index = prevTagIndex;

    if (e.keyCode === DELETE) {
      index = nextTagIndex;
    }

    var targetTaggle = taggles[index];
    var hotClass = 'taggle_hot';
    var isDeleteOrBackspace = [BACKSPACE, DELETE].indexOf(e.keyCode) !== -1;

    // prevent holding backspace from deleting all tags
    if (this.input.value === '' && isDeleteOrBackspace && !this._backspacePressed) {
      if (targetTaggle.classList.contains(hotClass)) {
        this._backspacePressed = true;
        this._remove(targetTaggle, e);
        this._fixInputWidth();
        this._setFocusStateForContainer();
      }
      else {
        targetTaggle.classList.add(hotClass);
      }
    }
    else if (targetTaggle.classList.contains(hotClass)) {
      targetTaggle.classList.remove(hotClass);
    }
  };

  /**
   * Setter for the hidden input.
   * @param {Number} width
   */
  _setInputWidth() {
    var width = this.sizer.getBoundingClientRect().width;
    var max = this.measurements.container.rect.width - this.measurements.container.padding;
    var size = parseInt(this.sizer.style.fontSize, 10);

    // 1.5 just seems to be a good multiplier here
    var newWidth = Math.round(_clamp(width + (size * 1.5), 10, max));

    this.input.style.width = newWidth + 'px';
  };


  /**
   * Checks whether or not the key pressed is acceptable
   * @param  {Number}  key code
   * @return {Boolean}
   */
  _isConfirmKey(key) {
    var confirmKey = false;

    if (this.settings.submitKeys.indexOf(key) > -1) {
      confirmKey = true;
    }

    return confirmKey;
  };

  // Event handlers

  /**
   * Handles focus state of div container.
   */
  _setFocusStateForContainer() {
    this._fixInputWidth();

    if (!this.container.classList.contains(this.settings.containerFocusClass)) {
      this.container.classList.add(this.settings.containerFocusClass);
    }

    this._hidePlaceholder();
  };

  /**
   * Runs all the events that need to happen on a blur
   * @param  {Event} e
   */
  _blurEvent(e) {
    if (this.container.classList.contains(this.settings.containerFocusClass)) {
      this.container.classList.remove(this.settings.containerFocusClass);
    }

    if (this.settings.clearOnBlur) {
      this.input.value = '';
      this._setInputWidth();
    }

    if (!this.tag.values.length && !this.input.value) {
      this._showPlaceholder();
    }
  };

  /**
   * Runs all the events that need to run on keydown
   * @param  {Event} e
   */
  _keydownEvents(e) {

    var key = e.keyCode;
    this.pasting = false;

    this._setInputWidth();

    if (key === 86 && e.metaKey) {
      this.pasting = true;
    }

    if (this._isConfirmKey(key) && this.input.value !== '') {
      this._confirmValidTagEvent(e);
      return;
    }

    if (this.tag.values.length) {
      this._checkPrevOrNextTag(e);
    }
  };

  /**
   * Runs all the events that need to run on keyup
   * @param  {Event} e
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
  };

  /**
   * Confirms the inputted value to be converted to a tag
   * @param  {Event} e
   */
  _confirmValidTagEvent(e) {
    // prevents from jumping out of textarea
    e.preventDefault();

    this._add(e, null, this._inputPosition);
  };

  _createTag(text, index) {
    var tagOption = document.createElement('tag-option');

    text = this._formatTag(text);
    tagOption.textContent = text;
    tagOption.setAttribute('value', text);

    var formatted = this.settings.tagFormatter(tagOption);

    if (typeof formatted !== 'undefined') {
      tagOption = formatted;
    }

    if (!(tagOption instanceof HTMLElement) || !(tagOption.localName === 'tag-option' || tagOption.tagName === 'TAG-OPTION')) {
      throw new Error('tagFormatter must return an tag-option element');
    }


    this.tag.values.splice(index, 0, text);
    this.tag.elements.splice(index, 0, tagOption);
    this._inputPosition = _clamp(this._inputPosition + 1, 0, this.tag.values.length);

    return tagOption;
  };

  _showPlaceholder() {
    if (this.placeholder) {
      this.placeholder.style.opacity = 1;
      this.placeholder.setAttribute('aria-hidden', 'false');
    }
  };

  _hidePlaceholder() {
    if (this.placeholder) {
      this.placeholder.style.opacity = 0;
      this.placeholder.setAttribute('aria-hidden', 'true');
    }
  };

  /**
   * Removes tag from the tags collection
   * @param  {tagOption} tagOption List item to remove
   * @param  {Event} e
   */
  _remove(tagOption, e) {
    var self = this;
    var text;
    var elem;
    var index;

    if (tagOption.tagName.toLowerCase() !== 'tag-option') {
      tagOption = tagOption.parentNode;
    }

    elem = (tagOption.tagName.toLowerCase() === 'a') ? tagOption.parentNode : tagOption;
    index = this.tag.elements.indexOf(elem);

    text = this.tag.values[index];

    function done(error) {
      if (error) {
        return;
      }

      tagOption.remove()

      // Going to assume the indicies match for now
      self.tag.elements.splice(index, 1);
      self.tag.values.splice(index, 1);

      self.settings.onTagRemove(e, text);

      if (index < self._inputPosition) {
        self._inputPosition = _clamp(self._inputPosition - 1, 0, self.tag.values.length);
      }

      self._setFocusStateForContainer();
    }

    var ret = this.settings.onBeforeTagRemove(e, text, done);

    if (!ret) {
      return;
    }

    done();
  };

  /**
   * Format the text for a tag
   * @param {String} text Tag text
   * @return {String}
   */
  _formatTag(text) {
    return this.settings.preserveCase ? text : text.toLowerCase();
  };

  // @todo
  // @deprecated use getTags().values
  getTagValues() {
    return [].slice.apply(this.tag.values);
  };

  getInput() {
    return this.input;
  };

  getContainer() {
    return this.container;
  };

  add(text, index) {
    var isArr = Array.isArray(text);

    if (isArr) {
      var startingIndex = index;

      for (var i = 0, len = text.length; i < len; i++) {
        if (typeof text[i] === 'string') {
          this._add(null, text[i], startingIndex);

          if (!isNaN(startingIndex)) {
            startingIndex += 1;
          }
        }
      }
    }
    else {
      this._add(null, text, index);
    }

    return this;
  };

  remove(text, all) {
    var len = this.tag.values.length - 1;
    var found = false;

    while (len > -1) {
      var tagText = this.tag.values[len];

      if (tagText === text) {
        found = true;
        this._remove(this.tag.elements[len]);
      }

      if (found && !all) {
        break;
      }

      len--;
    }

    return this;
  };

  removeAll() {
    for (var i = this.tag.values.length - 1; i >= 0; i--) {
      this._remove(this.tag.elements[i]);
    }

    this._showPlaceholder();

    return this;
  };
  enable() {
    var buttons = [].slice.call(this.container.querySelectorAll('button'));
    var inputs = [].slice.call(this.container.querySelectorAll('input'));

    buttons.concat(inputs).forEach(function(el) {
      el.removeAttribute('disabled');
    });

    return this;
  };

  disable() {
    var buttons = [].slice.call(this.container.querySelectorAll('button'));
    var inputs = [].slice.call(this.container.querySelectorAll('input'));

    buttons.concat(inputs).forEach(function(el) {
      el.setAttribute('disabled', '');
    });

    return this;
  }
}

export default Taggle;
