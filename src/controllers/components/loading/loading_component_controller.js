"use strict";

define([
	'jquery',
	'underscore',

	'director/assert',
	'hbs!./loading_template',
	'director/logger',
	'director/views/view'],
	function(
		$,
		_,

		Assert,
		LoadingTemplate,
		Logger,
		View) {

	/*
	* Component controller for the loading component.
    *
    * @param {Object} options - The options for the filter.
    	{
			selector: '#some-container-selector', //required with inline
			view_type: 'inline' //or modal
			selectors_to_hide: [ //required with inline (used when you need to hide elements to make room for loading message)
				'.some-selector-to-hide',
				'#another-selector-to-hide'
			]
    	}
    */
	function LoadingComponentController(options) {
        if (Assert.typeOf(options).isNotObject()) {
        	Logger.error('LoadingComponentController.constructor: Invalid argument "options", it should be an object.');
            return null;
        }
        if (Assert.typeOf(options.view_type).isNotString()) {
        	Logger.error('LoadingComponentController.constructor: Invalid argument "options.view_type", it should be a string.');
            return null;
        }
        if (options.view_type === 'inline') {
        	if (Assert.typeOf(options.selector).isNotString()) {
	        	Logger.error('LoadingComponentController.constructor: Invalid argument "options.selector", it should be a string.');
	            return null;
	        }
	        if (Assert.typeOf(options.selectors_to_hide).isNotArray()) {
	        	Logger.error('LoadingComponentController.constructor: Invalid argument "options.selectors_to_hide", it should be an array.');
	            return null;
	        }
        }

		var self = this;
		var _inlineSelector = options.selector + ' > div[loading-component]';
		var _loadingView = null;

		/*
		* @public
		*
		* Decides which view type to load and calls that method (inline or modal).
		*/
		self.loadView = function(msg) {
			switch(options.view_type) {
				case 'modal':
					_loadingView = View.extend({
		            	type: 'modal',
		            	template: LoadingTemplate,
		            	context: {
							msg: msg || "Loading"
						}
		            });
					break;
				case 'inline':
					_.each(options.selectors_to_hide, function(selector) {
						$(selector).hide();
					});
					_loadingView = View.extend({
						context: {
							msg: msg || "Loading..."
						},
						selector: _inlineSelector,
						template: LoadingTemplate
					});
					break;
			}
			_loadingView.load();
		};
		/*
		* @public
		*
		* Decides which view type to unload and calls that method (inline or modal).
		*
		* @param {Boolean} showPreviousView - Indicator used for inline loading modals to display the previous view.
			This can be used in the case of when submitting a form to the server and getting an error back that
			requires the user to update and resubmit the form.
		*/
		self.unloadView = function(showPreviousView) {
			if (showPreviousView && options.view_type === 'inline') {
				_.each(options.selectors_to_hide, function(selector) {
					$(selector).show();
				});
			}
			_loadingView.unload();
		};
    }

	return LoadingComponentController;
});