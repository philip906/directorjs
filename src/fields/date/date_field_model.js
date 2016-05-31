"use strict";

define([], function() {

    /*
    * @constructor
    *
    * Field data model for data configurations and settings.
    *
    * @param {Object} config - The field config for the data model.
        {
            "title": "Start Date",
            "tooltip": "The start date for this batch of coupons to be used.",
            "include_time": false,
            "field_type": "date"        
        } 
    * @param {Array} settings - The settings for the data field.
        2016-03-18T23:00:00.000+0000
    * @param {String} key - The key of the data field.
    */
    return function DateFieldModel(baseKey, config, value) {
        var self = this;
        config.field_type = 'date';

        self.init(baseKey, config, value);
    };
});