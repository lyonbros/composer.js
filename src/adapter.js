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
	var has_moo = !!global.MooTools;

	var find = (function() {
		if(has_jquery)
		{
			return function(context, selector) {
				context || (context = document);
				return jQuery(context).find(selector)[0];
			};
		}
		else if(has_moo)
		{
			return function(context, selector) {
				context || (context = document.id(document));
				return context.getElement(selector);
			};
		}
		else if(has_slick)
		{
			return function(context, selector) {
				context || (context = document);
				return Slick.find(context, selector);
			};
		}
		throw new Error('No selector engine present. Include Sizzle/jQuery or Slick/Mootools before loading composer.');
	})();

	var match = (function() {
		if(has_jquery)
		{
			return function(element, selector) {
				element || (element = document);
				return jQuery(element).is(selector);
			};
		}
		else if(has_slick)
		{
			return function(element, selector) {
				element || (element = document);
				return Slick.match(element, selector);
			};
		}
		throw new Error('No selector engine present. Include Sizzle/jQuery or Slick/Mootools before loading composer.');
	})();

	var add_event = (function() {
		if(has_jquery)
		{
			return function(el, ev, fn, selector) {
				if(selector) return jQuery(el).on(ev, selector, fn);
				else return jQuery(el).on(ev, fn);
			};
		}
		else if(has_moo)
		{
			return function(el, ev, fn, selector) {
				var _fn = fn;
				fn = function()
				{
					_fn.apply(this, arguments);
				};

				if(selector) return document.id(el).addEvent(ev+':relay('+selector+')', fn);
				else return document.id(el).addEvent(ev, fn);
			};
		}
		else
		{
			return function(el, ev, fn, selector) {
				if(selector)
				{
					el.addEventListener(ev, function(event) {
						fn.apply(this, [event].concat(event.params || []));
					}, false);
				}
				else
				{
					el.addEventListener(ev, function(event) {
						var target = event.target || event.srcElement;
						if(event.__composer_handled || !match(target, selector)) return false;
						event.__composer_handled = true;
						fn.apply(this, [event].concat(event.params || []));
					});
				}
			};
		}
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
		return function(node, eventName, options) {
			options || (options = {});

			// Make sure we use the ownerDocument from the provided node to avoid cross-window problems
			var doc;
			if (node.ownerDocument) {
				doc = node.ownerDocument;
			} else if (node.nodeType == 9){
				// the node may be the document itself, nodeType 9 = DOCUMENT_NODE
				doc = node;
			} else {
				throw new Error("Invalid node passed to fireEvent: " + node.id);
			}

			if (node.dispatchEvent) {
				// Gecko-style approach (now the standard) takes more work
				var eventClass = "";

				// Different events have different event classes.
				// If this switch statement can't map an eventName to an eventClass,
				// the event firing is going to fail.
				switch (eventName) {
				case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
				case "mousedown":
				case "mouseup":
					eventClass = "MouseEvents";
					break;

				case "focus":
				case "change":
				case "blur":
				case "select":
					eventClass = "HTMLEvents";
					break;

				case "keyup":
				case "keydown":
					eventClass = "KeyboardEvent";
					break;

				default:
					throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
					break;
				}

				var bubbles = true;
				var event = doc.createEvent(eventClass);

				switch(eventClass)
				{
				case 'KeyboardEvent':
					var key = options.key || 0;
					event.initKeyEvent(eventName, bubbles, true, document.defaultView, false, false, false, false, key, key);
				case 'MouseEvents':
				case 'UIEvents':
					event.initUIEvent(eventName, bubbles, true, global, 1); // All events created as bubbling and cancelable.
					break;
				default:
					event.initEvent(eventName, bubbles, true); // All events created as bubbling and cancelable.
					break;
				}

				event.synthetic = true; // allow detection of synthetic events
				// The second parameter says go ahead with the default action
				node.dispatchEvent(event, true);
			} else  if (node.fireEvent) {
				// IE-old school style
				var event = doc.createEventObject();
				event.synthetic = true; // allow detection of synthetic events
				node.fireEvent("on" + eventName, event);
			}
		};
	})();

	var remove_event = (function() {
		if(has_jquery)
		{
			return function(el, ev, fn) {
				jQuery(el).off(ev, fn);
			};
		}
		else if(has_moo)
		{
			return function(el, ev, fn) {
				document.id(el).removeEvent(ev, fn);
			};
		}
		else
		{
			return function(el, ev, fn) {
				el.removeEventListener(ev, fn, false);
			};
		}
	})();

	var find_parent = function(selector, element)
	{
		if(match(element, selector)) return element;
		var par = element.parentNode;
		return find_parent(selector, par);
	};

	Composer.exp0rt({
		find: find,
		match: match,
		add_event: add_event,
		fire_event: fire_event,
		remove_event: remove_event,
		find_parent: find_parent
	});
}).apply((typeof exports != 'undefined') ? exports : this);

