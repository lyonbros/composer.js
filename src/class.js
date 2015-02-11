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
	var extend_parent = function(to, from, k)
	{
		return function()
		{
			if(!this.$state.parents[k]) this.$state.parents[k] = [];
			this.$state.parents[k].push(from);
			this.$state.fn.push(k);
			var val = to.apply(this, arguments);
			this.$state.fn.pop();
			this.$state.parents[k].pop();
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
				from[k] = extend_parent(from[k], into[k], k);
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
			this.$state = {parents: {}, fn: []};
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
			var k = this.$state.fn[this.$state.fn.length - 1];
			if(!k) return false;
			var parents = this.$state.parents[k];
			var parent = parents[parents.length - 1];
			return parent || false;
		};
		cls.prototype.parent = function()
		{
			var fn = this.$get_parent();
			if(fn) return fn.apply(this, arguments);
			throw 'Class.js: Bad parent method: '+ this.$state.fn[this.$state.fn.length - 1];
		};

		return cls;
	};

	// wrap base class so we can call it directly or as .extend()
	function Class(obj) { return Base.extend(obj); };
	Class.extend = Class;

	this.Composer.exp0rt({ Class: Class });

}).apply((typeof exports != 'undefined') ? exports : this);

