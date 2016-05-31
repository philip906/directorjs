"use strict";

define([], function() {

    /*
    * @constructor
    *
    * Field data model for lists.
    * @param baseKey
    * @param config
        {            
            "title": "Some Title",                      //(Optional) The title to display for the field
            "tooltip": "Some Tooltip",                  //(Optional) The tooltip to display for the field
            "field_type": "switch",                     //The type of the field
            "default_value": "somedefaultvalue"         //(Optional) The default selected list item 
            "reverse_value": true                       //(Optional) If we should reverse the boolean value that is selected,
                                                            value will be reversed during getSettings 
        } 
    * @param value
        true
    */
    return function SwitchFieldModel(baseKey, config, value) {
        var Model = require('director/models/model'); //Avoid circular reference
        var self = this;
        var parent = Model.FieldBase.prototype;

        config.field_type = 'switch';

        if (config.reverse_value) {
            value = !value;
        }

        self.init(baseKey, config, value);
        /*
        * @public @override Model.FieldBase.prototype.getSettings
        *
        * We need a special getSettings here in order to reverse the value of
            the boolean if it is configured.
        *
        * @return {Boolean} settings
        */
        self.getSettings = function() {
            var settings = parent.getSettings.call(self);
            if (self.config.reverse_value) {
                settings = !settings;
            }
            return settings;
        };
    };
});