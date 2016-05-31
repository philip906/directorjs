"use strict";

define('director/fields/list/list_field_controller',
	['jquery',
	'require',
	'underscore',

	'hbs!./list_field_template',
	'director/models/model',
	'director/router',
	'service_resource_dependency'],
	function(
		$,
		require,
		_,

		ListFieldTemplate,
		Model,
		Router,
		ServiceResourceDependency) {

	/*
	* @extend Director.Controller.FieldBase
	*
	* Field controller for lists.
		field_type - list
	*
	* @param {ListFieldModel} model - The data model for the list
	*/
	return function ListFieldController (model) {
		var self = this;
		var Controller = require('director/controllers/controller');
		var parent = Controller.FieldBase.prototype;

		var _isCustomItemSelected = false;

		/*
		* @private
		*
		* Determines the state of the custom field (if it was the selected option in the list).
		*/
		var _determineCustomFieldState = function() {
			if ($(self.valueSelector).val() === "CUSTOM_LIST_ITEM") {
				_isCustomItemSelected = true;
				$(self.fieldSelector).addClass('custom-field-active');
				$(self.fieldSelector + ' .custom-list-field-item-txt').show();
			} else {
				_isCustomItemSelected = false;
				$(self.fieldSelector).removeClass('custom-field-active');
				$(self.fieldSelector + ' .custom-list-field-item-txt').hide();
			}
		};
		/*
		* @private
		*
		* Determines if the custom item is currently selected.
		*
		* @return {Boolean} isSelected
		*/
		var _customItemSelected = function() {
			var $customItem = $(self.fieldSelector + '.custom-field-active');
			return $customItem.length > 0;
		};
		/*
		* @public @override Director.Controller.FieldBase.prototype.init
		*
		* TODO: define
		*/
		self.init = function() {
			/*
	        * Determine what is the selected index.
	        */
	        var selectedIndex = null;
	        var customFieldIndex = null;
	        _.each(model.config.list, function(item, index) {
	            if (item.id == model.value) {
	                selectedIndex = index;
	            } else if (!model.value && item.id == model.config.default_value) {
	                selectedIndex = index;
	            }
	            /*
	            * Find index of custom field.
	            */
	            if (item.id === "CUSTOM_LIST_ITEM") {
	            	customFieldIndex = index;
	            }
	        });
	        /*
	        * Check if there was a custom list item selected.
	        */
	        if (selectedIndex === null && model.config.custom_list_item) {
	        	selectedIndex = customFieldIndex;
	        } else if (selectedIndex === null) {
	        	selectedIndex = 0;
	        }
	        model.selectedIndex = selectedIndex;
			parent.init.call(self, 'select option:selected', model, ListFieldTemplate);
			if (model.config.custom_list_item) {
				_determineCustomFieldState();
			}
			if (_isCustomItemSelected) {
				$(self.fieldSelector + ' .custom-list-field-item-txt').val(self.model.value);
			}
			self.registerEvents();
		};
		/*
		* @public
		*
		* Registers the DOM events for field.
		*/
		self.registerEvents = function() {
			/*
			* TODO: define
			*/
			$(self.fieldSelector + ' .empty-field-data-link').on('click', function() {
				var path = self.model.config.dependency.service_config.create_new_path;
				var query = {
					open_create_modal: true
				};
				Router.routeUser(path, true, true, query);
			});
			/*
			* TODO: define
			*/
			$(self.fieldSelector + ' .empty-field-reload-link').on('click', function() {
				var methodArgs = self.model.config.dependency.service_config.method_args.concat([
                    false,
                    function(data) {
                    	self.model.config.data = data;
                        ServiceResourceDependency.injectListItems(self.model.config);
						self.init();
                    }]
                );
                self.model.config.dependency.service_config.get.apply(this, methodArgs);
			});
			/*
			* TODO: define
			*/
			if (model.config.custom_list_item) {
				$(self.fieldSelector + ' select').on('change', _determineCustomFieldState);
			}
		};
		/*
		* @public @override Director.Controller.FieldBase.prototype.getValue
		*
		* Gets the value for the field. Also stores the currently selected index.
		*/
		self.getValue = function() {
			self.model.selectedIndex = $(this.valueSelector).index();
			if (_isCustomItemSelected) {
				return $(self.fieldSelector + ' .custom-list-field-item-txt').val();
			}
			return $(self.valueSelector).attr('value');
		};
		/*
		* @public @override FieldControllerBase.prototype.hasAcceptedValue
		*/
		self.hasAcceptedValue = function() {
			var value = self.getValue();
			if (value === 'NON_SELECTED') return false;
			if (_customItemSelected() && !value) return false;
			return true;
		}
		/*
		* @public @override Director.Controller.FieldBase.prototype.checkIfDirty
		*
		* TODO: define
		*/
		self.checkIfDirty = function() {
			if (!self.model.value && parent.getValue.call(self) === "NON_SELECTED" && self.model.config.non_selected_list_item_title) {
                return false;
            }
            return parent.checkIfDirty.call(self);
		};

		self.init();
	};
});