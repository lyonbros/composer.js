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
 * Copyright (c) 2011, Lyon Bros LLC. (http://www.lyonbros.com)
 * 
 * Licensed under The MIT License. 
 * Redistributions of files must retain the above copyright notice.
 */
(function(global, undefined) {
	"use strict";
	var Composer = this.Composer;
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
		routes: {},

		options: {
			suppress_initial_route: false,
			enable_cb: function(url) { return true; },
			process_querystring: false,
			base: false
		},

		/**
		 * initialize the routes your app uses. this is really the only public
		 * function that exists in the router, since it takes care of everything for
		 * you after instantiation.
		 */
		initialize: function(routes, options) {
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

			if(!this.options.suppress_initial_route) {
				// run the initial route
				History.Adapter.trigger(global, 'statechange', [this.cur_path()]);
			}
		},

		/**
		 * remove all router bindings and perform any cleanup. note that once
		 * this is called, the router can no longer be used and a new one must
		 * be created.
		 */
		destroy: function() {
			this.trigger('destroy');
			this.unbind();
		},

		debasify: function(path) {
			if(this.options.base && path.indexOf(this.options.base) == 0) {
				path = path.substr(this.options.base.length);
			}
			return path;
		},

		/**
		 * get the current url path
		 */
		cur_path: function() {
			if(History.emulated.pushState) {
				var path = '/' + new String(global.location.hash).toString().replace(/^[#!\/]+/, '');
			} else {
				var path = global.location.pathname+global.location.search;
			}
			return this.debasify(decodeURIComponent(path));
		},

		/**
		 * Get a value (by key) out of the current query string
		 */
		get_param: function(search, key) {
			key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
			var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
			var results = regex.exec(search);
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
		route: function(url, options) {
			url || (url = this.cur_path());
			options || (options = {});
			options.state || (options.state = {});

			var base = (this.options.base || '');
			var newpath = url.trim().replace(/^[a-z]+:\/\/.*?\//, '').replace(/^[#!\/]+/, '');
			if(!options.raw) newpath = decodeURIComponent(newpath);
			var href = base + '/' + newpath;
			var old = base + this.cur_path();
			var title = options.title || (this.options.default_title || '');
			if(old == href) {
				this.trigger('statechange', href, true);
			} else if(History.emulated.pushState) {
				// we're using hashbangs, which are async (if we use
				// History.pushState). we really want sync behavior so let's
				// fool History into thinking it already routed this hash (so it
				// doesn't double-fire) then trigger the event manually.
				History.saveHash(url);		// makes History.js not fire on hash
				window.location.hash = '#'+href;
				this.trigger('statechange', href, true);
			} else {
				if(options.replace_state) {
					History.replaceState(options.state, title, href);
				} else {
					History.pushState(options.state, title, href);
				}
			}
		},

		/**
		 * given a url, route it within the given routes the router was instantiated
		 * with. if none fit, do nothing =]
		 *
		 * *internal only* =]
		 */
		_do_route: function(url, routes) {
			if(!this.options.enable_cb(url)) {
				return false;
			}

			// allow passing in of routes manually, otherwise default to internal route table
			routes || (routes = this.routes);

			var routematch = this.find_matching_route(url, routes);
			if(!routematch) {
				return this.trigger('fail', {url: url, route: false, handler_exists: false, action_exists: false});
			}

			// pass the found route object (whatever it may be) and our matched
			// arguments in verbatim to process_match
			return this.process_match(url, routematch);
		},

		/**
		 * when a matching route is found, it is passed here, regardless of its
		 * format. this function will do its best to find a suitable function to
		 * call given the matched route.
		 *
		 * note that this function can be overridden for custom routing
		 * behavior.
		 */
		process_match: function(url, routematch) {
			var route = routematch.route;
			var match = routematch.args;
			var routefn;
			if(route instanceof Function) {
				routefn = route;
			} else if(typeof(route) == 'object') {
				var obj = route[0];
				var action = route[1];
				if (typeof(obj) != 'object') {
					if(!global[obj]) {
						return this.trigger('fail', {url: url, route: route, handler_exists: false, action_exists: false});
					}
					var obj = global[obj];
				}
				if(!obj[action] || typeof(obj[action]) != 'function') {
					return this.trigger('fail', {url: url, route: route, handler_exists: true, action_exists: false});
				}
				routefn = function() { return obj[action].apply(obj, arguments); };
			} else {
				return this.trigger('fail', {url: url, route: route, handler_exists: false, action_exists: false});
			}
			var args = match;
			args.shift();
			this._last_url = url;	// save the last successfully routed url
			this.trigger('route-success', route);
			routefn.apply(this, args);
		},

		/**
		 * Stateless function for finding the best matching route for a URL and given
		 * set of routes.
		 */
		find_matching_route: function(url, routes) {
			var url = '/' + url.replace(/^!?\//g, '');
			var route = false;
			var match = [];
			var regex = null;
			var matched_re = null;
			for(var re in routes) {
				regex = new RegExp('^' + re.replace(/\//g, '\\\/') + '$');
				match = regex.exec(url);
				if(match) {
					route = routes[re];
					matched_re = re;
					break;
				}
			}
			if(!route) return false;

			return {route: route, args: match, regex: regex, key: matched_re};
		},

		/**
		 * attached to the pushState event. fires the `route` event on success
		 * which in turns runs any attached handlers.
		 */
		state_change: function(path, force) {
			if(path && path.stop != undefined) path = false;
			if(path) path = this.debasify(path);
			if(!path) path = this.cur_path();
			force = !!force;

			// check if we are routing to the same exact page. if we are, return
			// (unless we force the route)
			if(this.last_path == path && !force) {
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
		last_url: function() {
			return this._last_url;
		},

		/**
		 * Bind the pushState to any links that don't have the options.exclude_class
		 * className in them.
		 */
		bind_links: function(options) {
			options || (options = {});

			// bind all <a>'s
			var selector = 'a';
			if(options.selector) {
				// use specified selector
				selector = options.selector;
			} else if(options.exclude_class) {
				// exclude <a> tags with given classname
				selector = 'a:not([class~="'+options.exclude_class+'"])';
			}

			var bind_element = options.bind_element || document.body;

			// bind our heroic pushState to the <a> tags we specified. this
			// hopefully be that LAST event called for any <a> tag because it's
			// so high up the DOM chain. this means if a composer event wants to
			// override this action, it can just call event.stop().
			var route_link = function(e) {
				if(e.defaultPrevented) return;
				if(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;

				var a = Composer.find_parent(selector, e.target);
				var button = typeof(e.button) != 'undefined' ? e.button : e.event.button;

				// don't trap links that are meant to open new windows, and don't
				// trap middle mouse clicks (or anything more than left click)
				if(a.target == '_blank' || button > 0) return;

				// don't run JS links
				if(a.href.match(/^javascript:/)) return;

				// don't run mailto links
				if(a.href.match(/^mailto:/)) return;

				// don't run tel links
				if(a.href.match(/^tel:/)) return;

				// this is an <a href="#"> link, ignore it
				if(History.emulated.pushState && a.href.replace(/^.*?#/, '') == '') return;

				var curhost = global.location.host;
				var linkhost = a.href.match(/^[a-z]+:\/\//) ? a.href.replace(/[a-z]+:\/\/(.*?)\/.*/i, '$1') : curhost;

				// if we're routing to a different domain/host, don't trap the click
				if(curhost != linkhost) return;

				// if our do_state_change exists and returns false, bail
				if(options.do_state_change && !options.do_state_change(a)) return;

				if(e) e.preventDefault();

				// turn:
				//  - https://my-domain.com/nerd/city
				//  - http://slappy.com/#!/nerd/city
				//  - file:///D:/nerd/city
				// into:
				//  nerd/city
				var href = a.href
					.replace(/^file:\/\/(\/)?([a-z]:)?\//i, '')
					.replace(/^[a-z-]+:\/\/.*?\//i, '')
					.replace(/^[#!\/]+/, '');
				if(options.filter_trailing_slash) href = href.replace(/\/$/, '');
				href = '/'+href;

				// if we have a rewrite function, apply it.
				if(options.rewrite) href = options.rewrite(href);

				this.route(href, {state: options.global_state});
				return;
			}.bind(this);

			Composer.add_event(bind_element, 'click', route_link, selector);
		}
	});

	Composer.exp0rt({ Router: Router });
}).apply((typeof exports != 'undefined') ? exports : this);

