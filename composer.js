/**
 * util.js
 *
 * This sets up our util object, which defines a way to export Composer
 * components and also defines a number of helper functions the rest of the
 * system will use.
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

	var global = this;
	if(!global.Composer) global.Composer = {
		// note: this used to be "export" but IE is a whiny little bitch, so now
		// we're sup3r 1337 h4x0r5
		exp0rt: function(obj)
		{
			Object.keys(obj).forEach(function(key) {
				global.Composer[key] = obj[key];
			});
		}
	};

	/**
	 * You must override this function in your app.
	 */
	var sync = function(method, model, options) { return options.success(); };

	// a closure that returns incrementing integers. these will be unique across
	// the entire app since only one counter is instantiated
	var cid = (function() {
		var counter = 1;
		return function(inc) { return 'c'+counter++; };
	})();

	// wraps error callbacks for syncing functions
	var wrap_error = function(callback, model, options)
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

	// Composer equality function. Does deep-inpection and is able to tell the
	// difference between {key: 3} and {key: 3, key2: 4} (_.eq had problems with
	// this back in the day).
	var eq = function(a, b)
	{
		if ( a === b ) return true;
		if(a instanceof Function) return false;
		if(typeof(a) != typeof(b)) return false;
		if((a && a.constructor) && !b || !b.constructor) return false;
		if((b && b.constructor) && !a || !a.constructor) return false;
		if(a && b && a.constructor != b.constructor) return false;
		if(a instanceof Array || Object.prototype.toString.call(a) === '[object Array]')
		{
			if(a.length != b.length) return false;
			// TODO: check if array indexes are always sequential
			for(var i = 0, n = a.length; i < n; i++)
			{
				if(!b.hasOwnProperty(i)) return false;
				if(!eq(a[i], b[i])) return false;
			}
		}
		else if(a instanceof Object)
		{
			for( var p in b )
			{
				if( b.hasOwnProperty(p) && ! a.hasOwnProperty(p) ) return false;
			}
			for( var p in a )
			{
				if ( ! a.hasOwnProperty( p ) ) continue;
				if ( ! b.hasOwnProperty( p ) ) return false;
				if ( a[ p ] === b[ p ] ) continue;
				if ( typeof( a[ p ] ) !== "object" ) return false;
				if ( ! eq( a[ p ],  b[ p ] ) ) return false;
			}
		}
		else if(a != b)
		{
			return false;
		}
		return true;
	};

	// create an extension function that merges specific properties from
	// inherited objects
	var merge_extend = function(cls, properties)
	{
		var _extend = cls.extend;
		cls.extend = function(def, base)
		{
			base || (base = this);
			var attr = base.prototype;

			properties.forEach(function(prop) {
				def[prop] = Composer.object.merge({}, attr[prop], def[prop]);
			});

			var cls = _extend.call(base, def);
			global.Composer.merge_extend(cls, properties);
			return cls;
		}
	};

	// some Mootools-reminiscent object utilities Composer uses
	var array = {
		erase: function(arr, item)
		{
			for(var i = arr.length - 1; i >= 0; i--)
			{
				if(arr[i] === item) arr.splice(i, 1);
			}
		},

		is: (function() {
			return ('isArray' in Array) ? 
				Array.isArray :
				function(obj) {
					return obj instanceof Array || Object.prototype.toString.call(obj) === '[object Array]'
				}
		})()
	};
	var object = {
		each: function(obj, fn, bind)
		{
			if(!obj) return;
			bind || (bind = this);
			Object.keys(obj).forEach(function(key) {
				(fn.bind(bind))(obj[key], key)
			});
		},
		clone: function(obj, options)
		{
			options || (options = {});
			if(options.deep) return JSON.parse(JSON.stringify(obj));

			var clone = {};
			Object.keys(obj).forEach(function(key) {
				clone[key] = obj[key];
			});
			return clone;
		},
		merge: function(to, _)
		{
			var args = Array.prototype.slice.call(arguments, 1);
			args.forEach(function(obj) {
				if(!obj) return;
				Object.keys(obj).forEach(function(key) {
					to[key] = obj[key];
				});
			});
			return to;
		},
		set: function(object, key, value)
		{
			object || (object = {});
			var paths = key.split('.');
			var obj = object;
			for(var i = 0, n = paths.length; i < n; i++)
			{
				var path = paths[i];
				if(i == n - 1)
				{
					obj[path] = value;
					break;
				}

				if(!obj[path])
				{
					obj[path] = {};
				}
				else if(typeof(obj) != 'object' || Composer.array.is(obj))
				{
					obj[path] = {};
				}
				obj = obj[path];
			}
			return object;
		},
		get: function(object, key)
		{
			object || (object = {});
			var paths = key.split('.');
			var obj = object;
			for(var i = 0, n = paths.length; i < n; i++)
			{
				var path = paths[i];
				var type = typeof(obj[path]);
				if(type == 'undefined')
				{
					return obj[path];
				}
				obj = obj[path];
			}
			return obj;
		}
	};

	var promisify = function(poptions)
	{
		poptions || (poptions = {});

		var create_converter = function(type)
		{
			return function(key)
			{
				var options = arguments[1] || {};
				var options_idx = options.options_idx || 0;
				var names = options.names || ['success', 'error'];

				var _old = Composer[type].prototype[key];
				global.Composer[type].prototype[key] = function()
				{
					var args = Array.prototype.slice.call(arguments, 0);
					if(args.length < options_idx)
					{
						var _tmp = new Array(options_idx);
						args.forEach(function(item, i) { _tmp[i] = item; });
						args = _tmp;
					}
					if(!args[options_idx]) args[options_idx] = {};
					var _self = this;
					var options = args[options_idx];
					if(options.promisified) return _old.apply(_self, args);
					if(poptions.warn && (options[names[0]] || options[names[1]]))
					{
						console.warn('Composer: promisify: attempting to pass callbacks to promisified function: ', type, key);
					}
					return new Promise(function(resolve, reject) {
						if(names[0]) options[names[0]] = resolve;
						if(names[1]) options[names[1]] = function(_, err) { reject(err); };
						options.promisified = true;
						_old.apply(_self, args);
					});
				};
			};
		}
		var convert_collection_fn = create_converter('Collection');
		['fetch', 'save', 'destroy'].forEach(create_converter('Model'));
		['fetch'].forEach(convert_collection_fn);
		convert_collection_fn('reset_async', {options_idx: 1, names: ['complete']});
	};

	this.Composer.exp0rt({
		sync: sync,
		cid: cid,
		wrap_error: wrap_error,
		eq: eq,
		merge_extend: merge_extend,
		array: array,
		object: object,
		promisify: promisify
	});
}).apply((typeof exports != 'undefined') ? exports : this);

