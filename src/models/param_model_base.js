"use strict";

define('director/models/param_model_base',
    ['underscore',

    'director/assert',
    'director/logger'],
    function(
        _,

        Assert,
        Logger) {

    /*
    * @constructor
    *
    * Base class for param models to extend.
    */
    function ParamModelBase() {}

    ParamModelBase.prototype = {
        /*
        * Property that can be checked to see if the child has extended this prorotype already.
            We only want to extend a param model once so that we will be able to determine later
            in our assertions if a param instance matches a certain class.
        */
        __parentPrototype: true,
        initialized: false,
        /*
        * The settings to ignore during the param validation.
        */
        settingsToIgnore: [],
        /*
        * @protected
        *
        * Initializes parameter model.
        *
        * @param {String} baseKey - The base key for the param (i.e some.path.to.this.param)
        * @param {Array of String} settingsToIgnore - The settings that should be ignored during param validation
        */
        init: function(baseKey, settingsToIgnore) {
            if (this.initialized) {
                Logger.warn('ParamModelBase.init: This param model has already been initialized.', this);
                return;
            }
            if (typeof baseKey !== 'undefined') {
                this.baseKey = baseKey;
                var baseKeyParts = baseKey.split('.');
                this.key = baseKeyParts.length > 1 ? baseKeyParts[baseKeyParts.length - 1] : baseKey;
            }
            this.setSettingsToIgnore(settingsToIgnore);
            this.initialized = true;
            this.isParam = true;
        },
        /*
        * @protected @property
        *
        * Sets the settings to ignore.
        *
        * @param {Array of String} settingsToIgnore - The settings that should be ignored during param validation
        */
        setSettingsToIgnore: function(settingsToIgnore) {
            settingsToIgnore = settingsToIgnore || [];
            this.settingsToIgnore = settingsToIgnore;
        },
        /*
        * @protected
        *
        * Gets the settings from the current state of all the fields of the param. All field settings will
            be found at the top level of their param.
            Example Old Path: someparam.parameters.anotherparam.fields.somefieldmodel.value
            Example New Path: someparam.anotherparam.somefieldsetting
        *
        * @return {*} settings
        */
        getSettings: function() {
            var settings = {};
            _.each(this.parameters, function(parameter, parameterKey) {
                if (parameter.parameters || parameter.fields) {
                    settings[parameterKey] = parameter.getSettings();
                } else if (_.isArray(parameter)) {
                    settings[parameterKey] = [];
                    _.each(parameter, function(param) {
                        settings[parameterKey].push(param.getSettings());
                    });
                } else if (typeof parameter === 'object') {
                    settings[parameterKey] = {};
                    _.each(parameter, function(param, key) {
                        settings[parameterKey][key] = param.getSettings();
                    });
                }
            });
            _.each(this.fields, function(field, fieldKey) {
                if (!field.config.skip_settings && field.hasAcceptedValue()) {
                    settings[fieldKey] = field.getSettings();
                    _.extend(settings, field.getAdditionalSettings());
                }
            });
            return settings;
        },
        /*
        * @protected
        *
        * Gets the all the fields for the param. All fields will be found at the top level of their param.
            Example Old Path: someparam.parameters.anotherparam.fields.somefieldmodel
            Example New Path: someparam.anotherparam.somefieldmodel
        *
        * @return {*} fields
        */
        getFields: function() {
            var settings = {};
            _.each(this.parameters, function(parameter, parameterKey) {
                if (parameter.parameters || parameter.fields) {
                    settings[parameterKey] = parameter.getFields();
                } else if (_.isArray(parameter)) {
                    settings[parameterKey] = [];
                    _.each(parameter, function(param) {
                        settings[parameterKey].push(param.getFields());
                    });
                } else if (typeof parameter === 'object') {
                    settings[parameterKey] = {};
                    _.each(parameter, function(param, key) {
                        settings[parameterKey][key] = param.getFields();
                    });
                }
            });
            _.each(this.fields, function(field, fieldKey) {
                settings[fieldKey] = field;
            });
            return settings;
        },
        /*
        * TODO: define
        */
        findDiff: function(modelToCompare) {
            var diffFieldBaseKey = null;
            var findParamDiff = function(param1, param2) {
                _.each(param1.fields, function(field, key) {
                    if (typeof param2.fields === 'undefined' ||
                        typeof param2.fields[key] === 'undefined') {
                        diffFieldBaseKey = field.baseKey;
                    } else if (field.findDiff(param2.fields[key])) {
                        diffFieldBaseKey = field.baseKey;
                    }
                });
                _.each(param1.parameters, function(param, key) {
                    if (typeof param2.parameters === 'undefined' ||
                        typeof param2.parameters[key] === 'undefined') {
                        diffFieldBaseKey = param.baseKey;
                        return;
                    }
                    findParamDiff(param, param2.parameters[key]);
                });
            };
            findParamDiff(this, modelToCompare);
            return diffFieldBaseKey;
        },
        /*
        * TODO: define
        */
        hasValue: function(value) {
            if (!value || (typeof value === 'object' && _.isEmpty(value))) {
                return false;
            }
            return true;
        },
        /*
        * @protected
        *
        * Validates the initialized param model to make sure everything (that should be) is defined.
        */
        validate: function(context, settings) {
            if (typeof settings === 'string') return null;
            if (!this.initialized) {
                Logger.warn("ParamModelBase.validate: Param has not been initialized correctly, try calling the parent's init method.", this);
            }
            _.each(settings, function(setting, key) {
                if (_.isEmpty(setting)) return;
                if (context.settingsToIgnore && context.settingsToIgnore.indexOf(key) > -1) return;

                var msg = 'ParamModelBase.validate: setting "' + key + '" was not defined in parameter.';
                //If there was no value found in the top level or fields or parameters
                if (typeof context[key] === 'undefined' &&
                    (context.fields && typeof context.fields[key] === 'undefined') &&
                    (context.parameters && typeof context.parameters[key] === 'undefined')) {
                    Logger.warn(msg, settings);
                } else if (typeof context[key] === 'undefined' &&
                    (!context.fields) && (context.parameters && typeof context.parameters[key] === 'undefined')) {
                    Logger.warn(msg, settings);
                } else if (typeof context[key] === 'undefined' &&
                    (!context.parameters) && (context.fields && typeof context.fields[key] === 'undefined')) {
                    Logger.warn(msg, settings);
                }
            });
        },
        /*
        * Gets parameter from parameter array given some key.
        *
        * @param {String} paramsKey - The key for parameters array
            self.parameters[paramsKey]
        * @param {String} rawKey - The key for the parameter in the parameters array
            self.parameters[paramsKey][rawKey]
        * @return {ParamModel} param
        */
        getParam: function(paramsKey, rawKey) {
            var key = rawKey;
            if (!isNaN(key)) {
                key = parseInt(rawKey);
            }
            return this.parameters[paramsKey][key];
        },
        /*
        * Applies default settings to a config. This will take the current settings and extend the default settings.
            Here are the cases that are handled:
                1. If there was no previously defined value in the original setting then the default will override
                2. Default settings will not override an original setting if it is not included in the default setting
                3. Default settings will override any switch fields. We are assuming that switches are used for enabling/disabling fields
        *
        * @param {Object} originalSettings
        * @param {Object} defaultSettings
        * @return {Object} updatedOriginalSettings
        */
        applyDefaultSettings: function(originalSettings, defaultSettings) {
            var applySettings = function(origSet, defSet) {
                for (var key in defSet) {
                    var defValue = defSet[key];
                    if (Assert.typeOf(defValue).isUndefined()) {
                        //TODO: probably should handle these checks in a different place, unit test...
                        return Logger.error('ParamModelBase.applyDefaultSettings.applySettings: Default setting "' + key + '" was undefined.', defSet);
                    }
                    /*
                    * We want to add any default values that were not previously set in the original setting. Or we
                        also see if there is an object we need to search for empty values.
                    */
                    if (typeof origSet[key] === 'undefined' || Assert.typeOf(origSet[key]).isObject()) {
                        /*
                        * If there is an object then we will perform a recursive check.
                        */
                        if (Assert.typeOf(defValue).isObject()) {
                            origSet[key] = origSet[key] || {};
                            applySettings(origSet[key], defValue);
                        } else if (Assert.typeOf(defValue).isArray() && origSet[key].length === 0) {
                            /*
                            * If the original value is an empty array then we will simply clone the default array settings.
                                I'm aware this is the same function as below (I just wanted to be explicit :) ). Maybe this
                                will change later, I'm just not sure how I want to handle it yet as most arrays are actually
                                fields.
                            */
                            origSet[key] = _.clone(defValue);
                        } else {
                            origSet[key] = _.clone(defValue); //Values are just copied
                        }
                    } else if (Assert.typeOf(defValue).isBoolean()) {
                        /*
                        * We want to overwrite any boolean values.
                        */
                        origSet[key] = defValue;
                    }
                }
            };
            applySettings(originalSettings, defaultSettings);
            return originalSettings;
        }
    };

    return ParamModelBase;

});
