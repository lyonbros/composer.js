/**
 * adapter.js
 *
 * A jQuery/MooTools adapter for various DOM operations.
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

	var has_sizzle = !!global.Sizzle;
	var has_jquery = !!global.jQuery;
	var has_slick = !!global.Slick;

	var which_adapter = function(types)
	{
		var wrap = function(fn)
		{
			return function(context, selector) {
				context || (context = document);
				if(types.native && context instanceof window.DocumentFragment)
				{
					return types.native(context, selector);
				}
				else
				{
					return fn(context, selector);
				}
			};
		};
		if(has_slick && types.slick) return wrap(types.slick);
		if(has_sizzle && types.sizzle) return wrap(types.sizzle);
		if(has_jquery && types.jquery) return wrap(types.jquery);
		if('querySelector' in document && types.native) return wrap(types.native);
		throw new Error('No selector engine present. Include Sizzle/jQuery or Slick/Mootools before loading composer (or use a modern browser with document.querySelector).');
	};

	var find = which_adapter({
		slick: function(context, selector)
		{
			return Slick.find(context, selector);
		},
		sizzle: function(context, selector)
		{
			return Sizzle.select(selector, context)[0];
		},
		jquery: function(context, selector)
		{
			return jQuery(context).find(selector)[0];
		},
		native: (function() {
			var scope = false;
			try { document.querySelector(':scope > h1'); scope = true; }
			catch(e) {}

			return function(context, selector) {
				if(scope && !(context instanceof window.DocumentFragment)) selector = ':scope '+selector;
				return context.querySelector(selector);
			};
		})()
	});

	var match = which_adapter({
		slick: function(context, selector)
		{
			return Slick.match(context, selector);
		},
		sizzle: function(context, selector)
		{
			return Sizzle.matchesSelector(context, selector);
		},
		jquery: function(context, selector)
		{
			return jQuery(context).is(selector);
		},
		native: function(context, selector)
		{
			if('matches' in context) var domatch = context.matches;
			if('msMatchesSelector' in context) var domatch = context.msMatchesSelector;
			if('mozMatchesSelector' in context) var domatch = context.mozMatchesSelector;
			if('webkitMatchesSelector' in context) var domatch = context.webkitMatchesSelector;
			return domatch.call(context, selector);
		}
	});

	var captured_events = {
		'focus': true,
		'blur': true
	};
	var add_event = (function() {
		return function(el, ev, fn, selector) {
			var capture = captured_events[ev] || false;
			if(selector)
			{
				el.addEventListener(ev, function(event) {
					// if we have a mootools event class, wrap the event in it
					if(event && window.MooTools && window.DOMEvent) event = new DOMEvent(event);
					var target = event.target || event.srcElement;
					while(target)
					{
						if(match(target, selector))
						{
							fn.apply(this, [event].concat(event.params || []));
							break;
						}
						target = target.parentNode;
						if(target == el.parentNode || target == document.body.parentNode)
						{
							target = false;
						}
					}
				}, capture);
			}
			else
			{
				el.addEventListener(ev, function(event) {
					// if we have a mootools event class, wrap the event in it
					if(event && window.MooTools && window.DOMEvent) event = new DOMEvent(event);
					fn.apply(this, [event].concat(event.params || []));
				}, capture);
			}
		};
	})();

	var remove_event = (function() {
		return function(el, ev, fn) {
			el.removeEventListener(ev, fn, false);
		};
	})();

	var fire_event = (function() {
		/**
		 * NOTE: taken from http://stackoverflow.com/a/2381862/236331
		 *
		 * Fire an event handler to the specified node. Event handlers can
		 * detect that the event was fired programatically by testing for a
		 * 'synthetic=true' property on the event object
		 *
		 * @param {HTMLNode} node The node to fire the event handler on.
		 * @param {String} eventName The name of the event without the "on" (e.g., "focus")
		 */
		return function(el, type, options) {
			options || (options = {});

			if(type == 'click' && el.click)
			{
				return el.click();
			}

			var ev = new CustomEvent(type, options.args);
			el.dispatchEvent(ev);
		};
	})();

	var find_parent = function(selector, element, stop)
	{
		if(!element) return false;
		if(element == stop) return false;
		if(match(element, selector)) return element;
		var par = element.parentNode;
		return find_parent(selector, par);
	};

	var frame = function(cb) { global.requestAnimationFrame(cb); };

	/**
	 * our xdom system! provides hooks for diffing/patching the DOM, and also
	 * allows parts of itself to be replaced by different implementations.
	 */
	var xdom = {
		/**
		 * diff two DOM elements. in the default case, we use morphdom which
		 * does the diffing/patching in one call so we don't really need to do
		 * anything here, but other DOM patching libs may have discrete steps so
		 * we want to have a hook for it.
		 */
		diff: function(from, to, options)
		{
			return [from, to];
		},

		/**
		 * patch the DOM! uses morphdom by default. takes a root DOM node to
		 * patch and a patch to apply to it.
		 */
		patch: function(root, diff, options)
		{
			options || (options = {});

			if(!root || !diff[1]) return;
			var ignore_elements = options.ignore_elements || [];
			var ignore_children = options.ignore_children || [];
			return morphdom(root, diff[1], {
				// this callback preserves form input values (text, checkboxes,
				// radios, textarea, selects)
				onBeforeMorphEl: function(from, to) {
					if(options.reset_inputs) return;

					var tag = from.tagName.toLowerCase();
					switch(tag)
					{
					case 'input':
					case 'textarea':
						to.checked = from.checked;
						to.value = from.value;
						break;
					case 'select':
						to.value = from.value;
						break;
					}
				},
				onBeforeNodeDiscarded: function(node) {
					if(ignore_elements.indexOf(node) >= 0) return false;
				},
				onBeforeMorphElChildren: function(from, to) {
					if(ignore_children.indexOf(from) >= 0) return false;
				},
				childrenOnly: options.children_only
			});
		},

		/**
		 * allows hooking in your own DOM diffing/patching library
		 */
		hooks: function(options)
		{
			options || (options = {});
			var diff = options.diff;
			var patch = options.patch;

			if(diff) xdom.diff = diff;
			if(patch) xdom.patch = patch;
		}
	};

	this.Composer.exp0rt({
		find: find,
		match: match,
		add_event: add_event,
		fire_event: fire_event,
		remove_event: remove_event,
		find_parent: find_parent,
		frame: frame,
		xdom: xdom
	});
}).apply((typeof exports != 'undefined') ? exports : this);

