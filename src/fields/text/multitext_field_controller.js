"use strict";

define('director/fields/text/multitext_field_controller',
	['jquery',
	'underscore',

	'director/models/model',
	'hbs!./multitext_field_template',
	'hbs!./multitext_list_item_template',
	'director/views/view'],
	function(
		$,
		_,

		Model,
		MultitextFieldTemplate,
		MultitextListItemTemplate,
		View) {

	/*
	* @extend Director.Controller.FieldBase
	*
	* Field controller for data.

		field_type - multitext

	* Views: multitext-list-view
	*
	* @param {TextFieldModel} model - The multitext field model
	*/
	return function MultitextFieldController (model) {
		var Controller = require('director/controllers/controller');
		var self = this;
		var parent = Controller.FieldBase.prototype;

		self.items = [];
		self.originalItems = null;

		var _init = function() {
			self.init(null, model, MultitextFieldTemplate);
			self.registerEvents();

			_.each(self.model.value, function(val) {
	            _addItem(val);
	        });
	        self.originalItems = _.clone(self.items);
		};

		/*
		* @private
		*
		* Add a new data items to the list and compile on the page.
		*
		* @param {Object} item - The item we are compiling.
		*/
		var _addItem = function(item) {
			var displayFirstItemConstant = false;
			if (item.config.first_item && item.value === item.config.first_item.value) {
				displayFirstItemConstant = true;
			}
			var listView = View.extend({
				context: {
					base_key: item.baseKey,
					key: item.key,
					display_first_item_constant: displayFirstItemConstant
				},
				selector: self.fieldSelector + ' div[multitext-list-view]',
				template: MultitextListItemTemplate,
				placement: 'append'
			});
			listView.load();
			self.items.push(Controller.createField(item));
		};

		/*
		* @public
		*
		* Registers the DOM events for field.
		*/
		self.registerEvents = function() {
			$(self.fieldSelector).on('click', '.add-new-field-list-item-btn', function() {
				var item = self.model.addItem();
				_addItem(item);
			});
			$(self.fieldSelector).on('click', '.delete-multitext-item-btn', function() {
				var $parentEl = $($(this).parents('div[data-list-item-index]')[0]);
				var key = $parentEl.data('list-item-index');
				$parentEl.remove();
				Model.removeModelFromArray(self.model.value, key);
				Model.removeModelFromArray(self.items, key);
			});
		};

		/*
		* @override Director.Controller.FieldBase.prototype.save
		*
		* Saves the data field by iterating through all data params and saving the data items.
		*/
		self.save = function() {
			_.each(self.items, function(item) {
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
        * @overrider FieldControllerBase.prototype.hasAcceptedValue
        */
        self.hasAcceptedValue = function() {
        	if (!self.getValue().length) return false;
        	return true;
        }
		/*
		* @override Director.Controller.FieldBase.prototype.checkIfDirty
		*
		* Saves the data field by iterating through all data params and saving the data items.
		*/
		self.checkIfDirty = function() {
			var isDirty = false;
			var self = this;
			if (self.model.value.length !== self.getValue().length) {
				return true;
			}
			if (self.items.length !== self.originalItems.length) {
				return true;
			}
			_.each(self.items, function(item, key) {
				if (item.model.value !== self.originalItems[key].getValue() &&
					(item.model.value || self.originalItems[key].getValue())) {

	                isDirty = true;
	            }
			});
            return isDirty;
        };

        _init();
	};
});