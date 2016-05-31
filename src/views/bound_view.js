"use strict";

define([
    'jquery',
    'handlebars',
    'underscore',

    'director/logger',
    'director/models/model'],
    function(
        $,
        HandleBars,
        _,

        Logger,
        Model) {

    /*
    * @private
    *
    * Class for wrapping view so we can perform operations on a particular view.
    *
    * @param {Object} options - The options to apply to the view
    */
    return function BoundView(options) {
        var Controller = require('director/controllers/controller');
        var View = require('director/views/view');
        var self = this;
        self.key = options.key;
        self.options = options;
        self.watchedFields = {};
        self.boundContext = {};
        self.originalContext = {};
        self.children = [];
        self.$el = null;
        self.$oldContainer = null;

        /*
        * @constant
        *
        * Selectors for the views we will compile
        */
        var VIEW_SELECTOR = {
            MODAL_CONTAINER: 'div[modal-container-view]'
        };

        var _timeoutKeys = {};
        /*
        * @private
        *
        * Polls field to watch and waits for field to become dirty. If a field is removed from the
            page then we will stop watching that field.
        *
        * @param {FieldController} fieldToWatch - The field controller that we are testing for a dirty state.
        */
        var _pollForDirtyField = function(fieldToWatch) {
            if (!fieldToWatch) {
                Logger.error('BoundView._pollForDirtyField: Incorrect argument "fieldToWatch", it should be an object.');
                return;
            }
            if (_timeoutKeys && _timeoutKeys[fieldToWatch.baseKey]) {
                window.clearTimeout(_timeoutKeys[fieldToWatch.baseKey].timeoutKey);
            } else {
                _timeoutKeys[fieldToWatch.baseKey] = _timeoutKeys[fieldToWatch.baseKey] || {};
            }
            var check = function() {
                if ($(fieldToWatch.fieldSelector).length === 0 && _timeoutKeys[fieldToWatch.baseKey]) {
                    window.clearTimeout(_timeoutKeys[fieldToWatch.baseKey]);
                    return;
                }
                if (fieldToWatch.checkIfDirty()) {
                    return fieldToWatch.dirtyEvent();
                } else {
                    _timeoutKeys[fieldToWatch.baseKey].timeoutKey = window.setTimeout(check, 250);
                }
            };
            _timeoutKeys[fieldToWatch.baseKey].timeoutKey = window.setTimeout(check, 250);
        };
        self.boundFields = {}; //TODO: see if we can move this to be private (need to check for all references)
        /*
        * @property @write
        *
        * Changes the values of a bound field.
        *
        * @param {String} baseKey - The baseKey for the field that we are changing the value for.
        * @param {*} newValue - The new value
        */
        self.setBoundFieldValue = function(baseKey, newValue) {
            var field = self.boundFields[baseKey];
            if (!field) {
                Logger.error('BoundView.setBoundFieldValue: Could not find a bound field for the baseKey "' + baseKey + '".', self.boundFields);
                return;
            }
            field.setValue(newValue);
        };
        /*
        * @public
        *
        * Adds watcher on field to detect when it becomes dirty.
        *
        * @param {FieldModel} field - The field we want to watch.
        * @param {Function} callback - The return callback when any the field become dirty.
        */
        self.addFieldWatcher = function(field, callback) {
            var fieldToWatch = self.boundFields[field.baseKey];
            if (!fieldToWatch) {
                Logger.error("BoundView.addFieldWatcher: Cound not find field with matching field base key \"" + field.baseKey + "\".", self.boundFields);
            } else {
                fieldToWatch.watcherCallback = function(oldValue, newValue) {
                    callback.call(self, oldValue, newValue);
                    if (typeof self.options.fields_watcher === 'function') {
                        self.options.fields_watcher.call(self, oldValue, newValue);
                    }
                };
                /*
                * If we detected that we are adding the same field again then we will replace that field.
                */
                if (self.watchedFields[field.baseKey]) {
                    Logger.info("BoundView.addFieldWatcher: Field watcher for \"" + field.baseKey + "\" already exists.", fieldToWatch);
                } else {
                    self.watchedFields[field.baseKey] = fieldToWatch;
                }
                _pollForDirtyField(fieldToWatch);
            }
        };
        /*
        * @public
        *
        * Removes a field watcher.
        *
        * @param {FieldModel} field - The field we want to watch.
        */
        self.unwatchField = function(field, callback) {
            if (_timeoutKeys && _timeoutKeys[field.key]) {
                window.clearTimeout(_timeoutKeys[field.key].timeoutKey);
                delete _timeoutKeys[field.key];
            }
            delete self.watchedFields[field.baseKey];
        };
        /*
        * @public
        *
        * Binds a field model to the view.
        *
        * @param {FieldModel} field - Field data model to bind to the page.
        */
        self.bindField = function(field) {
            if (typeof field === 'undefined') return;
            if (typeof field.config === 'undefined') {
                Logger.error('BoundView.bindField: No config was supplied for field.', field);
                return;
            }
            if (field.config.field_type == 'hidden') return;
            var fieldController = Controller.createField(field);
            var originalValue = fieldController.originalValue;
            if (self.boundFields[field.baseKey]) {
                originalValue = self.boundFields[field.baseKey].originalValue; //Helper for storing the old context if we lost the reference.
                Logger.info("BoundView.bindField: Replacing existing boundField \"" + self.boundFields[field.baseKey].baseKey + "\".", fieldController);
            }
            self.boundFields[field.baseKey] = fieldController;
            self.boundFields[field.baseKey].originalValue = originalValue;
        };
        /*
        * Updates the view. This will also reinitiate any field watchers that are in place.
        */
        self.update = function() {
            if (self.options.update_selector) {
                self.load();
            } else {
                Logger.error('BoundView.update: There is not options.update_selector configured, no update will take place.', self);
            }
        };
        /*
        * @public
        *
        * Loads a view.
        *
        * @param {Object} options - The options to apply to the view
        */
        self.load = function() {
            if (typeof self.options.pre_load === 'function') {
                self.options.pre_load.call(self);
            }
            if (self.options.context_to_bind) {
                self.boundContext = self.options.context_to_bind;
                self.options.context.bound_context = self.boundContext.isParam ? self.boundContext.getFields() : self.boundContext;
            }
            var html = '';
            if (typeof self.options.template === 'string') {
                html = self.options.template;
            } else {
                Logger.info('BoundView.load: Compiling template with context:', self.options.context);
                html = self.options.template(self.options.context);
            }
            /*
            * If the element is not stored yet then we need to create it.
            */
            if (!self.$el) {
                var $container = $(self.options.selector);
                if (!$container.length) {
                    Logger.warn('BoundView.load: Could not find the options.selector "' + self.options.selector + '" to compile the template.', self.options);
                } else if ($container.length > 1) {
                    Logger.warn('BoundView.load: Found more than one matching element with the options.selector "' + self.options.selector + '".', self.options);
                }
                if (self.options.placement === 'replace_content') {
                    $container.html(html);
                } else if (self.options.placement === 'replace_container') {
                    self.$oldContainer = $container;
                    $container.replaceWith(html);
                } else {
                    $container[self.options.placement](html);
                }
            } else {
                /*
                * Else we should update the template.
                */
                if (self.options.update_placement === 'replace_container') {
                    self.$el.replaceWith(html);
                } else {
                    self.$el.html(html);
                }
            }
            self.$el = $(self.options.update_selector);

            if (self.options.context_to_bind) {
                /*
                * Convert possible nested object of boundContext to a top level array. This works recursively.
                */
                var boundFieldKeys = [];
                var findFieldsToBind = function(obj) {
                    _.each(obj, function(property, key) {
                        /*
                        * If this is not an object then we skip over, we are
                            just looking for fields, or nested fields.
                        */
                        if (typeof property !== 'object') {
                            return;

                        } else if ((typeof property === 'object' && !property.isField) &&
                            (!self.options.params_to_ignore || self.options.params_to_ignore.indexOf(key) === -1)) {

                            findFieldsToBind(property);

                        } else if (property.isField &&
                            (!self.options.fields_to_ignore || self.options.fields_to_ignore.indexOf(key) === -1)) {
                            boundFieldKeys.push(property.baseKey);
                            self.bindField(property);
                        }
                    });
                };
                /*
                * Check if this is field that doesn't need extracted.
                */
                if (self.boundContext.isField) {
                    boundFieldKeys.push(self.boundContext.baseKey);
                    self.bindField(self.boundContext);
                } else {
                    /*
                    * Else assume this is an object containing nested fields. This will
                        apply to the parameter case as well.
                    */
                    findFieldsToBind(self.boundContext);
                }

                /*
                * Remove old bound fields.
                */
                var fieldKeysToRemove = [];
                _.each(self.boundFields, function(boundField) {
                    if (boundFieldKeys.indexOf(boundField.baseKey) === -1) {
                        fieldKeysToRemove.push(boundField.baseKey);
                    }
                });
                _.each(fieldKeysToRemove, function(fieldKeyToRemove) {
                    delete self.boundFields[fieldKeyToRemove];
                });
            }

            if (options.type === 'modal') {
                $('#myModal').modal({
                    show: true,
                    backdrop: 'static'
                });
            }
            /*
            * Add back all field watchers.
            */
            if (_.size(self.watchedFields)) {
                var oldFields = self.watchedFields;
                self.watchedFields = {};
                _.each(_timeoutKeys, function(timeout) {
                    window.clearTimeout(timeout.timeoutKey);
                });
                _timeoutKeys = {};
                _.each(oldFields, function(oldField, fieldBaseKey) {
                    /*
                    * Verify that this old field is still a part of the scope.
                    */
                    if (self.boundFields[fieldBaseKey]) {
                        self.addFieldWatcher(oldField, oldField.watcherCallback);
                    }
                });
            } else {
                /*
                * Else add all new field watchers.
                */
                _.each(self.options.field_watchers, function(fieldWatcherCallback, key) {
                    var fieldToWatch = Model.getModelFromArray(self.boundFields, key);
                    if (!fieldToWatch) {
                        Logger.info('BoundView.load: Could not find field to watch with the key "' + key + '". Available fields to watch:', self.boundContext);
                        return null;
                    }
                    self.addFieldWatcher(fieldToWatch, fieldWatcherCallback);
                });
            }
            /*
            * Add fields watcher if available.
            */
            if (typeof self.options.fields_watcher === 'function') {
                _.each(self.boundFields, function(boundField) {
                    /*
                    * Make sure we don't already have this field watched, if so then
                        the fields_watcher is already taken into account.
                    */
                    if (!self.watchedFields[boundField.baseKey]) {
                        self.addFieldWatcher(boundField, self.options.fields_watcher);
                    }
                });
            }
            /*
            * This will only be run in the case that this is a non-list.
            */
            if (typeof self.options.post_load === 'function') {
                self.options.post_load.call(self);
            }
        };
        /*
        * @public
        *
        * Removes a view from the page.
        *
        * @param {Boolean} maintainState (optional) - If all fields should keep their state
        */
        self.unload = function(maintainState) {
            if (self.options.type === 'modal') {
                $('#myModal').modal('hide');
                $('#myModal').on('hidden.bs.modal', function () {
                    $(VIEW_SELECTOR.MODAL_CONTAINER).remove();
                });
            } else if (self.options.type === 'inline') {
                if (self.options.update_selector && self.options.placement === 'append') {
                    self.$el.remove();
                } else if (self.options.update_selector && self.options.placement === 'replace_container') {
                    self.$el.replaceWith(self.$oldContainer); //TODO: this hasn't been tested, I think it works :/
                } else if (self.options.update_selector && self.options.placement === 'replace_content') {
                    self.$el.html('').hide();
                } else {
                    Logger.error('BoundView.unload: There is not options.update_selector configured, no unload will take place.', self);
                }
            }
            if (!maintainState && _.size(self.boundFields)) {
                self.resetFields();
            }
            /*
            * This will only be run in the case that this is a non-list.
            */
            if (typeof self.options.post_unload === 'function') {
                self.options.post_unload.call(self);
            }
        };
        /*
        * @public
        *
        * Hides the view from the page.
        */
        self.hide = function() {
            self.$el.hide();
        };
        /*
        * @public
        *
        * Shows the view on the page.
        */
        self.show = function() {
            self.$el.show();
        };
        /*
        * @public
        *
        * Saves all bound fields.
        *
        * @param {Boolean} validateFields - If we should perform validation before saving
        * @return {Boolean} succuss - If fields were successfully saved
        */
        self.saveFields = function(validateFields) {
            if (validateFields) {
                if (!self.$el.find('div[form-error-view]').length) {
                    Logger.warn('BoundView.saveFields: There was an attempt to validate the fields contained in ' + self.options.update_selector + ' but there was no <div form-error-view></div> detected in that view. Please add this to the view\'s template if you want the error messages to be displayed.', self);
                }

                var errors = View.checkParamFields(self.boundFields);
                if (errors.length) {
                    View.displayErrors(errors, self.options.update_selector);
                    return false;
                }
            }
            _.each(self.boundFields, function(boundField) {
                boundField.save();
            });
            return true;
        };
        /*
        * @public
        *
        * Resets all fields to their original value.
        */
        self.resetFields = function() {
            _.each(self.boundFields, function(boundField) {
                self.unwatchField(boundField);
                boundField.reset();
            });
        };
    };
});