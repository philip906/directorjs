"use strict";

define('director/fields/switch/switch_field_controller',
	['bootstrap_switch',
	'jquery',

	'hbs!./switch_field_template'],
	function(
		BootstrapSwitch,
		$,

		SwitchFieldTemplate) {

	/*
	* @extend FieldControllerBase
	*
	* Field controller for switch configurations.

		field_type - switch
	*
	* @param {SwitchFieldModel} model - The data model for the switch
	*/
	return function SwitchFieldController (model) {
		var self = this;

		var _init = function() {
			self.init('input[name="switch-checkbox"]', model, SwitchFieldTemplate);
			$(self.valueSelector).bootstrapSwitch('toggleState');
			$(self.valueSelector).attr('data-state', true);
			if (!self.model.value) {
				$(self.valueSelector).bootstrapSwitch('toggleState');
				$(self.valueSelector).attr('data-state', false);
			}
			self.registerEvents();
		};
		/*
		* @public
		*
		* Registers the DOM events for field.
		*/
		self.registerEvents = function() {
			$(this.valueSelector).on('switchChange.bootstrapSwitch', function(e, state) {
			  	$(this).attr('data-state', state);
			});
		};
		/*
		* @public @override FieldControllerBase.prototype.init
		*
		* Gets the value for the field.
		*/
		self.getValue = function() {
			var strValue = $(this.valueSelector).attr('data-state');
			var state = (strValue == "true" ? true : false);
	        return state;
		};

		_init();
	};
});