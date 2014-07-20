/**
 * router.js
 *
 * Provides tie-ins to URL state changes to route URLs to actions.
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

	var global = this;

	/**
	 * The Router class is a utility that helps in the routing of requests to
	 * certain parts of your application. It works either by history.pushState
	 * (which is highly recommended) or by falling back onto hashbang url
	 * support (not recommended).
	 *
	 * Note that if you do want to use pushState, you have to include History.js
	 * before instantiating the Router class:
	 *
	 *   https://github.com/balupton/History.js/
	 */
	var Router = Composer.Base.extend({
		/**
		 * Track this object's type. Useful for debugging, mainly
		 */
		__composer_type: 'router',

		last_path:	false,
		_last_url:	null,
		routes:		{},

		options: {
			suppress_initial_route: false,
			enable_cb: function(url) { return true; },
			process_querystring: false
		},

		/**
		 * initialize the routes your app uses. this is really the only public
		 * function that exists in the router, since it takes care of everything for
		 * you after instantiation.
		 */
		initialize: function(routes, options)
		{
			this.set_options(options);

			this.routes = routes;
			this.bind('route', this._do_route.bind(this));

			// in case History.js isn't loaded
			if(!global.History) global.History = {enabled: false};
			if(!History.enabled) throw 'History.js is *required* for proper router operation: https://github.com/browserstate/history.js';

			// set up our bindings
			this.bind('statechange', this.state_change.bind(this));
			this.bind_once('destroy', function() {
				Object.keys(History.Adapter.handlers).forEach(function(key) {
					delete History.Adapter.handlers[key];
				});
				delete global['onstatechange'];
			});

			History.Adapter.bind(global, 'statechange', function(data) {
				data || (data = [this.cur_path()]);
				var url = data[0];
				var force = data[1];
				this.trigger('statechange', url, force);
			}.bind(this));

			if(!this.options.suppress_initial_route)
			{
				// run the initial route
				History.Adapter.trigger(global, 'statechange', [global.location.pathname]);
			}
		},

		/**
		 * remove all router bindings and perform any cleanup. note that once
		 * this is called, the router can no longer be used and a new one must
		 * be created.
		 */
		destroy: function()
		{
			this.trigger('destroy');
			this.unbind();
		},

		/**
		 * get the current url path
		 */
		cur_path: function()
		{
			return new String(global.location.pathname+global.location.search).toString();
		},

		/**
		 * Get a value (by key) out of the current query string
		 */
		get_param: function(key)
		{
			key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
			var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
			var results = regex.exec(location.search);
			return results == null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
		},

		/**
		 * wrapper around the routing functionality. basically, instead of doing a
		 *   window.location = '/my/route';
		 * you can do
		 *   router.route('/my/route');
		 *
		 * Note that the latter isn't necessary, but it provides a useful abstraction.
		 */
		route: function(url, options)
		{
			url || (url = this.cur_path());
			options || (options = {});
			options.state || (options.state = {});

			var href = '/' + url.trim().replace(/^[a-z]+:\/\/.*?\//, '').replace(/^[#!\/]+/, '');
			var old = this.cur_path();
			if(old == href)
			{
				this.trigger('statechange', href, true);
			}
			else
			{
				if(options.replace_state)
				{
					History.replaceState(options.state, '', href);
				}
				else
				{
					History.pushState(options.state, '', href);
				}
			}
		},

		/**
		 * given a url, route it within the given routes the router was instantiated
		 * with. if none fit, do nothing =]
		 *
		 * *internal only* =]
		 */
		_do_route: function(url, routes)
		{
			if(!this.options.enable_cb(url))
			{
				return false;
			}

			// allow passing in of routes manually, otherwise default to internal route table
			routes || (routes = this.routes);

			var routematch = this.find_matching_route(url, routes);
			if(!routematch)
			{
				return this.trigger('fail', {url: url, route: false, handler_exists: false, action_exists: false});
			}

			var route = routematch.route;
			var match = routematch.args;

			var obj = route[0];
			var action = route[1];
			if (typeof(obj) != 'object') {
				if(!global[obj])
				{
					return this.trigger('fail', {url: url, route: route, handler_exists: false, action_exists: false});
				}
				var obj = global[obj];
			}
			if(!obj[action] || typeof(obj[action]) != 'function')
			{
				return this.trigger('fail', {url: url, route: route, handler_exists: true, action_exists: false});
			}
			var args = match;
			args.shift();
			this._last_url = url;	// save the last successfully routed url
			this.trigger('route-success', route);
			obj[action].apply(obj, args);
		},

		/**
		 * Stateless function for finding the best matching route for a URL and given
		 * set of routes.
		 */
		find_matching_route: function(url, routes)
		{
			var url = '/' + url.replace(/^!?\//g, '');
			var route = false;
			var match = [];
			var regex = null;
			for(var re in routes)
			{
				regex = new RegExp('^' + re.replace(/\//g, '\\\/') + '$');
				match = regex.exec(url);
				if(match)
				{
					route = routes[re];
					break;
				}
			}
			if(!route) return false;

			return {route: route, args: match, regex: regex};
		},

		/**
		 * attached to the pushState event. fires the `route` event on success
		 * which in turns runs any attached handlers.
		 */
		state_change: function(path, force)
		{
			if(path && path.stop != undefined) path = false;
			path || (path = this.cur_path());
			force = !!force;

			// check if we are routing to the same exact page. if we are, return
			// (unless we force the route)
			if(this.last_path == path && !force)
			{
				// no need to reload
				return false;
			}

			this.last_path = path;

			// remove querystring from the url if we have set the Router to
			// ignore it. Note that this happens after the same-page check since
			// we still want to take QS into account when comparing URLs.
			if(!this.options.process_querystring) path = path.replace(/\?.*/, '');

			// allow preroute to modify the path before sending out to the
			// actualy route-matching function.
			path = new String(path);
			var boxed = {path: path};
			this.trigger('preroute', boxed);
			this.trigger('route', boxed.path);
		},

		/**
		 * Returns the full, last successfully routed URL that the Router found
		 * a match for.
		 */
		last_url: function()
		{
			return this._last_url;
		},

		/**
		 * Bind the pushState to any links that don't have the options.exclude_class
		 * className in them.
		 */
		bind_links: function(options)
		{
			options || (options = {});

			// bind our heroic pushState to the <a> tags we specified. this
			// hopefully be that LAST event called for any <a> tag because it's
			// so high up the DOM chain. this means if a composer event wants to
			// override this action, it can just call event.stop().
			var route_link = function(e)
			{
				if(e.control || e.shift || e.alt) return;

				var a = Composer.find_parent('a', e.target);
				var button = typeof(e.button) != 'undefined' ? e.button : e.event.button;

				// don't trap links that are meant to open new windows, and don't
				// trap middle mouse clicks (or anything more than left click)
				if(a.target == '_blank' || button > 0) return;

				var curhost = new String(global.location).replace(/[a-z]+:\/\/(.*?)\/.*/i, '$1');
				var linkhost = a.href.match(/^[a-z]+:\/\//) ? a.href.replace(/[a-z]+:\/\/(.*?)\/.*/i, '$1') : curhost;
				if(
					curhost != linkhost ||
					(typeof(options.do_state_change) == 'function' && !options.do_state_change(a))
				)
				{
					return;
				}

				if(e) e.stop();

				var href = a.href.replace(/^[a-z]+:\/\/.*?\//, '').replace(/^[#!\/]+/, '');
				if(options.filter_trailing_slash) href = href.replace(/\/$/, '');
				href = '/'+href;

				this.route(href, {state: options.global_state});
				return false;
			}.bind(this);

			// build a selector that works for YOU.
			if(options.selector)
			{
				// specific selector......specified. use it.
				var selector = options.selector;
			}
			else
			{
				// create a CUSTOM selector tailored to your INDIVIDUAL needs.
				if(options.exclude_class)
				{
					// exclusion classname exists, make sure to not listen to <a>
					// tags with that class
					var selector = 'a:not([class~="'+options.exclude_class+'"])';
				}
				else
				{
					// bind all <a>'s
					var selector = 'a';
				}
			}
			Composer.add_event(document.body, 'click', route_link, selector);
		}
	});

	Composer.export({ Router: Router });
}).apply((typeof exports != 'undefined') ? exports : this);