/**
 * class.js
 *
 * Defines the base class system used by Composer (can be standlone as well)
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
	 * like typeof, but returns if it's an array or null
	 */
	var typeOf = function(obj)
	{
		if(obj == null) return 'null';
		var type = typeof(obj);
		if(type != 'object') return type;
		if(Array.isArray && Array.isArray(obj)) return 'array';
		else if(Object.prototype.toString.call(obj) === '[object Array]') return 'array';
		return type;
	};

	/**
	 * Merge object `from` into `into`
	 */
	var merge = function(into, from, options)
	{
		options || (options = {});
		for(var k in from)
		{
			if(!from.hasOwnProperty(k)) continue;
			if(options.transform) options.transform(into, from, k);
			into[k] = from[k];
		}
		return into;
	};

	/**
	 * Wraps an overriding method to track its state so get_parent() can pull
	 * out the right function.
	 */
	var wrapfn = function(origfn, k)
	{
		return function()
		{
			if(!this.$state.levels[k]) this.$state.levels[k] = 0;
			this.$state.levels[k]++;
			this.$state.fn.unshift(k);
			var val = origfn.apply(this, arguments);
			this.$state.fn.shift();
			this.$state.levels[k]--;
			return val;
		};
	};

	/**
	 * Takes care of "parentizing" overridden methods when merging prototypes
	 */
	var do_extend = function(to_prototype, from_prototype)
	{
		return merge(to_prototype, from_prototype, {
			transform: function(into, from, k) {
				if(typeof into[k] != 'function' || into[k].prototype.$parent || typeof from[k] != 'function' || from[k].prototype.$parent) return false;
				from[k] = wrapfn(from[k], k);
				from[k].$parent = into[k];
			}
		});
	};

	/**
	 * Given an object, copy the subobjects/subarrays recursively
	 */
	var copy = function(obj)
	{
		for(var k in obj)
		{
			var val = obj[k];
			switch(typeOf(val))
			{
			case 'object':
				obj[k] = copy(merge({}, val));
				break;
			case 'array':
				obj[k] = val.slice(0);
				break;
			}
		}
		return obj;
	}

	/**
	 * Create a new class prototype from the given base class.
	 */
	var create = function(base)
	{
		base.$initializing = true;
		var prototype = new base();
		delete base.$initializing;

		var cls = function Omni()
		{
			copy(this);
			if(cls.$initializing) return this;
			this.$state = {levels: {}, fn: []};
			if(this.initialize) return this.initialize.apply(this, arguments);
			else return this;
		};
		cls.$constructor = prototype.$constructor = cls;
		cls.prototype = prototype;
		cls.prototype.$parent = base;

		return cls;
	};

	/**
	 * Once base to rule them all (and in the darkness bind them)
	 */
	var Base = function() {};

	/**
	 * Main extension method, creates a new class from the given object
	 */
	Base.extend = function(obj)
	{
		var base = this;
		var cls = create(base);
		do_extend(cls.prototype, obj);
		cls.extend = Base.extend;

		cls.prototype.$get_parent = function()
		{
			var key = this.$state.fn[0];
			if(!key) return false;
			var level = this.$state.levels[key];
			var parent = cls.prototype[key]; for(var i = 0; i < level && parent; i++) { parent = parent.$parent; }
			return parent || false;
		};
		cls.prototype.parent = function()
		{
			var fn = this.$get_parent();
			if(fn) return fn.apply(this, arguments);
			throw 'Class.js: Bad parent method: '+ this.$state.fn[0];
		};

		return cls;
	};

	// wrap base class so we can call it directly or as .extend()
	function Class(obj) { return Base.extend(obj); };
	Class.extend = Class;

	this.Composer.exp0rt({ Class: Class });

}).apply((typeof exports != 'undefined') ? exports : this);

/**
 * event.js
 *
 * Defines the eventing fabric used throughout Composer
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
(function(global, undefined) {
	"use strict";

	var make_lookup_name = function(event_name, bind_name)
	{
		return event_name + '@' + bind_name;
	};

	var Event = Composer.Class({
		_handlers: {},
		_handler_names: {},

		/**
		 * Bind a function to an event. Optionally allows naming the binding so
		 * it can be removed later on without the reference to the bound
		 * function.
		 */
		bind: function(event_name, fn, bind_name)
		{
			if(Composer.array.is(event_name))
			{
				event_name.forEach(function(ev) {
					this.bind(ev, fn, bind_name);
				}.bind(this));
				return this;
			}
			if(bind_name) this.unbind(event_name, bind_name);

			if(!this._handlers[event_name]) this._handlers[event_name] = [];
			var eventhandlers = this._handlers[event_name];
			eventhandlers.push(fn);

			if(bind_name)
			{
				this._handler_names[make_lookup_name(event_name, bind_name)] = fn;
			}
			return this;
		},

		/**
		 * Bind a function to an event, but clear the binding out once the event
		 * has been triggered once.
		 */
		bind_once: function(event_name, fn, bind_name)
		{
			bind_name || (bind_name = null);

			var wrapped_function = function()
			{
				this.unbind(event_name, wrapped_function)
				fn.apply(this, arguments);
			}.bind(this);
			return this.bind(event_name, wrapped_function, bind_name);
		},

		/**
		 * Unbind an event/function pair. If function_or_name contains a
		 * non-function value, the value is used in a name lookup instead. This
		 * allows removing an event/function binding by its name (as specified
		 * by `bind_name` in the bind function) which can be nice when the
		 * original function is no longer in scope.
		 */
		unbind: function(event_name, function_or_name)
		{
			if(!event_name) return this.wipe();
			if(Composer.array.is(event_name))
			{
				event_name.forEach(function(ev) {
					this.unbind(ev, function_or_name);
				}.bind(this));
				return this;
			}
			if(!function_or_name) return this.unbind_all(event_name);

			var is_fn = function_or_name instanceof Function;
			var lookup_name = is_fn ? null : make_lookup_name(event_name, function_or_name);
			var fn = is_fn ?  function_or_name : this._handler_names[lookup_name];
			if(!fn) return this;
			if(!is_fn) delete this._handler_names[lookup_name];
			if(!this._handlers[event_name]) return this;

			var idx = this._handlers[event_name].indexOf(fn);
			if(idx < 0) return this;

			this._handlers[event_name].splice(idx, 1);
			return this;
		},

		/**
		 * Unbind all handlers for the given event name.
		 */
		unbind_all: function(event_name)
		{
			delete this._handlers[event_name];
			return this;
		},

		/**
		 * Wipe out all handlers for a dispatch object.
		 */
		wipe: function(options)
		{
			options || (options = {});

			this._handlers = {};
			this._handler_names = {};

			return this;
		},

		/**
		 * Trigger an event.
		 */
		trigger: function(event_name, _)
		{
			var args = Array.prototype.slice.call(arguments, 0);
			var handlers = this._handlers[event_name] || [];
			var catch_all = this._handlers['all'] || [];
			handlers.slice(0).forEach(function(handler) {
				handler.apply(this, args.slice(1));
			}.bind(this));
			catch_all.slice(0).forEach(function(handler) {
				handler.apply(this, args.slice(0));
			}.bind(this));
			return this;
		}
	});

	Event._make_lookup_name = make_lookup_name;
	this.Composer.exp0rt({ Event: Event });
}).apply((typeof exports != 'undefined') ? exports : this);

/**
 * base.js
 *
 * Defines the base class for Composer objects (Model, Collection, etc)
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
	 * The base class is inherited by models, collections, and controllers. It
	 * provides some nice common functionality.
	 */
	var Base = Composer.Event.extend({
		/**
		 * Track this object's type. Useful for debugging, mainly
		 */
		__composer_type: 'base',

		/**
		 * Holds generic options for objects.
		 * */
		options: {},

		/**
		 * Every Composer object has an assigned unique id (regardless of the
		 * object's actual app ID). It is stored here.
		 */
		_cid: false,

		/**
		 * CTOR, assigns our CID
		 */
		initialize: function()
		{
			// assign the unique app id
			this._cid = Composer.cid();
		},

		/**
		 * Pull out the object's unique Composer ID
		 */
		cid: function()
		{
			return this._cid;
		},

		/**
		 * Convenience function to set options easily
		 */
		set_options: function(options)
		{
			options || (options = {});

			Object.keys(options).forEach(function(key) {
				this.options[key] = options[key];
			}.bind(this));
		},

		/**
		 * fire_event determines whether or not an event should fire. given an event
		 * name, the passed-in options, and any arbitrary number of arguments,
		 * determine whether or not the given event should be triggered.
		 */
		fire_event: function()
		{
			var args = Array.prototype.slice.call(arguments, 0);
			var evname = args.shift();
			var options = args.shift();

			options || (options = {});

			// add event name back into the beginning of args
			args.unshift(evname);
			if(!options.silent && !options.not_silent)
			{
				// not silent, fire the event
				return this.trigger.apply(this, args);
			}
			else if(
				options.not_silent &&
				(options.not_silent == evname ||
				 (options.not_silent.indexOf && options.not_silent.indexOf(evname) >= 0))
			)
			{
				// silent, BUT the given event is allowed. fire it.
				return this.trigger.apply(this, args);
			}
			else if(
				options.silent &&
				((typeof(options.silent) == 'string' && options.silent != evname) ||
				 (options.silent.indexOf && !(options.silent.indexOf(evname) >= 0)))
			)
			{
				// the current event is not marked to be silent, fire it
				return this.trigger.apply(this, args);
			}
			return this;
		}
	});

	this.Composer.exp0rt({ Base: Base });
}).apply((typeof exports != 'undefined') ? exports : this);

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

		// validation function, used to check data before it's set into the model
		validate: function(data, options) { return false; },

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

			// call Base.initialize
			this.parent();

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
			return new this.$constructor(this.toJSON());
		},

		/**
		 * return the raw data for this model (cloned, not referenced).
		 */
		toJSON: function()
		{
			return Composer.object.clone(this.data, {deep: true});
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

	this.Composer.exp0rt({ Model: Model });
}).apply((typeof exports != 'undefined') ? exports : this);

