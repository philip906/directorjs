"use strict";

define([
    'jquery'],
    function(
        $) {

    /*
    * @singleton
    *
    * Helper class for logging: errors, info, and warnings.
    */
    function Logger() {
        var self = this;
        /*
        * @private
        *
        * TODO: define
        */
        var _log = function(type, msg, obj) {
            var message = '[' + type.toUpperCase() + ']: ' + msg;
            if (typeof window.console !== 'undefined' && window.console.log) {
                _consoleLog(type, message, obj);
            }
        };
        /*
        * @private
        *
        * TODO: define
        */
        var _consoleLog = function(type, message, obj) {
            switch(type) {
                case 'timer':
                    if (obj) {
                        window.console.info(message, obj);
                    } else {
                        window.console.info(message);
                    }
                    break;
                case 'info':
                case 'warn':
                case 'error':
                    if (obj) {
                        window.console[type](message, obj);
                    } else {
                        window.console[type](message);
                    }
                    break;
            }
        };
        /*
        * @public
        *
        * TODO: define
        */
        self.info = function(msg, obj) {
            _log('info', msg, obj);
        };
        /*
        * @public
        *
        * TODO: define
        */
        self.warn = function(msg, obj) {
            _log('warn', msg, obj);
        };
        /*
        * @public
        *
        * TODO: define
        */
        self.error = function(msg, obj) {
            _log('error', msg, obj);
        };
        /*
        * @public
        *
        * TODO: define
        */
        self.timer = function(msg, obj) {
            _log('timer', msg, obj);
        };
    }

    return new Logger(); //Return a singleton class

});