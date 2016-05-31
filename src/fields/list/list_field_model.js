"use strict";

define([
    'underscore',

    'director/logger',
    'util'],
    function(
        _,

        Logger,
        Util) {

    /*
    * @constructor
    *
    * Field data model for lists.
    * @param baseKey
    * @param config
        {            
            "title": "Some Title",                        //(Optional) The title to display for the field
            "tooltip": "Some Tooltip",                    //(Optional) The tooltip to display for the field
            "field_type": "list",                         //The type of the field
            "default_value": "somedefaultvalue"           //(Optional) The default selected list item    
            "skip_settings": true,                    //(Optional) If we should ignore this field when we run getSettings for a param
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
            "non_selected_list_item_title": "Some Title"    //(Optional) Should be used when you are using resource dependency
                                                                injection for this field's items
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
            "custom_list_item": {           //(Optional) The config for a custom list item, this should be defined if you have some predefined selections in the list items,
                                                but want to allow the user to enter something custom, this should be used in conjunction with place the custom field
                                                list item in the list array
                "placeholder": "someph"     //(Optional) The placeholder for the custom list item text input
            }
        } 
    * @param value
        "someValue"
    */
    return function ListFieldModel(baseKey, config, value) {
        var Model = require('director/models/model'); //Avoid circular reference

        var self = this;
        var parent = Model.FieldBase.prototype;
        var CUSTOM_LIST_ITEM_ID = "CUSTOM_LIST_ITEM";

        /*
        * @private
        *
        * Initializes field model.
        */
        var _init = function() {
            config = config || {};
            config.field_type = 'list';

            self.init(baseKey, config, value);
        };
        /*
        * @public @property @read
        *
        * Gets the currently selected list item name.
        */
        var _selectedName;
        self.getSelectedName = function() {
            if (typeof self.value === 'undefined') return self.value;
            /*
            * Attempts to get selected item and if none is found then we use the custom selection if one is configured.
            */
            var selectedItem = Util.getObjectInArrayByProperty(self.config.list, "id", self.value) ||
                Util.getObjectInArrayByProperty(self.config.list, "id", CUSTOM_LIST_ITEM_ID);

            if (!selectedItem) {
                Logger.warn('ListFieldModel.getSelectedName: No item was found for value "' + self.value + '" in the list:', self.config.list);
                return null;
            }
            return selectedItem.name;
        };
        /*
        * @public @override Model.FieldBase.prototype.getAdditionalSettings
        *
        * Checks if there is an additional settings object to attach with this field.
        *
        * @return {Object} additionalSettingsObj - The additional settings object
        */
        self.getAdditionalSettings = function() {
            var additionalSettings = null;
            var matchingObj = Util.getObjectInArrayByProperty(self.config.list, "id", self.value);
            if (matchingObj) {
                additionalSettings = matchingObj.additional_settings;
            }
            return additionalSettings;
        };
        /*
        * @public @override Model.FieldBase.prototype.hasAcceptedValue
        *
        * Checks if the model contains a valid value.
        *
        * @return {Boolean} hasAcceptedValue - If the value stored on the model is valid
        */
        self.hasAcceptedValue = function() {
            if (self.value === "NON_SELECTED" && self.config.non_selected_list_item_title) {
                return false;
            }
            return parent.hasAcceptedValue.call(self);
        };

        _init();
    };
});