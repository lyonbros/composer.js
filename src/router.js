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
(function() {
	"use strict";

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
			redirect_initial: true,
			suppress_initial_route: false,
			enable_cb: function() { return true; },
			on_failure: function() {},
			hash_fallback: true,
			process_querystring: false
		},

		/**
		 * initialize the routes your app uses. this is really the only public
		 * function that exists in the router, since it takes care of everything for
		 * you after instantiation.
		 */
		initialize: function(routes, options)
		{
			this.setOptions(options);

			this.routes = routes;
			this.register_callback(this._do_route.bind(this));

			// in case History.js isn't loaded
			if(!global.History) global.History = {enabled: false};

			if(History.enabled)
			{
				// bind our pushstate event
				History.Adapter.bind(global, 'statechange', this.state_change.bind(this));

				if(!this.options.suppress_initial_route)
				{
					// run the initial route
					History.Adapter.trigger(global, 'statechange', [global.location.pathname]);
				}
			}
			else if(this.options.hash_fallback)
			{
				// load the initial hash value
				var path = window.location.pathname;
				var hash = path == '' || path == '/' ? this.cur_path() : path;

				// if redirect_initial is true, then whatever page a user lands on, redirect
				// them to the hash version, ie
				//
				// gonorrhea.com/users/display/42
				// becomes:
				// gonorrhea.com/#!/users/display/42
				//
				// the routing system will pick this new hash up after the redirect and route
				// it normally
				if(this.options.redirect_initial && !(hash == '/' || hash == ''))
				{
					global.location = '/#!' + hash;
				}

				// SUCK ON THAT, HISTORY.JS!!!!
				// NOTE: this fixes a hashchange double-firing in IE, which
				// causes some terrible, horrible, no-good, very bad issues in
				// more complex controllers.
				delete Element.NativeEvents.hashchange;

				// set up the hashchange event
				global.addEvent('hashchange', this.state_change.bind(this));

				if(!this.options.suppress_initial_route)
				{
					// run the initial route
					global.fireEvent('hashchange', [hash]);
				}
			}
			else if(!this.options.suppress_initial_route)
			{
				this._do_route(new String(global.location.pathname).toString());
			}
		},

		/**
		 * add a callback that runs whenever the router "routes"
		 */
		register_callback: function(cb, name)
		{
			name || (name = null);
			return this.bind('route', cb, name);
		},

		/**
		 * remove a router callback
		 */
		unregister_callback: function(cb)
		{
			return this.unbind('route', cb);
		},

		/**
		 * get the current url path
		 */
		cur_path: function()
		{
			if(!History.enabled)
			{
				return '/' + new String(global.location.hash).toString().replace(/^[#!\/]+/, '');
			}
			else
			{
				return new String(global.location.pathname+global.location.search).toString();
			}
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
				if(History.enabled)
				{
					History.Adapter.trigger(global, 'statechange', [href, true]);
				}
				else if(this.options.hash_fallback)
				{
					global.fireEvent('hashchange', [href, true]);
				}
			}
			else
			{
				if(History.enabled)
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
				else if(this.options.hash_fallback)
				{
					global.location = '/#!'+href;
				}
				else
				{
					global.location = href;
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
			if(!routematch) return this.options.on_failure({url: url, route: false, handler_exists: false, action_exists: false});

			var route = routematch.route;
			var match = routematch.args;

			var obj = route[0];
			var action = route[1];
			if (typeof(obj) != 'object') {
				if(!global[obj]) return this.options.on_failure({url: url, route: route, handler_exists: false, action_exists: false});
				var obj = global[obj];
			}
			if(!obj[action] || typeof(obj[action]) != 'function') return this.options.on_failure({url: url, route: route, handler_exists: true, action_exists: false});
			var args = match;
			args.shift();
			this._last_url = url;	// save the last successfully routed url
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
		 * stupid function, not worth the space it takes up. oh well.
		 */
		setup_routes: function(routes)
		{
			this.routes = routes;
		},

		/**
		 * attached to the pushState event. runs all the callback assigned with
		 * register_callback().
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

			// allow URL to be modifyable within the "preroute" callback, ie
			// mimick mutable strings, kind of. this affords an opportunity for
			// a preroute callback to "rewrite" the URL such that the address
			// bar stays the same, but the actual route loaded is for the
			// new, rewritten URL.
			path = new String(path);
			path.rewrite = function(str) {
				this._string_value = str;
			}.bind(path);
			path.rewrite(null);
			this.trigger('preroute', path);
			// grab rewritten url, if any
			if(path._string_value) path = path._string_value;

			this.trigger('route', path.toString());
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

			// build a selector that work for YOU.
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

			// convenience function, recursively searches up the DOM tree until
			// it finds an element with tagname ==  tag.
			var next_tag_up = function(tag, element)
			{
				return element.get('tag') == tag ? element : next_tag_up(tag, element.getParent());
			};

			// bind our heroic pushState to the <a> tags we specified. this
			// hopefully be that LAST event called for any <a> tag because it's
			// so high up the DOM chain. this means if a composer event wants to
			// override this action, it can just call event.stop().
			$(document.body).addEvent('click:relay('+selector+')', function(e) {
				if(e.control || e.shift || e.alt) return;

				var a = next_tag_up('a', e.target);
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

				if(History.enabled)
				{
					var href = a.href.replace(/^[a-z]+:\/\/.*?\//, '').replace(/^[#!\/]+/, '');
					if(options.filter_trailing_slash) href = href.replace(/\/$/, '');
					href = '/'+href;

					History.pushState(options.global_state, '', href);
					return false;
				}
				else
				{
					var href = a.href.replace(/^[a-z]+:\/\/.*?\//, '');
					if(options.filter_trailing_slash) href = href.replace(/\/$/, '');
					href = '/#!/'+href;

					global.location = href;
				}
			});
		}
	});

	Composer.export({ Router: Router });
})();

