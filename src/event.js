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

