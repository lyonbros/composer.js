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