/**
 * collection.js
 *
 * Provides an object used to handle groups of models.
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

	var global = this;

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
	var Collection = Composer.Base.extend({
		/**
		 * Track this object's type. Useful for debugging, mainly
		 */
		__composer_type: 'collection',

		// the TYPE of model in this collection
		model: Composer.Model,

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
			for(var x in params)
			{
				this[x] = params[x];
			}

			// call Base.initialize
			this.parent();

			// allow Collection.model to be a string so load-order dependencies can be
			// kept to a minimum. here, we convert the string to an object on collection
			// instantiation and store it back into Collection.model.
			//
			// NOTE: this happens before the initial reset =]
			this.model = typeof(this.model) == 'string' ? global[this.model] : this.model;

			if(models)
			{
				this.reset(models, options);
			}

			this.init();
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
		 * get the number of models in the collection
		 */
		size: function()
		{
			return this.models().length;
		},

		/**
		 * add a model to this collection, and hook up the correct wire in doing so
		 * (events and setting the model's collection).
		 */
		add: function(data, options)
		{
			if(Composer.array.is(data))
			{
				return data.forEach(function(model) { this.add(model, options); }.bind(this));
			}

			options || (options = {});

			// if we are passing raw data, create a new model from data
			var model = data instanceof Composer.Model ? data : new this.model(data, options);

			// reference this collection to the model
			if(model.collections.indexOf(this) == -1)
			{
				model.collections.push(this);
				options.is_new = true;
			}

			if(this.sortfn)
			{
				// if we have a sorting function, get the index the model should exist at
				// and add it to that position
				var index = options.at ? parseInt(options.at) : this.sort_index(model);
				this._models.splice(index, 0, model);
			}
			else
			{
				if (typeof(options.at) == 'number')
					this._models.splice(options.at, 0, model);
				else
					this._models.push(model);
			}

			// listen to the model's events so we can propogate them
			model.bind('all', this._model_event.bind(this), 'collection:'+this.cid()+':listen:model:all');

			this.fire_event('add', options, model, this, options);

			return model;
		},

		/**
		 * remove a model(s) from the collection, unhooking all necessary wires (events, etc)
		 */
		remove: function(model, options)
		{
			if(Composer.array.is(model))
			{
				return model.slice(0).forEach(function(m) { this.remove(m, options); }.bind(this));
			}
			if(!model) return;

			options || (options = {});

			// remove this collection's reference(s) from the model
			Composer.array.erase(model.collections, this);

			// save to trigger change event if needed
			var num_rec = this._models.length;

			// remove the model
			Composer.array.erase(this._models, model);

			// if the number actually change, trigger our change event
			if(this._models.length != num_rec)
			{
				this.fire_event('remove', options, model);
			}

			// remove the model from the collection
			this._remove_reference(model);
		},

		/**
		 * given a model, check if its ID is already in this collection. if so,
		 * replace is with the given model, otherwise add the model to the collection.
		 */
		upsert: function(data, options)
		{
			if(Composer.array.is(data))
			{
				return data.forEach(function(model) { this.upsert(model, options); }.bind(this));
			}

			options || (options = {});

			// if we are passing raw data, create a new model from data
			var model = data instanceof Composer.Model ? data : new this.model(data, options);

			var existing = this.find_by_id(model.id(), options);
			if(existing)
			{
				// reposition the model if necessary
				var existing_idx = this.index_of(existing);
				if(typeof(options.at) == 'number' && existing_idx != options.at)
				{
					this._models.splice(existing_idx, 1);
					this._models.splice(options.at, 0, existing);
					this.fire_event('sort', options);
				}

				// replace the data in the existing model with the new model's
				existing.set(model.toJSON(), Composer.object.merge({}, {silent: true, upsert: true}, options));
				this.fire_event('upsert', options, existing, options);

				return existing;
			}

			// model is not in this collection, add it
			this.add(model, options);
			return model;
		},

		/**
		 * remove all the models from the collection
		 */
		clear: function(options)
		{
			options || (options = {});

			// save to trigger change event if needed
			var num_rec = this._models.length;

			if(num_rec == 0) return;

			this.remove(this._models, options);
			this._models = [];

			// if the number actually change, trigger our change event
			if(this._models.length != num_rec)
			{
				this.fire_event('clear', options, options);
			}
		},

		/**
		 * reset the collection with all new data. it can also be appended to the
		 * current set of models if specified in the options (via "append").
		 */
		reset: function(data, options)
		{
			options || (options = {});

			if(!options.append && !options.upsert) this.clear(options);
			if(options.upsert)
			{
				this.upsert(data, options);
			}
			else
			{
				this.add(data, options);
			}

			this.fire_event('reset', options, options);
		},

		/**
		 * reset the collection with all new data. it does this asynchronously
		 * for each item in the data array passed. this is good for setting
		 * large amounts of data into a collection whose models may do heavy
		 * processing. this way, the browser is able to process other events (ie
		 * not freeze) while adding the models to the collection.
		 *
		 * data can be appended by setting the {append: true} flag in the
		 * options.
		 *
		 * when ALL models have been added, this function calls the
		 * options.complete callback.
		 */
		reset_async: function(data, options)
		{
			options || (options = {});

			if(data == undefined) return;
			if(!Composer.array.is(data)) data = [data];

			data = data.slice(0);

			if(!options.append && !options.upsert) this.clear();
			if(data.length > 0)
			{
				var batch = options.batch || 1;
				var slice = data.splice(0, batch);
				if(options.upsert)
				{
					this.upsert(slice, options);
				}
				else
				{
					this.add(slice, options);
				}
			}
			if(data.length == 0)
			{
				this.fire_event('reset', options, options);
				if(options.complete) options.complete()
				return;
			}
			setTimeout(function() {
				this.reset_async(data, Composer.object.merge({append: true}, options));
			}.bind(this), 0);
		},

		/**
		 * not normally necessary to call this, unless collection.sortfn changes after
		 * instantiation of the data. sort order is normall maintained upon adding of
		 * data viw Collection.add().
		 *
		 * However, since the sorting criteria for the models can be modified manually
		 * and it's not always desired to sort automatically, you can call this method
		 * to re-sort the data in the collection via the bubble-up eventing:
		 *
		 * mycollection.bind('change:sort_order', mycollection.sort.bind(mycollection))
		 */
		sort: function(options)
		{
			if(!this.sortfn) return false;

			this._models.sort(this.sortfn);
			this.fire_event('reset', options, options);
		},

		/**
		 * given the current sort function and a model passecd in, determine the
		 * index the model should exist at in the collection's model list.
		 */
		sort_index: function(model)
		{
			if(!this.sortfn) return false;

			if(this._models.length == 0) return 0;

			var sorted = this._models.slice(0).sort(this.sortfn);
			for(var i = 0; i < sorted.length; i++)
			{
				if(model == sorted[i]) return i;
				if(this.sortfn(sorted[i], model) > 0) return i;
			}
			var index = sorted.indexOf(model);
			if(index == sorted.length - 1) return index;
			return sorted.length;
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
			bind || (bind = this);
			this.models().forEach(cb.bind(bind));
		},

		/**
		 * convenience function to execute a function on a collection's models
		 */
		map: function(cb, bind)
		{
			bind || (bind = this);
			return this.models().map(cb.bind(bind));
		},

		/**
		 * Find the first model that satisfies the callback. An optional sort function
		 * can be passed in to order the results of the find, which uses the usual
		 * fn(a,b){return (-1|0|1);} syntax.
		 */
		find: function(callback, sortfn)
		{
			var models = this.models();
			if(sortfn) models = models.slice(0).sort(sortfn);

			for(var i = 0; i < models.length; i++)
			{
				var rec = models[i];
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
			for(var i = 0; i < this.size(); i++)
			{
				if(callback(this.models()[i])) return true;
			}
			return false;
		},

		/**
		 * convenience function to find a model by id
		 */
		find_by_id: function(id, options)
		{
			options || (options = {});
			return this.find(function(model) {
				if(model.id(options.strict) == id)
				{
					return true;
				}
				if(options.allow_cid && model.cid() == id)
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
			var id = model_or_id.__composer_type == 'model' ? model_or_id.id() : model_or_id;
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
		 * Filter this collection's models by the given callback. Works just
		 * like Array.filter in JS.
		 */
		filter: function(callback, bind)
		{
			bind || (bind = this);
			return this._models.filter(callback.bind(bind));
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
				var params = selector;
				var keys = Object.keys(params);
				selector = function(model) {
					for(var i = 0; i < keys.length; i++)
					{
						var key = keys[i];
						var compare = params[key];
						if(model.get(key) !== compare) return false;
					}
					return true;
				};
			}
			return this._models.filter(selector);
		},

		/**
		 *	Convenience functon to just select one model from a collection
		 */
		select_one: function(selector)
		{
			var result = this.select(selector);

			if(result.length) return result[0];

			return null;
		},

		/**
		 * return the first model in the collection. if n is specified, return the
		 * first n models.
		 */
		first: function(n)
		{
			var models = this.models();
			return (typeof(n) != 'undefined' && parseInt(n) != 0) ? models.slice(0, n) : models[0];
		},

		/**
		 * returns the last model in the collection. if n is specified, returns the
		 * last n models.
		 */
		last: function(n)
		{
			var models = this.models();
			return (typeof(n) != 'undefined' && parseInt(n) != 0) ? models.slice(models.length - n) : models[models.length - 1];
		},

		/**
		 * returns the model at the specified index. if there is no model there,
		 * return false
		 */
		at: function(n)
		{
			var model = this._models[n];
			return (model || false);
		},

		/**
		 * given the current sort function, find the model at the given position
		 */
		sort_at: function(n)
		{
			if(!this.sortfn) return false;

			var sorted = this._models.slice(0).sort(this.sortfn);
			return sorted[n];
		},

		/**
		 * sync the collection with the server.
		 */
		fetch: function(options)
		{
			options || (options = {});

			var success = options.success;
			options.success = function(res)
			{
				this.reset(this.parse(res), options);
				if(success) success(this, res);
			}.bind(this);
			options.error = Composer.wrap_error(options.error ? options.error.bind(this) : null, this, options).bind(this);
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
			Composer.array.erase(model.collections, this);

			// don't listen to this model anymore
			model.unbind('all', 'collection:'+this.cid()+':listen:model:all');
		},

		/**
		 * bound to every model's "all" event, propagates or reacts to certain events.
		 */
		_model_event: function(ev, model, collections, options)
		{
			if(ev == 'destroy') this.remove(model, options);
			this.trigger.apply(this, arguments);
		}
	});
	this.Composer.exp0rt({ Collection: Collection });
}).apply((typeof exports != 'undefined') ? exports : this);

