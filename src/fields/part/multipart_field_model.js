"use strict";

define([
    'underscore',

    'director/assert',
    'director/fields/hidden/hidden_field_model',
    'director/fields/list/list_field_model',
    'director/logger',
    'director/fields/hash/multihash_field_model',
    'director/fields/switch/switch_field_model',
    'director/fields/text/text_field_model'],
    function(
        _,

        Assert,
        HiddenFieldModel,
        ListFieldModel,
        Logger,
        MultihashFieldModel,
        SwitchFieldModel,
        TextFieldModel) {

    /*
    * @constructor
    *
    * Field data model for multipart configurations and settings.
    *
    * @param {Object} config - The field config for the multipart data model
        {
          "config_type": {              //This contains the different config options that can be used with this field, they
                                            are dependant on which list item is selected in the config type field
            "type_1": {
              "field_1": {...},
              "field_2": {...},
            },
            "type_2": {
              "field_1": {...},
              "field_2": {...},
            }
          },
          "common_parts": {             //The common parts that are used no matter what config type is selected, this is where
                                            the config field type should be located
            "field_3": {...},
            "field_4": {...},
          },

          "config_type_field_key": "field_3",     //The key of the field we use in determining which config to use (i.e. which config under "config_type")

          "default_config_type_key": "text",      //The default config type key to use when none is defined

          "field_type": "multipart",
          "title": "Fields",
          "tooltip": "The fields to ask...",
          "add_button_label": "+ Add"
        }
    * @param {Array} settings - The settings for the multipart field.
        [
            {
                "field_1": "email",
                "field_2": "somevalue",
                "field_3": "text",
                "field_4": "asdasda"
            }
        ]
    * @param {String} key - The key of the multipart data field.
    */
    return function MultipartFieldModel(multipartBaseKey, config, settings) {
        var Model = require('director/models/model'); //Avoid circular reference

        var self = this;
        var parent = Model.FieldBase.prototype;

        config.field_type = 'multipart';

        /*
        * @constructor
        *
        * Field model for parts.
        *
        * @param {String} configTypeKey (optional) -  The type of config to use
        * @param {Object} setting - The setting to apply to the hash field
        * @param {String|Integer} - The key of this field
        */
        function PartFieldModel(baseKey, configTypeKey, setting) {
            var self = this;
            if (Assert.typeOf(setting).isNotObject()) {
                Logger.error('MultipartFieldModel.PartFieldModel: Incorrect argument "setting", it should be an object.');
                return;
            }

            /*
            * Default settings.
            */
            setting = setting || {};
            self.baseKey = baseKey;
            var baseKeyParts = baseKey.split('.');
            self.key = baseKeyParts[baseKeyParts.length - 1];
            self.items = [];
            self.config_type_key = configTypeKey || setting[config.config_type_field_key] || config.default_config_type_key;
            self.remove_button_label = config.remove_button_label;
            if (configTypeKey) {
                setting[config.config_type_field_key] = configTypeKey;
            }

            /*
            * Determines and creates the needed field and then adds it to the list of items.
            */
            var addItem = function(partConfig, partConfigKey) {
                var partFieldItemValue = setting[partConfigKey];
                var FIELD_MODEL_CLASS_MAP = {
                    text: TextFieldModel,
                    list: ListFieldModel,
                    switch: SwitchFieldModel,
                    hidden: HiddenFieldModel,
                    multihash: MultihashFieldModel
                };
                var FieldModelClass = FIELD_MODEL_CLASS_MAP[partConfig.field_type];
                var partFieldItem = Model.createField(self.baseKey + "." + partConfigKey, FieldModelClass, partConfig, partFieldItemValue);
                self.items.push(partFieldItem);
            };

            _.each(config.common_parts, function(partConfig, partConfigKey) {
                addItem(partConfig, partConfigKey);
            });
            _.each(config.config_type[self.config_type_key], function(partConfig, partConfigKey) {
                addItem(partConfig, partConfigKey);
            });
        }

        /*
        * @private
        *
        * Initializes the field model and creates the inital part field models.
        */
        var _init = function() {
            self.init(multipartBaseKey, config, []);

            _.each(settings, function(setting) {
                self.addPartField(null, setting);
            });
        };

        /*
        * @public
        *
        * Adds a new part field to the list.
        *
        * @param {String} configTypeKey - The setting to apply to the new part field
        * @param {Object} setting - The setting to apply to the part field
        * @return {PartFieldModel} partField - The newly created part field model
        */
        self.addPartField = function(configTypeKey, setting) {
            setting = setting || {};
            var keyToUse = Model.getNextKeyToUseInArray(self.value);
            var partField = new PartFieldModel(self.baseKey + "." + keyToUse, configTypeKey, setting);
            self.value.push(partField);
            return partField;
        };
        /*
        * @public
        *
        * Changes the config a specified part field from the list.
        *
        * @param {String} baseKey - The base key of the part field to change
        * @param {String} newConfigTypeKey - The new key of the config to change to
        * @return {PartFieldModel} newPartField - The changed part
        */
        self.changePartFieldConfig = function(baseKey, newConfigTypeKey) {
            var newPartField = new PartFieldModel(baseKey, newConfigTypeKey, {});
            Model.replaceModelInArray(self.value, newPartField);
            return newPartField;
        };
        /*
        * @public @override Model.FieldBase.prototype.findDiff
        *
        * Compares fieldModel with this model to see if there is a difference.
        *
        * @param {FieldModel} modelToCompare - The field model to compare
        * @return {Boolean} isDifferent - Indicator if the current multipart field is different
            from the one we are comparing against
        */
        self.findDiff = function(modelToCompare) {
            var isDifferent = false;
            var self = this;
            if (modelToCompare.value.length !== self.value.length) {
                return true;
            }
            var partFieldsToCompare = modelToCompare.value;
            _.each(self.value, function(partField, key) {
                if (partFieldsToCompare[key]) {
                    _.each(partField.items, function(item, itemkey) {
                        if (partFieldsToCompare[key].items[itemkey]) {
                            if (item.config.field_type === 'multihash' && item.findDiff(partFieldsToCompare[key].items[itemkey])) {
                                isDifferent = true;
                            } else if (item.config.field_type !== 'multihash' && parent.findDiff.call(item, partFieldsToCompare[key].items[itemkey])) {
                                isDifferent = true;
                            }
                        }
                    });
                } else {
                    isDifferent = true;
                }
            });
            return isDifferent;
        };
        /*
        * @public @override Model.FieldBase.prototype.getSettings
        *
        * Gets the settings for each of the different fields.
        *
        * @return {Array} settings
        */
        self.getSettings = function() {
            var settings = [];

            /*
            * Gets the settings for each field in the list.
            */
            _.each(self.value, function(partField) {
                var data = {};

                _.each(partField.items, function(partFieldItem) {
                    var keyParts = partFieldItem.key.split('.');
                    var key = keyParts[keyParts.length - 1];
                    if (key) {
                        data[key] = partFieldItem.getSettings();
                        _.extend(data, partFieldItem.getAdditionalSettings());
                    }
                });
                settings.push(data);
            });

            return settings;
        };

        _init();
    };
});