"use strict";

define([
    'underscore',

    'director/logger'],
    function(
        _,

        Logger) {

    /*
    * @constructor
    *
    * Base class for field models to extend.
    */
    function FieldModelBase() {}

    FieldModelBase.prototype = {
        /*
        * Property that can be checked to see if the child has extended this prorotype already.
            We only want to extend a field model once so that we will be able to determine later
            in our assertions if a field instance matches a certain class.
        */
        __parentPrototype: true,
        baseKey: null,
        key: null,
        value: null,
        is_field: null,
        /*
        * @protected
        *
        * Initializes parameter model. Should always be called by child class.
        */
        init: function(baseKey, config, value) {
            this.config = config;
            this.baseKey = baseKey;
            var baseKeyParts = baseKey.split('.');
            this.key = baseKeyParts[baseKeyParts.length - 1];
            this.value = value;
            if (!this.hasAcceptedValue(value)) {
                this.value = this.config.default_value;
            }
            this.isField = true;
        },
        /*
        * @protected
        *
        * A value is considered to be set (i.e. accepted value) if it is not one of the following:
            null, undefined, ""
        */
        hasAcceptedValue: function() {
            if (this.value ||
                this.value == "0" ||
                this.value === false ||
                this.value === "false" ||
                _.isArray(this.value)) {

                return true;
            }
            return false;
        },
        /*
        * @protected
        *
        * TODO: define
        */
        findDiff: function(modelToCompare) {
            var value1 = this.value;
            var value2 = modelToCompare.value;
            if (_.isArray(value1)) {
                var isDifferent = false;
                if (value1.length !== value2.length) {
                    return true;
                }
                _.each(value1, function(val1, key) {
                    if (!val1 || value2[key].value !== val1.value) {
                        isDifferent = true;
                    }
                });
                return isDifferent;
            } else if (value1 !== value2 && (value1 || value2)) {
                return true;
            }
            return false;
        },
        /*
        * @protected
        *
        * Checks if there is an additional settings object to attach with this field. This
            should be overridden if the inheriting field does not have a top level
            additional_settings property.
        *
        * @return {Object} additionalSettingsObj - The additional settings object
        */
        getAdditionalSettings: function() {
            var self = this;
            return self.config.additional_settings;
        },
        /*
        * @protected
        *
        * Gets the settings from the current state of the field.
        *
        * @return {*} settings
        */
        getSettings: function() {
            var self = this;
            var settings = null;

            if (_.isArray(self.value)) {
                settings = [];
                _.each(self.value, function(item) {
                    if (!item) return Logger.warn('Model.FieldBase.getSettings: There was an undefined value in the array of values, this will be ignored in the getSettings.', self);
                    settings.push(item.value);
                });
            } else {
                settings = self.value;
            }

            return settings;
        }
    };

    return FieldModelBase;

});
