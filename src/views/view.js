"use strict";

define('director/views/view',
    ['jquery',
    'handlebars',
    'underscore',

    'director/assert',
    'hbs!./form_error_template',
    'hbs!./modal/modal_container_template',
    'hbs!./modal/modal_template',
    'director/views/bound_view',
    'director/views/bound_list_view',
    'director/logger',
    'util'],
    function(
        $,
        HandleBars,
        _,

        Assert,
        FormErrorTemplate,
        ModalContainerTemplate,
        ModalTemplate,
        BoundView,
        BoundListView,
        Logger,
        Util) {

    /*
    * @singleton @public @constructor
    *
    * Helper class for managing the views and binding models to the views.
    */
    function View() {
        var self = this;

        /*
        * @constant
        *
        * Selectors for the views we will compile
        */
        var VIEW_SELECTOR = {
            MODAL_CONTAINER: 'div[modal-container-view]',
            MODEL_CONTENT: 'div[modal-content-view]',
            FORM_ERROR: 'div[form-error-view]'
        };

        self.ModalTemplate = ModalTemplate; //TODO: figure out how I can remove this, seems to be a circular reference somewhere
        /*
        * @public
        *
        * Compiles html templates and adds them to DOM
        *
        * @param {Object} options - The options to apply:
            {
                ------------------------- general options ----------------------------------
                context: {                           //(Optional) The context to apply to the template. context_to_bind will be added
                                                         to the context before compilation, it will appear as context.bound_context
                    another_value: '...'
                },
                selector: '.some-selector',          //The selector that we will place the view in or near
                template: SomeTemplate,              //The HandleBars template to compile
                placement: "prepend",                //(Optional) How we should place the element on the DOM (prepend, append, replace_content, replace_container).
                                                         Default for list is append, Default for non-list is replace_content
                field_watchers: {                    //(Optional) The field watchers to apply to this view. If we are compiling a list then
                                                         these watchers will be applied to each view. The callback function will contain the
                                                         arguments (oldValue, newValue), and the context will be the current view containing
                                                         the bound field.
                    some_field_key: callback
                },
                fields_to_ignore: ['some-field-key'], //(Optional) An array of field keys that we should not bind to the view, this is just to prevent
                                                          false warnings that may occur during the compilation
                params_to_ignore: ['some-param-key'], //(Optional) An array of param keys that we should not bind to the view, this is just to prevent
                                                          false warnings that may occur during the compilation
                post_load: fn,                        //(Optional) Some function to run after a load.
                pre_load: fn,                         //(Optional) Some function to run before a load. You can use this to override options before loading like
                                                          if a parameter changes and you need the next load to update. You only need it if you have context that
                                                          is not doesn't have a reference.

                ------------------------- load view list specific options -----------------------------
                context_list,                         //(Optional) A list of view contexts to load, when the list is compiled into each view they
                                                          will have a key placed on the context (i.e. view.context.key) which will be used in lookup
                                                          situations. You should either use this or context_list_to_bind.
                context_list_to_bind: {...},          //(Optional) The params we will bind to the view. You should either use this or context_list.
                fitlers: [{...}]                      //(Optional) An array of filters to apply to the list data
                post_filter: fn(filteredList),        //(Optional) An optional callback function to run after a filter takes place. The newly filter list
                                                          will be passed as a parameter to this callback.
                empty_template: '<div>...</div>',     //(Optional) the template to inject if there are not items in the list to load

                ------------------------- load view non-list specific options -------------------------
                type: "modal",                        //(Optional) The type of view we are loading. Values: modal, inline
                update_selector: '.some-selector',    //(Optional) The selector to use if any updates are performed. Default value is to use the same selector
                post_unload: fn,                      //(Optional) function to run after a view has been unloaded from the page,
                context_to_bind: {...},               //(Optional) Object to bind to the view
                fields_watcher: fn                    //(Optional) Callback function to execute if there are any changes to the fields

            }
        * @return {BoundView|Array of BoundView} - in the context of a list we return an array of views in the context
            of a single view we return that bound view
        */
        self.extend = function(options) {
            var invalidOptions = Util.validateKeys(
                                    ["context", "selector", "template", "placement", "type", 'context_list',
                                        'context_list_to_bind', 'context_to_bind', 'empty_template', 'params_to_ignore',
                                        'field_watchers', 'fields_to_ignore', 'post_load', 'update_selector',
                                        'post_unload', 'fields_watcher', 'pre_load', 'filters', 'post_filter'],
                                    options);
            if (invalidOptions.length) {
                Logger.error('Director.View.extend: Invalid options used.', invalidOptions);
                return null;
            }
            if (Assert.typeOf(options).isNotObject()) {
                Logger.error('Director.View.extend: Invalid argument "options", it should be an object.', options);
                return null;
            }
            if (options.type !== "modal" && Assert.typeOf(options.selector).isNotString()) {
                Logger.error('Director.View.extend: Invalid argument "options.selector", it should be a string.', options);
                return null;
            }
            if (options.placement &&
                !Util.validateValue(["prepend", "append", "replace_content", "replace_container"], options.placement)) {

                Logger.error('Director.View.extend: Invalid options.placement used.', invalidOptions);
                return null;
            }

            var view = null;
            /*
            * Check if we are loading a list of views.
            */
            if (options.context_list || options.context_list_to_bind) {
                options.type = 'inline'; //Currently only inline can be used for lists
                if (options.context_list && options.context_list_to_bind) {
                    Logger.error('Director.View.extend: You either user context_list or context_list_to_bind, but not both.', options);
                    return null;
                }
                options.placement = options.placement || 'append';
                view = new BoundListView(options);
                /*
                * Use context_list if available.
                */
                _.each(options.context_list, function(context, index) {
                    context.list_item_index = index;
                    view.addView(context, false);
                });
                /*
                * Use context_list_to_bind if available.
                */
                _.each(options.context_list_to_bind, function(contextToBind) {
                    view.addView(contextToBind, false);
                });
            } else {
                /*
                * Else we are loading a non-list view.
                */
                options.placement = options.placement || 'replace_content';
                options.context = options.context || {};
                options.update_selector = options.update_selector || '';

                options.type = options.type || 'inline';
                if (options.type !== 'modal' && options.type !== 'inline')  {
                    Logger.error('Director.View.extend: Invalid options.type.', options.type);
                    return null;
                }
                if (options.type === 'modal') {
                    /*
                    * If modal container is not on the page then we need to insert it.
                    */
                    if (!$(VIEW_SELECTOR.MODAL_CONTAINER).length) {
                        var modalView = new BoundView({
                            selector: 'body',
                            template: ModalContainerTemplate,
                            placement: 'append'
                        });
                        modalView.load();
                        var modalContainerView = new BoundView({
                            selector: VIEW_SELECTOR.MODAL_CONTAINER,
                            template: self.ModalTemplate,
                            placement: 'replace_content'
                        });
                        modalContainerView.load();
                    }
                    options.selector = VIEW_SELECTOR.MODEL_CONTENT;
                    options.update_selector = options.selector;
                } else {
                    if (!options.update_selector && options.placement === 'replace_content') {
                        options.update_selector = options.selector;
                    }
                }
                view = new BoundView(options);
            }
            return view;
        };
        /*
        * @public
        *
        * Checks array of param fields and return errors if one of the fields is empty.
        *
        * @param {Array of FieldController} paramFields - An array of param field controllers to check
        * @return {Array} errors - An array of found errors
        */
        self.checkParamFields = function(paramFields) {
            var errors = [];
            _.each(paramFields, function(field, key) {
                if (field.model.config.required && !field.model.config.error_msg) {
                    Logger.warn('View.checkParamFields: No error_msg was defined in param configurations.', field.model.config);
                } else if (field.model.config.required && !field.hasAcceptedValue() ||
                    (field.model.config.field_type === 'list' && field.getValue() === 'NON_SELECTED')) {

                    errors.push(field.model.config.error_msg);
                }
            });
            return errors;
        };
        /*
        * @public
        *
        * Checks field elements and return errors if one of the field's values is empty.
        *
        * @param {Array} fields - An array of field elements to check
            [$someFieldElement1, $someFieldElement2]
        * @return {Array of String} errors - An array of found errors
            ['Error message 1', 'Error message 2']
        */
        self.checkFields = function(fields) {
            var errors = [];
            _.each(fields, function($field, index) {
                var errorMsg = $field.data('error-msg');
                if (!errorMsg) {
                    Logger.warn('View.checkFields: No data-error-msg was found on the field.', $field);
                } else if (!$field.val()) {
                    errors.push(errorMsg);
                }
            });
            return errors;
        };
        /*
        * @public
        *
        * Compiles error message and places on DOM.
        *
        * @param {Array} errors - An array of errors to display
            ["Error message 1.", "Error message 2."]
        * @param {String} containerSelector - The container selector for where the <div form-error-view></div> is located.
        */
        self.displayErrors = function(errors, containerSelector) {
            var selector = containerSelector ? containerSelector  + ' ' + VIEW_SELECTOR.FORM_ERROR :
                VIEW_SELECTOR.FORM_ERROR;
            var errorsView = self.extend({
                context: {
                    errors: errors
                },
                selector: selector,
                template: FormErrorTemplate
            });
            errorsView.load();
        };
    }

    return new View(); //Return singleton
});