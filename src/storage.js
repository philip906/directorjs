"use strict";

define(['director/logger'], function(Logger) {
    /*
    * @singleton
    *
    * Helper class for managing local storage (i.e. localStorage, cookies, etc...).
    */
    function Storage() {
        var self = this;
        /*
        * @public
        *
        * Gets object from localStorage.
        *
        * @param {String} key - Key for lookup in localStorage
        * @return {Object} decodedValue - JSON parsed version of the stored data
        */
        self.getLocal = function(key) {
            var stringifiedValue = window.localStorage.getItem(key);
            var obj = null;
            if (stringifiedValue && stringifiedValue != "undefined") {
                try {
                    obj = JSON.parse(stringifiedValue);
                } catch(err) {
                    Logger.error('Director.Storage.getLocal', err.stack);
                    return null;
                }
            }
            return obj;
        };
        /*
        * @public
        *
        * Stores some object in localStorage.
        *
        * @param {String} key - Key for lookup in localStorage
        * @param {Object} object - The data we will be storing
        */
        self.setLocal = function(key, obj) {
            try {
                var json = JSON.stringify(obj);
                if (json && json != 'undefined') {
                    window.localStorage.setItem(key, json);
                } else {
                    Logger.warn('Director.Storage.setLocal: Value was not found to set.');
                }
            } catch (err) {
                Logger.error('Director.Storage.setLocal', err.stack);
                return false;
            }
            finally {
                return true;
            }
        };
        /*
        * @public
        *
        * Removes item from localStorage.
        *
        * @param {String} key - Key for item to remove from localStorage
        */
        self.removeLocal = function(key) {
            window.localStorage.removeItem(key);
        };

        /*
         * Returns the value of a cookie given its name
         * @param {String} cookieName - the name of the cookie to get
         * @param {String} cookiesString (optional) - cookies to pass to extract from
         * @return {String|undefined} the cookie or undefined if it does not exist
        */
        self.getCookie = function (cookieName, cookiesString) {
            var cookieValue;
            // if optional cookies were passed then extract against that
            var cookies = cookiesString ? cookiesString.split(';') : document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var trimmedCookie = cookies[i].match(/^\s*(.*)/)[1];
                if (trimmedCookie.indexOf(cookieName + "=") === 0) {
                    cookieValue = trimmedCookie.substring(cookieName.length + 1, trimmedCookie.length);
                    break;
                }
            }
            return cookieValue;
        };
        /*
         * Stores a cookie; does not support expiration times.
         * @param {String} cookieName - the name of the cookie to set
         * @param {String} value - the value for the cookie
         * @param {String|undefined} expires (optional) - time to cookie expiration (defaults to 1 week)
        */
        self.setCookie = function(cookieName, value, expires) {
            var cookieStr = cookieName + "=" + value + "; path=/";
            if (!!expires) {
                cookieStr += "; expires=" + expires;
            } else {
                var weekInMs = 1000 * 60 * 60 * 24 * 7;
                expires = new Date(new Date().getTime() + weekInMs);
                cookieStr += "; expires=" + expires;
            }
            document.cookie = cookieStr;
        };
        /*
        * Checks if localStorage is available.
        */
        self.localStorageAvailable = function() {
            /*
            * Check if we have localStorage available.
            */
            try {
                window.localStorage.setItem("test", "a");
                window.localStorage.removeItem("test");
                return true;
            } catch (e) {
                if (e.code == e.QUOTA_EXCEEDED_ERR) {
                    return false;
                }
            }
        };
    }

    return new Storage(); //Singleton a singleton class

});

