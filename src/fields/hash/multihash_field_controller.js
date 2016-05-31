"use strict";

define('director/fields/hash/multihash_field_controller',
	['jquery',
	'require',
	'underscore',

	'director/models/model',
	'hbs!./multihash_field_template',
	'hbs!./multihash_list_item_template',
	'director/views/view'],
	function(
		$,
		require,
		_,

		Model,
		MultihashFieldTemplate,
		MultihashListItemTemplate,
		View) {

	/*
	* @constructor @extend Director.Controller.FieldBase
	*
	* Field controller for multihash configurations and settings. You should use this field controller
        whenever you have a field that has a key->value such as query parameters.

		field_type - multihash

	* Views: multihash-list-view
	*
	* @param {MultihashFieldModel} model - The data field model
	*/
	return function MultihashFieldController (model) {
		var self = this;
		var Controller = require('director/controllers/controller');
		var parent = Controller.FieldBase.prototype;

		/*
        * @constant
        *
        * Selectors for the views we will compile
        */
        var VIEW_SELECTOR = {
            MULTIHASH_LIST: 'div[multihash-list-view]'
        };

		self.hashFields = [];
		self.originalHashFields = null;

		var _init = function() {
			self.init(null, model, MultihashFieldTemplate);
			self.registerEvents();

			_.each(self.model.value, function(hashFieldModel) {
	            _addHashField(hashFieldModel);
	        });
	        self.originalHashFields = _.clone(self.hashFields);
		};

		/*
		* @private
		*
		* Add a new hash field to the list and compile on the page.
		*
		* @param {HashFieldModel} hashFieldModel - The hash we are adding to the list and compiling.
		*/
		var _addHashField = function(hashFieldModel) {
			var hashListViewSelector = self.fieldSelector + ' ' + VIEW_SELECTOR.MULTIHASH_LIST;
			var hashListView = View.extend({
				context: hashFieldModel,
				selector: hashListViewSelector,
				template: MultihashListItemTemplate,
				placement: 'append'
			});
			hashListView.load();

			var fieldContainerSelector = hashListViewSelector + ' div[data-list-item-index="' + hashFieldModel.key + '"]';

			self.hashFields.push(Controller.createField(hashFieldModel.name));
			self.hashFields.push(Controller.createField(hashFieldModel.value));
		};
		/*
		* @public
		*
		* Registers the DOM events for field.
		*/
		self.registerEvents = function() {
			$(self.fieldSelector).on('click', '.add-new-field-list-item-btn', function() {
				var configTypeKey = $(this).data('config-type-key');
				var hashFieldModel = self.model.addHashField(configTypeKey);
				_addHashField(hashFieldModel);
			});
			$(self.fieldSelector).on('click', '.delete-field-list-item-btn', function() {
				var $parent = $(this).parent();
				var key = $parent.attr('data-list-item-index');
				Model.removeModelFromArray(self.model.value, key);
				Model.removeModelFromArray(self.hashFields, key);
				$parent.remove();
			});
		};
		/*
		* @public @override FieldControllerBase.prototype.save
		*
		* Saves the multihash field by iterating through all hash fields and saving.
		*/
		self.save = function() {
			_.each(self.hashFields, function(item) {
                item.save();
            });
			parent.save.call(this);
		};
		/*
		* @override FieldControllerBase.prototype.getValue
		*
		* gets the current values.
		*/
		self.getValue = function() {
			return this.model.value;
		};

		/*
		* @override FieldControllerBase.prototype.checkIfDirty
		*
		* Saves the multihash field by iterating through each hash and saving.
		*/
		self.checkIfDirty = function() {
			var isDirty = false;
			var self = this;
			//if (self.originalValue.length !== self.getValue().length) {
			if (self.model.value.length !== self.getValue().length) {
				return true;
			}
			if (self.hashFields.length !== self.originalHashFields.length) {
				return true;
			}
			_.each(self.hashFields, function(hashField, key) {
				if (hashField.model.value !== self.originalHashFields[key].getValue() &&
					(hashField.model.value || self.originalHashFields[key].getValue())) {

	                isDirty = true;
	            }
			});
            return isDirty;
        };


        _init();
	};
});