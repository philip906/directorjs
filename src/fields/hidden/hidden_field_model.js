"use strict";

define([], function() {

    /*
    * @constructor
    *
    * Field data model for values that should not surface for the
      user to configure, but need to be passed to the customer API.
    */
    return function HiddenFieldModel(baseKey, config, value) {
        var self = this;
        if (typeof config.value !== "undefined") {
            value = config.value;
        }
        self.init(baseKey, config, value);

        /*
        * @public @override Model.FieldBase.prototype.getSettings
        *
        * Gets the set value for the hidden field.
        *
        * @return {*} settings
        */
        self.getSettings = function() {
            return self.value;
        };
    };
});