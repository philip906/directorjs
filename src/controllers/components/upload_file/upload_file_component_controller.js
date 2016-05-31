"use strict";

define('director/controllers/components/upload_file/upload_file_component_controller',
	['dropzone',
	'jquery',
	'underscore',

	'director/assert',
	'director/logger',
	'hbs!./upload_file_template',
	'director/views/view'],
	function(
		Dropzone,
		$,
		_,

		Assert,
		Logger,
		UploadFileTemplate,
		View) {

	Dropzone.autoDiscover = false;

	/*
	* Component controller for uploading files. This component uses dropzone.js (see: http://www.dropzonejs.com/)
    *
    * @param {Object} options - The options for the filter.
    	{
			selector: '#some-container-selector' //required with inline
    	}
    */
	function UploadFileComponentController(options) {
		if (Assert.typeOf(options).isNotObject()) {
        	Logger.error('UploadFileComponentController.constructor: Invalid argument "options", it should be an object.');
            return null;
        }
        if (Assert.typeOf(options.selector).isNotString()) {
        	Logger.error('UploadFileComponentController.constructor: Invalid argument "options.selector", it should be a string.');
            return null;
        }

        var self = this;
		var _componentSelector = options.selector + ' div[upload-file-component]';
		var _dz = null;

		/*
		* @private
		*
		* Compiles error message and places on DOM.
		*/
		var _loadView = function() {
			var uploadFileView = View.extend({
				selector: _componentSelector,
				template: UploadFileTemplate
			});
			uploadFileView.load();
		};
		/*
		* @private
		*
		* Registers DOM events.
		*/
		var _registerEvents = function() {
			_dz = new Dropzone(_componentSelector + ' .dropzone', {
				url: 'NO_URL_NEEDED',
				autoProcessQueue: false,
				uploadMultiple: false,
				clickable: true,
				dictDefaultMessage: 'Drag file here<span class="dz-message-linebreak">or</span> <span class="dz-message-button">Select a File</span>',
				addRemoveLinks: true,
				dictRemoveFile: 'Remove file',
				maxFiles: 1,
				accept: function(file, done) {
			    	if (file.type !== "text/csv") {
			      		done("Not a valid CSV file.");
			    	} else {
			    		done();
			    	}
			  	}
			});
			_dz.on("addedfile", function(file) {
				var oldFile = self.getFile();
				if (oldFile) {
					_dz.removeFile(oldFile);
				}
	  			Logger.info("UploadFileComponentController._registerEvents: File added to queue.", file);
	  		});
	  		_dz.on("error", function(file, message) {
	  			_dz.removeFile(file);
	  			$(_componentSelector + ' .dropzone-error').html('Please upload a valid file (must be a CSV).');
	  		});
		};
		/*
		* @private
		*
		* Initializes the component controller.
		*/
		var _init = function() {
            _loadView();
        	_registerEvents();
		};
		/*
		* @public
		*
		* Gets the current queued up file.
		*
		* @return {File} file - The file that was queued up.
		*/
		self.getFile = function() {
			var files = _dz.getAcceptedFiles();
			if (files.length) {
				return files[0];
			} else {
				return null;
			}
		};

        _init();
    }

	return UploadFileComponentController;
});