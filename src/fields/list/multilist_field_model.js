"use strict";

define('director/fields/list/multilist_field_model',
    ['director/assert',
    'director/logger',
    'require',
    'underscore',

    './list_field_model'],
    function(
        Assert,
        Logger,
        require,
        _,

        ListFieldModel) {

    /*
    * @constructor
    *
    * Field data model for multi text configurations and values.
    *
    * @param {String} baseKey
    * @param {Object} config
        {            
            "title": "Some Title",                        //(Optional) The title to display for the field
            "tooltip": "Some Tooltip",                    //(Optional) The tooltip to display for the field
            "field_type": "multilist",                    //The type of the field
            "add_button_label": "+ Add",                  //The CTA text to display for adding a new value
            "dependency":  {                                //(Optional) The configuration for the resource dependency injection
                "service_config": {...}                     //The location of the service resource to get (i.e. Director.Resource.map.services.membercheck_client_apis)
                "key": "service_config_key",                //The key of the service resource
                "id_key": "some_id_key",                    //The key for the property on resource to use as the list item id
                "id_key_is_field": true,                    //(Optional) If the id key for the properties resource exists in a field for the param
                "name_key": "some_name_key",                //The key for the property on the resource to use as the list item name
                "name_key_is_field": true,                  //(Optional) If the name key for the properties resource exists in a field for the param
                "fallback": {                       //(Optional) The fallback name to use if name was not found, we use this so that we don't display empty list items to the user
                  "name_key": "external_id"         //The key for the property on the resource to use as the fallback list item name
                  "name_key_is_field": true         //(Optional) If the fallback name key for the properties resource exists in a field for the param
                },
                "create_new_title": "+ Configure New"       //The CTA to use are the prompt to configure the resource of no items existed
            },
            "item": {                           //The config for the each item in the list of values
                "list": [                       //The items to display for this field, if using resource dependency injection then
                                                this should be an empty array (i.e. [])      
                  {                 
                    "id": "item_1_value",       //The id of the field which is used for holding the currently set value
                    "name": "Some Item 1"       //The name to display in the list for the item
                  },
                  {
                    "id": "CUSTOM_LIST_ITEM",   //(Optional) Custom fields can be added and should have the id "CUSTOM_LIST_ITEM", when these items are
                                                    selected, a text field will appear for the user. This should be used in conjunction with the custom_list_item config
                    "name": "Custom Field"
                  }
                  ...        
                ],
                "first_item": {                        //(Optional) Config for the first item in the list of values, this is generally used for defining constants that are defined for some field.
                    "immutable": true,                   //If the field is disabled
                    "value": "CriOS\/4[0-5]|MSIE 8."   //The value for the first item
                },
                "non_selected_list_item_title": "Some Title"    //(Optional) Should be used when you are using resource dependency
                                                                    injection for this field's items
                "custom_list_item": {           //(Optional) The config for a custom list item, this should be defined if you have some predefined selections in the list items,
                                                    but want to allow the user to enter something custom, this should be used in conjunction with place the custom field
                                                    list item in the list array
                    "placeholder": "someph"     //(Optional) The placeholder for the custom list item text input
                }
            }
        } 
    * @param {Array} values
    */
    return function MultilistFieldModel(baseKey, config, values) {
        var Model = require('director/models/model');
        var self = this;

        if (Assert.typeOf(config.item).isUndefined()) {
            Logger.error('MultilistFieldModel: Invalid argument "item", it should not be undefined.', self);
            return null;
        }

        config.field_type = 'multilist';

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
            _.each(values, function(value) {
                self.addItem(value);
            });
        };

        /*
        * @public
        *
        * Adds a new item to the multi list value array.
        *
        * @param {String} value - The value to apply to the new list field
        * @return {ListFieldModel} listField - The newly created list field model
        */
        self.addItem = function(value) {
            value = value || '';
            var keyToUse = Model.getNextKeyToUseInArray(self.value);
            var listField = Model.createField(self.baseKey + "." + keyToUse, ListFieldModel, self.config.item, value);
            self.value.push(listField);
            return listField;
        };

        _init();
    };
});