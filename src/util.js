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
		export: function(obj)
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
		if(a instanceof Array)
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
			if ( a.constructor !== b.constructor ) return false;
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
				if(arr[i] == item) arr.splice(i, 1);
			}
		}
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

	Composer.export({
		sync: sync,
		cid: cid,
		wrap_error: wrap_error,
		eq: eq,
		merge_extend: merge_extend,
		array: array,
		object: object
	});
}).apply((typeof exports != 'undefined') ? exports : this);

