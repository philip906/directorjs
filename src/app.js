"use strict";

define('director/app', ['./logger'], function(Logger) {
    /*
    * @singleton
    *
    * Director's app component. This is used for bootstraping the application.
    */
    function App() {
        var self = this;
        /*
        * @public
        *
        * Used for extending the app.
        *
        * @param {Object} options
        */
        self.extend = function(options) {
            if (typeof options.init === 'function') {
                self.init = options.init;
            }
        };
        /*
        * @protected
        *
        * This function should be extended in Director.App.extend.
        */
        self.init = function() {
            Logger.error("Director.App.init: This has not been method needs to be overriden.");
            return undefined;
        };
    }

    return new App(); //Singleton

});