/**
 * adapter.js
 *
 * A jQuery/MooTools adapter for various DOM operations.
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

	var global = this;

	var has_sizzle = !!global.Sizzle;
	var has_jquery = !!global.jQuery;
	var has_slick = !!global.Slick;
	var has_moo = !!global.MooTools;

	var find = (function() {
		if(has_moo)
		{
			return function(context, selector) {
				context || (context = document);
				return document.id(context).getElement(selector);
			};
		}
		else if(has_jquery)
		{
			return function(context, selector) {
				context || (context = document);
				return jQuery(context).find(selector)[0];
			};
		}
		else if(has_sizzle)
		{
			return function(context, selector) {
				context || (context = document);
				return Sizzle.select(selector, context)[0];
			};
		}
		else if(has_slick)
		{
			return function(context, selector) {
				context || (context = document);
				return Slick.find(context, selector);
			};
		}
		throw new Error('No selector engine present. Include Sizzle/jQuery or Slick/Mootools before loading composer.');
	})();

	var match = (function() {
		if(has_sizzle)
		{
			return function(element, selector) {
				element || (element = document);
				return Sizzle.matchesSelector(element, selector);
			};
		}
		else if(has_slick)
		{
			return function(element, selector) {
				element || (element = document);
				return Slick.match(element, selector);
			};
		}
		else if(has_jquery)
		{
			return function(element, selector) {
				element || (element = document);
				return jQuery(element).is(selector);
			};
		}
		throw new Error('No selector engine present. Include Sizzle/jQuery or Slick/Mootools before loading composer.');
	})();

	var add_event = (function() {
		if(has_jquery)
		{
			return function(el, ev, fn, selector) {
				if(selector) return jQuery(el).on(ev, selector, fn);
				else return jQuery(el).on(ev, fn);
			};
		}
		else if(has_moo)
		{
			return function(el, ev, fn, selector) {
				var _fn = fn;
				fn = function()
				{
					_fn.apply(this, arguments);
				};

				if(selector) return document.id(el).addEvent(ev+':relay('+selector+')', fn);
				else return document.id(el).addEvent(ev, fn);
			};
		}
		else
		{
			return function(el, ev, fn, selector) {
				if(selector)
				{
					el.addEventListener(ev, function(event) {
						var target = event.target || event.srcElement;
						if(event.__composer_handled || !match(target, selector)) return false;
						event.__composer_handled = true;
						fn.apply(this, [event].concat(event.params || []));
					});
				}
				else
				{
					el.addEventListener(ev, function(event) {
						fn.apply(this, [event].concat(event.params || []));
					}, false);
				}
			};
		}
	})();

	var remove_event = (function() {
		if(has_jquery)
		{
			return function(el, ev, fn) {
				jQuery(el).off(ev, fn);
			};
		}
		else if(has_moo)
		{
			return function(el, ev, fn) {
				document.id(el).removeEvent(ev, fn);
			};
		}
		else
		{
			return function(el, ev, fn) {
				el.removeEventListener(ev, fn, false);
			};
		}
	})();

	var fire_event = (function() {
		/**
		 * NOTE: taken from http://stackoverflow.com/a/2381862/236331
		 *
		 * Fire an event handler to the specified node. Event handlers can
		 * detect that the event was fired programatically by testing for a
		 * 'synthetic=true' property on the event object
		 *
		 * @param {HTMLNode} node The node to fire the event handler on.
		 * @param {String} eventName The name of the event without the "on" (e.g., "focus")
		 */
		return function(el, type, options) {
			options || (options = {});

			if(type == 'click' && el.click)
			{
				return el.click();
			}

			var ev = new CustomEvent(type, options.args);
			el.dispatchEvent(ev);
		};
	})();

	var find_parent = function(selector, element)
	{
		if(!element) return false;
		if(match(element, selector)) return element;
		var par = element.parentNode;
		return find_parent(selector, par);
	};

	this.Composer.exp0rt({
		find: find,
		match: match,
		add_event: add_event,
		fire_event: fire_event,
		remove_event: remove_event,
		find_parent: find_parent
	});
}).apply((typeof exports != 'undefined') ? exports : this);

