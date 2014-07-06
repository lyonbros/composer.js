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

	var has_jquery = !!global.jQuery;
	var has_slick = !!global.Slick;

	var find = (function() {
		if(has_jquery)
		{
			return function(context, selector) {
				context || (context = document);
				return jQuery(context).find(selector)[0];
			};
		}
		else if(has_slick)
		{
			return function(context, selector) {
				context || (context = document);
				return Slick.find(context, selector)
			};
		}
		error('No selector engine present. Include jQuery or Slick.');
	})();

	var match = (function() {
		if(has_jquery)
		{
			return function(context, selector) {
				context || (context = document);
				return jQuery(context).is(selector);
			};
		}
		else if(has_slick)
		{
			return function(context, selector) {
				context || (context = document);
				return Slick.match(context, selector);
			};
		}
		error('No selector engine present. Include jQuery or Slick.');
	})();

	var add_event = (function() {
		if(has_jquery)
		{
			return function(el, ev, fn, selector) {
				if(selector) return jQuery(el).on(ev, selector, fn);
				else return jQuery(el).on(ev, fn);
			};
		}
		else if(document.body && document.body.addEvent)
		{
			return function(el, ev, fn, selector) {
				if(selector) return el.addEvent(ev+':relay('+selector+')', fn);
				else return el.addEvent(ev, fn);
			};
		}
		else
		{
			return function(el, ev, fn, selector) {
				if(selector)
				{
					el.addEventListener(ev, fn, false);
				}
				else
				{
					el.addEventListener(ev, function(event) {
						var target = event.target || event.srcElement;
						if(event.__composer_handled || !match(target, selector)) return false;
						event.__composer_handled = true;
						fn(event);
					});
				}
			};
		}
	})();

	var remove_event = (function() {
		if(has_jquery)
		{
			return function(el, ev, fn) {
				jQuery(el).off(ev, fn);
			};
		}
		else if(document.body && document.body.removeEvent)
		{
			return function(el, ev, fn) {
				el.removeEvent(ev, fn);
			};
		}
		else
		{
			return function(el, ev, fn) {
				el.removeEventListener(ev, fn, false);
			};
		}
	})();

	Composer.export({
		find: find,
		match: match,
		add_event: add_event,
		remove_event: remove_event
	});
}).apply((typeof exports != 'undefined') ? exports : this);

