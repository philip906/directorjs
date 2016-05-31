"use strict";

define('director',
	['./app',
	'./assert',
	'./controllers/controller',
	'./logger',
	'./message',
	'./models/model',
	'./resource',
	'./router',
	'./views/view',
	'./session',
	'./storage'],
	function(
		App,
		Assert,
		Controller,
		Logger,
		Message,
		Model,
		Resource,
		Router,
		View,
		Session,
		Storage) {

	/*
	* @singleton
	*
	* Director framework.
	*/
	function Director() {
		this.App = App;
		this.Assert = Assert;
		this.Controller = Controller;
		this.Logger = Logger;
		this.Message = Message;
		this.Model = Model;
		this.Resource = Resource;
		this.Router = Router;
		this.View = View;
		this.Session = Session;
		this.Storage = Storage;
	}

	return new Director();

});