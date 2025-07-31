import Taggle from "./taggle.js"
import autocomplete from "autocompleter"


class TagOption extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this._shadowRoot.innerHTML = `
      <style>
        :host {
          background: #588a00;
          padding: 3px 10px 3px 10px !important;
          margin-right: 4px !important;
          margin-bottom: 2px !important;
          display: inline-flex;
          align-items: center;
          float: none;
          font-size: 1.25em;
          line-height: 1;
          min-height: 32px;
          color: #fff;
          text-transform: none;
          border-radius: 3px;
          position: relative;
          cursor: pointer;
        }
        button {
          z-index: 1;
          border: none;
          background: none;
          font-size: 1.4em;
          display: inline-block;
          color: rgba(255, 255, 255, 0.6);
          right: 10px;
          height: 100%;
          cursor: pointer;
        }
      </style>
      <slot></slot>
      <button type="button">×</button>
    `;

    this.buttonTarget = this._shadowRoot.querySelector("button")
    this.buttonTarget.onclick = event => {
      this.parentNode._taggle._remove(this, event)
    }
  }

  get value() {
    return this.getAttribute("value") || this.innerText
  }
}
customElements.define("tag-option", TagOption);


class InputTag extends HTMLElement {
  static get formAssociated() {
    return true;
  }

  static get observedAttributes() {
    return ['name', 'multiple', 'required', 'list'];
  }

