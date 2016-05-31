"use strict";

define('director/fields/text/text_field_controller',
	['hbs!./text_field_template'],
	function(TextFieldTemplate) {

	/*
	* @constructor @extend Director.Controller.FieldBase
	*
	* Field controller for text configurations.

		field_type - text
	*
	* @param {TextFieldModel} model - The data model for the list
	*/
	return function TextFieldController (model) {
		var self = this;

		self.init('input', model, TextFieldTemplate);
	};
});