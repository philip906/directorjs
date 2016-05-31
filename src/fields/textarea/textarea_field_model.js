"use strict";

//TODO: finish defining TextareaFieldModel constructor
define([], function() {
    /*
    * @constructor
    *
    * Field data model for textarea fields.
    */
    return function TextareaFieldModel(baseKey, config, value) {
        var self = this;

        config.field_type = 'textarea';

        self.init(baseKey, config, value);
    };
});