/**
 * model.js
 *
 * Provides the data-driver layer of Composer
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
	 * Models are the data class. They deal with loading and manipulating data from
	 * various sources (ajax, local storage, etc). They make wrapping your actual
	 * data easy, and tie in well with collections/controllers via events to allow
	 * for easy updating and rendering.
	 *
	 * They also tie in with the Composer.sync function to provide a central place
	 * for saving/updating information with a server.
	 */
	var Model = Composer.Base.extend({
		/**
		 * Track this object's type. Useful for debugging, mainly
		 */
		__composer_type: 'model',

		// for internal object testing
		// NOTE: deprecated in favor of __composer_type
		__is_model: true,

		options: {},

		// default values for the model, merged with the data passed in on CTOR
		defaults: {},

		// holds the model's data
		data: {},

		// whether or not the model has changed since the last save/update via sync
		_changed: false,

		// reference to the collections the model is in (yes, multiple). urls are
		// pulled from the collection via a "priority" parameter. the highest
		// priority collection will have its url passed to the model's sync function.
		collections: [],

		// what key to look under the data for the primary id for the object
		id_key: 'id',

		// can be used to overwrite all url generation for syncing (if you have a url
		// that doesn't fit into the "/[collection url]/[model id]" scheme.
		url: false,

		// can be used to manually set a base url for this model (in the case it
		// doesn't have a collection or the url needs to change manually).
		base_url: false,

		/**
		 * CTOR, allows passing in of data to set that data into the model.
		 */
		initialize: function(data, options)
		{
			data || (data = {});
			var _data = {};

			// merge in the defaults/data
			var merge_fn = function(v, k) { _data[k] = v; };
			Composer.object.each(Composer.object.clone(this.defaults), merge_fn);
			Composer.object.each(data, merge_fn);

			// assign the unique app id
			this._cid = Composer.cid();

			// set the data into the model (but don't trigger any events)
			this.set(_data, options);

			// call the init fn
			this.init(options);
		},

		/**
		 * override me, if needed
		 */
		init: function() {},

		/**
		 * wrapper to get data out of the model. it's bad form to access model.data
		 * directly, you must always go through model.get('mykey')
		 */
		get: function(key, def)
		{
			if(typeof(def) == 'undefined') def = null;
			if(typeof(this.data[key]) == 'undefined')
			{
				return def;
			}
			return this.data[key];
		},

		/**
		 * like Model.get(), but if the data is a string, escape it for HTML output.
		 */
		escape: function(key)
		{
			var data = this.get(key);
			if(data == null || typeof(data) != 'string')
			{
				return data;
			}

			// taken directly from backbone.js's escapeHTML() function... thanks!
			return data
				.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#x27;')
				.replace(/\//g,'&#x2F;');
		},

		/**
		 * whether or not a key exists in this.data
		 */
		has: function(key)
		{
			return this.data[key] != null;
		},

		/**
		 * set data into the model. triggers change events for individual attributes
		 * that change, and also a general change event if the model has changed. it
		 * only triggers these events if the model has indeed changed, setting an
		 * attribute to the same value it currently is will not trigger events:
		 *
		 *   model.set({name: "fisty", age: 21});
		 *
		 * this will trigger the events:
		 *   "change:name"
		 *   "change:age"
		 *   "change"
		 *
		 * if the model belongs to a collection, the events will bubble up to that
		 * collection as well, so as to notify the collection of any display changes
		 * needed.
		 */
		set: function(data, options)
		{
			options || (options = {});

			if(!options.silent && !this.perform_validation(data, options)) return false;

			var already_changing = this.changing;
			this.changing = true;
			Composer.object.each(data, function(val, key) {
				if(!Composer.eq(val, this.data[key]))
				{
					this.data[key] = val;
					this._changed = true;
					this.fire_event('change:'+key, options, this, val, options);
				}
			}.bind(this));

			if(!already_changing && this._changed)
			{
				this.fire_event('change', options, this, options, data);
				this._changed = false;
			}

			this.changing = false;
			return this;
		},

		/**
		 * unset a key from the model's data, triggering change events if needed.
		 */
		unset: function(key, options)
		{
			if(!(key in this.data)) return this;
			options || (options = {});

			var obj = {};
			obj[key] = void(0);
			if(!options.silent && !this.perform_validation(obj, options)) return false;

			delete this.data[key];
			this._changed = true;
			this.fire_event('change:'+key, options, this, void 0, options);
			this.fire_event('change', options, this, options);
			this._changed = false;
			return this;
		},

		/**
		 * clear all data out of a model, triggering change events if needed.
		 */
		clear: function(options)
		{
			options || (options = {});

			var old = this.data;
			var obj = {};
			for(var key in old) obj[key] = void(0);
			if(!options.silent && !this.perform_validation(obj, options)) return false;

			this.data = {};
			if(!options.silent)
			{
				for(var key in old)
				{
					this._changed = true;
					this.fire_event('change'+key, options, this, void 0, options);
				}

				if(this._changed)
				{
					this.fire_event('change', options, this, options);
					this._changed = false;
				}
			}
			return this;
		},

		/**
		 * fetch this model from the server, via its id.
		 */
		fetch: function(options)
		{
			options || (options = {});

			var success = options.success;
			options.success = function(res)
			{
				this.set(this.parse(res), options);
				if(success) success(this, res);
			}.bind(this);
			options.error = Composer.wrap_error(options.error ? options.error.bind(this) : null, this, options).bind(this);
			return (this.sync || Composer.sync).call(this, 'read', this, options);
		},

		/**
		 * save this model to the server (update if exists, add if doesn't exist (uses
		 * id to detemrine if exists or note).
		 */
		save: function(options)
		{
			options || (options = {});

			if(!this.perform_validation(this.data, options)) return false;

			var success = options.success;
			options.success = function(res)
			{
				if(!this.set(this.parse(res), options)) return false;
				if(success) success(this, res);
			}.bind(this);
			options.error = Composer.wrap_error(options.error ? options.error.bind(this) : null, this, options).bind(this);
			return (this.sync || Composer.sync).call(this, (this.is_new() ? 'create' : 'update'), this, options);
		},

		/**
		 * delete this item from the server
		 */
		destroy: function(options)
		{
			options || (options = {});

			var success = options.success;
			options.success = function(res)
			{
				this.fire_event('destroy', options, this, this.collections, options);
				if(success) success(this, res);
			}.bind(this);

			// if the model isn't saved yet, just mark it a success
			if(this.is_new() && !options.force) return options.success();

			options.error = Composer.wrap_error(options.error ? options.error.bind(this) : null, this, options).bind(this);
			return (this.sync || Composer.sync).call(this, 'delete', this, options);
		},

		/**
		 * overridable function that gets called when model data comes back from the
		 * server. use it to perform any needed transformations before setting data
		 * into the model.
		 */
		parse: function(data)
		{
			return data;
		},

		/**
		 * get this model's id. if it doesn't exist, return the cid instead.
		 */
		id: function(no_cid)
		{
			if(typeof(no_cid) != 'boolean') no_cid = false;

			var id = this.get(this.id_key);
			if(id) return id;
			if(no_cid) return false;
			return this.cid();
		},

		/**
		 * test whether or not the model is new (checks if it has an id)
		 */
		is_new: function()
		{
			return !this.id(true);
		},

		/**
		 * create a new model with this models data and return it
		 */
		clone: function()
		{
			return new this.constructor(this.toJSON());
		},

		/**
		 * return the raw data for this model (cloned, not referenced).
		 */
		toJSON: function()
		{
			return Composer.object.clone(this.data);
		},

		/**
		 * validate the model using its validation function (if it exists)
		 */
		perform_validation: function(data, options)
		{
			if(typeof(this.validate) != 'function') return true;

			var error = this.validate(data, options);
			if(error)
			{
				if(options.error)
				{
					options.error(this, error, options);
				}
				else
				{
					this.fire_event('error', options, this, error, options);
				}
				return false;
			}
			return true;
		},

		/**
		 * loops over the collections this model belongs to and gets the highest
		 * priority one. makes for easier url extraction during syncing.
		 */
		highest_priority_collection: function()
		{
			var collections = this.collections.slice(0);
			collections.sort( function(a, b) { return b.priority - a.priority; } );
			return collections.length ? collections[0] : false;
		},

		/**
		 * get the endpoint url for this model.
		 */
		get_url: function()
		{
			if(this.url)
				// we are overriding the url generation.
				return this.url;

			// pull from either overridden "base_url" param, or just use the highest
			// priority collection's url for the base.
			if (this.base_url)
				var base_url = this.base_url;
			else
			{
				var collection = this.highest_priority_collection();

				// We need to check that there actually IS a collection...
				if (collection)
					var base_url = collection.get_url();
				else
					var base_url = '';
			}

			// create a /[base url]/[model id] url.
			var id = this.id(true);
			if(id) id = '/'+id;
			else id = '';
			var url = base_url ? '/' + base_url.replace(/^\/+/, '').replace(/\/+$/, '') + id : id;
			return url;

		}
	});

	Composer.export({ Model: Model });
})();

