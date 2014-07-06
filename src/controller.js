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

		// holds events bound with with_bind
		_bound_events: [],

		// the DOM element to tie this controller to (a container element)
		el: false,

		// if this is set to a DOM *selector*, then this.el will be ignored and
		// instantiated as a new Element(this.tag), then injected into the element
		// referened by the this.inject selector. this allows you to inject
		// controllers into the DOM
		inject: false,

		// if this.el is empty, create a new element of this type as the container
		tag: 'div',

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

			// assign the unique app id
			this._cid = Composer.cid();

			// make sure we have an el
			this._ensure_el();

			if(this.inject)
			{
				this.attach(options);
			}

			if(this.className)
			{
				this.el.addClass(this.className);
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
		 * bind an event that the controller tracks and unbinds on release
		 */
		with_bind: function(object, ev, fn, name)
		{
			name || (name = false);
			object.bind(ev, fn, name);
			this._bound_events.push([object, ev, fn]);
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
			if(this.el.parentNode) this.el.parentNode.removeChild(this.el);
			this.el = false;

			// auto-remove bound events
			this._bound_events.forEach(function(binding) {
				var obj = binding[0];
				var ev = binding[1];
				var fn = binding[2];
				obj.unbind(ev, fn);
			});

			this.fire_event('release', options, this);

			// remove all events from controller
			if(!options.keep_events) this.unbind();
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
					this.el.removeEventListener(evname, fn, false);
					this.el.addEventListener(evname, fn, false);
				}
				else
				{
					this.el.addEventListener(evname, function(ev) {
						var target = ev.target || ev.srcElement;
						if(ev.__composer_handled || !Composer.match(target, selector)) return false;
						ev.__composer_handled = true;
						fn(ev);
					});
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

	var _extend = Controller.extend;
	Controller.extend = function(def, base)
	{
		base || (base = this);
		var attr = base.prototype;
		var base_events = attr.events;
		var base_elements = attr.elements;

		def.events = Composer.object.merge({}, base_events, def.events);
		def.elements = Composer.object.merge({}, base_elements, def.elements);

		var cls = _extend.call(base, def);
		cls.extend = function(def)
		{
			return base.extend(def, cls);
		};
		return cls;
	};

	Composer.export({ Controller: Controller });
})();

