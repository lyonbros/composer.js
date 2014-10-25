/**
 * listcontroller.js
 *
 * Provides a useful abstraction for controllers have have arbitrary lists of
 * sub-controllers. Especially useful with rendering based off of a collection.
 * -----------------------------------------------------------------------------
 *
 * Composer.js is an MVC framework for creating and organizing javascript 
 * applications. For documentation, please visit:
 *
 *     http://lyonbros.github.com/composer.js/
 * 
 * -----------------------------------------------------------------------------
 *
 * Copyright (c) 2011, Lyon Bros Enterprises, LLC. (http://www.lyonbros.com)
 * 
 * Licensed under The MIT License. 
 * Redistributions of files must retain the above copyright notice.
 */
(function() {
	"use strict";

	/**
	 * The controller class sits between views and your models/collections.
	 * Controllers bind events to your data objects and update views when the data
	 * changes. Controllers are also responsible for rendering views.
	 */
	var ListController = Composer.Controller.extend({
		/**
		 * Track this object's type. Useful for debugging, mainly
		 */
		__composer_type: 'listcontroller',

		// tracks sub-controllers
		_subcontroller_list: [],
		_subcontroller_idx: {},

		// the collection we're tracking
		_collection: null,

		/**
		 * Set up tracking on the given collection. When models are added or
		 * removed to the collection, the change is reflected in the
		 * subcontrollers. `create_fn` is a function that is given a model and
		 * must return an instantiated controller (this is used to create the
		 * actual subcontrollers that are tracked).
		 */
		track: function(collection, create_fn, options)
		{
			options || (options = {});
			this.set_options(options);
			this._collection = collection;

			this.with_bind(collection, 'reset', function() {
				this.reset_subcontrollers(create_fn);
			}.bind(this));
			this.with_bind(collection, 'add', function(model) {
				this.add_subcontroller(model, create_fn);
			}.bind(this));
			this.with_bind(collection, 'remove', function(model) {
				this.remove_subcontroller(model);
			}.bind(this));
			this.reset_subcontrollers(create_fn);
		},

		release: function()
		{
			this.clear_subcontrollers();
			return this.parent.apply(this, arguments);
		},

		index_controller: function(model, controller)
		{
			if(!model) return false;
			this._subcontroller_idx[model.cid()] = controller;
			this._subcontroller_list.push(controller);
		},

		unindex_controller: function(model, controller)
		{
			if(!model) return false;
			delete this._subcontroller_idx[model.cid()];
			this._subcontroller_list = this._subcontroller_list.filter(function(c) {
				return c != controller;
			});
		},

		lookup_controller: function(model)
		{
			if(!model) return false;
			return this._subcontroller_idx[model.cid()];
		},

		clear_subcontrollers: function()
		{
			this._subcontroller_list.forEach(function(con) {
				con.release();
			});
			this._subcontroller_list = [];
			this._subcontroller_idx = {};
		},

		reset_subcontrollers: function(create_fn)
		{
			this.clear_subcontrollers();
			this._collection.each(function(model) {
				this.add_subcontroller(model, create_fn);
			}, this);
		},

		add_subcontroller: function(model, create_fn)
		{
			var con = create_fn(model);
			this.index_controller(model, con);

			// inject the controller at the correct position, according to the
			// collection's sortfn
			var sort_idx = this._collection.sort_index(model);
			var before_model = this._collection.sort_at(sort_idx - 1) || false;
			var before_con = this.lookup_controller(before_model);

			var parent = con.el.parentNode;
			if(sort_idx == 0)
			{
				parent.insertBefore(con.el, parent.firstChild);
			}
			else if(before_con)
			{
				parent.insertBefore(con.el, before_con.el.nextSibling);
			}
			else
			{
				parent.appendChild(con.el);
			}
		},

		remove_subcontroller: function(model)
		{
			var con = this.lookup_controller(model);
			if(!con) return false;
			con.release();
			this.unindex_controller(model, con);
		}
	});
	Composer.exp0rt({ ListController: ListController });
})();

