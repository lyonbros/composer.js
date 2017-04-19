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
	 * The ListController extends the Controller object to provide a way of
	 * tracking a collection and keeping its models in-sync with a set of
	 * controllers that are injected into the DOM.
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

		// holds our empty state
		_empty: true,

		// note that these options are mainly set by track()
		options: {
			// bind to the collection's `reset` event (on top of add/remove).
			// generally this isn't needed but there are certainly cases where
			// yuu would want a collection.trigger('reset') to re-render the
			// children completely.
			bind_reset: false,

			// passed into the collection's sort_index and sort_at functions
			// when adding items
			accurate_sort: false,

			// points to the DOM element that all our subcontrollers will be
			// placed into. this is set by options.container and although it's
			// not stricly needed for rendering, it's very useful when using
			// XDOM so the render system knows to ignore the children of the
			// container (so calling html() on a listcontroller doesn't remove
			// its children from the DOM).
			container: null
		},

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

			// empty state tracking
			if(collection.size() > 0) this._empty = false;
			this.with_bind(collection, ['clear', 'add', 'remove', 'reset'], function() {
				var empty = collection.size() == 0;
				if(this._empty && !empty) this.trigger('list:notempty');
				if(!this._empty && empty) this.trigger('list:empty');
				this._empty = empty;
			}.bind(this));
			// trigger the initial empty state event
			this.trigger('list:'+(this._empty ? 'empty' : 'notempty'));

			this.with_bind(collection, 'clear', function(options) {
				this._clear_subcontrollers();
			}.bind(this));
			this.with_bind(collection, 'add', function(model, _, options) {
				this._add_subcontroller(model, create_fn, options);
			}.bind(this));
			this.with_bind(collection, 'remove', function(model) {
				this._remove_subcontroller(model);
			}.bind(this));
			if(options.bind_reset)
			{
				this.with_bind(collection, 'reset', function(options) {
					this._reset_subcontrollers(create_fn, options);
				}.bind(this));
			}

			this._reset_subcontrollers(create_fn);
		},

		release: function()
		{
			// move the el to a fragment, which keeps a bunch of reflows from
			// happening on release
			var fragment = document.createDocumentFragment();
			fragment.appendChild(this.el);

			// do an async wipe of the subcontrollers
			this._clear_subcontrollers({async: true});
			return this.parent.apply(this, arguments);
		},

		/**
		 * extend Controller.html() such that if we're using xdom, pass this
		 * instances options.container into the XDOM ignore-children list so the
		 * subcontrollers' DOM elements are preserved on render. this allows us
		 * to call html() until the cows come home without having to re-init our
		 * list controller
		 */
		html: function(obj, options)
		{
			options || (options = {});
			var container = this.options.container;
			if(container instanceof Function) container = container();
			if(container)
			{
				var ignore_children = options.ignore_children || [];
				ignore_children.push(container);
				options.ignore_children = ignore_children;
			}
			return this.parent.apply(this, arguments);
		},

		/**
		 * Index a controller so it can be looked up by the model is wraps
		 */
		_index_controller: function(model, controller)
		{
			if(!model) return false;
			this._subcontroller_idx[model.cid()] = controller;
			this._subcontroller_list.push(controller);
		},

		/**
		 * Unindex a model -> controller lookup
		 */
		_unindex_controller: function(model, controller)
		{
			if(!model) return false;
			delete this._subcontroller_idx[model.cid()];
			this._subcontroller_list = this._subcontroller_list.filter(function(c) {
				return c != controller;
			});
		},

		/**
		 * Lookup a controller by its model
		 */
		_lookup_controller: function(model)
		{
			if(!model) return false;
			return this._subcontroller_idx[model.cid()];
		},

		/**
		 * Untrack all subcontrollers, releasing each one
		 */
		_clear_subcontrollers: function(options)
		{
			options || (options = {});

			// we allow an async option here, which clears out subcontrollers
			// in batches. this is more favorable than doing it sync because we
			// don't have to block the interface while removing all our subs.
			if(options.async)
			{
				// clone the subcon list in case someone else makes mods to it
				// while we're clearing.
				var subs = this._subcontroller_list.slice(0);
				var batch = 10;
				var idx = 0;
				var next = function()
				{
					for(var i = 0; i < batch; i++)
					{
						var con = subs[idx];
						if(!con) return;
						idx++;
						try
						{
							con.release();
						}
						catch(e) {}
					}
					setTimeout(next);
				}.bind(this);
				setTimeout(next);
			}
			else
			{
				this._subcontroller_list.forEach(function(con) {
					con.release();
				});
			}
			this._subcontroller_list = [];
			this._subcontroller_idx = {};
		},

		/**
		 * Sync the tracked subcontrollers with the items in the wrapped
		 * collection
		 */
		_reset_subcontrollers: function(create_fn, options)
		{
			options || (options = {});

			this._clear_subcontrollers();

			var reset_fragment = this.options.container;
			if(reset_fragment)
			{
				var fragment = document.createDocumentFragment();
				options = Composer.object.clone(options);
				options.fragment = fragment;
				options.container = fragment;
			}

			this._collection.each(function(model) {
				this._add_subcontroller(model, create_fn, options);
			}, this);

			if(reset_fragment && fragment.children && fragment.children.length > 0)
			{
				var container = reset_fragment instanceof Function ?
					reset_fragment() :
					reset_fragment;
				container.appendChild(fragment);
			}
		},

		/**
		 * Given a model, create a subcontroller that wraps it and inject the
		 * subcontroller at the correct spot in the DOM (based on the model's
		 * sort order).
		 */
		_add_subcontroller: function(model, create_fn, options)
		{
			// add our container into the options (non-destructively)
			options = Composer.object.clone(options);
			options.container = this.options.container;
			if(options.container instanceof Function) options.container = options.container();

			var con = create_fn(model, options);
			this._index_controller(model, con);

			// if the subcontroller releases itself, be sure to remove it from
			// tracking
			con.bind('release', function() {
				this._unindex_controller(model, con);
			}.bind(this));

			// inject the controller at the correct position, according to the
			// collection's sortfn
			var sort_idx = this._collection.sort_index(model, options);
			var before_model = this._collection.sort_at(sort_idx - 1, options) || false;
			var before_con = this._lookup_controller(before_model);

			// place the subcontroller into the right place in the DOM base on
			// its model's sort order
			var parent = con.el.parentNode;
			if(sort_idx == 0)
			{
				parent.insertBefore(con.el, parent.firstChild);
			}
			else if(before_con && before_con.el.parentNode == parent)
			{
				parent.insertBefore(con.el, before_con.el.nextSibling);
			}
			else
			{
				parent.appendChild(con.el);
			}
		},

		/**
		 * Given a model, lookup the subcontroller that wraps it and release it,
		 * also untracking that subcontroller.
		 */
		_remove_subcontroller: function(model)
		{
			var con = this._lookup_controller(model);
			if(!con) return false;
			con.release();
			this._unindex_controller(model, con);
		}
	});
	this.Composer.exp0rt({ ListController: ListController });
}).apply((typeof exports != 'undefined') ? exports : this);

