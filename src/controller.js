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
 * Copyright (c) 2011, Lyon Bros LLC. (http://www.lyonbros.com)
 * 
 * Licensed under The MIT License. 
 * Redistributions of files must retain the above copyright notice.
 */
(function() {
	"use strict";
	var Composer = this.Composer;

	// whether or not to enable xdom rendering
	var xdom = false;

	/**
	 * This function is responsible for
	 *  - diffing elements via our xdom object
	 *  - scheduling rendering/patching of the DOM
	 *  - batching patches so they happen on the browser's animation frame
	 *  - patching the DOM using the diff we got
	 *  - letting the callers know when the updates happened
	 */
	var schedule_render = (function() {
		var diffs = [];
		var scheduled = false;
		return function(from, to, options, callback) {
			options || (options = {});

			diffs.push([from, Composer.xdom.diff(from, to, options), options, callback]);
			if(scheduled) return;
			scheduled = true;
			Composer.frame(function() {
				scheduled = false;
				var diff_clone = diffs.slice(0);
				diffs = [];
				var cbs = [];
				diff_clone.forEach(function(entry) {
					var from = entry[0];
					var diff = entry[1];
					var options = entry[2];
					var cb = entry[3];
					Composer.xdom.patch(from, diff, options);
					if(cb) cbs.push(cb);
				});
				// run our callbacks after we run our DOM updates
				cbs.forEach(function(cb) { cb(); });
			});
		};
	})();

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

		// if true, enables XDOM just for this controller
		xdom: false,

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
		initialize: function(params, options) {
			options || (options = {});

			for(var x in params) {
				this[x] = params[x];
			}

			// call Base.initialize
			this.parent();

			// make sure we have an el
			this._ensure_el();

			if(this.inject) this.attach(options);

			// backwards compat
			if(this.className) this.class_name = this.className;
			if(this.class_name) {
				this.el.className += ' '+this.class_name;
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
		html: function(obj, options) {
			options || (options = {});
			if(!this.el) this._ensure_el();

			var append = function(el, child) {
				if(typeof(child) == 'string') {
					el.innerHTML = child;
				} else {
					el.innerHTML = '';
					el.appendChild(child);
				}
			};

			if(xdom || this.xdom) {
				var el = document.createElement(this.tag);
				append(el, obj);
				var cb = options.complete;
				var ignore_elements = options.ignore_elements || [];
				var ignore_children = options.ignore_children || [];
				ignore_elements = ignore_elements.concat(
					Object.keys(this._subcontrollers)
						.map(function(name) { return this._subcontrollers[name].el; }.bind(this))
						.filter(function(el) { return !!el; })
				);
				options.ignore_elements = ignore_elements;
				options.children_only = true;
				schedule_render(this.el, el, options, function() {
					// if we released mid-render (yes, this happens) then skip
					// the rest of the render
					if(this._released) return;
					this.refresh_elements();
					if(cb) cb();
					this.trigger('xdom:render');
				}.bind(this));
			} else {
				append(this.el, obj);
				this.refresh_elements();
			}
		},

		/**
		 * injects the controller's element into the DOM.
		 */
		attach: function(options) {
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
		_with_binder: function(bind_fn, object, ev, fn, name) {
			name || (name = false);
			var wrapped = function() {
				if(this._released) return;
				fn.apply(this, arguments);
			}.bind(this);
			bind_fn.call(object, ev, wrapped, name);
			this._bound_events.push([object, ev, wrapped]);
		},

		/**
		 * bind an event that the controller tracks and unbinds on release
		 */
		with_bind: function(object, ev, fn, name) {
			return this._with_binder(object.bind, object, ev, fn, name);
		},

		/**
		 * bind a event that the controller tracks and unbinds on release or
		 * that unbinds itself once it fires once
		 */
		with_bind_once: function(object, ev, fn, name) {
			return this._with_binder(object.bind_once, object, ev, fn, name);
		},

		/**
		 * keep track of a sub controller that will release when this controller
		 * does. If no creation function given, return the subcontroller under
		 * the given name.
		 */
		sub: function(name, create_fn) {
			if(!create_fn) return this._subcontrollers[name] || false;

			// if we have an existing controller with the same name, release and
			// remove it.
			this.remove(name);

			// create the new controller, track it, and make sure if it's
			// released we untrack it
			var instance = create_fn();
			instance.bind('release', this.remove.bind(this, name, {skip_release: true}));
			this._subcontrollers[name] = instance;
			return instance;
		},

		/**
		 * remove a subcontroller from tracking and (by default) release it
		 */
		remove: function(name, options) {
			options || (options = {});
			if(!this._subcontrollers[name]) return
			if(!options.skip_release) this._subcontrollers[name].release();
			delete this._subcontrollers[name];
		},

		trigger_subs: function(_) {
			var args = Array.prototype.slice.call(arguments, 0);
			Object.keys(this._subcontrollers).forEach(function(name) {
				var con = this.sub(name);
				if(con) con.trigger.apply(con, args);
			}.bind(this));
		},

		/**
		 * DEPRECATED. use sub()/remove()
		 */
		track_subcontroller: function() { return this.sub.apply(this, arguments); },
		get_subcontroller: function(name) { return this.sub.apply(this, arguments); },
		remove_subcontroller: function() { return this.remove.apply(this, arguments); },

		/**
		 * make sure el is defined as an HTML element
		 */
		_ensure_el: function() {
			// allow this.el to be a string selector (selecting a single element) instad
			// of a DOM object. this allows the defining of a controller before the DOM
			// element the selector refers to exists, but this.el will be updated upon
			// instantiation of the controller (presumably when the DOM object DOES
			// exist).
			if(typeof(this.el) == 'string') {
				this.el = Composer.find(document, this.el);
			}

			// if this.el is null (bad selector or no item given), create a new DOM
			// object from this.tag
			this.el || (this.el = document.createElement(this.tag));
		},

		/**
		 * remove the controller from the DOM and trigger its release event
		 */
		release: function(options) {
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
		replace: function(element) {
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
		delegate_events: function() {
			// setup the events given
			for(var ev in this.events) {
				var fn = this[this.events[ev]];
				if(typeof(fn) != 'function') {
					// easy, easy, whoa, you gotta calm down there, chuck
					continue;
				}
				fn = fn.bind(this);

				var match = ev.match(/^(\w+)\s*(.*)$/);
				var evname = match[1].trim();
				var selector = match[2].trim();

				if(selector == '') {
					Composer.remove_event(this.el, evname, fn);
					Composer.add_event(this.el, evname, fn);
				} else {
					Composer.add_event(this.el, evname, fn, selector);
				}
			}
		},

		/**
		 * re-init the elements into the scope of the controller (uses this.elements)
		 */
		refresh_elements: function() {
			// setup given elements as instance variables
			if(!this.elements) return false;
			Object.keys(this.elements).forEach(function(key) {
				var iname = this.elements[key];
				this[iname] = Composer.find(this.el, key);
			}.bind(this));
		}
	});

	Controller.xdomify = function() { xdom = true; };

	Composer.merge_extend(Controller, ['events', 'elements']);
	Composer.exp0rt({ Controller: Controller });
}).apply((typeof exports != 'undefined') ? exports : this);

