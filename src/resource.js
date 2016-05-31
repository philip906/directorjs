"use strict";

define([
	'underscore',

	'./logger',
	'./session'],
	function(
		_,

		Logger,
		Session) {

	/*
	* @singleton
	*
	* Helper class for managing resources such as view/controller combinations.
	*/
	function Resource() {
		var self = this;

		/*
		* @public
		*
		* Map for all pages/services/roles
		*/
		self.map = {
			pages: {},
			services: {},
			roles: {}
		};
        /*
        * @public
        *
        * The base path for the page resources. Can be overridden depending on your file structure.
        */
        self.basePagePath = '/public/pages/';
        /*
        * @public
        *
        * Checks if the user has access to view a resource. This should be overridden as each site
            will have different privileges and roles.
        *
        * @param {String} resource - The resource the user is trying to access.
        * return {Boolean} hasAccess - Indicator if user has access to path or not.
        */
		self.hasAccess = function(resource) {
			Logger.error("Director.Resource.hasAccess: This has not been method needs to be overriden.");
			return undefined;
		};
		/*
		* @public
		*
		* Gets requested resource based on some path.
		*
		* @param {String} path - The path to get resource for
		* @return {Object} resource - The resource that was found
		*/
		self.getPageResource = function(path) {
			var pathToMatch = path || window.location.pathname;
			if (pathToMatch === "/") {
				return self.map.pages.home;
			}
			var resource = null;
			_.each(self.map.pages, function(page, key) {
				if (page.path === pathToMatch) {
					resource = page;
				}
			});
			var userHasAccess = self.hasAccess(resource);
			if (resource && userHasAccess) {
				return resource;
			} else if (userHasAccess === false) {
				Logger.error('Director.Resource.getPageResource: User does not access to resource for path "' + pathToMatch + '".');
				Session.setSession(null);
				return 'unauthorized';
			} else {
				return null;
			}

			Logger.error('Director.Resource.getPageResource: Resource not found for path "' + pathToMatch + '".');
			return resource;
		};
		/*
		* @public
		*
		* Gets requested resource based on some path.
		*
		* @param {String} path - The path to get resource for
		* @return {Object} resource - The resource that was found
		*/
		self.getServiceResource = function(key) {
			var resource = self.map.services.param[key];
			if (!resource) {
				Logger.error('Director.Resource.getServiceResource: Service not found for "' + key + '" key.');
			}
			return resource;
		};
		/*
		* @public
		*
		* Used for extending the resource map.
		*
		* @param {Object} options - The options to extend the Router functionality with
		*/
		self.extend = function(options) {
			_.each(options.pages, function(option, key) {
				if (typeof self.map.pages[key] !== "undefined") {
					Logger.warn('Director.Resource.extend: Page ' + key + ' already detected, overwriting with new value.', option);
				}
				self.map.pages[key] = option;
			});
			_.each(options.services, function(option, key) {
				if (typeof self.map.services[key] !== "undefined") {
					Logger.warn('Director.Resource.extend: Service ' + key + ' already detected, overwriting with new value.', option);
				}
				self.map.services[key] = option;
			});
			if (typeof options.hasAccess === 'function') {
				self.hasAccess = options.hasAccess;
			}
			_.extend(self.map.roles, options.roles);
		};
	}

	return new Resource(); //Return a singleton class

});