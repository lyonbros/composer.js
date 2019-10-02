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
 * Copyright (c) 2011, Lyon Bros LLC. (http://www.lyonbros.com)
 *
 * Licensed under The MIT License.
 * Redistributions of files must retain the above copyright notice.
 */
(function() {
	"use strict";
	var Composer = this.Composer;

	/**
	 * like typeof, but returns if it's an array or null
	 */
	var typeOf = function(obj) {
		if(obj == null) return 'null';
		var type = typeof(obj);
		if(type != 'object') return type;
		if(obj instanceof Array) return 'array';
		return type;
	};

	/**
	 * Merge object `from` into `into`
	 */
	var merge = function(into, from, options) {
		options || (options = {});
		var keys = Object.keys(from);
		var transform = options.transform;
		for(var i = 0, n = keys.length; i < n; i++) {
			var k = keys[i];
			if(transform) transform(into, from, k);
			into[k] = from[k];
		}
		return into;
	};

	/**
	 * Given an object, copy the subobjects/subarrays recursively
	 */
	var copy = function(obj) {
		// we can't do Object.keys or hasOwnProperty here because we actually
		// want to look at all inherited objects as well as owned objects.
		for(var k in obj) {
			var val = obj[k];
			var type = typeOf(val);
			if(type == 'object') {
				obj[k] = copy(merge({}, val));
			} else if(type == 'array') {
				obj[k] = val.map(copy);
			}
		}
		return obj;
	};

	/**
	 * Create a new class prototype from the given base class.
	 */
	var create = function(base, mixinsfn) {
		if('create' in Object) {
			// create the new object from the prototype
			var prototype = Object.create(base.prototype);
		} else {
			// of we won't have Object.create, then we need to let the object
			// know we want a bare instance (without initializing it)
			base.$initializing = true;
			var prototype = new base();
			delete base.$initializing;
		}

		var cls = function Omni() {
			// don't run the ctor if we're just trying to get a prototype
			if(cls.$initializing) return this;

			process_mixins(this, mixinsfn && mixinsfn());
			// if we don't copy the objects in the prototype, then if we have an
			// object in the prototype like so:
			// {
			//     count: {x: 0},
			//     ...
			// }
			//
			// Then by doing `new Counter().count.x = 5`, we set x=5 for the
			// entire prototype, and hence all the subsequent instantiations of
			// the class.
			copy(this);
			this.$state = {parents: {}, fn: []};
			return this.initialize ?  this.initialize.apply(this, arguments) : this;
		};
		cls.$constructor = prototype.$constructor = cls;
		cls.prototype = prototype;
		cls.prototype.$parent = base;

		return cls;
	};

	/**
	 * Wraps an overriding method to track its state so get_parent() can pull
	 * out the right function.
	 */
	var extend_parent = function(to, from, k) {
		return function() {
			if(!this.$state.parents[k]) this.$state.parents[k] = [];
			this.$state.parents[k].push(from);
			this.$state.fn.push(k);
			var val = to.apply(this, arguments);
			this.$state.fn.pop();
			this.$state.parents[k].pop();
			return val;
		};
	};

	const process_mixins = function(obj, mixins) {
		if(!Array.isArray(mixins) || mixins.length == 0) return;
		const is_obj = function(o) { return typeof(o) == 'object' && !Array.isArray(o); };
		const newobj = {};
		const do_mixin = function(mixin) {
			Object.keys(mixin).forEach(function(k) {
				const val = mixin[k];
				if(is_obj(val)) {
					newobj[k] = Object.assign({}, newobj[k] || {}, val);
				} else {
					newobj[k] = val;
				}
			});
		};
		mixins.forEach(function(mixin) {
			do_mixin(mixin.prototype);
		});
		Object.keys(newobj).forEach(function(k) {
			const val = newobj[k];
			if(typeof(obj[k]) == 'undefined') {
				obj[k] = val;
			} else if(is_obj(obj[k]) && is_obj(val)) {
				obj[k] = Object.assign(val, obj[k]);
			}
		});
	};

	/**
	 * Takes care of "parentizing" overridden methods when merging prototypes
	 */
	var do_extend = function(to_prototype, from_prototype) {
		return merge(to_prototype, from_prototype, {
			transform: function(into, from, k) {
				if(typeof into[k] != 'function' || into[k].prototype.$parent || typeof from[k] != 'function' || from[k].prototype.$parent) return false;
				from[k] = extend_parent(from[k], into[k], k);
				from[k].$parent = into[k];
			}
		});
	};

	/**
	 * Once base to rule them all (and in the darkness bind them)
	 */
	var Base = function() {};

	/**
	 * Main extension method, creates a new class from the given object
	 */
	Base.extend = function(obj) {
		var base = this;
		const mixinsfn = obj._mixins ? obj._mixins : false;
		delete obj._mixins;
		var cls = create(base, mixinsfn);
		do_extend(cls.prototype, obj);
		cls.extend = Base.extend;

		cls.prototype.$get_parent = function() {
			var k = this.$state.fn[this.$state.fn.length - 1];
			if(!k) return false;
			var parents = this.$state.parents[k];
			var parent = parents[parents.length - 1];
			return parent || false;
		};
		cls.prototype.parent = function() {
			var fn = this.$get_parent();
			if(fn) return fn.apply(this, arguments);
			throw 'Class.js: Bad parent method: '+ this.$state.fn[this.$state.fn.length - 1];
		};

		return cls;
	};

	// wrap base class so we can call it directly or as .extend()
	function Class(obj) { return Base.extend(obj); };
	Class.extend = Class;

	Composer.exp0rt({ Class: Class });

}).apply((typeof exports != 'undefined') ? exports : this);

