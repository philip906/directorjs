"use strict";

define('director/fields/date/date_field_controller',
	['bootstrap_datetimepicker',
	'jquery',
	'require',

	'hbs!./date_field_template',
	'util'],
	function(
		BootstrapDatetimepicker,
		$,
		require,

		DateFieldTemplate,
		Util) {

	/*
	* @constructor @extend Controller.FieldBase
	*
	* Field controller for date configurations. This can allow use to configure date or date + time.
		field_type - date
	*
	* @param {SwitchFieldModel} model - The data model for the date
	*/
	return function DateFieldController (model) {
		var Controller = require('director/controllers/controller');
		var self = this;
		var parent = Controller.FieldBase.prototype;

		var _picker = null;

		/*
		* @public @override Controller.FieldBase.prototype.init
		*
		* Initializes field controller.
		*/
		self.init = function() {
			parent.init.call(self, '.date-picker', model, DateFieldTemplate);

			var useTime = self.model.config.include_time;
			_picker = $(self.valueSelector).datetimepicker({
		      	defaultDate: Util.convertDateIsoStringToLocale(self.model.value, !!useTime),
		    });
		};

		/*
		* @public @override Controller.FieldBase.prototype.getValue
		*
		* Gets the value for the field.
		*/
		self.getValue = function() {
			var date = _picker.data('date');
			var localeDate = date;
			if (localeDate) {
				localeDate = Util.convertDateLocaleToIso(date);
			}
	        return localeDate;
		};

		self.init();
	};
});