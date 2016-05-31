"use strict";

define([
    'jquery',
    'underscore',

    'director/views/view'],
    function(
        $,
        _,

        View) {

    /*
    * @constructor
    *
    * Base class for field controllers to extend.
    */
    function FieldControllerBase() {}

    FieldControllerBase.prototype = {
        /*
        * Initializes the filed controller. This should be called by the inheriting field controllers.
        *
        * @param {String} valueSelector - The CSS selector for the value element for this field
        * @param {FieldModel} model - The field's data model
        * @param {HandlebarsTemplate} Template - The handlebars template for the field to compile
        */
        init: function(valueSelector, model, Template) {
            //TODO: add argument validation
            this.fieldSelector = 'div[data-field="' + model.baseKey + '"]';
            this.valueSelector = this.fieldSelector + ' ' + valueSelector;
            this.model = model;
            this.baseKey = model.baseKey;
            this.key = model.key;
            this.originalValue = _.clone(model.value);
            /*
            * Check for config overrides.
                Supported overrides: placeholder, tooltip, title
            */
            this.model.config.placeholder = $(this.fieldSelector).data('config-placeholder') || this.model.config.placeholder;
            this.model.config.tooltip = $(this.fieldSelector).data('config-tooltip') || this.model.config.tooltip;
            this.model.config.title = $(this.fieldSelector).data('config-title') || this.model.config.title;
            /*
            * Bind view.
            */
            var fieldControllerView = View.extend({
                context: this.model,
                selector: this.fieldSelector,
                template: Template
            });
            fieldControllerView.load();
            if (this.model.config.tooltip) {
                $(this.fieldSelector + ' [data-toggle="tooltip"]').tooltip();
            }
            $(this.fieldSelector).addClass(this.model.config.field_type + '-field');
        },
        /*
        * @property {String} - The key that identifies this field globally.
        */
        baseKey: null,
        /*
        * @property {String} - The key that identifies this field in it's parameter.
        */
        key: null,
        /*
        * @property {String} - The CSS selector for the field div.
        */
        fieldSelector: null,
        /*
        * @property {String} - The CSS selector for the value element for this field
        */
        valueSelector: null,
        /*
        * @property {FieldModel} - The field's data model
        */
        model: null,
        /*
        * @property {Function} - The callback function to execute after the fields gets a dirty state.
        */
        watcherCallback: null,
        /*
        * Gets the current value of the field.
        */
        getValue: function() {
            return $(this.valueSelector).val();
        },
        /*
        * Sets the current value of the field.
        */
        setValue: function(newValue) {
            $(this.valueSelector).val(newValue);
            this.setIsDirty(this.checkIfDirty());
        },
        /*
        * Gets the current value of the field
        */
        hasAcceptedValue: function() {
            var value = this.getValue();
            if (value ||
                value == "0" ||
                value === false ||
                value === "false" ||
                (_.isArray(value) && value.length)) {

                return true;
            }
            return false;
        },
        /*
        * Saves the current value to the field's data model. The originalValue will still remain in tact so
            that you can perform a field reset.
        */
        save: function() {
            this.model.value = this.getValue();
            /* If value is empty then we want the default value */
            if (this.model.value === '' && this.model.config.default_value) {
                this.model.value = this.model.config.default_value;
            }
            this.setIsDirty(this.checkIfDirty());
        },
        /*
        * Checks if there is a field is being watched and if so passes the original and
            new value to the callback function of that watcher.
        *
        * @return {Function} this.watcherCallback(oldValue, newValue)
        */
        dirtyEvent: function() {
            var self = this;
            if (self.watcherCallback) {
                return self.watcherCallback(self.model.value, self.getValue());
            }
        },
        /*
        * Checks if the field controller has a dirty state.
        *
        * @param {Boolean} isDirty - Indicator if field is dirty or not
        */
        checkIfDirty: function() {
            var self = this;
            if (self.getValue() != self.model.value && (self.model.value || self.getValue())) return true;
            else return false;
        },
        /*
        * Sets the isDirty property.
        *
        * @param {Boolean} isDirty
        */
        setIsDirty: function(isDirty) {
            var self = this;
            self.model.isDirty = isDirty;
        },
        /*
        * Resets the current field value to it's original value.
        */
        reset: function() {
            var self = this;
            self.model.value = self.originalValue;
        }
    };

    return FieldControllerBase;

});