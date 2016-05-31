"use strict";

define('director/controllers/controller',
    ['director/assert',
    'director/fields/date/date_field_controller',
    './components/filter/dropdown_filter_component_controller',
    'director/fields/field_controller_base',
    './iframe_controller_base',
    'director/fields/list/list_field_controller',
    './components/loading/loading_component_controller',
    'director/logger',
    'director/fields/extract/multiextract_field_controller',
    'director/fields/hash/multihash_field_controller',
    'director/fields/list/multilist_field_controller',
    'director/fields/part/multipart_field_controller',
    'director/fields/text/multitext_field_controller',
    './page_controller_base',
    './components/filter/search_filter_component_controller',
    'director/fields/switch/switch_field_controller',
    'director/fields/textarea/textarea_field_controller',
    'director/fields/text/text_field_controller',
    './components/upload_file/upload_file_component_controller',
    'util'],
    function(
        Assert,
        DateFieldController,
        DropdownFilterComponentController,
        FieldControllerBase,
        IframeControllerBase,
        ListFieldController,
        LoadingComponentController,
        Logger,
        MultiextractFieldController,
        MultihashFieldController,
        MultilistFieldController,
        MultipartFieldController,
        MultitextFieldController,
        PageControllerBase,
        SearchFilterComponentController,
        SwitchFieldController,
        TextareaFieldController,
        TextFieldController,
        UploadFileComponentController,
        Util) {

    /*
    * @singleton
    *
    * Factory for component and field controllers.
    */
    function Controller() {
        var self = this;
        /*
        * @public
        *
        * Used for extending the controller. Currently this is just used for adding components
            to the PageControllerBase.
        *
        * @param {Object} options
        */
        self.extend = function(options) {
            if (options.PageBase && typeof options.PageBase.init === 'function') {
                self.PageBase.prototype.init = function() {
                    Logger.info('PageControllerBase.init: Initializing page controller base.');
                    this._init();
                    options.PageBase.init();
                    Logger.info('PageControllerBase.init: Initialization complete.');
                }
            }
        };
        /*
        * @public
        *
        * Creates a new field controller.
        *
        * @param {FieldModel} model - The field model to compile with the field.
        * @return {FieldController} fieldController - The new field controller.
        */
        self.createField = function(model) {
            if (Assert.typeOf(model).isUndefined()) {
                Logger.error('Director.Controller.createField: Invalid argument "model", it should not be undefined.');
                return null;
            }
            var FIELD_MAP = {
                list: ListFieldController,
                text: TextFieldController,
                switch: SwitchFieldController,
                multihash: MultihashFieldController,
                multiextract: MultiextractFieldController,
                multitext: MultitextFieldController,
                multilist: MultilistFieldController,
                multipart: MultipartFieldController,
                textarea: TextareaFieldController,
                date: DateFieldController
            };

            var FieldController = FIELD_MAP[model.config.field_type];
            FieldController.prototype = new this.FieldBase;
            return new FieldController(model);
        };

        /*
        * @public
        *
        * Creates a new component controller.
        *
        * @param {Object} options - The component options for this controller.
            TODO: define the available options
        * @return {ComponentController} componentController - The new component controller.
        */
        self.createComponent = function(options) {
            //TODO: add assertions for options
            if (Assert.typeOf(options).isNotObject()) {
                Logger.error('Director.Controller.createComponent: Invalid argument "options", it should be a object.');
                return null;
            }

            var COMPONENT_MAP = {
                search_filter: SearchFilterComponentController,
                dropdown_filter: DropdownFilterComponentController,
                loading: LoadingComponentController,
                upload_file: UploadFileComponentController
            };
            var ComponentController = COMPONENT_MAP[options.type];
            return new ComponentController(options);
        };
        /*
        * @public
        *
        * This should be extended by the iframe controllers.
        */
        self.IframeBase = IframeControllerBase;
        /*
        * @public
        *s
        * This should be extended by the field controllers.
        */
        self.FieldBase = FieldControllerBase;
        /*
        * @public
        *
        * This should be extended by the page controllers.
        */
        self.PageBase = PageControllerBase;
    }

    return new Controller(); //Singleton

});