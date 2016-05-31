"use strict";

define('director/controllers/components/filter/search_filter_component_controller',
	['jquery',
	'underscore',

	'hbs!./search_filter_template',
	'director/views/view'],
	function(
		$,
		_,

		SearchFilterTemplate,
		View) {

	/*
	* @constructor
	*
	* Component controller for the search component.
    *
    * @param {Object} options - The options for the search component.
    */
	return function SearchFilterComponentController(options) {
		var self = this;

		var componentSelector = 'div[search-component="' + options.key + '"]';
		var _valueSelector = componentSelector + ' input';

		self.originalItems = _.clone(options.items);
		self.key = options.key;

		var searchFilterView = View.extend({
			context: {
				placeholder: options.placeholder
			},
			selector: componentSelector,
			template: SearchFilterTemplate,
			post_load: function() {
	            //setup before functions
	            var typingTimer;                //timer identifier
	            var doneTypingInterval = 500;  //time in ms, 1 second for example

	            //on keyup, start the countdown
	            $(_valueSelector).keyup(function(){
	            	window.clearTimeout(typingTimer);
	                if ($(this).val()) {
	                    typingTimer = window.setTimeout(function() {
	                    	var newItems = self.filterItems(options.items);
	                    	return options.callback(newItems, self.key);
	                    }, doneTypingInterval);
	                } else {
	                	return options.callback(self.originalItems, self.key);
	                }
	            });
			}
		});
		searchFilterView.load();

        /*
        * @public
        *
        * Filters the current items based on the selected filter.
        *
        * @param {Array of Object} - The items to filter
        * @return {Array of Objects} - The new filtered array of items
        */
        self.filterItems = function(items) {
            var filterValue = $(_valueSelector).val().toLowerCase();
			var newItems = [];
			_.each(items, function(item) {
				if (options.filter_key_is_field && item.fields[options.filter_key].value !== undefined && item.fields[options.filter_key].value.toLowerCase().indexOf(filterValue) !== -1) {
					newItems.push(item);
                } else if (!options.filter_key_is_field && item[options.filter_key] !== undefined && item[options.filter_key].toLowerCase().indexOf(filterValue)) {
					newItems.push(item);
                }
			});
			return newItems;
        };
    };
});