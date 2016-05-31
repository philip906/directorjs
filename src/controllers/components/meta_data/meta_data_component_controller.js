"use strict";

define('director/controllers/components/meta_data/meta_data_component_controller',
	['hbs!./meta_data_template',
	'site_config',
	'director/views/view'],
	function(
		MetaDataTemplate,
		SiteConfig,
		View) {

	/*
	* @singleton
	*
	* Component controller for meta data to be placed in header.
	*/
	function MetaDataComponentController() {
		var self = this;

		/*
        * @public
        *
        * Initializes component controller.
        *
        * @param {PageController} pageController - The page controller this component was loaded from
        */
        self.init = function(pageController) {
            self.pageController = pageController;
        };

		/*
		* @public
		*
		* Initializes controller and loads view.
		*/
		self.loadView = function() {
			var metaDataView = View.extend({
				context:{
					metaData: [{
						name: "app_version",
						value: SiteConfig.app_version
					}]
				},
				selector: "head",
				template: MetaDataTemplate,
				placement: 'append'
			});
			metaDataView.load();
		};
	}

	return new MetaDataComponentController(); //Return a singleton class

});