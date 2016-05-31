"use strict";

define([
    './storage',
    'util'],
    function(
        Storage,
        Util) {

    /*
    * Data model for user sessions.
    */
    function SessionModel(data) {
        var self = this;

        self.access_token = data.access_token;
        self.refresh_token = data.refresh_token;
        self.expires_in = data.expires_in;
        self.role = data.role;
        self.user = data.user;
    }

    /*
    * @singleton
    *
    * Helper class for managing session for the current user.
    */
    function Session() {
        var self = this;
        var _sessionModel = null;
        var _localStorageAvailable = Storage.localStorageAvailable();
        /*
        * This is the map that is used for extending other session variables.
        */
        self.properties = {
            /*
            * @private @property @read
            *
            * The current user.
            */
            user: null
        }
        /*
        * @public
        *
        * Used for extending the session resource.
        *
        * @param {Array of Objects} options
        */
        self.extend = function(options) {
            _.each(options, function(option, key) {
                self.properties[option.property] = null;
                _.extend(self, option.access_methods);
            });
        };
        /*
        * @public
        *
        * Attempts to get current session if one is available.
        *
        * @return {SessionModel} sessionModel - The current session model or null of no session.
        */
        self.getSession = function() {
            var session = null;
            if (_localStorageAvailable) {
                session = Storage.getLocal('session');
            } else {
                session = Storage.getCookie('session');
                if (session) {
                    session = JSON.parse(session);
                }
            }
            if (session) {
                self.setSession(session, false);
            }
            return _sessionModel;
        };
        /*
        * @public
        *
        * Gets the access token for the current session.
        */
        self.getAccessToken = function() {
            if (_sessionModel && _sessionModel.access_token) {
                return _sessionModel.access_token;
            }
            return null;
        };
        /*
        * @public
        *
        * Stores or removes the current session.
        *
        * @param {SessionModel} session - The current session to set, should pass null if
            you want to end the current session
        */
        self.setSession = function(session) {
            var cacheKey = 'session';
            if (session) {
                _sessionModel = new SessionModel(session);
                self.properties.user = _sessionModel.user;
                if (_localStorageAvailable) {
                    Storage.setLocal(cacheKey, _sessionModel);
                } else {
                    Storage.setCookie(cacheKey, JSON.stringify(_sessionModel));
                }
            } else {
                _sessionModel = null;
                self.properties.user = null;
                if (_localStorageAvailable) {
                    Storage.removeLocal(cacheKey);
                } else {
                    Storage.removeCookie(cacheKey);
                }
            }
        };
        /*
        * @property
        *
        * Getter method for user property.
        *
        * @return {Object} user - The data model for the current user
        */
        self.getUser = function() {
            return self.properties.user;
        };
        /*
        * @property
        *
        * Getter method for user id property.
        *
        * @return {Strting} userId - The id of the current user
        */
        self.getUserId = function() {
            return self.properties.user ? self.properties.user.id : null;
        };
    }

    return new Session(); //Singleton a singleton class

});