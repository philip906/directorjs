"use strict";

define([
    'jquery',
    'underscore',

    'hbs!./dropdown_filter_template',
    'director/views/view'],
	function(
        $,
        _,

        DropdownFilterTemplate,
        View) {

	/*
    * @constructor
    *
	* Component controller a dropdown filter
    *
    * @param {Object} options - The options for the filter.
    	{
            selector: '#instances-table',   //container of the filter component element
            no_filter_name: "Any Status"    //The name to display for the first option in the list
            list: [                   //The list of options to display
                {
                    id: "Active",     //The value for the property that we filtering by
                    name: "Active"    //The name to display for selecting to filter by this
                }, {
                    id: "Inactive",
                    name: "Inactive"
                }
            ],
            items: [{...}...],              //The items we are filtering
            filter_key: 'status',           //The key on the item that we will be filtering by
            default_selected_index: 1,
            selected_value: "any_status"    //(optional) The value to select in the filter initially
            callback: self.loadInstanceList //The function to execute once filter is complete, generally for reloading list
        }
    */
	return function DropdownFilterComponentController(options) {
		var self = this;
        self.filterOptions = [];

        self.filterOptions.push({
            id: "NO_FILTER_OPTION",
            name: options.no_filter_name
        });
        /*
        * Convert all item ids to strings.
        */
        _.each(options.list, function(listItem) {
            var filterOption = _.clone(listItem);
            filterOption.id = filterOption.id.toString();
            self.filterOptions.push(filterOption);
        });

        var _componentSelector = 'div[filter-component="' + options.key + '"]';
        self.filter_key = options.filter_key || 'status'
        self.default_selected_index = options.default_selected_index || 0;
        self.key = options.key;
        self.filter_key_is_field = options.filter_key_is_field;
        self.items = _.clone(options.items);

        var filterView = View.extend({
            context: {
                list: self.filterOptions,
                default_selected_index: self.default_selected_index,
                selected_value: options.selected_value
            },
            selector: _componentSelector,
            template: DropdownFilterTemplate,
            post_load: function() {
                $(_componentSelector + " .dropdown-filter-component").change(function () {
                    var newItems = self.filterItems(self.items);
                    options.callback(newItems, self.key);
                });
            }
        });
        /*
        * @public
        *
        * Filters the current items based on the selected filter.
        *
        * @param {Array of Object} - The items to filter
        * @return {Array of Objects} - The new filtered array of items
        */
        self.filterItems = function(items) {
            var value = $(_componentSelector + " .dropdown-filter-component").val();
            /*
            * The first value is considered the "no filter" option.
            */
            if (value === self.filterOptions[0].id) {
                return items;
            }
            var newItems = [];
            _.each(items, function(item, index) {
                if (self.filter_key_is_field && item.fields[self.filter_key].value !== undefined && item.fields[self.filter_key].value.toString() === value) {
                    newItems.push(item);
                } else if (!self.filter_key_is_field && item[self.filter_key] !== undefined && item[self.filter_key].toString() === value) {
                    newItems.push(item);
                }
            });
            return newItems;
        };

        filterView.load();
	};
});