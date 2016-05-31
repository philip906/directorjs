"use strict";

define('director/fields/text/multitext_field_model',
    ['require',
    'underscore',

    './text_field_model'],
    function(
        require,
        _,

        TextFieldModel) {

    /*
    * @constructor
    *
    * Field data model for multitext configurations and values.
    *
    * @param {String} baseKey
    * @param {Object} config
        {            
            "title": "Trigger:",
            "tooltip": "A CSS selector for an element on the page that we need to exist before loading the instanace.",
            "field_type": "multitext",
            "item": {
                "placeholder": ".someselector",
                "default_value": ".someslector"
            }
            "add_button_label": "+ Add"        
        } 
    * @param {Array} values
    */
    return function MultitextFieldModel(baseKey, config, values) {
        /*
        * Avoid circular reference.
        */
        var Model = require('director/models/model');
        var Assert = require('director/assert');

        var self = this;
        config.field_type = 'multitext';
        /*
        * @private
        *
        * Initializes field model.
        */
        var _init = function() {
            self.init(baseKey, config, []);
            if (config.item && config.item.first_item && config.item.first_item.value) {
                if (!values) {
                    values = [config.item.first_item.value];
                } else if (_.isEmpty(values)) {
                    values.push(config.item.first_item.value);
                } else if (values[0] != config.item.first_item.value) {
                    values.unshift(config.item.first_item.value);
                }
            }
            if (!values || !values.length) return;
            /*
            * If this is a comma delimited list of values, then we need to convert
                it to an array.
            */
            var valuesToAdd = Assert.typeOf(values).isString() ? values.split(',') : values;
            /*
            * Add each item for the multilist.
            */
            _.each(valuesToAdd, function(value) {
                 self.addItem(value);
            });
        };

        /*
        * @public
        *
        * Adds a new item to the multitext value array.
        *
        * @param {String} value - The value to apply to the new text field
        * @return {TextFieldModel} textField - The newly created text field model
        */
        self.addItem = function(value) {
            value = value || '';
            var keyToUse = Model.getNextKeyToUseInArray(self.value);
            var textField = Model.createField(self.baseKey + "." + keyToUse, TextFieldModel, self.config.item, value);
            self.value.push(textField);
            return textField;
        };

        _init();
    };
});