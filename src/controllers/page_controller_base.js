"use strict";

define([
    'jquery',

    'director/logger',
    'director/controllers/components/meta_data/meta_data_component_controller',
    'director/session',
    'director/storage'],
    function(
        $,

        Logger,
        MetaDataComponentController,
        Session,
        Storage) {

    /*
    * @constructor
    *
    * Base class for Page Controllers to extend.
    */
    function PageControllerBase() {}

    PageControllerBase.prototype = {
        /*
        * @protected
        *
        * Performs intialization operations for all page controllers. This will be called before
            the overridden init function.
        */
        _init: function() {
            /*
            * Initialize DirectorJS component controllers.
            */
            MetaDataComponentController.init(this);
            MetaDataComponentController.loadView();
        },
        /*
        * @protected
        *
        * This function should be extended in Director.Controller.extend.
        */
        init: function() {
            Logger.error("PageControllerBase.init: This has not been method needs to be overriden.");
            return undefined;
        }
    };

    return PageControllerBase;

});
