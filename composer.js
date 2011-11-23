/**
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
	var Composer	=	{};

	/**
	 * You must override this function in your app.
	 */
	Composer.sync	=	function(method, model, options) { return options.success(); };

	// a closure that returns incrementing integers. these will be unique across 
	// the entire app since only one counter is instantiated
	Composer.cid	=	(function() {
		var counter	=	1;
		return function(inc) { return 'c'+counter++; };
	})();
	
	/**
	 * The events class provides bindings to objects (Models and Collections,
	 * mainly) and allows triggering of those events. For instance, a controller
	 * can bind its "removeItemFromView" function to its model's "destroy" event.
	 * Now when that model is destroyed, the destroyer doesn't have to remember to
	 * also trigger the "removeItemFromView" function, but it will happen 
	 * automatically as a result of the binding.
	 *
	 * Note that this class is meant to be extended and doesn't provide much use on
	 * its own.
	 *
	 * Certain events are used by the framework itself:
	 *   Models:
	 *     "change" - called when a model's values are changed vie its set()
	 *       function. 
	 *     "change:[key]" - called when [key] is changed under model's data. For
	 *       instance, if you did :
	 *         model.bind("change:name", myfn);
	 *         model.set({name: 'leonard'});    // <-- this will trigger the event
	 *     "destroy" - called when model.destroy() is called.
	 *     "error" - triggered when an error happens saving/reading/validating the
	 *       model
	 *   Collections:
	 *     "add" - Called when a model is added to a collection via
	 *       collection.add()
	 *     "clear" - Called when all models are cleared out of a via 
	 *       collection.clear()
	 *     "reset" - Called when collection is reset with new model data via
	 *       collection.reset()
	 *     "remove" - Called when collection.remove() is used to remove a model
	 *       from the collection
	 *   Controllers:
	 *     "release" - Called when controller.release() is called to remove the 
	 *       controller from the view.
	 *
	 * Note that the "all" event will bubble up from model to collection...when a
	 * model is added to a collection via collection.add(), the collection binds
	 * an 'all' event to that model so that any events that happen on that model
	 * will be triggered in the collection as well. This makes it easy for a 
	 * controller to monitor changes on collections of items instead of each item
	 * individually.
	 */
	Events	=	new Class({
		_events: {},

		/**
		 * Bind a callback to a specific event for this object. Adds the callback to
		 * an array instead of replacing other callbacks, so many callbacks can exist
		 * under the same event for this object.
		 *
		 * Example: mymodel.bind("change", this.render.bind(this));
		 *
		 * Whenever mymodel is changed in any way, the "render" function for the 
		 * current object (probably a controller in this instance) will be called.
		 */
		bind: function(name, callback)
		{
			this._events[name] || (this._events[name] = []);
			if(!this._events[name].contains(callback))
			{
				this._events[name].push(callback);
			}

			return this;
		},

		/**
		 * Trigger an event for this object, which in turn runs all callbacks for that
		 * event WITH all parameters passed in to this function.
		 *
		 * For instance, you could do:
		 * mymodel.bind("destroy", this.removeFromView.bind(this));
		 * mymodel.trigger("destroy", "omg", "lol", "wtf");
		 *
		 * this.removeFromView will be called with the arguments "omg", "lol", "wtf".
		 *
		 * Note that any trigger event will also trigger the "all" event. the idea
		 * being that you can subscribe to anything happening on an object.
		 */
		trigger: function(ev)
		{
			var args	=	shallow_array_clone(Array.from(arguments));
			[ev, 'all'].each(function(type) {
				if(!this._events[type]) return;
				this._events[type].each(function(callback) {
					callback.apply(this, (type == 'all') ? args : args.slice(1));
				}, this);
			}, this);

			return this;
		},

		/**
		 * Unbinds an event from the current object.
		 */
		unbind: function(ev, callback)
		{
			if(typeof(ev) == 'undefined')
			{
				// no event passed, unbind everything
				this._events	=	{};
				return this;
			}

			var callback	=	typeof(callback) == 'function' ? callback : null;

			if(typeof(this._events[ev]) == 'undefined' || this._events[ev].length == 0)
			{
				// event isn't bound
				return this;
			}

			if(!callback)
			{
				// no callback given, unbind all events of type ev
				this._events[ev]	=	[];
				return this;
			}

			// remove all callback matches for the event type ev
			this._events[ev].erase(callback);
			
			return this;
		}
	});

	/**
	 * The base class is inherited by models, collections, and controllers. It
	 * provides some nice common functionality.
	 */
	var Base	=	new Class({
		/**
		 * allows one object to extend another. since controllers, models, and
		 * collections all do this differently, it is up to each to have their own 
		 * extend function and call this one for validation.
		 */
		extend: function(obj, base)
		{
			obj || (obj = {});
			base || (base = null);
			if(obj.initialize)
			{
				var str	=	'You are creating a Composer object with an "initialize" method/' +
							'parameter, which is reserved. Unless you know what you\'re doing ' +
							'(and call this.parent.apply(this, arguments)), please rename ' +
							'your parameter to something other than "initialize"! Perhaps you' +
							'were thinking of init()?';
				console.log('----------WARNING----------');
				console.log(str);
				console.log('---------------------------');
			}

			if(obj.extend)
			{
				var str	=	'You are creating a Composer object with an "initialize" method/' +
							'parameter, which is reserved. Unless you know what you\'re doing ' +
							'(and call this.parent.apply(this, arguments)), please rename ' +
							'your parameter to something other than "extend"!';
				console.log('----------WARNING----------');
				console.log(str);
				console.log('---------------------------');
			}

			return obj;
		},

		_do_extend: function(obj, base)
		{
			var obj	=	Object.merge({Extends: (base || this.$constructor)}, obj);
			var cls	=	new Class(obj);
			return cls;
		},

		/**
		 * fire_event dtermines whether or not an event should fire. given an event
		 * name, the passed-in options, and any arbitrary number of arguments, 
		 * determine whether or not the given event should be triggered.
		 */
		fire_event: function()
		{
			var args	=	shallow_array_clone(Array.from(arguments));
			var evname	=	args.shift();
			var options	=	args.shift();

			options || (options = {});

			// add event name back into the beginning of args
			args.unshift(evname);
			if(!options.silent)
			{
				// not silent, fire the event
				return this.trigger.apply(this, args);
			}
			else if(
				(typeof(options.not_silent) == 'array' && options.not_silent.contains(evname)) ||
				(options.not_silent == evname)
			)
			{
				// silent, BUT the given event is allowed. fire it.
				return this.trigger.apply(this, args);
			}
			return this;
		}
	});

	/**
	 * Models are the data class. They deal with loading and manipulating data from
	 * various sources (ajax, local storage, etc). They make wrapping your actual
	 * data easy, and tie in well with collections/controllers via events to allow
	 * for easy updating and rendering.
	 *
	 * They also tie in with the Composer.sync function to provide a central place
	 * for saving/updating information with a server.
	 */
	var Model	=	new Class({
		Extends: Base,
		Implements: [Events],

		// for internal object testing
		__is_model: true,

		// the model's unique app id, assigned by composer on instantiation
		_cid: false,

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

			// merge the defaults into the data
			data	=	Object.merge(Object.clone(this.defaults), data);

			// assign the unique app id
			this._cid	=	Composer.cid();

			// set the data into the model (but don't trigger any events)
			this.set(data, {silent: true});

			// call the init fn
			this.init(options);
		},

		extend: function(obj, base)
		{
			obj || (obj = {});
			base || (base = Model);
			obj	=	this.parent.call(this, obj, base);
			return this._do_extend(obj, base);
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
			if(typeof(def) == 'undefined') def	=	null;
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
			var data	=	this.get(key);
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

			var already_changing	=	this.changing;
			this.changing			=	true;
			Object.each(data, function(val, key) {
				if(!Composer.eq(val, this.data[key]))
				{
					this.data[key]	=	val;
					this._changed	=	true;
					this.fire_event('change:'+key, options, this, val, options);
				}
			}.bind(this));

			if(!already_changing && this._changed)
			{
				this.fire_event('change', options, this, options);
				this._changed	=	false;
			}

			this.changing	=	false;
			return this;
		},

		/**
		 * unset a key from the model's data, triggering change events if needed.
		 */
		unset: function(key, options)
		{
			if(!(key in this.data)) return this;
			options || (options = {});

			var obj		=	{};
			obj[key]	=	void(0);
			if(!options.silent && !this.perform_validation(obj, options)) return false;			

			delete this.data[key];
			this._changed	=	true;
			this.fire_event('change:'+key, options, this, void 0, options);
			this.fire_event('change', options, this, options);
			this._changed	=	false;
		},

		/**
		 * clear all data out of a model, triggering change events if needed.
		 */
		clear: function(options)
		{
			options || (options = {});

			var old		=	this.data;
			var obj		=	{};
			for(key in old) obj[key] = void(0);
			if(!options.silent && !this.perform_validation(obj, options)) return false;			

			this.data	=	{};
			if(!options.silent)
			{
				for(key in old)
				{
					this._changed	=	true;
					this.fire_event('change'+key, options, this, void 0, options);
				}

				if(this._changed)
				{
					this.fire_event('change', options, this, options);
					this._changed	=	false;
				}
			}
		},

		/**
		 * fetch this model from the server, via its id. 
		 */
		fetch: function(options)
		{
			options || (options = {});

			var success	=	options.success;
			options.success	=	function(res)
			{
				this.set(this.parse(res), options);
				if(success) success(model, res);
			}.bind(this);
			options.error	=	wrap_error(options.error ? options.error.bind(this) : null, this, options);
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

			var success	=	options.success;
			options.success	=	function(res)
			{
				if(!this.set(this.parse(res), options)) return false;
				if(success) success(model, res);
			}.bind(this);
			options.error	=	wrap_error(options.error ? options.error.bind(this) : null, this, options);
			return (this.sync || Composer.sync).call(this, (this.is_new() ? 'create' : 'update'), this, options);
		},

		/**
		 * delete this item from the server
		 */
		destroy: function(options)
		{
			options || (options = {});

			if(this.is_new())
			{
				return this.fire_event('destroy', options, this, this.collections, options);
			}

			var success	=	options.success;
			options.success	=	function(res)
			{
				this.fire_event('destroy', options, this, this.collections, options);
				if(success) success(model, res);
			}.bind(this);
			options.error	=	wrap_error(options.error ? options.error.bind(this) : null, this, options);
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

			var id	=	this.get(this.id_key);
			if(id) return id;
			if(no_cid) return false;
			return this._cid;
		},

		/**
		 * get the model's unique app id (cid)
		 */
		cid: function()
		{
			return this._cid;
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
			return new this.$constructor(this.toJSON());
		},

		/**
		 * return the raw data for this model (cloned, not referenced).
		 */
		toJSON: function()
		{
			return Object.clone(this.data);
		},

		/**
		 * validate the model using its validation function (if it exists)
		 */
		perform_validation: function(data, options)
		{
			if(typeof(this.validate) != 'function') return true;

			var error	=	this.validate(data, options);
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
			var collections	=	shallow_array_clone(this.collections);
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
					var base_url	=	collection.get_url();
				else
					var base_url	=	'';
			}

			// create a /[base url]/[model id] url.
			var id	=	this.id(true);
			if(id) id = '/'+id;
			else id = '';
			var url	=	base_url ? '/' + base_url.replace(/^\/+/, '').replace(/\/+$/, '') + id : id;
			return url;

		}
	});

	/**
	 * Collections hold lists of models and contain various helper functions for
	 * finding and selecting subsets of model data. They are basically a wrapper
	 * around an array, thats function is dealing with large amounts of model data.
	 *
	 * Collections can also sync with the server like models. They tie into model
	 * events in such a way that if a model's data changes, the collection will be
	 * notified, and anybody listinging to the collection (ie, a controller) can
	 * react to that event (re-display the view, for instance).
	 */
	var Collection	=	new Class({
		Extends: Base,
		Implements: [Events],

		// the TYPE of model in this collection
		model: Model,

		// "private" array holding all the models in this collection
		_models: [],

		// function used for sorting. override to sort on a criteria besides order of
		// addition to collection
		sortfn: null,

		// the base url for this collection. if you update a model, the default url 
		// sent to the sync function would be PUT /[collection url]/[model id].
		url: '/mycollection',

		// when a model belongs to many collections, it will generate its url from the
		// collection having the highest priority. if all have the same priority, then
		// the first collection from the list will have its url used for the model's
		// sync operation.
		priority: 1,

		/**
		 * allow the passing in of an array of data to instantiate a collection with a
		 * pre-set number of models. models will be created via this.model.
		 */
		initialize: function(models, params, options)
		{
			params || (params = {});
			for(x in params)
			{
				this[x]	=	params[x];
			}

			if(models)
			{
				this.reset(models, options);
			}
			this.init();
		},

		extend: function(obj, base)
		{
			obj || (obj = {});
			base || (base = Collection);
			obj	=	this.parent.call(this, obj, base);
			return this._do_extend(obj, base);
		},

		/**
		 * override me
		 */
		init: function() {},

		/**
		 * for each model in this collection, get its raw data, then return all of the
		 * raw data in an array
		 */
		toJSON: function()
		{
			return this.models().map( function(model) { return model.toJSON(); } );
		},

		/**
		 * wrapper to get the models under this collection for direct selection (often
		 * via MooTools' array helper/selection functions)
		 */
		models: function()
		{
			return this._models;
		},

		/**
		 * add a model to this collection, and hook up the correct wire in doing so
		 * (events and setting the model's collection).
		 */
		add: function(data, options)
		{
			if (data instanceof Array)
			{
				return Object.each(data, function(model) { this.add(model) }, this);
			}
			
			var model	=	data.__is_model ? data : new this.model(data);
			
			options || (options = {});

			// reference this collection to the model
			if(!model.collections.contains(this))
			{
				model.collections.push(this);
			}

			if(this.sortfn)
			{
				// if we have a sorting function, get the index the model should exist at
				// and add it to that position
				var index	=	options.at ? parseInt(options.at) : this.sort_index(model);
				this._models.splice(index, 0, model);
			}
			else
			{
				// no sort fn, add model to the end of the list
				this._models.push(model);
			}

			// listen to the model's events so we can propogate them
			model.bind('all', this._model_event.bind(this));

			this.fire_event('add', options, model, this, options);
		},

		/**
		 * remove a model(s) from the collection, unhooking all necessary wires (events, etc)
		 */
		remove: function(model, options)
		{
			if (model instanceof Array)
			{
				return Object.each(model, function(m) { this.remove(m) }, this);
			}
			
			options || (options = {});

			// remove this collection's reference(s) from the model
			model.collections.erase(this);

			// save to trigger change event if needed
			var num_rec	=	this._models.length;

			// remove hte model
			this._models.erase(model);

			// if the number actually change, trigger our change event
			if(this._models.length != num_rec)
			{
				this.fire_event('remove', options, model);
			}

			// remove the model from the collection
			this._remove_reference(model);
		},

		/**
		 * remove all the models from the collection
		 */
		clear: function(options)
		{
			options || (options = {});

			// save to trigger change event if needed
			var num_rec	=	this._models.length;

			this._models.each(function(model) {
				this._remove_reference(model);
			}, this);
			this._models	=	[];

			// if the number actually change, trigger our change event
			if(this._models.length != num_rec)
			{
				this.fire_event('clear', options);
			}
		},

		/**
		 * reset the collection with all new data. it can also be appended to the 
		 * current set of models if specified in the options (via "append").
		 */
		reset: function(data, options)
		{
			options || (options = {});

			if(!options.append)
			{
				this.clear(options);
			}
			this.add(data, options);

			this.fire_event('reset', options);
		},

		/**
		 * not normally necessary to call this, unless collection.sortfn changes after
		 * instantiation of the data. sort order is normall maintained upon adding of
		 * data viw Collection.add().
		 */
		sort: function(options)
		{
			if(!this.sortfn) return false;

			this._models.sort(this.sortfn);
			this.fire_event('reset', options, this, options);
		},

		/**
		 * given the current for function and a model passecd in, determine the index
		 * the model should exist at in the colleciton's model list.
		 */
		sort_index: function(model)
		{
			if(!this.sortfn) return false;

			for(var i = 0; i < this._models.length; i++)
			{
				if(this.sortfn(this._models[i], model) > 0)
				{
					return i;
				}
			}
			return this._models.length;
		},

		/**
		 * overridable function called when the collection is synced with the server
		 */
		parse: function(data)
		{
			return data;
		},

		/**
		 * convenience function to loop over collection's models
		 */
		each: function(cb, bind)
		{
			if(bind)
			{
				this.models().each(cb, bind);
			}
			else
			{
				this.models().each(cb);
			}
		},

		/**
		 * Find the first model that satisfies the callback. An optional sort function
		 * can be passed in to order the results of the find, which uses the usual 
		 * fn(a,b){return (-1|0|1);} syntax.
		 */
		find: function(callback, sortfn)
		{
			if(sortfn)
			{
				var models	=	shallow_array_clone(this.models()).sort(sortfn);
			}
			else
			{
				var models	=	this.models();
			}

			for(var i = 0; i < models.length; i++)
			{
				var rec	=	models[i];
				if(callback(rec))
				{
					return rec;
				}
			}
			return false;
		},

		/**
		 * given a callback, returns whether or not at least one of the models 
		 * satisfies that callback.
		 */
		exists: function(callback)
		{
			return this.models().some(callback);
		},

		/**
		 * convenience function to find a model by id
		 */
		find_by_id: function(id)
		{
			return this.find(function(model) {
				if(model.id() == id)
				{
					return true;
				}
			});
		},

		/**
		 * convenience function to find a model by cid
		 */
		find_by_cid: function(cid)
		{
			return this.find(function(model) {
				if(model.cid() == cid)
				{
					return true;
				}
			});
		},

		/**
		 * get the index of an item in the list of models. useful for sorting items.
		 */
		index_of: function(model_or_id)
		{
			var id	=	model_or_id.__is_model ? model_or_id.id() : model_or_id;
			for(var i = 0; i < this._models.length; i++)
			{
				if(this._models[i].id() == id)
				{
					return i;
				}
			}
			return false;
		},

		/**
		 * query the models in the collection with a callback and return ALL that
		 * match. takes either a function OR a key-value object for matching:
		 *
		 * mycol.select(function(data) {
		 *		if(data.get('name') == 'andrew' && data.get('age') == 24)
		 *		{
		 *			return true
		 *		}
		 * });
		 *
		 * is the same as:
		 *
		 * mycol.select({
		 *		name: andrew,
		 *		age: 24
		 * });
		 *
		 * in other words, it's a very simple version of MongoDB's selection syntax,
		 * but with a lot less functionality. the only selection is direct value
		 * matching. still nice, though.
		 */
		select: function(selector)
		{
			if(typeof(selector) == 'object')
			{
				var qry	=	[];
				for(var key in selector)
				{
					var val	=	selector[key];
					qry.push('data.get("'+key+'") == ' + val);
				}
				var fnstr	=	'if(' + qry.join('&&') + ') { return true; }';
				selector	=	new Function('data', fnstr);
			}
			return this._models.filter(selector);
		},

		/**
		 * return the first model in the collection. if n is specified, return the
		 * first n models.
		 */
		first: function(n)
		{
			var models	=	this.models();
			return (typeof(n) != 'undefined' && parseInt(n) != 0) ? models.slice(0, n) : models[0];
		},

		/**
		 * returns the last model in the collection. if n is specified, returns the
		 * last n models.
		 */
		last: function(n)
		{
			var models	=	this.models();
			return (typeof(n) != 'undefined' && parseInt(n) != 0) ? models.slice(models.length - n) : models[0];
		},

		/**
		 * sync the collection with the server.
		 */
		fetch: function(options)
		{
			options || (options = {});

			var success	=	options.success;
			options.success	=	function(res)
			{
				this.reset(this.parse(res), options);
				if(success) success(model, res);
			}.bind(this);
			options.error	=	wrap_error(options.error ? options.error.bind(this) : null, this, options);
			return (this.sync || Composer.sync).call(this, 'read', this, options);
		},

		/**
		 * simple wrapper to get the collection's url
		 */
		get_url: function()
		{
			return this.url;
		},

		/**
		 * remove all ties between this colleciton and a model
		 */
		_remove_reference: function(model)
		{
			model.collections.erase(this);

			// don't listen to this model anymore
			model.unbind('all', this._model_event.bind(this));
		},

		/**
		 * bound to every model's "all" event, propagates or reacts to certain events.
		 */
		_model_event: function(ev, model, collections, options)
		{
			if((ev == 'add' || ev == 'remove') && !collections.contains(this)) return;
			if(ev == 'destroy')
			{
				this.remove(model, options);
			}
			this.trigger.apply(this, arguments);
		}
	});

	/**
	 * The controller class sits between views and your models/collections. 
	 * Controllers bind events to your data objects and update views when the data
	 * changes. Controllers are also responsible for rendering views.
	 */
	var Controller	=	new Class({
		Extends: Base,
		Implements: [Events],

		// the DOM element to tie this controller to (a container element)
		el: false,

		// if this is set to a DOM *selector*, then this.el will be ignored and
		// instantiated as a new Element(this.tag), then injected into the element
		// referened by the this.inject selector. this allows you to inject
		// controllers into the DOM 
		inject: false,

		// don't worry about it
		event_splitter:	/^(\w+)\s*(.*)$/,

		// if tihs.el is empty, create a new element of this type as the container
		tag: 'div',

		// elements to assign to this controller
		elements: {},

		// events to bind to this controllers sub-items.
		events: {},

		/**
		 * CTOR. instantiate main container element (this.el), setup events and
		 * elements, and call init()
		 */
		initialize: function(params)
		{
			for(x in params)
			{
				this[x]	=	params[x];
			}
			
			// make sure we have an el
			this._ensure_el();
			
			if(this.inject)
			{
				this.attach();
			}
			
			if(this.className)
			{
				this.el.addClass(this.className);
			}

			this.refresh_elements();
			this.delegate_events();

			this.init();
		},

		extend: function(obj, base)
		{
			obj || (obj = {});
			base || (base = Controller);
			obj	=	this.parent.call(this, obj, base);

			// extend the base object's events and elements
			obj.events		=	Object.merge(this.events || {}, obj.events);
			obj.elements	=	Object.merge(this.elements || {}, obj.elements);

			return this._do_extend(obj, base);
		},

		/**
		 * override
		 */
		init: function() {},		// lol

		/**
		 * override. not OFFICIALLY used by the framework, but it's good to use it AND
		 * return "this" when you're done with it.
		 */
		render: function() { return this; },

		/**
		 * replace this.el's html with the given test, also refresh the controllers
		 * elements. 
		 */
		html: function(str)
		{
			this.el.set('html', str);
			this.refresh_elements();
		},

		/**
		 * injects to controller's element into the DOM.
		 */
		attach: function(options)
		{
			// make sure we have an el
			this._ensure_el();
			
			var container	=	document.getElement(this.inject);
			if(!container)
			{
				return false;
			}

			container.set('html', '');
			this.el.inject(container);
		},
		
		/**
		 * make sure el is defined as an HTML element
		 */
		_ensure_el: function() {
			// allow this.el to be a string selector (selecting a single element) instad
			// of a DOM object. this allows the defining of a controller before the DOM
			// element the selector refers to exists, but this.el will be updated upon
			// instantiation of the controller (presumably when the DOM object DOES
			// exist).
			if(typeof(this.el) == 'string')
			{
				this.el = document.getElement(this.el);
			}

			// if this.el is null (bad selector or no item given), create a new DOM
			// object from this.tag
			this.el || (this.el = new Element(this.tag));
		},

		/**
		 * remove the controller from the DOM and trigger its release event
		 */
		release: function(options)
		{
			options || (options = {});
			if(this.el && this.el.destroy)
			{
				if(options.dispose)
				{
					this.el.dispose();
				}
				else
				{
					this.el.destroy();
				}
			}
			this.el	=	false;
			this.fire_event('release', options);
		},

		/**
		 * replace this controller's container element (this.el) with another element.
		 * also refreshes the events/elements associated with the controller
		 */
		replace: function(element)
		{
			if(this.el.parentNode)
			{
				element.replaces(this.el);
			}
			this.el	=	element;

			this.refresh_elements();
			this.delegate_events();

			return element;
		},

		/**
		 * set up the events (by delegation) to this controller (events are stored 
		 * under this.events).
		 */
		delegate_events: function()
		{
			// setup the events given
			for(ev in this.events)
			{
				var fn			=	this[this.events[ev]];
				if(typeof(fn) != 'function')
				{
					// easy, easy, whoa, you gotta calm down there, chuck
					continue;
				}
				fn	=	fn.bind(this);

				match			=	ev.match(this.event_splitter);
				var evname		=	match[1].trim();
				var selector	=	match[2].trim();

				if(selector == '')
				{
					this.el.removeEvent(evname, fn);
					this.el.addEvent(evname, fn);
				}
				else
				{
					this.el.addEvent(evname+':relay('+selector+')', fn);
				}
			}
		},

		/**
		 * re-init the elements into the scope of the controller (uses this.elements)
		 */
		refresh_elements: function()
		{
			// setup given elements as instance variables
			for(selector in this.elements)
			{
				var iname	=	this.elements[selector];
				this[iname]	=	this.el.getElement(selector);
			}
		}
	});

	/*
	---
	description: Added the onhashchange event

	license: MIT-style

	authors: 
	- sdf1981cgn
	- Greggory Hernandez

	requires: 
	- core/1.2.4: '*'

	provides: [Element.Events.hashchange]

	...
	*/
	Element.Events.hashchange = {
		onAdd: function() {
			var hash = self.location.hash;

			var hashchange = function(){
				if (hash == self.location.hash) return;
				else hash = self.location.hash;

				var value = (hash.indexOf('#') == 0 ? hash.substr(1) : hash);
				window.fireEvent('hashchange', value);
				document.fireEvent('hashchange', value);
			};

			if ("onhashchange" in window){
				window.onhashchange = hashchange;
			} else {
				hashchange.periodical(50);
			}
		}
	};

	var Router	=	new Class({
		last_hash:	false,
		routes:		{},
		callbacks:	[],

		options: {
			redirect_initial: true,
			suppress_initial_route: false,
			enable_cb: function() { return true; },
			on_failure: function() {}
		},

		/**
		 * initialize the routes your app uses. this is really the only public
		 * function that exists in the router, since it takes care of everything for
		 * you after instantiation.
		 */
		initialize: function(routes, options)
		{
			for(x in options)
			{
				this.options[x]	=	options[x];
			}

			this.routes	=	routes;

			this.register_callback(this._do_route.bind(this));

			// load the initial hash value
			var hash	=	self.location.hash;
			var value	=	(hash.indexOf('#') == 0 ? hash.substr(1) : hash);
			
			// if redirect_initial is true, then whatever page a user lands on, redirect
			// them to the hash version, ie
			//
			// gonorrhea.com/users/display/42
			// becomes:
			// gonorrhea.com/#!/users/display/42
			//
			// the routing system will pick this new hash up after the redirect and route
			// it normally
			if(this.options.redirect_initial && hash.trim() == '')
			{
				window.location	=	'/#!' + self.location.pathname;
			}

			// set up the hashchange event
			window.addEvent('hashchange', this.hash_change.bind(this));

			if(!this.options.suppress_initial_route)
			{
				// run the initial route
				window.fireEvent('hashchange', [value]);
			}
		},

		/**
		 * run the given callback when a route changes
		 */
		register_callback: function(cb)
		{
			this.callbacks.push(cb);
		},

		/**
		 * wrapper around the routing functionality. basically, instead of doing a 
		 *   window.location = '#!/my/route';
		 * you can do
		 *   router.route('#!/my/route');
		 *
		 * Note that the latter isn't necessary, but it provides a useful abstraction.
		 */
		route: function(url)
		{
			url || (url = new String(window.location.href));

			var href	=	url.trim();
			href		=	'/' + href.replace(/^[a-z]+:\/\/.*?\//, '').replace(/^[#!\/]+/, '');
			var hash	=	'#!' + href;

			var old		=	new String(self.location.hash).toString();
			if(old == hash)
			{
				window.fireEvent('hashchange', [href, true]);
			}
			else
			{
				window.location	=	hash;
			}
		},

		/**
		 * given a url, route it within the given routes the router was instantiated
		 * with. if none fit, do nothing =]
		 *
		 * *internal only* =]
		 */
		_do_route: function(url)
		{
			if(!this.options.enable_cb())
			{
				return false;
			}

			var url		=	'/' + url.replace(/^!?\//g, '');
			var route	=	false;
			var match	=	[];
			for(var re in this.routes)
			{
				var regex	=	'/' + re.replace(/\//g, '\\\/') + '$/';
				match		=	eval(regex).exec(url);
				if(match)
				{
					route	=	this.routes[re];
					break;
				}
			}
			if(!route) return this.options.on_failure({url: url, route: false, handler_exists: false, action_exists: false});

			var handler	=	route[0];
			var action	=	route[1];
			if(!window[handler]) return this.options.on_failure({url: url, route: route, handler_exists: false, action_exists: false});

			var obj		=	window[handler];
			if(!obj[action] || typeof(obj[action]) != 'function') return this.options.on_failure({url: url, route: route, handler_exists: true, action_exists: false});
			var args	=	match;
			args.shift();
			obj[action].apply(obj, args);
		},

		/**
		 * stupid function, not worth the space it takes up
		 */
		setup_routes: function(routes)
		{
			this.routes	=	routes;
		},

		/**
		 * attached to the hashchange event. runs all the callback assigned with
		 * register_callback().
		 */
		hash_change: function(hash, force)
		{
			var force	=	!!force;

			// remove the motherfucking ! at the beginning
			hash	=	hash.replace(/^!/, '');
			if(this.last_hash == hash && !force)
			{
				// no need to reload
				return false;
			}
			
			this.last_hash	=	hash;
			this.callbacks.each(function(fn) {
				if(typeof(fn) == 'function') fn.call(this, hash);
			}, this);
		}
	});


	// wraps error callbacks for syncing functions
	var wrap_error	=	function(callback, model, options)
	{
		return function(resp)
		{
			if(callback)
			{
				callback(model, resp, options);
			}
			else
			{
				this.fire_event('error', options, model, resp, options);
			}
		};
	};

	// do a shallow clone of an array
	var shallow_array_clone	=	function(from)
	{
		var to	=	new Array();
		for(i in from)
		{
			to[i]	=	from[i];
		}
		return to;
	};

	// taken and modified from underscore.js. added in some function helpers for
	// the value comparisons.
	//
	//     Underscore.js 1.2.0
	//     (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
	//     Underscore is freely distributable under the MIT license.
	//     Portions of Underscore are inspired or borrowed from Prototype,
	//     Oliver Steele's Functional, and John Resig's Micro-Templating.
	//     For all details and documentation:
	//     http://documentcloud.github.com/underscore
	var eq	=	function(a, b, stack)
	{
		stack || (stack = []);
		// Identical objects are equal. `0 === -0`, but they aren't identical.
		// See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
		if (a === b) return a !== 0 || 1 / a == 1 / b;
		// A strict comparison is necessary because `null == undefined`.
		if (a == null) return a === b;
		// Compare object types.
		var typeA = typeof a;
		if (typeA != typeof b) return false;
		// Optimization; ensure that both values are truthy or falsy.
		if (!a != !b) return false;
		// `NaN` values are equal.
		if (a != a) return b != b;
		// Compare string objects by value.
		var is_string	=	function(obj) {return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));};
		var isStringA = is_string(a), isStringB = is_string(b);
		if (isStringA || isStringB) return isStringA && isStringB && String(a) == String(b);
		// Compare number objects by value.
		var is_number	=	function(obj) {return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));};
		var isNumberA = is_number(a), isNumberB = is_number(b);
		if (isNumberA || isNumberB) return isNumberA && isNumberB && +a == +b;
		// Compare boolean objects by value. The value of `true` is 1; the value of `false` is 0.
		var is_boolean	=	function(b) {return b === true || b === false;};
		var isBooleanA = is_boolean(a), isBooleanB = is_boolean(b);
		if (isBooleanA || isBooleanB) return isBooleanA && isBooleanB && +a == +b;
		// Ensure that both values are objects.
		if (typeA != 'object') return false;
		// Unwrap any wrapped objects.
		if (a._chain) a = a._wrapped;
		if (b._chain) b = b._wrapped;
		// Assume equality for cyclic structures. The algorithm for detecting cyclic structures is
		// adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
		var length = stack.length;
		while (length--) {
			// Linear search. Performance is inversely proportional to the number of unique nested
			// structures.
			if (stack[length] == a) return true;
		}
		// Add the first object to the stack of traversed objects.
		var hasOwnProperty	=	Object.prototype.hasOwnProperty;
		stack.push(a);
		var size = 0, result = true;
		if (a.length === +a.length || b.length === +b.length) {
			// Compare object lengths to determine if a deep comparison is necessary.
			size = a.length;
			result = size == b.length;
			if (result) {
				// Deep compare array-like object contents, ignoring non-numeric properties.
				while (size--) {
					// Ensure commutative equality for sparse arrays.
					if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
				}
			}
		} else {
			// Deep compare objects.
			for (var key in a) {
				if (hasOwnProperty.call(a, key)) {
					// Count the expected number of properties.
					size++;
					// Deep compare each member.
					if (!(result = hasOwnProperty.call(b, key) && eq(a[key], b[key], stack))) break;
				}
			}
			// Ensure that both objects contain the same number of properties.
			if (result) {
				for (key in b) {
					if (hasOwnProperty.call(b, key) && !size--) break;
				}
				result = !size;
			}
		}
		// Remove the first object from the stack of traversed objects.
		stack.pop();
		return result;
	}
	Composer.eq	=	eq;


	// list the items we're going to export with "extends" wrappers
	var exports		=	['Model', 'Collection', 'Controller'];

	// run the exports
	exports.each(function(name) {
		var obj			=	eval('new '+name+'()');
		Composer[name]	=	obj;
	});
	Composer.Router	=	Router;
	window.Composer	=	Composer;
})();
