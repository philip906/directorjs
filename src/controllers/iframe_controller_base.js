"use strict";

define(['director/logger'], function(Logger) {
    /*
    * @constructor
    *
    * Base class for Iframe Controllers to extend.
    */
    function IframeControllerBase() {}

    IframeControllerBase.prototype = {
        /*
        * @public
        *
        * Performs intialization operations for all iframe controllers.
        */
        init: function() {
            Logger.info('IframeControllerBase.init: Initializing iframe controller base.');
        }
    };

    return IframeControllerBase;

});
