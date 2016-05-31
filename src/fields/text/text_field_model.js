"use strict";

define([], function() {
    /*
    * @constructor
    *
    * Field data model for text fields.
    *
    * @param {String} baseKey
    * @param {Object} config
        {            
            "title": "Trigger:",
            "tooltip": "A CSS selector for an element on the page that we need to exist before loading the instanace.",
            "field_type": "text",
            "placeholder": ".someselector",
            "default_value": ".someslector"      
        } 
    * @param {Array} settings
    */
    return function TextFieldModel(baseKey, config, value) {
        var self = this;

        config.field_type = 'text';

        self.init(baseKey, config, value);
    };
});