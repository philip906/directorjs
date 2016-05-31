"use strict";

//TODO: move service_resource_dependency to director
define('director/models/model',
    ['require',
    'underscore',

    'director/assert',
    'director/fields/date/date_field_model',
    'director/fields/field_model_base',
    'director/fields/hidden/hidden_field_model',
    'director/fields/list/list_field_model',
    'director/logger',
    'director/fields/extract/multiextract_field_model',
    'director/fields/hash/multihash_field_model',
    'director/fields/list/multilist_field_model',
    'director/fields/part/multipart_field_model',
    'director/fields/text/multitext_field_model',
    './param_model_base',
    'service_resource_dependency',
    'director/fields/switch/switch_field_model',
    'director/fields/textarea/textarea_field_model',
    'director/fields/text/text_field_model'],
    function(
        require,
        _,

        Assert,
        DateFieldModel,
        FieldModelBase,
        HiddenFieldModel,
        ListFieldModel,
        Logger,
        MultiextractFieldModel,
        MultihashFieldModel,
        MultilistFieldModel,
        MultipartFieldModel,
        MultitextFieldModel,
        ParamModelBase,
        ServiceResourceDependency,
        SwitchFieldModel,
        TextareaFieldModel,
        TextFieldModel) {

    /*
    * @singleton
    *
    * This class is used for managing data models. This class contains:
        - Factory methods for creating field and param models
        - Helper methods for manipulating/converting model or array of models
        - Helper methods for retrieving useful values from array of models
    */
    function Model() {
        var self = this;
        /*
        * @public
        *
        * Factory function for creating new field data model.
            TODO: should define an options argument
        *
        * @param {String} baseKey - The base key for this field model
        * @param {FieldModel} FieldModel - The field model class to create an instance of
        * @param {Object} config - The config to apply to the field
        * @param {*} setting - The setting to apply to the field
        * @return {Function} field - The newly created field model.
        */
        self.createField = function(baseKey, FieldModel, config, setting) {
            if (Assert.typeOf(FieldModel).isUndefined()) {
                Logger.error('Director.Model.createField: Invalid argument "FieldModel", it should not be undefined.');
                return null;
            }
            if (Assert.typeOf(config).isNotObject()) {
                Logger.error('Director.Model.createField: Invalid argument "config", it should be an object.');
                return null;
            }
            if (Assert.typeOf(baseKey).isNotString()/* && Assert.typeOf(baseKey).isNotNumber()*/) {
                Logger.error('Director.Model.createField: Invalid argument "baseKey", it should be a string.');
                return null;
            }
            /*
            * Check if we haven't inherited the prototype yet.
            */
            if (!FieldModel.prototype.__parentPrototype) {
                FieldModel.prototype = new self.FieldBase();
            }
            var field = new FieldModel(baseKey, config, setting);
            return field;
        };
        /*
        * @public
        *
        * Adds a new field to the parameter model.
        *
        * @param {ParamModel} context - The context to apply the child param to, when calling this method from
            a param the value is "this"
        * @param {String} fieldKey - The key to use as the lookup on the DOM
        * @param {Object} config - The config to apply to the field
        * @param {*} setting - The setting to apply to the field
        * @return {FieldModel} fieldModel - The newly created field model
        */
        self.addField = function(context, fieldKey, config, setting) {
            if (typeof config === 'undefined') return;
            if (Assert.typeOf(config.field_type).isNotString()) {
                Logger.error('Director.Model.addField: "field_type" was not defined for the field. It should be a string like: text, multitext, switch, list, etc...', this);
                return null;
            }

            context.fields = context.fields || {};
            var FieldModel = this.getFieldModelClass(config.field_type);
            var field = this.createField(context.baseKey + '.' + fieldKey, FieldModel, config, setting);
            context.fields[fieldKey] = context.fields[fieldKey] || {};
            if (context.fields[fieldKey].push) {
                context.fields[fieldKey].push(field);
            } else {
                context.fields[fieldKey] = field;
            }
            return field;
        };
        /*
        * @public
        *
        * Adds fields to the fields object.
        *
        * @param {ParamModel} context - The context to apply the child param to, when calling this method from
            a param the value is "this"
        * @param {Object} config - The config we are attempting to add fields from
        * @param {Object} setting - The setting to attach to the field
        */
        self.addFields = function(context, config, setting) {
            var self = this;
            if (!config) return;
            if (Assert.typeOf(config).isNotObject()) {
                Logger.error('Director.Model.addFields: Incorrect argument "config", it should be an object.');
                return null;
            }
            if (Assert.typeOf(setting).isNotObject()) {
                Logger.error('Director.Model.addFields: Incorrect argument "setting", it should be an object.');
                return null;
            }

            _.each(config.fields, function(field, fieldKey) {
                self.addField(context, fieldKey, field, setting[fieldKey]);
            });
        };
        /*
        * @public
        *
        * Gets the class of a field model given some type.
        *
        * @param {String} type - The field type to find the class of
        * @return {FieldModel} FieldModelClass - the class for the field type
        */
        self.getFieldModelClass = function(fieldType) {
            //TODO: add argument validation
            var FIELD_MODEL_CLASS_MAP = {
                text: TextFieldModel,
                list: ListFieldModel,
                switch: SwitchFieldModel,
                hidden: HiddenFieldModel,
                multihash: MultihashFieldModel,
                multiextract: MultiextractFieldModel,
                textarea: TextareaFieldModel,
                multitext: MultitextFieldModel,
                multilist: MultilistFieldModel,
                multipart: MultipartFieldModel,
                date: DateFieldModel
            };
            var FieldModelClass = FIELD_MODEL_CLASS_MAP[fieldType];
            if (!FieldModelClass) {
                Logger.error('Director.Model.getFieldModelClass: Field model class for type "' + fieldType + '" is not defined.');
            }
            return FieldModelClass;
        };
        /*
        * @public
        *
        * Factory method for creating new param data models.
            TODO: should define an options argument
        *
        * @param {ParamModel} ParamModel - The param model class to create an instance of
        * @param {Object} config - The config to apply to the parameter
        * @param {*} setting - The setting to apply to the parameter
        * @param {String} baseKey - The baseKey for the parameter
        * @param {Boolean} injectDependency - If we should inject the dependencies into the config
        * @param {Function} callback - The callback function for after param has been created
        * @return {Function} callback
        */
        self.createParam = function(baseKey, ParamModel, config, setting, injectDependency, callback) {
            var self = this;
            if (Assert.typeOf(ParamModel).isUndefined()) {
                Logger.error('Director.Model.createParam: Invalid argument "ParamModel", it should not be undefined.');
                return null;
            }
            if (Assert.typeOf(config).isNotObject()) {
                Logger.error('Director.Model.createParam: Invalid argument "config", it should be an object.');
                return null;
            }
            if (Assert.typeOf(baseKey).isNotString()) {
                Logger.error('Director.Model.createParam: Invalid argument "baseKey", it should be a string.');
                return null;
            }
            if (Assert.typeOf(callback).isNotFunction()) {
                Logger.error('Director.Model.createParam: Invalid argument "callback", it should be a function.');
                return null;
            }
            var _create = function(config) {
                /*
                * Check if we haven't inherited the prototype yet.
                */
                if (!ParamModel.prototype.__parentPrototype) {
                    ParamModel.prototype = new self.ParamBase();
                }
                var param = new ParamModel(baseKey, config, setting);
                param.validate(param, setting);
                return callback(param);
            };
            if (injectDependency) {
                ServiceResourceDependency.injectParamConfigDependencies(config, function(newConfig) {
                    _create(newConfig);
                });
            } else {
                _create(config);
            }
        };
        /*
        * @public
        *
        * Add a new parameter to the current parameters object.
        *
        * @param {ParamModel} context - The context to apply the child param to, when calling this method from
            a param the value is "this"
        * @param {String} paramKey - The key to store the parameter as in the current parameters object
        * @param {ParamModel} paramModelClass - The class of all the parameters we will be creating
        * @param {Object} config - The configuration for the parameters
        * @param {Object} setting - The setting to create the parameter from
        * @param {String} index (Optional) - The index for this param, used in cases that it
            exists in an array of similar parameters
        */
        self.addParam = function(context, paramKey, ParamModelClass, config, setting, index) {
            if (!config || _.isEmpty(config)) return;

            context.parameters = context.parameters || {};
            context.parameters[paramKey] = context.parameters[paramKey] || {};
            if (!context.hasValue(setting)) {
                setting = {};
            }
            var _addParam = function(param) {
                if (_.isArray(context.parameters[paramKey])) {
                    context.parameters[paramKey].push(param);
                } else {
                    context.parameters[paramKey] = param;
                }
            };

            /*
            * Check if setting is already a param model and if so we need to treat it differently.
            */
            if ((setting instanceof ParamModelClass)) {
                _addParam(setting);
            } else {
                var baseKey = context.baseKey + '.' + paramKey;
                baseKey = index ? baseKey + '.' + index : baseKey;
                this.createParam(baseKey, ParamModelClass, config, setting, false, _addParam);
            }
        };
        /*
        * @public
        *
        * Adds an array or object of parameters with the same Class as a parameter in the current parameters object.
        *
        * @param {ParamModel} context - The context to apply the child param to, when calling this method from
            a param the value is "this"
        * @param {String} paramKey - The key to store the parameter as in the current parameters object.
        * @param {ParamModel} paramModelClass - The class of all the parameters we will be creating.
        * @param {Object} config - The configuration for the parameters.
        * @param {Object|Array} settings - The object or array of settings to create the parameters from.
        */
        self.addParams = function(context, paramKey, ParamModelClass, config, settings) {
            var self = this;

            context.parameters = context.parameters || {};
            context.parameters[paramKey] = (_.isArray(settings) ? [] : {});
            _.each(settings, function(setting, key) {
                self.addParam(context, paramKey, ParamModelClass, config, setting, key.toString());
            });
        };
        /*
        * @public
        *
        * Factory function for cloning a previously created param.
            TODO: should define an options argument
        *
        * @param {ParamModel Class} ParamModel - The param model class to create an instance of
        * @param {Object} config - The config to apply to the parameter
        * @param {ParamModel} paramToClone - The parameter we are cloning
        * @param {Function} callback - The callback function for after param has been cloned
        * @return {Function} callback
        */
        self.cloneParam = function(ParamModel, config, paramToClone, callback) {
            if (Assert.typeOf(ParamModel).isUndefined()) {
                Logger.error('Director.Model.cloneParam: Invalid argument "ParamModel", it should not be undefined.');
                return null;
            }
            if (Assert.typeOf(config).isNotObject()) {
                Logger.error('Director.Model.cloneParam: Invalid argument "config", it should be an object.');
                return null;
            }
            if (Assert.instanceOf(paramToClone).isNot(ParamModel)) {
                Logger.error('Director.Model.cloneParam: Invalid argument "paramToClone", it should be an instance of:', ParamModel);
                return null;
            }
            if (Assert.typeOf(callback).isNotFunction()) {
                Logger.error('Director.Model.cloneParam: Invalid argument "callback", it should be a function.');
                return null;
            }
            self.createParam(paramToClone.baseKey, ParamModel, config, paramToClone.getSettings(), false, callback);
        };
        /*
        * @public
        *
        * Factory function for creating an array of new params.
            TODO: should define an options argument
        *
        * @param {ParamModel} ParamModel - The param model class to create an instance of
        * @param {Object} config - The config for the param model
        * @param {Array} settings - The settings to create parameters from
        * @param {Function} callback - The callback function for after params have been created.
        * @return {Function} callback(params)
        */
        self.createArrayOfParams = function(baseKey, ParamModel, config, settings, callback) {
            if (Assert.typeOf(ParamModel).isUndefined()) {
                Logger.error('Director.Model.createArrayOfParams: Invalid argument "ParamModel", it should not be undefined.');
                return null;
            }
            if (Assert.typeOf(config).isNotObject()) {
                Logger.error('Director.Model.createArrayOfParams: Invalid argument "config", it should be an object.');
                return null;
            }
            if (Assert.typeOf(callback).isNotFunction()) {
                Logger.error('Director.Model.createArrayOfParams: Invalid argument "callback", it should be a function.');
                return null;
            }
            var params = [];
            if (!_.size(settings)) return callback([]);
            ServiceResourceDependency.injectParamConfigDependencies(config, function(newConfig) {
                /*
                * TODO: implement promises.
                */
                var totalRequestsToMake = _.size(settings);
                var totalRequestsMade = 0;
                var filterRequestsCallback = function(param) {
                    totalRequestsMade++;
                    params.push(param);
                    if (totalRequestsMade >= totalRequestsToMake) {
                        return callback(params);
                    }
                };
                _.each(settings, function(setting, key) {
                    self.createParam(baseKey + '.' + key, ParamModel, newConfig, setting, false, filterRequestsCallback);
                });
            });
        };
        /*
        * @public
        *
        * Gets the model with the matching key from an array of models.
        *
        * @param {Array} models - Array of models to search
        * @param {String|Integer} key - The key to lookup
        * @return {Model} foundModel
        */
        self.getModelFromArray = function(models, key) {
            var modelToReturn = null;
            _.each(models, function(model, index) {
                if (model.key == key) {
                    modelToReturn = model;
                }
            });
            return modelToReturn;
        };
        /*
        * @public
        *
        * Gets the index of the model with the matching key from an array of models.
        *
        * @param {Array} models - Array of models to search
        * @param {String} propertyName - The key to lookup
        * @param {*} valueToMatch - The value to match
        * @return {Integer} index
        */
        self.getModelIndexFromArrayByProperty = function(models, propertyName, value) {
            var indexToReturn = null;
            _.each(models, function(model, index) {
                if (model[propertyName] == value) {
                    indexToReturn = index;
                }
            });
            return indexToReturn;
        };
         /*
        * @public
        *
        * Gets some model in an array by some property.
        *
        * @param {Array} models - Array of models to search
        * @param {String} propertyName - The key to lookup
        * @param {*} valueToMatch - The value to match
        * @return {Model} modelToReturn
        */
        self.getModelFromArrayByProperty = function(models, propertyName, value) {
            var modelToReturn = null;
            _.each(models, function(model) {
                if (model[propertyName] == value) {
                    modelToReturn = model;
                }
            });
            return modelToReturn;
        };
        /*
        * @public
        *
        * Gets the index of the model with the matching key from an array of models.
        *
        * @param {Array} models - Array of models to search
        * @param {String|Integer} key - The key to lookup
        * @return {Integer} index
        */
        self.getModelIndexFromArrayByKey = function(models, key) {
            return self.getModelIndexFromArrayByProperty(models, 'key', key);
        };
        /*
        * @public
        *
        * Replaces the model that has the matching key from an array of models.
        *
        * @param {Array} models - Array of models to search
        * @param {Model} model - The model we will use to replace
        */
        self.replaceModelInArray = function(models, model) {
            var index = self.getModelIndexFromArrayByKey(models, model.key);
            models[index] = model;
        };
        /*
        * @public
        *
        * Removes the model with matching key from an array of models.
        *
        * @param {Array} models - Array of models to search
        * @param {String|Integer} key - The key to of model to remove
        */
        self.removeModelFromArray = function(models, key) {
            var indexToRemove = null;
            _.each(models, function(model, index) {
                if (model.key == key) {
                    indexToRemove = index;
                }
            });
            models.splice(indexToRemove, 1);
        };
        /*
        * @public
        *
        * Removes the model with matching property value.
        *
        * @param {Array} models - Array of models to search
        * @param {String} propertyName - The key to lookup
        * @param {*} valueToMatch - The value to match
        */
        self.removeModelFromArrayByProperty = function(models, propertyName, value) {
            var indexToRemove = self.getModelIndexFromArrayByProperty(models, propertyName, value);
            models.splice(indexToRemove, 1);
        };
        /*
        * @public
        *
        * Removes all models from an array. Use this if you want references
            to the array to stay intact, but you need the array to be empty.
        *
        * @param {Array} models - Array of models to search
        */
        self.removeModelsFromArray = function(models) {
            models.splice(0, models.length);
        };
        /*
        * @public
        *
        * This will get the next key for a model that should be used. It starts with attempting
            to use the current length of array as the next key, but after checks each model to
            make sure it is unique.
        *
        * @param {Array} models - Array of models to search for next key to use
        */
        self.getNextKeyToUseInArray = function(models) {
            var keyToReturn = null;
            var searchForIndex = function(keyToUse) {
                var done = false;
                _.each(models, function(model) {
                    if (!done && model.key == keyToUse) {
                        done = true;
                        searchForIndex(++keyToUse);
                    }
                });
                if (!done) {
                    keyToReturn = keyToUse;
                }
            };
            searchForIndex(models.length);
            return keyToReturn.toString();
        };
        /*
        * @public
        *
        * This should be extended by the field models.
        */
        self.FieldBase = FieldModelBase;
        /*
        * @public
        *
        * This should be extended by the param models.
        */
        self.ParamBase = ParamModelBase;
    }

    return new Model(); //Return a singleton class

});