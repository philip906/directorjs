"use strict";

define([
    'underscore',

    'director/assert',
    'director/views/bound_view',
    'director/logger',
    'director/models/model'],
    function(
        _,

        Assert,
        BoundView,
        Logger,
        Model) {

    /*
    * @private
    *
    * Class for wrapping view so we can perform operations on a particular view.
    *
    * @param {Object} options - The options to apply to the view
    */
    return function BoundListView(options) {
        var self = this;
        var Controller = require('director/controllers/controller');
        self.options = options;
        self.views = [];
        self.boundContextList = [];
        /*
        * If we have a context list to bind then we want to store a copy of that original list.
        */
        if (self.options.context_list_to_bind) {
            self.originalContextList = _.clone(self.options.context_list_to_bind);
        }
        self.filters = [];
        if (options.empty_template) {
            self.emptyView = new BoundView({
                selector: self.options.selector,
                template: self.options.empty_template,
                placement: 'append',
                update_selector: self.options.selector + ' .empty-list'
            });
            self.emptyView.load();
            self.emptyView.hide();
            if (!self.emptyView.$el.hasClass('empty-list')) {
                Logger.error('BoundListView: You must have the class "empty-list" on the container of your empty_template or it is not valid.', self.options.empty_template);
            }
        }

        /*
        * @public
        *
        * Add a new view to the list.
        *
        * @param {Object} context - The context that will apply to this view
        * @param {Boolean} autoload - If we should autoload the view after we bind it
        */
        self.addView = function(context, autoload) {
            var newOptions = {
                template: self.options.template,
                selector: self.options.selector,
                placement: self.options.placement,
                parent: self.options.parent,
                type: self.options.type,
                fields_to_ignore: self.options.fields_to_ignore,
                params_to_ignore: self.options.params_to_ignore,
                key: context.key,
                update_selector: self.options.selector + ' > div[data-list-item-index="' + context.key + '"]',
                update_placement: 'replace_container',
                field_watchers: self.options.field_watchers
            };
            newOptions.context = {};
            if (self.options.context_list_to_bind) {
                newOptions.context_to_bind = context;
                self.boundContextList.push(newOptions.context_to_bind);
            } else {
                newOptions.context = context;
            }
            newOptions.context.key = context.key;
            var boundView = new BoundView(newOptions);
            self.views.push(boundView);
            if (autoload) {
                boundView.load();
            }
        };
        /*
        * @public
        *
        * Gets a view from the list that matches a key.
        *
        * @param {String} viewKey - The key fo the view to get
        * @return {BoundView} view
        */
        self.getView = function(viewKey) {
            return Model.getModelFromArray(self.views, viewKey);
        };
        /*
        * @public
        *
        * Removes a view from the list that matches a key.
        */
        self.removeView = function(viewKey) {
            var view = Model.getModelFromArray(self.views, viewKey);
            view.unload();
            Model.removeModelFromArray(self.views, viewKey);
            Model.removeModelFromArray(self.boundContextList, viewKey);
        };
        /*
        * @public
        *
        * Saves all view's bound fields.
        */
        self.saveViews = function() {
            _.each(self.views, function(view) {
                view.saveFields();
            });
        };
        /*
        * @public
        *
        * Updates all the views and loads any new views.
        *
        * @param {Boolean} reload - If we should reload the view after the update, generally this is used
            for list items after the edit view has been resolved if there are things on the list items that
            need their new values reflected such as a list item name being changed in the editing view
        */
        self.update = function(reload) {
            if (self.options.context_list_to_bind) {
                /*
                * Find all new views to add. We check all the context_list_to_bind and if there are any that exist in
                    there that don't exist in boundContextList then we know we should add that new view.
                */
                _.each(self.options.context_list_to_bind, function(contextToBind) {
                    var existingView = Model.getModelFromArray(self.boundContextList, contextToBind.key);
                    if (!existingView) {
                        self.addView(contextToBind, true);
                    }
                });
                /*
                * Find all views to remove. We check boundContextList and if there are any in there that exist that do
                    not exist in context_list_to_bind then we know we should remove that view.
                */
                _.each(self.boundContextList, function(boundContext) {
                    var validView = Model.getModelFromArray(self.options.context_list_to_bind, boundContext.key);
                    if (!validView) {
                        self.removeView(boundContext.key);
                    }
                });
            }
            if (self.options.context_list) {
                /*
                * Find all new views to add. We check all the context_list_to_bind and if there are any that exist in
                    there that don't exist in boundContextList then we know we should add that new view.
                */
                _.each(self.options.context_list, function(context) {
                    var existingView = Model.getModelFromArray(self.views, context.key);
                    if (!existingView) {
                        self.addView(context, true);
                    }
                });
                /*
                * Find all views to remove. We check boundContextList and if there are any in there that exist that do
                    not exist in context_list_to_bind then we know we should remove that view.
                */
                _.each(self.views, function(view) {
                    var validView = Model.getModelFromArray(self.options.context_list, view.key);
                    if (!validView) {
                        self.removeView(view.key);
                    }
                });
            }
            if (reload) {
                self.load();
            }
        };
        /*
        * @public
        *
        * Loads all the views in the list.
        */
        self.load = function() {
            if (typeof self.options.pre_load === 'function') {
                self.options.pre_load.call(self);
            }
            if (self.views.length) {
                if (self.emptyView) {
                    self.emptyView.hide();
                }
                _.each(self.views, function(view) {
                    view.load();
                });
            } else if (self.emptyView) {
                self.emptyView.show();
            }
            if (typeof self.options.post_load === 'function') {
                self.options.post_load.call(self);
            }
            /*
            * Load all filters.
            */
            if (self.options.filters && self.options.filters.length) {
                var items = self.options.context_list.length ? self.options.context_list : self.boundContextList;
                self.filters = [];
                _.each(self.options.filters, function(filterOptions) {
                    filterOptions.items = items;
                    filterOptions.callback = self.filter;
                    var filter = Controller.createComponent(filterOptions);
                    self.filters.push(filter);
                });
                self.filter(items);
            }
        };
        /*
        * @public
        *
        * Allows filtering to be applied to hide the context that is being filtered out.
        *
        * @param {Array of Object} contextList - The contexts that should be visible
        * @param {String} key - The key of the filter
        */
        self.filter = function(contextList, key) {
            if (contextList.length) {
                if (self.emptyView) {
                    self.emptyView.hide();
                }
            }
            /*
            * Execute all other filters.
            */
            var newList = contextList;
            _.each(self.filters, function(filter) {
                /*
                * Make sure this is one of the other filters and not the one that was just used.
                */
                if (filter.key !== key) {
                    newList = filter.filterItems(newList);
                }
            });
            _.each(self.views, function(view) {
                var hideView = true;
                _.each(newList, function(context) {
                    if (view.key === context.key) {
                        hideView = false;
                    }
                });
                if (hideView) {
                    view.hide();
                    view.$el.removeClass('is-visible');
                } else {
                    view.show();
                    view.$el.addClass('is-visible');
                }
            });
            if (!newList.length) {
                if (self.emptyView) {
                    self.emptyView.show();
                }
            }
            if (typeof self.options.post_filter === 'function') {
                self.options.post_filter.call(self, newList);
            }
        };
    };
});