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
		_forwards: [],

		/**
		 * Forward events from this dispatcher to another. If the second
		 * dispatcher is given as a function, that function must return either
		 * another dispatcher or false. This lets you forward specific events at
		 * runtime based on data within the event.
		 */
		forward: function(to_or_function)
		{
			this._forwards.push(to_or_function);
			return this;
		},

		/**
		 * Determine if this dispatcher forwards to the given.
		 */
		forwards_to: function(to_or_function)
		{
			return this._forwards.indexOf(to_or_function) >= 0;
		},

		/**
		 * Undo a forward created by forward.
		 */
		unforward: function(to_or_function)
		{
			var idx = this._forwards.indexOf(to_or_function);
			if(idx < 0) return this;
			this._forwards.splice(idx, 1);
			return this;
		},

		/**
		 * Bind a function to an event. Optionally allows naming the binding so
		 * it can be removed later on without the reference to the bound
		 * function.
		 */
		bind: function(event_name, fn, bind_name)
		{
			if(event_name instanceof Array)
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
			if(event_name instanceof Array)
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

			if(!options.preserve_forwards) this._forwards = [];
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
			if(this._forwards.length > 0)
			{
				this._forwards.forEach(function(to) {
					if(to instanceof Event)
					{
						to.trigger.apply(to, args);
					}
					else if(to instanceof Function)
					{
						var to = to.apply(to, args);
						if(to instanceof Event)
						{
							to.trigger.apply(to, args);
						}
					}
				});
			}
			return this;
		}
	});

	Event._make_lookup_name = make_lookup_name;
	Composer.exp0rt({ Event: Event });
}).apply((typeof exports != 'undefined') ? exports : this);

