/**
 * FormCapture.js - A script to capture all form data on any webpage
 * This script can be embedded on any webpage to collect form field information
 * including field names, values, types, and other attributes.
 */

(function() {
  // Main FormCapture object
  const FormCapture = {
    /**
     * Initialize the FormCapture script
     * @param {Object} options - Configuration options
     */
    init: function(options = {}) {
      this.options = {
        captureOnLoad: true,           // Capture forms when the script loads
        captureOnChange: true,         // Capture forms when any field changes
        captureHiddenFields: false,    // Whether to capture hidden fields
        capturePasswordFields: false,  // Whether to mask or ignore password fields
        onCapture: null,               // Callback function when capture happens
        ignoreFormIds: [],             // Array of form IDs to ignore
        ignoreFieldNames: [],          // Array of field names to ignore
        ...options
      };

      // Initialization
      if (this.options.captureOnLoad) {
        // Wait for DOM to fully load before capturing
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => this.captureAllForms());
        } else {
          this.captureAllForms();
        }
      }

      if (this.options.captureOnChange) {
        this.setupChangeListeners();
      }

      // Expose the capture method globally
      window.captureAllForms = () => this.captureAllForms();
      
      console.log('FormCapture initialized');
      return this;
    },

    /**
     * Set up event listeners for detecting form changes
     */
    setupChangeListeners: function() {
      document.addEventListener('change', (event) => {
        const target = event.target;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
          this.captureAllForms();
        }
      });

      // Also listen for input events for real-time tracking
      document.addEventListener('input', (event) => {
        const target = event.target;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
          this.captureAllForms();
        }
      });
    },

    /**
     * Capture all forms on the page
     * @returns {Array} Collection of form data objects
     */
    captureAllForms: function() {
      const forms = document.querySelectorAll('form');
      const formsData = [];
      
      forms.forEach((form, formIndex) => {
        // Skip ignored forms
        if (form.id && this.options.ignoreFormIds.includes(form.id)) {
          return;
        }
        
        const formData = this.captureForm(form, formIndex);
        formsData.push(formData);
      });

      // Call the onCapture callback if provided
      if (typeof this.options.onCapture === 'function') {
        this.options.onCapture(formsData);
      }
      
      return formsData;
    },

    /**
     * Capture data from a specific form
     * @param {HTMLFormElement} form - The form element to capture
     * @param {Number} formIndex - Index of the form on the page
     * @returns {Object} Form data object
     */
    captureForm: function(form, formIndex) {
      const formId = form.id || `form-${formIndex}`;
      const formName = form.getAttribute('name') || '';
      const formAction = form.getAttribute('action') || '';
      const formMethod = form.getAttribute('method') || 'get';
      const formEnctype = form.getAttribute('enctype') || '';
      const formNoValidate = form.getAttribute('novalidate') !== null;
      const formTarget = form.getAttribute('target') || '';
      const formClass = form.className || '';
      
      // Get all form attributes
      const formAttributes = {};
      Array.from(form.attributes).forEach(attr => {
        if (!['id', 'name', 'action', 'method', 'enctype', 'novalidate', 'target', 'class'].includes(attr.name)) {
          formAttributes[attr.name] = attr.value;
        }
      });

      const fields = this.captureFormFields(form);

      return {
        formId,
        formName,
        formAction,
        formMethod,
        formEnctype,
        formNoValidate,
        formTarget,
        formClass,
        attributes: formAttributes,
        fields,
        serialized: this.serializeForm(form),
        domElement: form,
        pageUrl: window.location.href,
        timestamp: new Date().toISOString()
      };
    },

    /**
     * Capture all fields within a form
     * @param {HTMLFormElement} form - The form containing fields to capture
     * @returns {Array} Collection of field data objects
     */
    captureFormFields: function(form) {
      const formElements = form.elements;
      const fields = [];
      
      // Process each form element
      Array.from(formElements).forEach((element, index) => {
        // Skip ignored fields
        if (this.options.ignoreFieldNames.includes(element.name)) {
          return;
        }
        
        // Skip fieldsets and other non-input elements
        if (!['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(element.tagName)) {
          return;
        }
        
        // Skip hidden fields if configured
        if (element.type === 'hidden' && !this.options.captureHiddenFields) {
          return;
        }
        
        const fieldData = this.captureField(element, index);
        if (fieldData) {
          fields.push(fieldData);
        }
      });
      
      return fields;
    },

    /**
     * Capture data from a specific form field
     * @param {HTMLElement} field - The field element to capture
     * @param {Number} fieldIndex - Index of the field in the form
     * @returns {Object} Field data object
     */
    captureField: function(field, fieldIndex) {
      const fieldId = field.id || '';
      const fieldName = field.name || '';
      const fieldType = field.type || '';
      
      // Handle special case for password fields
      if (fieldType === 'password' && !this.options.capturePasswordFields) {
        return null;
      }
      
      let fieldValue = '';
      
      // Get value based on field type
      if (['checkbox', 'radio'].includes(fieldType)) {
        fieldValue = field.checked ? field.value : '';
      } else if (field.tagName === 'SELECT' && field.multiple) {
        fieldValue = Array.from(field.selectedOptions).map(option => option.value);
      } else {
        fieldValue = field.value;
        
        // Mask password values if configured to capture but not show actual value
        if (fieldType === 'password' && this.options.capturePasswordFields) {
          fieldValue = '••••••••';
        }
      }
      
      // Get attributes
      const fieldAttributes = {};
      Array.from(field.attributes).forEach(attr => {
        if (!['id', 'name', 'type', 'value', 'checked', 'selected'].includes(attr.name)) {
          fieldAttributes[attr.name] = attr.value;
        }
      });
      
      // Get validation state
      const validationState = {
        valid: field.validity ? field.validity.valid : null,
        required: field.required || false,
        validationMessage: field.validationMessage || '',
        patternMismatch: field.validity ? field.validity.patternMismatch : null,
        typeMismatch: field.validity ? field.validity.typeMismatch : null,
        tooLong: field.validity ? field.validity.tooLong : null,
        tooShort: field.validity ? field.validity.tooShort : null,
        rangeOverflow: field.validity ? field.validity.rangeOverflow : null,
        rangeUnderflow: field.validity ? field.validity.rangeUnderflow : null,
      };
      
      return {
        fieldId,
        fieldName,
        fieldType,
        fieldValue,
        attributes: fieldAttributes,
        validation: validationState,
        domElement: field
      };
    },

    /**
     * Serialize form data into a URL-encoded string
     * @param {HTMLFormElement} form - The form to serialize
     * @returns {String} URL-encoded form data
     */
    serializeForm: function(form) {
      const formData = new FormData(form);
      const serialized = new URLSearchParams(formData).toString();
      return serialized;
    }
  };

  // Export to global namespace
  window.FormCapture = FormCapture;

  // Auto-initialize with default settings
  FormCapture.init();
})();