  constructor() {
    super();
    this._internals = this.attachInternals();
    this._shadowRoot = this.attachShadow({ mode: "open" });

    this.observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Handle child list changes (tag-option elements added/removed)
          this.unobserve();
          this.processTagOptions();
          this.observe();
        } else if (mutation.type === 'attributes') {
          // Handle attribute changes on tag-option elements
          if (mutation.target !== this && mutation.target.tagName === 'TAG-OPTION') {
            this.unobserve();
            this.processTagOptions();
            this.observe();
          }
          // Note: changes to this element's attributes are handled by attributeChangedCallback
        }
      }
    });
  }

  unobserve() {
    this.observer.disconnect();
  }

  observe() {
    this.observer.observe(this, {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: ["value"],
    });
  }

  processTagOptions() {
    if(!this._taggle || !this._taggle.tag) return
    const values = Array.from(this.children).map(e => e.value)
    this._taggle.tag.elements = [...this.children]
    this._taggle.tag.values = values
    this._inputPosition = this._taggle.tag.values.length;
    
    // Update the taggle display elements to match the current values
    const taggleElements = this._taggle.tag.elements;
    taggleElements.forEach((element, index) => {
      if (element && element.setAttribute) {
        element.setAttribute('data-value', values[index]);
      }
    });
    
    // Update internal value to match
    this.updateValue();
  }

  get form() {
    return this._internals.form;
  }

  get name() {
    return this.getAttribute("name");
  }

  get value() {
    return this._internals.value;
  }

  set value(values) {
    const oldValues = this._internals.value;
    this._internals.value = values;

    const formData = new FormData();
    values.forEach(value => formData.append(this.name, value));
    if(values.length === 0) formData.append(this.name, ""); // none value
    this._internals.setFormValue(formData);

    // Update taggle to match the new values
    if (this._taggle && this.initialized) {
      this.suppressEvents = true; // Prevent infinite loops
      this._taggle.removeAll();
      if (values.length > 0) {
        this._taggle.add(values);
      }
      this.suppressEvents = false;
    }

    if(this.initialized && !this.suppressEvents && JSON.stringify(oldValues) !== JSON.stringify(values)) {
      this.dispatchEvent(new CustomEvent("change", {
        bubbles: true,
        composed: true,
      }));
    }
  }

  reset() {
    this._taggle.removeAll()
    this._taggleInputTarget.value = ''
  }

  get options() {
    const datalistId = this.getAttribute("list")
    if(datalistId) {
      const datalist = document.getElementById(datalistId)
      if(datalist) {
        return [...datalist.options].map(option => option.value)
      }
    }
    return []
  }

  async connectedCallback() {
    this.setAttribute('tabindex', '0');
    this.addEventListener("focus", e => this.focus(e));

    // Wait for child tag-option elements to be fully connected
    await new Promise(resolve => setTimeout(resolve, 0));

    this._shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        :host *{
          position: relative;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        #container {
          background: rgba(255, 255, 255, 0.8);
          padding: 6px 6px 3px;
          max-height: none;
          display: flex;
          margin: 0;
          flex-wrap: wrap;
          align-items: flex-start;
          min-height: 48px;
          line-height: 48px;
          width: 100%;
          border: 1px solid #d0d0d0;
          outline: 1px solid transparent;
          box-shadow: #ccc 0 1px 4px 0 inset;
          border-radius: 2px;
          cursor: text;
          color: #333;
          list-style: none;
          padding-right: 32px;
        }
        input {
          display: block;
          height: 32px;
          float: none;
          margin: 0;
          padding-left: 10px !important;
          padding-right: 30px !important;
          width: auto !important;
          min-width: 70px;
          font-size: 1.25em;
          width: 100%;
          line-height: 2;
          padding: 0 0 0 10px;
          border: 1px dashed #d0d0d0;
          outline: 1px solid transparent;
          background: #fff;
          box-shadow: none;
          border-radius: 2px;
          cursor: text;
          color: #333;
        }
        button {
          width: 30px;
          text-align: center;
          line-height: 30px;
          border: 1px solid #e0e0e0;
          font-size: 2em;
          color: #666;
          position: absolute !important;
          z-index: 10;
          right: 0px;
          top: 0;
          font-weight: 400;
          cursor: pointer;
          background: none;
        }
        .taggle_sizer{
          padding: 0;
          margin: 0;
          position: absolute;
          top: -500px;
          z-index: -1;
          visibility: hidden;
        }
        .ui-autocomplete{
          position: absolute;
          top: 0;
          left: 0;
          width: auto !important;
        }
        .ui-menu{
          margin: 0;
          padding: 6px;
          box-shadow: #ccc 0 1px 6px;
          z-index: 2;
          display: flex;
          flex-wrap: wrap;
          background: #fff;
          list-style: none;
          font-size: 1.25em;
          min-width: 200px;
        }
        .ui-menu .ui-menu-item{
          display: inline-block;
          margin: 0 0 2px;
          line-height: 30px;
          border: none;
          padding: 0 10px;
          text-indent: 0;
          border-radius: 2px;
          width: auto;
          cursor: pointer;
          color: #555;
        }
        .ui-menu .ui-menu-item::before{ display: none; }
        .ui-menu .ui-menu-item:hover{ background: #e0e0e0; }
        .ui-state-active{
          padding: 0;
          border: none;
          background: none;
          color: inherit;
        }
      </style>
      <div>
        <div id="container">
          <slot></slot>
        </div>
        <input
          id="inputTarget"
          type="hidden"
          name="${this.name}"
        />
      </div>
    `;

    this.form?.addEventListener("reset", this.reset.bind(this));

    this.containerTarget = this.shadowRoot.querySelector("#container");
    this.inputTarget = this.shadowRoot.querySelector("#inputTarget");

    this.required = this.hasAttribute("required")
    this.multiple = this.hasAttribute("multiple")

    const maxTags = this.multiple ? undefined : 1
    const placeholder = this.inputTarget.getAttribute("placeholder")

    this.inputTarget.value = ""
    this.inputTarget.id = ""

    this._taggle = new Taggle(this, {
      inputContainer: this.containerTarget,
      preserveCase: true,
      clearOnBlur: false,
      hiddenInputName: this.name,
      maxTags: maxTags,
      placeholder: placeholder,
      onTagAdd: (event, tag) => this.onTagAdd(event, tag),
      onTagRemove: (event, tag) => this.onTagRemove(event, tag),
    })
    this._taggleInputTarget = this._taggle.getInput()
    this._taggleInputTarget.id = this.id
    this._taggleInputTarget.autocomplete = "off"
    this._taggleInputTarget.setAttribute("data-turbo-permanent", true)
    this._taggleInputTarget.addEventListener("keyup", e => this.keyup(e))

    // Set initial value after taggle is initialized
    this.value = this._taggle.getTagValues()

    this.checkRequired()

    this.buttonTarget = h(`<button class="add">+</button>`)
    this.buttonTarget.addEventListener("click", e => this._add(e))
    this._taggleInputTarget.insertAdjacentElement("afterend", this.buttonTarget)

    this.autocompleteContainerTarget = h(`<ul>`);
    this.buttonTarget.insertAdjacentElement("afterend", this.autocompleteContainerTarget)

    this.setupAutocomplete()

    this.observe() // Start observing after taggle is set up
    this.initialized = true
  }

  setupAutocomplete() {
    autocomplete({
      input: this._taggleInputTarget,
      container: this.autocompleteContainerTarget,
      className: "ui-menu ui-autocomplete",
      fetch: (text, update) => {
        const suggestions = this.options.filter(tag => tag.toLowerCase().includes(text.toLowerCase()))
        update(suggestions)
      },
      render: item => h(`<li class="ui-menu-item">${item}</li>`),
      onSelect: item => this._taggle.add(item),
      minLength: 1,
    })
  }

  disconnectedCallback() {
    this.form?.removeEventListener("reset", this.reset.bind(this));
    this.unobserve();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    // Only handle changes after the component is connected and initialized
    if (!this._taggle) return;

    switch (name) {
      case 'name':
        this.handleNameChange(newValue);
        break;
      case 'multiple':
        this.handleMultipleChange(newValue !== null);
        break;
      case 'required':
        this.handleRequiredChange(newValue !== null);
        break;
      case 'list':
        this.handleListChange(newValue);
        break;
    }
  }

  checkRequired() {
    const flag = this.required && this._taggle.getTagValues().length == 0
    this._taggleInputTarget.required = flag

    // Update ElementInternals validity to match internal input
    if (flag) {
      this._internals.setValidity({ valueMissing: true }, 'Please fill out this field.', this._taggleInputTarget)
    } else {
      this._internals.setValidity({})
    }
  }

  // monkeypatch support for android comma
  keyup(event) {
    const key = event.which || event.keyCode
    const normalKeyboard = key != 229
    if(normalKeyboard) return
    const value = this._taggleInputTarget.value

    // backspace
    if(value.length == 0) {
      const values = this._taggle.tag.values
      this._taggle.remove(values[values.length - 1])
      return
    }

    // comma
    if(/,$/.test(value)) {
      const tag = value.replace(',', '')
      this._taggle.add(tag)
      this._taggleInputTarget.value = ''
      return
    }
  }

  _add(event) {
    event.preventDefault()
    this._taggle.add(this._taggleInputTarget.value)
    this._taggleInputTarget.value = ''
  }

  onTagAdd(event, tag) {
    if (!this.suppressEvents) {
      const isNew = !this.options.includes(tag)
      this.dispatchEvent(new CustomEvent("update", {
        detail: { tag, isNew },
        bubbles: true,
        composed: true,
      }));
    }
    this.syncValue()
    this.checkRequired()
  }

  onTagRemove(event, tag) {
    if (!this.suppressEvents) {
      this.dispatchEvent(new CustomEvent("update", {
        detail: { tag },
        bubbles: true,
        composed: true,
      }));
    }
    this.syncValue()
    this.checkRequired()
  }

  syncValue() {
    // Directly update internals without triggering the setter
    const values = this._taggle.getTagValues()
    const oldValues = this._internals.value;
    this._internals.value = values;

    const formData = new FormData();
    values.forEach(value => formData.append(this.name, value));
    if(values.length === 0) formData.append(this.name, ""); // none value
    this._internals.setFormValue(formData);

    if(this.initialized && !this.suppressEvents && JSON.stringify(oldValues) !== JSON.stringify(values)) {
      this.dispatchEvent(new CustomEvent("change", {
        bubbles: true,
        composed: true,
      }));
    }
  }

  // Public API methods
  add(tags) {
    if (!this._taggle) return
    this._taggle.add(tags)
  }

  remove(tag) {
    if (!this._taggle) return
    this._taggle.remove(tag)
  }

  removeAll() {
    if (!this._taggle) return
    this._taggle.removeAll()
  }

  has(tag) {
    if (!this._taggle) return false
    return this._taggle.getTagValues().includes(tag)
  }

  get tags() {
    if (!this._taggle) return []
    return this._taggle.getTagValues()
  }

  addAt(tag, index) {
    if (!this._taggle) return
    this._taggle.add(tag, index)
  }

  disable() {
    if (this._taggle) {
      this._taggle.disable()
    }
  }

  enable() {
    if (this._taggle) {
      this._taggle.enable()
    }
  }

  focus() {
    if (this._taggleInputTarget) {
      this._taggleInputTarget.focus()
    }
  }

  checkValidity() {
    if (this._taggle) {
      this.checkRequired()
    }
    return this._internals.checkValidity()
  }

  reportValidity() {
    if (this._taggle) {
      this.checkRequired()
    }
    return this._internals.reportValidity()
  }

  handleNameChange(newName) {
    // Update the hidden input name to match
    const hiddenInput = this._shadowRoot.querySelector('input[type="hidden"]');
    if (hiddenInput) {
      hiddenInput.name = newName || '';
    }
    
    // Update the form value with the new name
    if (this._internals.value) {
      this.value = this._internals.value; // This will recreate FormData with new name
    }
  }

  handleMultipleChange(isMultiple) {
    if (!this._taggle) return;
    
    // Update the internal multiple state
    this.multiple = isMultiple;
    
    // Get current tags
    const currentTags = this._taggle.getTagValues();
    
    if (!isMultiple && currentTags.length > 1) {
      // Single mode: remove excess tag-option elements from DOM
      const tagOptions = Array.from(this.children);
      // Keep only the first tag-option element, remove the rest
      for (let i = 1; i < tagOptions.length; i++) {
        if (tagOptions[i]) {
          this.removeChild(tagOptions[i]);
        }
      }
    }
    
    // Reinitialize taggle with new multiple setting
    this.reinitializeTaggle();
    
    // Restore tags, respecting the new multiple constraint
    if (isMultiple) {
      // Multiple mode: restore all remaining tags
      if (currentTags.length > 0) {
        this._taggle.add(currentTags);
      }
    } else {
      // Single mode: keep only the first tag
      if (currentTags.length > 0) {
        this._taggle.add(currentTags[0]);
      }
    }
    
    this.updateValue();
  }

  handleRequiredChange(isRequired) {
    if (!this._taggle) return;
    
    // Update the internal required state
    this.required = isRequired;
    
    // Update validation
    this.checkRequired();
  }

  handleListChange(newListId) {
    if (!this._taggle) return;
    
    // The options getter will automatically read from the new datalist
    // No additional action needed as autocomplete will pick up the change
  }

  reinitializeTaggle() {
    // Clean up existing taggle if it exists
    if (this._taggle && this._taggle.destroy) {
      this._taggle.destroy();
    }

    // Get current configuration
    const maxTags = this.hasAttribute("multiple") ? undefined : 1;
    const placeholder = this.getAttribute("placeholder") || "";

    // Create new taggle instance using original configuration pattern
    this._taggle = new Taggle(this, {
      inputContainer: this.containerTarget,
      preserveCase: true,
      clearOnBlur: false,
      hiddenInputName: this.name,
      maxTags: maxTags,
      placeholder: placeholder,
      onTagAdd: (event, tag) => this.onTagAdd(event, tag),
      onTagRemove: (event, tag) => this.onTagRemove(event, tag),
    });

    // Re-get references since taggle was recreated
    this._taggleInputTarget = this._taggle.getInput();
    this._taggleInputTarget.id = this.id || "";
    this._taggleInputTarget.autocomplete = "off";
    this._taggleInputTarget.setAttribute("data-turbo-permanent", true);
    this._taggleInputTarget.addEventListener("keyup", e => this.keyup(e));

    // Re-setup autocomplete
    this.setupAutocomplete();

    // Re-process existing tag options
    this.processTagOptions();
  }

  updateValue() {
    if (!this._taggle) return;
    
    // Update the internal value to match taggle state
    const values = this._taggle.getTagValues();
    const oldValues = this._internals.value;
    this._internals.value = values;

    const formData = new FormData();
    values.forEach(value => formData.append(this.name, value));
    if(values.length === 0) formData.append(this.name, ""); // none value
    this._internals.setFormValue(formData);

    // Check validity after updating
    this.checkRequired();

    if(this.initialized && !this.suppressEvents && JSON.stringify(oldValues) !== JSON.stringify(values)) {
      this.dispatchEvent(new CustomEvent("change", {
        bubbles: true,
        composed: true,
      }));
    }
  }
}
customElements.define("input-tag", InputTag);


function h(html) {
  const container = document.createElement("div")
  container.innerHTML = html
  return container.firstElementChild
}
