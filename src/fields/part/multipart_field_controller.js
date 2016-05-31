"use strict";

define('director/fields/part/multipart_field_controller',
	['jquery',
	'require',
	'underscore',

	'director/models/model',
	'hbs!./multipart_field_template',
	'hbs!./multipart_list_item_template',
	'director/views/view'],
	function(
		$,
		require,
		_,

		Model,
		MultipartFieldTemplate,
		MultipartListItemTemplate,
		View) {

	/*
	* @extend Director.Controller.FieldBase
	*
	* Field controller for multipart configurations and settings. You should use this field controller
        whenever you need a combination of fields.

		field_type - multipart

	* Views: multipart-list-view
	*
	* @param {DataFieldModel} model - The multipart field model
	*/
	return function MultipartFieldController (model) {
		var self = this;
		var Controller = require('director/controllers/controller');
		var parent = Controller.FieldBase.prototype;

		/*
        * @constant
        *
        * Selectors for the views we will compile
        */
        var VIEW_SELECTOR = {
            MULTIPART_LIST: 'div[multipart-list-view]'
        };

		self.partFields = [];

		var _init = function() {
			parent.init.call(self, null, model, MultipartFieldTemplate);

			self.registerEvents();

			_.each(self.model.value, function(partFieldModel, key) {
	            _addPartField(partFieldModel, key);
	        });
	        self.originalValue = _.clone(self.model.value);
		};
		/*
		* @private
		*
		* Add a new data items to the list and compile on the page.
		*
		* @param {Object} dataField - The item we are compiling.
		* @param {Number} key - The data parameter key of the parameter this field is nested under
		* @param {Boolean} shouldReplace - Indicator if we should replace DOM elements
		*/
		var _addPartField = function(partFieldModel, key, shouldReplace) {
			var partListViewSelector = self.fieldSelector + ' ' + VIEW_SELECTOR.MULTIPART_LIST;
			var fieldContainerSelector = partListViewSelector + ' > div[data-list-item-index="' + key + '"]';
			if (shouldReplace) {
				var fieldContainerView = View.extend({ //TODO: should load this like a list
					context: partFieldModel,
					selector: fieldContainerSelector,
					template: MultipartListItemTemplate,
					placement: 'replace_container'
				});
				fieldContainerView.load();
			} else {
				var partListView = View.extend({ //TODO: should load this like a list
					context: partFieldModel,
					selector: partListViewSelector,
					template: MultipartListItemTemplate,
					placement: 'append'
				});
				partListView.load();
			}

			_.each(partFieldModel.items, function(partFieldItem, partFieldItemKey) {
				if (partFieldItem.config.field_type === 'hidden') return;
				//var FIELD_CONTROLLER_CLASS_MAP = {
	                //text: TextFieldController,
	                //list: ListFieldController,
	                //switch: SwitchFieldController,
	                //multihash: MultihashFieldController
	            //};
				//var FieldControllerClass =  FIELD_CONTROLLER_CLASS_MAP[partFieldItem.config.field_type];
				var partField = Controller.createField(partFieldItem);
				if (partFieldItem.key === self.model.config.config_type_field_key) {
					$(partField.fieldSelector).on('change', function() {
						var key = $($(this).parents('[data-list-item-index]')[0]).data('list-item-index');
						var newPartField = self.model.changePartFieldConfig(partField.model.baseKey + '.' + key, partField.getValue());
						_addPartField(newPartField, key, true);
					});
				}
				if (shouldReplace) {
					self.partFields[partFieldItemKey] = partField;
				} else {
					self.partFields.push(partField);
				}
			});
		};
		/*
		* @public
		*
		* Registers the DOM events for field.
		*/
		self.registerEvents = function() {
			$(self.fieldSelector).on('click', '.add-multipart-item-btn', function() {
				var keyToUse = Model.getNextKeyToUseInArray(self.model.value);
				var partFieldModel = self.model.addPartField();
				_addPartField(partFieldModel, keyToUse);
			});
			$(self.fieldSelector).on('click', '.delete-multipart-list-item-btn', function() {
				var $partFieldEl = $($(this).parents('div[data-list-item-index]')[0]);
				var key = $partFieldEl.data('list-item-index');
				$partFieldEl.remove();
				Model.removeModelFromArray(self.model.value, key);
				Model.removeModelFromArray(self.partFields, key);
			});
		};
		/*
		* @public @override Director.Controller.FieldBase.prototype.save
		*
		* Saves the data field by iterating through all data params and saving the data fields items.
		*/
		self.save = function() {
			_.each(self.partFields, function(partField) {
                partField.save();
            });
			parent.save.call(self);
		};
		/*
		* @public @override Director.Controller.FieldBase.prototype.getValue
		*
		* gets the current values.
		*/
		self.getValue = function() {
			return this.model.value;
		};

		/*
		* @public @override Director.Controller.FieldBase.prototype.checkIfDirty
		*
		* Checks if the current multipart field is dirty, it will iterate through all part
			fields to determine.
		*
		* @return {Boolean} isDirty - Indicator if the current multipart field is dirty
		*/
		self.checkIfDirty = function() {
			var isDirty = false;
			var self = this;
			if (self.originalValue.length !== self.getValue().length) {
				return true;
			}
			_.each(self.partFields, function(partField, key) {
				if (partField.checkIfDirty()) {
					isDirty = true;
				}
			});
            return isDirty;
        };

        _init();
	};
});