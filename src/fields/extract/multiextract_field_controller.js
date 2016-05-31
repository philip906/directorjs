"use strict";

define('director/fields/extract/multiextract_field_controller',
	['jquery',
	'require',
	'underscore',

	'director/models/model',
	'hbs!./multiextract_field_template',
	'hbs!./multiextract_list_item_template',
	'director/views/view'],
	function(
		$,
		require,
		_,

		Model,
		MultiextractFieldTemplate,
		MultiextractListItemTemplate,
		View) {

	/*
	* @constructor @extend Director.Controller.FieldBase
	*
	* Field data model for multiextract configurations and settings. You should use this field model
        whenever you have a field that will be defining where it will be extracting value from such
        as a user or inviter object.

		field_type - multiextract

	* Views: multiextract-list-view
	*
	* @param {MultiextractFieldModel} model - The data field model
	*/
	return function MultiextractFieldController (model) {
		var self = this;
		var Controller = require('director/controllers/controller');
		var parent = Controller.FieldBase.prototype;

		/*
        * @constant
        *
        * Selectors for the views we will compile
        */
        var VIEW_SELECTOR = {
            MULTIEXTRACT_LIST: 'div[multiextract-list-view]'
        };

		self.extractFields = [];
		self.originalExtractFields = null;

		/*
		* @private
		*
		* Initializes the multiextract field controller.
		*/
		var _init = function() {
			self.init(null, model, MultiextractFieldTemplate);
			self.registerEvents();

			_.each(self.model.value, function(extractFieldModel) {
	            _addExtractField(extractFieldModel);
	        });
	        self.originalExtractFields = _.clone(self.extractFields);
		};

		/*
		* @private
		*f
		* Add a new extract field to the list and compile on the page.
		*
		* @param {ExtractFieldModel} extractFieldModel - The extract field we are adding to the list and compiling.
		* @param {Boolean} shouldReplace - Indicator if we should replace item or append to the DOM
		*/
		var _addExtractField = function(extractFieldModel, shouldReplace) {
			var extractListViewSelector = self.fieldSelector + ' ' + VIEW_SELECTOR.MULTIEXTRACT_LIST;
			var fieldContainerSelector = extractListViewSelector + ' div[data-list-item-index="' + extractFieldModel.key + '"]';
			if (shouldReplace) {
				var fieldContainerView = View.extend({ //TODO: should load this like a list
					context: extractFieldModel,
					selector: fieldContainerSelector,
					template: MultiextractListItemTemplate,
					placement: 'replace_container'
				});
				fieldContainerView.load();
			} else {
				var extractListView = View.extend({ //TODO: should load this like a list
					context: extractFieldModel,
					selector: extractListViewSelector,
					template: MultiextractListItemTemplate,
					placement: 'append'
				});
				extractListView.load();
			}

			/*
			* Create and compile the extract from list field.
			*/
			var extractFromField = Controller.createField(extractFieldModel.extract_from);
			self.extractFields.push(extractFromField);
			$(extractFromField.fieldSelector).on('change', function() {
				var $this = $(this);
				var $extractFieldEl = $this.parent();
				var newConfigTypeKey = extractFromField.getValue();
				_changeExtractFieldConfig($extractFieldEl, newConfigTypeKey);
			});

			/*
			* Create and compile the name and value fields.
			*/
			self.extractFields.push(Controller.createField(extractFieldModel.name));
            if (!extractFieldModel.config_type_key.match(/none/)) {
            	self.extractFields.push(Controller.createField(extractFieldModel.value));
            } else {
            	self.extractFields.push(Controller.createField(extractFieldModel.value));
            }
		};
		/*
		* @private
		*
		* Change the config type of the specified extract field.
		*
		* @param {jQuery Element} $extractFieldEl - The extract field we are changing the config for
		*/
		var _changeExtractFieldConfig = function($extractFieldEl, newConfigTypeKey) {
			var key = $extractFieldEl.data('list-item-index');
			var newExtractField = self.model.changeExtractFieldConfig(key, newConfigTypeKey);
			_addExtractField(newExtractField, true);
		};
		/*
		* @public
		*
		* Registers the DOM events for field.
		*/
		self.registerEvents = function() {
			$(self.fieldSelector).on('click', '.add-new-field-list-item-btn', function() {
				var extractFieldModel = self.model.addExtractField();
				_addExtractField(extractFieldModel);
			});
			$(self.fieldSelector).on('click', '.delete-field-list-item-btn', function() {
				var $parentEl = $($(this).parents('div[data-list-item-index]')[0]);
				var key = $parentEl.data('list-item-index');
				$parentEl.remove();
				Model.removeModelFromArray(self.model.value, key);
				Model.removeModelFromArray(self.extractFields, key);
			});
		};
		/*
		* @public @override Director.Controller.FieldBase.prototype.save
		*
		* Saves the multiextract field by iterating through all extract fields and saving.
		*/
		self.save = function() {
			_.each(self.extractFields, function(item) {
                item.save();
            });
			parent.save.call(this);
		};
		/*
		* @override Director.Controller.FieldBase.prototype.getValue
		*
		* gets the current values.
		*/
		self.getValue = function() {
			return this.model.value;
		};
		/*
		* @override Director.Controller.FieldBase.prototype.checkIfDirty
		*
		* Saves the multiextract field by iterating through each extract and saving.
		*/
		self.checkIfDirty = function() {
			var isDirty = false;
			var self = this;
			if (self.model.value.length !== self.getValue().length) {
				return true;
			}
			if (self.extractFields.length !== self.originalExtractFields.length) {
				return true;
			}
			_.each(self.extractFields, function(extractField, key) {
				if (extractField.getValue() !== self.originalExtractFields[key].model.value &&
					(extractField.getValue()  || self.originalExtractFields[key].model.value)) {

	                isDirty = true;
	            }
			});
            return isDirty;
        };


        _init();
	};
});