/**
 * controller.js
 *
 * Provides the glue between the DOM/UI and our data layer (models)
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
	var Controller = Composer.Base.extend({
		/**
		 * Track this object's type. Useful for debugging, mainly
		 */
		__composer_type: 'controller',

		// tracks if this controller has been released
		_released: false,

		// holds events bound with with_bind
		_bound_events: [],

		// tracks sub-controllers
		_subcontrollers: {},

		// the DOM element to tie this controller to (a container element)
		el: false,

		// if this is set to a DOM *selector*, then this.el will be ignored and
		// instantiated as a new Element(this.tag), then injected into the element
		// referened by the this.inject selector. this allows you to inject
		// controllers into the DOM
		inject: false,

		// if this.el is empty, create a new element of this type as the container
		tag: 'div',

		// the initial className to assign to the controller's element (this.el)
		class_name: false,

		// elements to assign to this controller
		elements: {},

		// events to bind to this controllers sub-items.
		events: {},

		/**
		 * CTOR. instantiate main container element (this.el), setup events and
		 * elements, and call init()
		 */
		initialize: function(params, options)
		{
			options || (options = {});

			for(var x in params)
			{
				this[x] = params[x];
			}

			// call Base.initialize
			this.parent();

			// make sure we have an el
			this._ensure_el();

			if(this.inject)
			{
				this.attach(options);
			}

			// backwards compat
			if(this.className) this.class_name = this.className;
			if(this.class_name)
			{
				this.el.className += ' ' + this.class_name;
			}

			this.refresh_elements();
			this.delegate_events();

			this.init();
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
		html: function(obj)
		{
			if(!this.el) this._ensure_el();

			if(obj.appendChild && obj.tagName)
			{
				this.el.innerHTML = '';
				this.el.appendChild(obj);
			}
			else
			{
				this.el.innerHTML = obj;
			}
			this.refresh_elements();
		},

		/**
		 * injects to controller's element into the DOM.
		 */
		attach: function(options)
		{
			options || (options = {});

			// make sure we have an el
			this._ensure_el();

			var container = typeof(this.inject) == 'string' ?
									Composer.find(document, this.inject) :
									this.inject;
			if(!container) return false;

			if(options.clean_injection) container.innerHTML = '';
			container.appendChild(this.el);
		},

		/**
		 * legwork function what runs the actual bind
		 */
		_with_binder: function(bind_fn, object, ev, fn, name)
		{
			name || (name = false);
			var wrapped = function()
			{
				if(this._released) return;
				fn.apply(this, arguments);
			}.bind(this);
			bind_fn.call(object, ev, wrapped, name);
			this._bound_events.push([object, ev, wrapped]);
		},

		/**
		 * bind an event that the controller tracks and unbinds on release
		 */
		with_bind: function(object, ev, fn, name)
		{
			return this._with_binder(object.bind, object, ev, fn, name);
		},

		/**
		 * bind a event that the controller tracks and unbinds on release or
		 * that unbinds itself once it fires once
		 */
		with_bind_once: function(object, ev, fn, name)
		{
			return this._with_binder(object.bind_once, object, ev, fn, name);
		},

		/**
		 * keep track of a sub controller that will release when this controller
		 * does
		 */
		track_subcontroller: function(name, create_fn)
		{
			var remove_subcontroller = function(name, skip_release)
			{
				if(!this._subcontrollers[name]) return
				if(!skip_release) this._subcontrollers[name].release();
				delete this._subcontrollers[name];
			}.bind(this);

			// if we have an existing controller with the same name, release and
			// remove it.
			remove_subcontroller(name);

			// create the new controller, track it, and make sure if it's
			// released we untrack it
			var instance = create_fn();
			instance.bind('release', function() { remove_subcontroller(name, true); });
			this._subcontrollers[name] = instance;
			return instance;
		},

		/**
		 * get a tracked subcontroller by name
		 */
		get_subcontroller: function(name)
		{
			return this._subcontrollers[name] || false;
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
				this.el = Composer.find(document, this.el);
			}

			// if this.el is null (bad selector or no item given), create a new DOM
			// object from this.tag
			this.el || (this.el = document.createElement(this.tag));
		},

		/**
		 * remove the controller from the DOM and trigger its release event
		 */
		release: function(options)
		{
			options || (options = {});
			if(this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
			this.el = false;

			// auto-remove bound events
			this._bound_events.forEach(function(binding) {
				var obj = binding[0];
				var ev = binding[1];
				var fn = binding[2];
				obj.unbind(ev, fn);
			});
			this._bound_events = [];

			// auto-release/remove sub-controllers
			Object.keys(this._subcontrollers).forEach(function(key) {
				this._subcontrollers[key].release();
			}.bind(this));
			this._subcontrollers = {};

			this.fire_event('release', options, this);

			// remove all events from controller
			if(!options.keep_events) this.unbind();
			this._released = true;
		},

		/**
		 * replace this controller's container element (this.el) with another element.
		 * also refreshes the events/elements associated with the controller
		 */
		replace: function(element)
		{
			if(this.el.parentNode) this.el.parentNode.replaceChild(element, this.el);
			this.el = element;

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
			for(var ev in this.events)
			{
				var fn = this[this.events[ev]];
				if(typeof(fn) != 'function')
				{
					// easy, easy, whoa, you gotta calm down there, chuck
					continue;
				}
				fn = fn.bind(this);

				var match = ev.match(/^(\w+)\s*(.*)$/);
				var evname = match[1].trim();
				var selector = match[2].trim();

				if(selector == '')
				{
					Composer.remove_event(this.el, evname, fn);
					Composer.add_event(this.el, evname, fn);
				}
				else
				{
					Composer.add_event(this.el, evname, fn, selector);
				}
			}
		},

		/**
		 * re-init the elements into the scope of the controller (uses this.elements)
		 */
		refresh_elements: function()
		{
			// setup given elements as instance variables
			if(!this.elements) return false;
			Object.keys(this.elements).forEach(function(key) {
				var iname = this.elements[key];
				this[iname] = Composer.find(this.el, key);
			}.bind(this));
		}
	});

	this.Composer.merge_extend(Controller, ['events', 'elements']);

	this.Composer.exp0rt({ Controller: Controller });
}).apply((typeof exports != 'undefined') ? exports : this);

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

			this.with_bind(collection, 'clear', function(options) {
				this.clear_subcontrollers();
			}.bind(this));
			this.with_bind(collection, 'add', function(model, _, options) {
				this.add_subcontroller(model, create_fn, options);
			}.bind(this));
			this.with_bind(collection, 'remove', function(model) {
				this.remove_subcontroller(model);
			}.bind(this));
			if(options.bind_reset)
			{
				this.with_bind(collection, 'reset', function(options) {
					this.reset_subcontrollers(create_fn, options);
				}.bind(this));
			}
			this.reset_subcontrollers(create_fn);
		},

		release: function()
		{
			this.clear_subcontrollers();
			return this.parent.apply(this, arguments);
		},

		/**
		 * Index a controller so it can be looked up by the model is wraps
		 */
		index_controller: function(model, controller)
		{
			if(!model) return false;
			this._subcontroller_idx[model.cid()] = controller;
			this._subcontroller_list.push(controller);
		},

		/**
		 * Unindex a model -> controller lookup
		 */
		unindex_controller: function(model, controller)
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
		lookup_controller: function(model)
		{
			if(!model) return false;
			return this._subcontroller_idx[model.cid()];
		},

		/**
		 * Untrack all subcontrollers, releasing each one
		 */
		clear_subcontrollers: function()
		{
			this._subcontroller_list.forEach(function(con) {
				con.release();
			});
			this._subcontroller_list = [];
			this._subcontroller_idx = {};
		},

		/**
		 * Sync the tracked subcontrollers with the items in the wrapped
		 * collection
		 */
		reset_subcontrollers: function(create_fn, options)
		{
			this.clear_subcontrollers();
			this._collection.each(function(model) {
				this.add_subcontroller(model, create_fn, options);
			}, this);
		},

		/**
		 * Given a model, create a subcontroller that wraps it and inject the
		 * subcontroller at the correct spot in the DOM (based on the model's
		 * sort order).
		 */
		add_subcontroller: function(model, create_fn, options)
		{
			var con = create_fn(model, options);
			this.index_controller(model, con);

			// if the subcontroller releases itself, be sure to remove it from
			// tracking
			con.bind('release', function() {
				this.unindex_controller(model, con);
			}.bind(this));

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

		/**
		 * Given a model, lookup the subcontroller that wraps it and release it,
		 * also untracking that subcontroller.
		 */
		remove_subcontroller: function(model)
		{
			var con = this.lookup_controller(model);
			if(!con) return false;
			con.release();
			this.unindex_controller(model, con);
		}
	});
	this.Composer.exp0rt({ ListController: ListController });
}).apply((typeof exports != 'undefined') ? exports : this);

