"use strict";

define([
    'underscore',

    'director/assert',
    'director/fields/list/list_field_model',
    'director/logger',
    'director/fields/text/text_field_model'],
    function(
        _,

        Assert,
        ListFieldModel,
        Logger,
        TextFieldModel) {

    /*
    * @constructor
    *
    * Field data model for multihash configurations and settings. You should use this field model
        whenever you have a field that has a key->value such as query parameters.
    *
    * @param {String} baseKey - The base key for this field
    * @param {Object} config - The field config for the multihash model
        {
          "name": {   
            "key": "KEY_FOR_SETTINGS",     
            "placeholder": "name",
            "field_type": "text"                            
          },
          "value": { 
            "key": "KEY_FOR_SETTINGS",      
            "placeholder": "Value",
            "field_type": "text"                            
          }
          "field_type": "multihash",
          "title": "Query Paramters",
          "tooltip": "The query parameters to append to the default exit url.",
          "add_button_label": "+ Add",      
        }
    } 
    * @param {Array} settings - The settings for the multihash field.
    */
    return function MultihashFieldModel(baseKey, multihashConfig, settings) {
        var self = this;
        var Model = require('director/models/model');
        var parent = Model.FieldBase.prototype;

        multihashConfig.field_type = 'multihash';

        /*
        * @constructor
        *
        * Field model for hashes.
        *
        * @param {Object} setting - The setting to apply to the hash field
        * @param {Integer} - The key of this field which is it's index in the value array
        */
        function HashFieldModel(baseKey, setting) {
            var self = this;
            if (Assert.typeOf(setting).isNotObject()) {
                Logger.error('MultihashFieldModel.HashFieldModel: Incorrect argument "setting", it should be an object.');
            }

            self.baseKey = baseKey;
            var baseKeyParts = baseKey.split('.');
            self.key = baseKeyParts[baseKeyParts.length - 1];
            var FIELD_MODEL_CLASS_MAP = {
                text: TextFieldModel,
                list: ListFieldModel
            };
            var NameFieldModel = FIELD_MODEL_CLASS_MAP[multihashConfig.name.field_type];
            self.name =  Model.createField(self.baseKey + '.' + 'name', NameFieldModel, multihashConfig.name, setting.name);
            var ValueFieldModel = FIELD_MODEL_CLASS_MAP[multihashConfig.value.field_type];
            self.value = Model.createField(self.baseKey + '.' + 'value', ValueFieldModel, multihashConfig.value, setting.value);
        }

        /*
        * @private
        *
        * Initializes the field model and creates the inital hash field models.
        */
        var _init = function() {
            self.init(baseKey, multihashConfig, []);

            _.each(settings, function(setting, key) {
                self.addHashField(setting);
            });
        };
        /*
        * @public
        *
        * Adds a new hash field.
        *
        * @param {Object} setting - The setting to apply to the hash field
        * @return {HashFieldModel} hashField - The newly created hash field model
        */
        self.addHashField = function(setting) {
            setting = setting || {};
            var keyToUse = Model.getNextKeyToUseInArray(self.value);
            var hashField = new HashFieldModel(self.baseKey + "." + keyToUse, setting);
            //hashField.index = keyToUse;
            self.value.push(hashField);
            return hashField;
        };
        /*
        * @public @override Model.FieldBase.prototype.findDiff
        *
        * Compares fieldModel with this model to see if there is a difference.
        *
        * @param {FieldModel} modelToCompare - The field model to compare
        * @return {Boolean} isDifferent - Indicator if the current multihash field is different
            from the one we are comparing against
        */
        self.findDiff = function(modelToCompare) {
            var isDifferent = false;
            var self = this;
            if (modelToCompare.value.length !== self.value.length) {
                return true;
            }
            var hashFieldsToCompare = modelToCompare.value;
            _.each(self.value, function(hashField, key) {
                if (hashFieldsToCompare[key]) {
                    if (parent.findDiff.call(hashField.name, hashFieldsToCompare[key].name) ||
                        parent.findDiff.call(hashField.value, hashFieldsToCompare[key].value)) {
                        isDifferent = true;
                    }
                }
            });
            return isDifferent;
        };
        /*
        * @public @override Model.FieldBase.prototype.getSettings
        *
        * Gets the settings from the current state of all the fields of the param.
        *
        * @return {Array} settings
        */
        self.getSettings = function() {
            var settings = [];

            _.each(self.value, function(hashField) {
                var data = {};
                data[hashField.name.config.key || 'name'] = hashField.name.getSettings();
                data[hashField.value.config.key || 'value'] = hashField.value.getSettings();

                /*
                * Get additional settings from fields.
                */
                _.extend(data, hashField.name.getAdditionalSettings());
                _.extend(data, hashField.value.getAdditionalSettings());

                settings.push(data);
            });

            return settings;
        };

        _init();
    };
});