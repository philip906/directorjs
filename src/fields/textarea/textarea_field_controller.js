"use strict";

define('director/fields/textarea/textarea_field_controller',
	['jquery',

	'hbs!./textarea_field_template'],
	function(
		$,

		TextareaFieldTemplate) {

	/*
	* @extend Director.Controller.FieldBase
	*
	* Field controller for textarea configurations.

		field_type - textarea
	*
	* @param {TextareaFieldModel} model - The data model for the textarea
	*/
	return function TextareaFieldController (model) {
		var self = this;

		self.registerEvents = function() {
            /* Captures key down events */
            $(self.valueSelector).on('keydown', function(e) {
	            var keyCode = e.keyCode || e.which;
	            var $el = $(this);

	            /* Tab button click */
			  	if (keyCode == 9) {
			    	e.preventDefault();
			    	var start = $el.get(0).selectionStart;
			    	var end = $el.get(0).selectionEnd;

			    	var tabIndent = "    ";

			    	// set textarea value to: text before caret + tab + text after caret
			    	$el.val($el.val().substring(0, start) + "    " + $el.val().substring(end));

			    	// put caret at right position again
			    	$el.get(0).selectionEnd = start + tabIndent.length;
			  	}
			});
		};

		self.init('textarea', model, TextareaFieldTemplate);
		self.registerEvents();
	};
});