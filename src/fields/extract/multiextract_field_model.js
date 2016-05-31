"use strict";

define([
    'underscore',

    'director/fields/hidden/hidden_field_model',
    'director/fields/list/list_field_model',
    'director/logger',
    'director/fields/text/text_field_model'],
    function(
        _,


        HiddenFieldModel,
        ListFieldModel,
        Logger,
        TextFieldModel) {

    /*
    * @constructor
    *
    * Field data model for multiextract configurations and settings. You should use this field model
        whenever you have a field that will be defining where it will be extracting value from such
        as a user or inviter object.
    *
    * @param {String} baseKey
    * @param {Object} config - Param config
    * @param {Array} settings - The settings for the multiextract field.
        [
            {
                "extract_from_user": true,
                "name": "email",
                "value": "email"
            }, {
                "extract_from_inviter": true,
                "name": "email",
                "value": "email"
            }, {
                "name": "api_key",
                "value": "slabs-live"
            }
        ]
    */
    return function MultiextractFieldModel(baseKey, multiextractConfig, settings) {
        var Model = require('director/models/model');
        var self = this;
        var parent = Model.FieldBase.prototype;

        multiextractConfig.field_type = 'multiextract';

        /*
        * @constructor //TODO: move to its own file
        *
        * Field model for hashes.
        *
        * @param {String} - The key of this field
        * @param {String} configTypeKey - The type of config to use
        * @param {Object} setting - The setting to apply to the hash field
            {
                "extract_from_user": true,
                "name": "email",
                "value": "email"
            }
        */
        function ExtractFieldModel(baseKey, configTypeKey, setting) {
            var self = this;
            //TODO: add assertions here
            setting = setting || {};

            self.config_type_key = configTypeKey || multiextractConfig.default_config_type_key;
            if (!configTypeKey) {
                _.each(multiextractConfig.extract_from_keys, function(extractFromKey) {
                    if (setting["extract_from_" + extractFromKey]) {
                        var keyFound = false;
                        /*
                        * Check if we have this value defined for this config or if it is custom.
                        */
                        _.each(multiextractConfig.config_type[extractFromKey].value.list, function(item) {
                            if (item.id == setting.value) {
                                keyFound = true;
                                self.config_type_key = extractFromKey;
                            }
                        });
                    }
                });
            }

            self.baseKey = baseKey;
            var baseKeyParts = baseKey.split('.');
            self.key = baseKeyParts[baseKeyParts.length - 1];
            self.config = multiextractConfig.config_type[self.config_type_key];
            self.extract_from = Model.createField(self.baseKey + '.extract.extract_from', ListFieldModel, multiextractConfig.extract_from, self.config_type_key);
            self.remove_button_label = multiextractConfig.remove_button_label;
            /*
            * Load the name value and extraction fields.
            */
            _.each(self.config, function(configField, key) {
                var fieldKey = 'extract.' + key;
                switch (configField.field_type) {
                    case 'text':
                        self[key] = Model.createField(self.baseKey + '.' + fieldKey, TextFieldModel, configField, setting[key]);
                        break;
                    case 'list':
                        self[key] = Model.createField(self.baseKey + '.' + fieldKey, ListFieldModel, configField, setting[key]);
                        break;
                    case 'hidden':
                        self[key] = Model.createField(self.baseKey + '.' + fieldKey, HiddenFieldModel, configField, setting[key]);
                        break;
                    default:
                        Logger.error('ExtractFieldModel.constructor: There was no matching FieldModel for "' + key + '".', configField);
                        break;
                }
            });
        }

        /*
        * @private
        *
        * Initializes the field model and creates the inital hash field models.
        */
        var _init = function() {
            self.init(baseKey, multiextractConfig, []);

            _.each(settings, function(setting, key) {
                self.addExtractField(null, setting);
            });
        };

        /*
        * @public
        *
        * Adds a new extract field to value array.
        *
        * @param {String} configTypeKey - The setting to apply to the new extract field
        * @param {Object} setting - The setting to apply to the hash field
        * @return {ExtractFieldModel} extractField - The newly created extract field model
        */
        self.addExtractField = function(configTypeKey, setting) {
            setting = setting || {};
            var keyToUse = Model.getNextKeyToUseInArray(self.value);
            var extractField = new ExtractFieldModel(self.baseKey + "." + keyToUse, configTypeKey, setting);
            self.value.push(extractField);
            return extractField;
        };
        /*
        * @public
        *
        * Changes the config a specified extract field from the value array.
        *
        * @param {String} key - The key of the extract field to change
        * @param {String} newConfigTypeKey - The new key of the config to extract to change
        * @return {ExtractFieldModel} newExtractField - The changed extract field model
        */
        self.changeExtractFieldConfig = function(key, newConfigTypeKey) {
            var newExtractField = new ExtractFieldModel(baseKey + '.' + key, newConfigTypeKey, null);
            Model.replaceModelInArray(self.value, newExtractField);
            return newExtractField;
        };
        /*
        * @public @override Model.FieldBase.prototype.findDiff
        *
        * Compares fieldModel with this model to see if there is a difference.
        *
        * @param {FieldModel} modelToCompare - The field model to compare
        * @return {Boolean} isDifferent - Indicator if the current multiextract field is different
            from the one we are comparing against
        */
        self.findDiff = function(modelToCompare) {
            var isDifferent = false;
            var self = this;
            if (modelToCompare.value.length !== self.value.length) {
                return true;
            }
            var extractFieldsToCompare = modelToCompare.value;
            _.each(self.value, function(extractField, key) {
                if (extractFieldsToCompare[key]) {
                    if (extractField.name.value !== extractFieldsToCompare[key].name.value) {
                        isDifferent = true;
                    } else if (extractField.value.value !== extractFieldsToCompare[key].value.value) {
                        isDifferent = true;
                    }
                } else {
                    isDifferent = true;
                }
            });
            return isDifferent;
        };
        /*
        * @public @override Model.FieldBase.prototype.getSettings
        *
        * We need to extract the name and value field values and reformat the keys to
            use the correct 'extract_from' prending.
        *
        * @return {Array} settings
        */
        self.getSettings = function() {
            var settings = [];

            _.each(self.value, function(extractField) {
                var data = {};
                data[extractField.name.config.key || 'name'] = extractField.name.getSettings();
                data[extractField.value.config.key || 'value'] = extractField.value.getSettings();

                /*
                * Get additional settings from fields.
                */
                _.extend(data, extractField.name.getAdditionalSettings());
                _.extend(data, extractField.value.getAdditionalSettings());

                /*
                * Check if we are performing extraction. If so then we need to set extra data to go
                    up to the customer API.
                */
                if (extractField.config_type_key !== 'none') {
                    var key = extractField.config_type_key.split('_')[0];
                    var extractKey = 'extract_from_' + key;
                    data[extractKey] = true;
                }
                settings.push(data);
            });

            return settings;
        };

        _init();
    };
});