/**
 * router.js
 *
 * Provides tie-ins to URL state changes to route URLs to actions.
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
(function(global, undefined) {
	"use strict";

	var global = this;

	/**
	 * The Router class is a utility that helps in the routing of requests to
	 * certain parts of your application. It works either by history.pushState
	 * (which is highly recommended) or by falling back onto hashbang url
	 * support (not recommended).
	 *
	 * Note that if you do want to use pushState, you have to include History.js
	 * before instantiating the Router class:
	 *
	 *   https://github.com/balupton/History.js/
	 */
	var Router = Composer.Base.extend({
		/**
		 * Track this object's type. Useful for debugging, mainly
		 */
		__composer_type: 'router',

		last_path:	false,
		_last_url:	null,
		routes:		{},

		options: {
			suppress_initial_route: false,
			enable_cb: function(url) { return true; },
			process_querystring: false,
			base: false
		},

		/**
		 * initialize the routes your app uses. this is really the only public
		 * function that exists in the router, since it takes care of everything for
		 * you after instantiation.
		 */
		initialize: function(routes, options)
		{
			this.set_options(options);

			this.routes = routes;
			this.bind('route', this._do_route.bind(this));

			// in case History.js isn't loaded
			if(!global.History) global.History = {enabled: false};
			if(!History.enabled) throw 'History.js is *required* for proper router operation: https://github.com/browserstate/history.js';

			// set up our bindings
			this.bind('statechange', this.state_change.bind(this));
			this.bind_once('destroy', function() {
				Object.keys(History.Adapter.handlers).forEach(function(key) {
					delete History.Adapter.handlers[key];
				});
				delete global['onstatechange'];
			});

			History.Adapter.bind(global, 'statechange', function(data) {
				data || (data = [this.cur_path()]);
				var url = data[0];
				var force = data[1];
				this.trigger('statechange', url, force);
			}.bind(this));

			if(!this.options.suppress_initial_route)
			{
				// run the initial route
				History.Adapter.trigger(global, 'statechange', [this.cur_path()]);
			}
		},

		/**
		 * remove all router bindings and perform any cleanup. note that once
		 * this is called, the router can no longer be used and a new one must
		 * be created.
		 */
		destroy: function()
		{
			this.trigger('destroy');
			this.unbind();
		},

		debasify: function(path)
		{
			if(this.options.base && path.indexOf(this.options.base) == 0)
			{
				path = path.substr(this.options.base.length);
			}
			return path;
		},

		/**
		 * get the current url path
		 */
		cur_path: function()
		{
			if(History.emulated.pushState)
			{
				var path = '/' + new String(global.location.hash).toString().replace(/^[#!\/]+/, '');
			}
			else
			{
				var path = global.location.pathname+global.location.search;
			}
			return this.debasify(unescape(path));
		},

		/**
		 * Get a value (by key) out of the current query string
		 */
		get_param: function(search, key)
		{
			key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
			var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
			var results = regex.exec(search);
			return results == null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
		},

		/**
		 * wrapper around the routing functionality. basically, instead of doing a
		 *   window.location = '/my/route';
		 * you can do
		 *   router.route('/my/route');
		 *
		 * Note that the latter isn't necessary, but it provides a useful abstraction.
		 */
		route: function(url, options)
		{
			url || (url = this.cur_path());
			options || (options = {});
			options.state || (options.state = {});

			var base = (this.options.base || '');
			var href = base + '/' + url.trim().replace(/^[a-z]+:\/\/.*?\//, '').replace(/^[#!\/]+/, '');
			var old = base + this.cur_path();
			if(old == href)
			{
				this.trigger('statechange', href, true);
			}
			else if(History.emulated.pushState)
			{
				// we're using hashbangs, which are async (if we use
				// History.pushState). we really want sync behavior so let's
				// fool History into thinking it already routed this hash (so it
				// doesn't double-fire) then trigger the event manually.
				History.saveHash(url);		// makes History.js not fire on hash
				window.location.hash = '#'+href;
				this.trigger('statechange', href, true);
			}
			else
			{
				if(options.replace_state)
				{
					History.replaceState(options.state, '', href);
				}
				else
				{
					History.pushState(options.state, '', href);
				}
			}
		},

		/**
		 * given a url, route it within the given routes the router was instantiated
		 * with. if none fit, do nothing =]
		 *
		 * *internal only* =]
		 */
		_do_route: function(url, routes)
		{
			if(!this.options.enable_cb(url))
			{
				return false;
			}

			// allow passing in of routes manually, otherwise default to internal route table
			routes || (routes = this.routes);

			var routematch = this.find_matching_route(url, routes);
			if(!routematch)
			{
				return this.trigger('fail', {url: url, route: false, handler_exists: false, action_exists: false});
			}

			var route = routematch.route;
			var match = routematch.args;

			var obj = route[0];
			var action = route[1];
			if (typeof(obj) != 'object') {
				if(!global[obj])
				{
					return this.trigger('fail', {url: url, route: route, handler_exists: false, action_exists: false});
				}
				var obj = global[obj];
			}
			if(!obj[action] || typeof(obj[action]) != 'function')
			{
				return this.trigger('fail', {url: url, route: route, handler_exists: true, action_exists: false});
			}
			var args = match;
			args.shift();
			this._last_url = url;	// save the last successfully routed url
			this.trigger('route-success', route);
			obj[action].apply(obj, args);
		},

		/**
		 * Stateless function for finding the best matching route for a URL and given
		 * set of routes.
		 */
		find_matching_route: function(url, routes)
		{
			var url = '/' + url.replace(/^!?\//g, '');
			var route = false;
			var match = [];
			var regex = null;
			for(var re in routes)
			{
				regex = new RegExp('^' + re.replace(/\//g, '\\\/') + '$');
				match = regex.exec(url);
				if(match)
				{
					route = routes[re];
					break;
				}
			}
			if(!route) return false;

			return {route: route, args: match, regex: regex};
		},

		/**
		 * attached to the pushState event. fires the `route` event on success
		 * which in turns runs any attached handlers.
		 */
		state_change: function(path, force)
		{
			if(path && path.stop != undefined) path = false;
			if(path) path = this.debasify(path);
			if(!path) path = this.cur_path();
			force = !!force;

			// check if we are routing to the same exact page. if we are, return
			// (unless we force the route)
			if(this.last_path == path && !force)
			{
				// no need to reload
				return false;
			}

			this.last_path = path;

			// remove querystring from the url if we have set the Router to
			// ignore it. Note that this happens after the same-page check since
			// we still want to take QS into account when comparing URLs.
			if(!this.options.process_querystring) path = path.replace(/\?.*/, '');

			// allow preroute to modify the path before sending out to the
			// actualy route-matching function.
			path = new String(path);
			var boxed = {path: path};
			this.trigger('preroute', boxed);
			this.trigger('route', boxed.path);
		},

		/**
		 * Returns the full, last successfully routed URL that the Router found
		 * a match for.
		 */
		last_url: function()
		{
			return this._last_url;
		},

		/**
		 * Bind the pushState to any links that don't have the options.exclude_class
		 * className in them.
		 */
		bind_links: function(options)
		{
			options || (options = {});

			// bind all <a>'s
			var selector = 'a';
			if(options.selector)
			{
				// use specified selector
				selector = options.selector;
			}
			else if(options.exclude_class)
			{
				// exclude <a> tags with given classname
				selector = 'a:not([class~="'+options.exclude_class+'"])';
			}

			// bind our heroic pushState to the <a> tags we specified. this
			// hopefully be that LAST event called for any <a> tag because it's
			// so high up the DOM chain. this means if a composer event wants to
			// override this action, it can just call event.stop().
			var route_link = function(e)
			{
				if(e.ctrlKey || e.shiftKey || e.altKey) return;

				var a = Composer.find_parent(selector, e.target);
				var button = typeof(e.button) != 'undefined' ? e.button : e.event.button;

				// don't trap links that are meant to open new windows, and don't
				// trap middle mouse clicks (or anything more than left click)
				if(a.target == '_blank' || button > 0) return;

				// don't run JS links
				if(a.href.match(/^javascript:/)) return;

				// this is an <a href="#"> link, ignore it
				if(History.emulated.pushState && a.href.replace(/^.*?#/, '') == '') return;

				var curhost = global.location.host;
				var linkhost = a.href.match(/^[a-z]+:\/\//) ? a.href.replace(/[a-z]+:\/\/(.*?)\/.*/i, '$1') : curhost;

				// if we're routing to a different domain/host, don't trap the click
				if(curhost != linkhost) return;

				// if our do_state_change exists and returns false, bail
				if(options.do_state_change && !options.do_state_change(a)) return;

				if(e) e.preventDefault();

				var href = a.href.replace(/^[a-z]+:\/\/.*?\//, '').replace(/^[#!\/]+/, '');
				if(options.filter_trailing_slash) href = href.replace(/\/$/, '');
				href = '/'+href;

				this.route(href, {state: options.global_state});
				return;
			}.bind(this);

			Composer.add_event(document.body, 'click', route_link, selector);
		}
	});

	this.Composer.exp0rt({ Router: Router });
}).apply((typeof exports != 'undefined') ? exports : this);

/**
 * relational.js
 *
 * An extension of the Model to allow hierarchical data structures.
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

	var global = this;

	var RelationalModel = Composer.Model.extend({
		relations: false,
		relation_data: {},

		// if true, toJSON will just call Model.toJSON instead of serializing
		// the relational data
		skip_relational_serialize: false,

		initialize: function(data, options)
		{
			options || (options = {});

			if(this.relations)
			{
				// cache the model/collection strings to real objects
				Composer.object.each(this.relations, function(relation, k) {
					// for each relation, make sure strings are referenced back to the catual
					// objects they refer to.
					if(relation.model && typeof(relation.model) == 'string')
					{
						relation.model = Composer.object.get(global, relation.model);
					}
					else if(relation.collection && typeof(relation.collection) == 'string')
					{
						relation.collection = Composer.object.get(global, relation.collection);
					}
					else if(relation.filter_collection && typeof(relation.filter_collection) == 'string')
					{
						// set up the filter collection. if one doesn't exist, create a function
						// that looks within the keys of the relational data to pull a master
						// collection out of.
						relation.filter_collection = Composer.object.get(global, relation.filter_collection);
						var master = relation.master;
						if(typeof(master) == 'string')
						{
							var master_key = relation.master;
							relation.master = function()
							{
								var master = Composer.object.get(this.relation_data, master_key);
								if(!master)
								{
									master = new this.relations[master_key].collection();
									Composer.object.set(this.relation_data, master_key);
								}
								return master;
							}.bind(this);
							relation.master();
						}
					}

					// unless otherwise specified, load relational objects up-front
					if(!relation.delayed_init)
					{
						var obj = this._create_obj(relation, k, {set_parent: true});
					}
				}, this);
			}

			// call Model.initialize()
			return this.parent(data, options);
		},

		/**
		 * extension of Model.toJSON() that also serializes the child
		 * (relational) objects
		 */
		toJSON: function(options)
		{
			options || (options = {});

			var data = this.parent();
			if(options.raw) return data;

			if(this.skip_relational_serialize || options.skip_relational)
			{
				Object.keys(this.relations).forEach(function(key) {
					delete data[key];
				});
			}
			else
			{
				Object.keys(this.relations).forEach(function(k) {
					var obj = Composer.object.get(this.relation_data, k);
					if(!obj) return;
					Composer.object.set(data, k, obj.toJSON());
				}.bind(this));
			}

			return data;
		},

		/**
		 * extension of Model.set which creates sub-models/collections from the
		 * given data if specified by our relations
		 */
		set: function(data, options)
		{
			options || (options = {});

			if(this.relations && !options.skip_relational)
			{
				Composer.object.each(this.relations, function(relation, k) {
					var d = Composer.object.get(data, k);
					if(typeof(d) == 'undefined') return;

					var options_copy = Composer.object.clone(options);
					options_copy.data = d;
					var obj = this._create_obj(relation, k, options_copy);
				}, this);
			}

			// call Model.set()
			return this.parent(data, options);
		},

		/**
		 * extension of Model.get which returns our relational data if it exists
		 */
		get: function(key, def)
		{
			var obj = Composer.object.get(this.relation_data, key);
			if(typeof(obj) != 'undefined') return obj;

			// call Model.get()
			return this.parent(key, def);
		},

		/**
		 * clear this model's data *and* its related sub-objects
		 */
		clear: function(options)
		{
			options || (options = {});

			if(this.relations && !options.skip_relational)
			{
				Composer.object.each(this.relations, function(relation, k) {
					var obj = Composer.object.get(this.relation_data, k);
					if(typeof(obj) == 'undefined') return;
					if(obj.clear && typeof(obj.clear) == 'function') obj.clear();
				}, this);
			}

			// call Model.clear()
			return this.parent.apply(this, arguments);
		},

		/**
		 * a wrapper around bind that makes sure our relational objects exist
		 */
		bind_relational: function(key)
		{
			var relation = this.relations[key];
			if(!relation) return false;

			var obj = this._create_obj(relation, key);

			// bind the event to the object
			var args = Array.prototype.slice.call(arguments, 0);
			obj.bind.apply(obj, args.slice(1));
		},

		/**
		 * a wrapper around unbind that makes sure our relational objects exist
		 */
		unbind_relational: function(key)
		{
			var relation = this.relations[key];
			if(!relation) return false;

			// grab the object and unbind the event
			var obj = Composer.object.get(this.relation_data, key);
			if(!obj) return false;
			var args = Array.prototype.slice.call(arguments, 0);
			obj.unbind.apply(obj, args.slice(1));
		},

		/**
		 * creates a reference to the parent (owning) object from the child
		 */
		set_parent: function(parent, child)
		{
			child.get_parent = function() { return parent; };
		},

		/**
		 * get a sub-object's parent
		 */
		get_parent: function(child)
		{
			return child.get_parent();
		},

		/**
		 * wrapper around creation/retrieval of relational sub-objects
		 */
		_create_obj: function(relation, obj_key, options)
		{
			options || (options = {});
			var _data = options.data;
			delete options.data;

			// check if the object being passed in is already a Composer object
			if(_data && _data.__composer_type && _data.__composer_type != '')
			{
				// yes, we passed in a composer object...set it directly into
				// the relational data as a replacement for the old one.
				// TODO: maybe provide an option to specify replace/update
				var obj = _data;
			}
			else
			{
				// data passed is just a plain old object (or, at least, not a
				// Composer object). set the data into the relation object.
				var obj = Composer.object.get(this.relation_data, obj_key);
				var collection_or_model = (relation.collection || relation.filter_collection) ?
											'collection' : 'model';
				switch(collection_or_model)
				{
				case 'model':
					obj || (obj = new relation.model());
					if(options.set_parent) this.set_parent(this, obj);	// NOTE: happens BEFORE setting data
					if(_data) obj.set(_data, options);
					break;
				case 'collection':
					if(!obj)
					{
						if(relation.collection)
						{
							obj = new relation.collection();
						}
						else if(relation.filter_collection)
						{
							obj = new relation.filter_collection(relation.master(), Composer.object.merge({skip_initial_sync: true}, relation.options));
						}
					}
					if(options.set_parent) this.set_parent(this, obj);	// NOTE: happens BEFORE setting data
					if(_data) obj.reset(_data, options);
					break;
				}
			}

			// set the object back into our relational data objects
			Composer.object.set(this.relation_data, obj_key, obj);
			this.trigger('relation', obj, obj_key);
			this.trigger('relation:'+obj_key, obj);
			return obj;
		}
	});

	this.Composer.merge_extend(RelationalModel, ['relations']);

	this.Composer.exp0rt({
		HasOne: -1,		// no longer used but needed for backwards compat
		HasMany: -1,	// " "
		RelationalModel: RelationalModel
	});
}).apply((typeof exports != 'undefined') ? exports : this);

/**
 * filtercollection.js
 *
 * Provides a collection type that utilizes automatic filtering to create what
 * are essentially materialized views.
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
	 * Collection that exists solely to be a "materialized view" of another
	 * "master" collection. Whenever items are added/removed from the master
	 * collection, the changes are filtered and applied to this collection as well.
	 * This is useful for keeping many collections in sync with one master list
	 * without having to manually update them all.
	 */
	var FilterCollection = Composer.Collection.extend({
		/**
		 * Track this object's type. Useful for debugging, mainly
		 */
		__composer_type: 'filtercollection',

		// holds the master collection, used to derive the items in this
		// filtercollection
		master: null,

		// the filter function, used to determine if a model should be included
		// in the filtercollection's results
		filter: function() { return true },

		// transformation function, called on a model when it's added or removed
		// to the collection
		transform: null,

		// if set to an integer will limit the amount of models this collection
		// will keep (post sort)
		limit: false,

		options: {
			forward_all_events: false,
			refresh_on_change: false,	// performance hit, but needed for backward compat
			sort_event: false			// if true, fires a 'sort' event instead of 'reset' when sorting
		},

		initialize: function(master, options)
		{
			options || (options = {});

			var optkeys = Object.keys(this.options);
			Object.keys(options).forEach(function(k) {
				var v = options[k];
				if(typeof(v) == 'function') v = v.bind(this);
				if(optkeys.indexOf(k) >= 0)
				{
					this.options[k] = v;
				}
				else
				{
					this[k] = v;
				}
			}.bind(this));

			// call Base.initialize
			this.parent();

			this.master = master;

			if(!this.master) return false;
			if(!this.filter) return false;

			this.attach(options);
			if(!options.skip_initial_sync) this.refresh();
		},

		/**
		 * bind our events to the master collection and start filtering
		 */
		attach: function()
		{
			this.master.bind('all', this.match_action.bind(this), 'filtercollection:'+this.cid()+':all');
			this.bind('reset', function(options) {
				options || (options = {});
				if(options.has_reload) return false;
				this.refresh(options);
			}.bind(this), 'filtercollection:reset');
		},

		/**
		 * detach from the master collection (stop listening and filtering)
		 */
		detach: function()
		{
			this.master.unbind('all', 'filtercollection:'+this.cid()+':all');
			this.unbind('reset', 'filtercollection:reset');
		},

		/**
		 * internal function used to match events from the master collection.
		 */
		match_action: function(event, model)
		{
			var args = Array.prototype.slice.call(arguments, 0);
			switch(event)
			{
			case 'add':
				this.add_event(model, {from_event: true}); break;
			case 'reset':
				this.refresh(); break;
			case 'clear':
				this.clear(); break;
			case 'remove':
				this.remove_event(model, {from_event: true}); break;
			case 'change':
				this.change_event(model, {}, args); break;
			case 'sort':
				this.refresh(); break;
			default:
				this.forward_event(event, model, args); break;
			}
		},

		/**
		 * match our models to the master collection
		 *
		 * works by filtering the master's models then comparing the original
		 * models to the new (filtered) ones and firing the add/remove events
		 * for each model respectively.
		 *
		 * also performs sorting/limiting.
		 */
		refresh: function(options)
		{
			options || (options = {});

			if(options.diff_events)
			{
				var old_models = this._models;
			}
			this._models = this.master._models.filter(function(model) {
				return this.filter(model, this);
			}.bind(this));
			this.sort({silent: true});
			if(this.limit) this._models.splice(this.limit, this._models.length);
			if(options.diff_events)
			{
				var arrdiff = function(arr1, arr2) { return arr1.filter(function(el) { return arr2.indexOf(el) < 0; }); };

				arrdiff(old_models, this._models).forEach(function(model) {
					this.fire_event('remove', options, model);
				}, this);

				arrdiff(this._models, old_models).forEach(function(model) {
					this.fire_event('add', options, model);
				}, this);
			}
			this.fire_event('reset', options, {has_reload: true});
		},

		/**
		 * fired when a model changes. when this happens, we have to make sure
		 * the model still meets the filtercollection's criteria so we call
		 * tihs.filter on it to see if it "fits in."
		 */
		change_event: function(model, options, forward_args)
		{
			options || (options = {});

			// see if this model even belongs to this collection
			if(!model || (this.models().indexOf(model) < 0 && !this.filter(model, this))) return false;

			// track the current number of items and reloda the data
			var num_items = this._models.length;

			if(this.options.refresh_on_change)
			{
				// the brute force option (re-sort everything, re-filter everything)
				// VERY expensive
				this.refresh({silent: true});
			}
			else
			{
				// a more tactful approach
				var cur_index = this._models.indexOf(model);
				var new_index = this.sort_index(model);

				if(cur_index == -1 && this.filter(model, this))
				{
					// welcome to the team!
					this.add(model, options);
				}
				else if(cur_index > -1 && !this.filter(model, this))
				{
					// we feel that your interests no longer align with the team's
					// ...we're going to have to let you go.
					//
					// You BASTARDS I've poured my LIFE into this collection!!
					//
					// Yes and we're thankful for your hard work, but feel it's
					// time to move on. Your replacement is a potted plant (come
					// to think of it, so is your severance). Think of this as a
					// new beginning! Now get out of my office.
					this.remove(model, options);
				}
				else if(cur_index != new_index)
				{
					// sort order changed
					if(this.options.sort_event)
					{
						this.sort(Composer.object.merge({}, options, {silent: true}));
						this.fire_event('sort', options);
					}
					else
					{
						this.sort(options);
					}
				}
			}

			// if the number of elements in the FC changed, just fire a standard
			// "change" event (with the forwarded args), otherwise the change
			// triggered a membership change, so fire a "reset"
			if(this._models.length == num_items)
			{
				forward_args.shift();
				var args = ['change', options].concat(forward_args);
				this.fire_event.apply(this, args);
			}
			else
			{
				this.fire_event('reset', options);
			}
		},

		/**
		 * extension of Collection.add that makes sure our model passes the
		 * filter test, and also adds the model into the master collection
		 * instead of the filtercollection's models dircetly.
		 */
		add: function(data, options)
		{
			if (Composer.array.is(data))
			{
				return Composer.object.each(data, function(model) { this.add(model, options); }, this);
			}
			
			options || (options = {});
			if(typeof(options.transform) == 'undefined') options.transform = true;

			// if we are passing raw data, create a new model from data
			var model = data.__composer_type == 'model' ? data : new this.master.model(data, options);

			if(this.transform && options.transform)
			{
				model = this.transform.call(this, model, 'add');
			}

			// model doesn't match filter. NICE TRY
			if(!this.filter(model, this)) return false;

			if(typeof(options.at) == 'number')
			{
				// find the correct insertion point in the master it options.at is set.
				var current = this.at(options.at);
				var master_idx = this.master.index_of(current);
				if(master_idx !== false)
				{
					options.at = master_idx;
				}
			}
			
			// if this model exists in the master already, we call our special
			// _do_add method, which manually adds, sorts, and limits for us.
			// otherwise, we just call master.add() and the model will be added
			// here via our wonderful events
			if(this.master.index_of(model))
			{
				this._do_add(model, options);
			}
			else
			{
				this.master.add(model, options);
				if(this.limit) this._models.splice(this.limit);
			}
			return model;
		},

		/**
		 * Manually add a model to this collection. Sorts and limits as well.
		 */
		_do_add: function(model, options)
		{
			// master already has item, so we don't need to add it to
			// master (it will just fire "upsert"). what we need is to
			// add the model to this collection's models, sorted, and
			// apply the limit.
			this._models.push(model);
			var old_idx = this._models.indexOf(model);
			this.sort({silent: true});
			var new_idx = this._models.indexOf(model);
			if(this.limit) this._models.splice(this.limit);
			// after sort/limit, model may not actually be in the FC, so
			// check before wildly firing add/sort events
			if(this.index_of(model))
			{
				// model was actually added, fire "add" event
				this.fire_event('add', options, model, this, options);
				if(old_idx != new_idx)
				{
					// sort changed! fire appropriate event
					if(this.options.sort_event)
					{
						this.fire_event('sort', options);
					}
					else
					{
						this.fire_event('reset', options);
					}
				}
			}
		},

		/**
		 * extension of Colleciton.remove that removes the model from the
		 * collection but only if it exists
		 */
		remove: function(model, options)
		{
			if (Composer.array.is(model))
			{
				return Composer.object.each(model, function(m) { this.remove(m); }, this);
			}
			
			options || (options = {});
			if(typeof(options.transform) == 'undefined') options.transform = true;

			if(this._models.indexOf(model) < 0) return false;

			if(this.transform && options.transform)
			{
				model = this.transform.call(this, model, 'remove');
			}

			// remove the model
			Composer.array.erase(this._models, model);

			this.fire_event('remove', options, model);

			// remove the model from the collection
			this._remove_reference(model);
		},

		add_event: function(model, options)
		{
			if(!this.filter(model, this)) return false;
			this.refresh({silent: true});
			if(this.options.sort_event) this.fire_event('sort', options);
			this.fire_event('add', options, model, this, options);
		},

		remove_event: function(model, options)
		{
			if(this._models.indexOf(model) < 0) return false;
			this.refresh({silent: true});
			this.fire_event('remove', options, model);
		},

		forward_event: function(event, model, args)
		{
			// return if not forwarding events
			if(!this.options.forward_all_events) return false;

			// we're forwarding events, but we're not about to forward them for
			// a model that doesn't "fit in" around here
			if(model && model.__composer_type == 'model' && !this.filter(model, this))
			{
				return false;
			}
			this.trigger.apply(this, args);
		}
	});

	this.Composer.exp0rt({ FilterCollection: FilterCollection });
}).apply((typeof exports != 'undefined') ? exports : this);

