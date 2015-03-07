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
	var has_moo = !!global.MooTools;

	var find = (function() {
		if(has_slick)
		{
			return function(context, selector) {
				context || (context = document);
				return Slick.find(context, selector);
			};
		}
		else if(has_sizzle)
		{
			return function(context, selector) {
				context || (context = document);
				return Sizzle.select(selector, context)[0];
			};
		}
		else if(has_jquery)
		{
			return function(context, selector) {
				context || (context = document);
				return jQuery(context).find(selector)[0];
			};
		}
		else if('querySelector' in document)
		{
			var scope = false;
			try { document.querySelector(':scope > h1'); scope = true; }
			catch(e) {}

			return function(context, selector) {
				context || (context = document);
				if(scope) selector = ':scope '+selector;
				return context.querySelector(selector);
			};
		}
		throw new Error('No selector engine present. Include Sizzle/jQuery or Slick/Mootools before loading composer (or use a modern browser with document.querySelector).');
	})();

	var match = (function() {
		if(has_slick)
		{
			return function(element, selector) {
				element || (element = document);
				return Slick.match(element, selector);
			};
		}
		else if(has_sizzle)
		{
			return function(element, selector) {
				element || (element = document);
				return Sizzle.matchesSelector(element, selector);
			};
		}
		else if(has_jquery)
		{
			return function(element, selector) {
				element || (element = document);
				return jQuery(element).is(selector);
			};
		}
		else if('querySelector' in document)
		{
			return function(element, selector) {
				element || (element = document);
				if('matches' in element) var domatch = element.matches;
				if('msMatchesSelector' in element) var domatch = element.msMatchesSelector;
				if('mozMatchesSelector' in element) var domatch = element.mozMatchesSelector;
				if('webkitMatchesSelector' in element) var domatch = element.webkitMatchesSelector;
				return domatch.call(element, selector);
			};
		}
		throw new Error('No selector engine present. Include Sizzle/jQuery or Slick/Mootools before loading composer.');
	})();


	var add_event = (function() {
		return function(el, ev, fn, selector) {
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
				});
			}
			else
			{
				el.addEventListener(ev, function(event) {
					// if we have a mootools event class, wrap the event in it
					if(event && window.MooTools && window.DOMEvent) event = new DOMEvent(event);
					fn.apply(this, [event].concat(event.params || []));
				}, false);
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

	var find_parent = function(selector, element)
	{
		if(!element) return false;
		if(match(element, selector)) return element;
		var par = element.parentNode;
		return find_parent(selector, par);
	};

	this.Composer.exp0rt({
		find: find,
		match: match,
		add_event: add_event,
		fire_event: fire_event,
		remove_event: remove_event,
		find_parent: find_parent
	});
}).apply((typeof exports != 'undefined') ? exports : this);

