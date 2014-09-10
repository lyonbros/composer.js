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

	// Composer equality function. It replaces _.eq, which wasn't able to tell
	// non-equality between {key1: 3} and {key1: 3, key2: 5} (said they were
	// equal). This was causing some events to not fire in Composer, prompting
	// me to write our own equality function. It might have just been the release
	// we were using, but I'm too lazy to go in and re-update _.eq to not have
	// other _ dependencies. Writing our own is a bit easier.
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
			Composer.merge_extend(cls, properties);
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
		clone: function(obj)
		{
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
		}
	};

	var promisify = function()
	{
		var create_converter = function(type)
		{
			return function(key)
			{
				var options = arguments[1] || {};
				var options_idx = options.options_idx || 0;
				var names = options.names || ['success', 'error'];

				var _old = Composer[type].prototype[key];
				Composer[type].prototype[key] = function()
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
					return new Promise(function(resolve, reject) {
						if(names[0]) options[names[0]] = resolve;
						if(names[1]) options[names[1]] = reject;
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

	Composer.exp0rt({
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

