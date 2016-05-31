"use strict";

define([
    'underscore',

    './logger',
    './resource',
    './storage',
    'util'],
    function(
        _,

        Logger,
        Resource,
        Storage,
        Util) {

    /*
    * @singleton
    *
    * Helper class for user navigation.
    */
    function Router() {
        var self = this;
        var _currentPath = window.location.pathname || '/';

        /*
        * @private
        *
        * @param {String} url - The url of the page to route the user to
        * @param {Boolean} openNewTab - If we should open the url in a new tab
        */
        var _routeUser = function(url, openNewTab) {
            if (openNewTab) {
                var newTab = window.open(url, '_blank');
                newTab.focus();
            } else if (url.indexOf('#') > -1 &&
                url.split('#')[0] == window.location.pathname + window.location.search) {

                window.location.href = url;
                window.location.reload();
            } else {
                window.location.href = url;
            }
        };
        /*
        * @public
        *
        * This is used for augmenting the router functionality to add
            defined routes for the user to navigate.
        *
        *
        */
        self.extend = function(obj) {
            _.extend(self, obj);
        };
        /*
        * @public
        *
        * Adds any additional formating needed on redirect URLs.
        */
        self.addAdditionalUrlData = function() {
            Logger.error("Director.Router.formatUrl: This has not been method needs to be overriden.");
            return undefined;
        };
        /*
        * @public
        *
        * Checks the url hash for cookies that need set.
        */
        self.setHashCookies = function() {
            var hash = window.location.hash;
            if (hash.indexOf('#cookie_') > -1) {
                var cookiePartsRaw = hash.split('#cookie_')[1];
                if (cookiePartsRaw) {
                    var cookieParts = cookiePartsRaw.split('=');
                    var cookieName = cookieParts[0];
                    var cookieValue = cookieParts[1];
                    Storage.setCookie(cookieName, cookieValue);
                    Logger.info('Director.Router.setHashCookies: setting cookie found in hash.', cookieParts);
                }
            }
        };
        /*
        * @public
        *
        * Routes user to new view.
        *
        * @param {String} path - The path we are redirecting the user to
        * @param {Boolean} forceNavigation (optional) - If we should force the user to navigate to the page
        * @param {Boolean} newTab (optional) - If we should open this page in a new tab
        * @param {Object} query (optional) - The query parameters to append to the url
        * @param {Object} hash (optional) - The hash parameters to append to the url
        */
        self.routeUser = function(path, forceNavigation, newTab, query, hash) {
            if (path !== _currentPath || forceNavigation) {
                Logger.info('Director.Router.routeUser: navigating user.', path);
                var baseUrl = path;
                var resource = Resource.getPageResource(path);
                if (resource === 'unauthorized') return this.routeUserToUnauthorized();
                query = query || {};
                baseUrl = Util.addQueryToUrl(baseUrl, query);
                baseUrl = Util.addHashToUrl(baseUrl, hash);

                var url = self.addAdditionalUrlData(baseUrl);

                _routeUser(url, newTab);
            } else {
                Logger.info('Director.Router.routeUser: user is already is viewing the resource they are trying to access.', path);
            }
        };
        /*
        * @public
        *
        * Refreshes the current page.
        */
        self.refreshPage = function() {
            var path = window.location.pathname;
            self.routeUser(path, true);
        };
        /*
        * @public
        *
        * Closes the current page.
        */
        self.closePage = function() {
            return window.close();
        };

        /*
        * @public
        *
        * Routes user to the home view.
        */
        self.routeUserToHome = function() {
            self.routeUser(Resource.map.pages.home.path, true);
        };
        /*
        * @public
        *
        * Routes user to the authentication page.
        */
        self.routeUserToUnauthorized = function() {
            self.routeUser(Resource.map.pages.unauthorized.path, true);
        };
        /*
        * @public
        *
        * Routes user to the authentication page.
        */
        self.routeUserToAuthenticate = function() {
            self.routeUser(Resource.map.pages.authenticate.path, true);
        };
        /*
        * @public
        *
        * Checks if the user is on an authentication page.
        *
        * @param {String} path (optional) - An optional path to check against instead of the current path.
        * @return {Boolean} isAuthenticatePage - An indicator for if we are on an authentication page
        */
        self.isAuthenticatePage = function(path) {
            if (path && path.indexOf(Resource.map.pages.authenticate.path) > -1) {
                return true;
            }
            if (_currentPath.indexOf(Resource.map.pages.authenticate.path) > -1) {
                return true;
            }
            return false;
        };
    }

    return new Router(); //Return a Singleton

});