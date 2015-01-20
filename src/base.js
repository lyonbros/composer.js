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

