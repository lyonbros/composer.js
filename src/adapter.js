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
		if(has_jquery) return function(context, selector) {
			context || (context = document);
			return jQuery(context).find(selector)[0];
		}
		else if(has_slick) return function(context, selector) {
			context || (context = document);
			return Slick.find(context, selector)
		}
	})();

	var match = (function() {
		if(has_jquery) return function(context, selector) {
			context || (context = document);
			return jQuery(context).is(selector);
		}
		else if(has_slick) return function(context, selector) {
			context || (context = document);
			return Slick.match(context, selector);
		}
	})();

	Composer.export({
		find: find,
		match: match
	});
}).apply((typeof exports != 'undefined') ? exports : this);

