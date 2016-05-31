"use strict";

define('director/fields/list/multilist_field_controller',
	['jquery',
	'require',
	'underscore',

	'director/models/model',
	'hbs!./multilist_field_template',
	'hbs!./multilist_list_item_template',
	'director/views/view'],
	function(
		$,
		require,
		_,

		Model,
		MultilistFieldTemplate,
		MultilistListItemTemplate,
		View) {

	/*
	* @extend Director.Controller.FieldBase
	*
	* Field controller for data.

		field_type - multilist

	* Views: multilist-list-view
	*
	* @param {String} containerSelector - The containerSelector of the data we are compiling
	* @param {ListFieldModel} model - The multilist field model
	*/
	return function MultilistFieldController (model) {
		var self = this;
		var Controller = require('director/controllers/controller');
		var parent = Controller.FieldBase.prototype;

		self.items = [];
		self.originalItems = null;

		var _init = function() {
			self.init(null, model, MultilistFieldTemplate);
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
			var listViewSelector = self.fieldSelector + ' div[multilist-list-view]';
			var listView = View.extend({ //TODO: should load this like a list instead of single operations
				context: item,
				selector: listViewSelector,
				template: MultilistListItemTemplate,
				placement: 'append'
			});
			listView.load();

			var fieldContainerSelector = listViewSelector + ' div[data-list-item-index="' + item.key + '"]';
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
			$(self.fieldSelector).on('click', '.delete-multilist-item-btn', function() {
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
        * @overrider Director.Controller.FieldBase.prototype.hasAcceptedValue
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