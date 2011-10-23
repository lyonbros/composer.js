(function() {
	var Composer	=	{};

	/**
	 * You must override this function in your app.
	 */
	Composer.sync	=	function(method, model, options) {};

	/**
	 * The events class provides bindings to objects (Models and Collections,
	 * mainly) and allows triggering of those events. For instance, a controller
	 * can bind its "removeItemFromView" function to its model's "destroy" event.
	 * Now when that model is destroyed, the destroyer doesn't have to remember to
	 * also trigger the "removeItemFromView" function, but it will happen 
	 * automatically as a result of the binding.
	 *
	 * Note that this class is meant to be extended and doesn't provide much use on
	 * its own.
	 *
	 * Certain events are used by the framework itself:
	 *   Models:
	 *     "change" - called when a model's values are changed vie its set()
	 *       function. 
	 *     "change:[key]" - called when [key] is changed under model's data. For
	 *       instance, if you did :
	 *         model.bind("change:name", myfn);
	 *         model.set({name: 'leonard'});    // <-- this will trigger the event
	 *     "destroy" - called when model.destroy() is called.
	 *     "error" - triggered when an error happens saving/reading/validating the
	 *       model
	 *   Collections:
	 *     "add" - Called when a model is added to a collection via
	 *       collection.add()
	 *     "clear" - Called when all models are cleared out of a via 
	 *       collection.clear()
	 *     "reset" - Called when collection is reset with new model data via
	 *       collection.reset()
	 *     "remove" - Called when collection.remove() is used to remove a model
	 *       from the collection
	 *   Controllers:
	 *     "release" - Called when controller.release() is called to remove the 
	 *       controller from the view.
	 *
	 * Note that the "all" event will bubble up from model to collection...when a
	 * model is added to a collection via collection.add(), the collection binds
	 * an 'all' event to that model so that any events that happen on that model
	 * will be triggered in the collection as well. This makes it easy for a 
	 * controller to monitor changes on collections of items instead of each item
	 * individually.
	 */
	Events	=	new Class({
		_events: {},

		/**
		 * Bind a callback to a specific event for this object. Adds the callback to
		 * an array instead of replacing other callbacks, so many callbacks can exist
		 * under the same event for this object.
		 *
		 * Example: mymodel.bind("change", this.render.bind(this));
		 *
		 * Whenever mymodel is changed in any way, the "render" function for the 
		 * current object (probably a controller in this instance) will be called.
		 */
		bind: function(name, callback)
		{
			this._events[name] || (this._events[name] = []);
			if(!this._events[name].contains(callback))
			{
				this._events[name].push(callback);
			}

			return this;
		},

		/**
		 * Trigger an event for this object, which in turn runs all callbacks for that
		 * event WITH all parameters passed in to this function.
		 *
		 * For instance, you could do:
		 * mymodel.bind("destroy", this.removeFromView.bind(this));
		 * mymodel.trigger("destroy", "omg", "lol", "wtf");
		 *
		 * this.removeFromView will be called with the arguments "omg", "lol", "wtf".
		 *
		 * Note that any trigger event will also trigger the "all" event. the idea
		 * being that you can subscribe to anything happening on an object.
		 */
		trigger: function()
		{
			if(arguments.length == 0) return this;

			// pull out our arguments
			var args		=	arguments == 0 ? [] : $A(arguments);
			var ev			=	args.shift();
			var orig_event	=	ev;

			var evs	=	[ev, 'all'];

			// run each callback with the given arguments
			var log	=	[];
			evs.each(function(type) {
				if(!this._events[type]) return;

				this._events[type].each(function(callback) {
					log.push(type);
					if(type == 'all')
					{
						// if someone bound to the "all" event, pass which event was triggered
						args.unshift(orig_event);
					}
					callback.apply(this, args);
				}, this);
			}, this);

			return this;
		},

		/**
		 * Unbinds an event from the current object.
		 */
		unbind: function(ev, callback)
		{
			if(typeof(ev) == 'undefined')
			{
				// no event passed, unbind everything
				this._events	=	{};
				return this;
			}

			var callback	=	typeof(callback) == 'function' ? callback : null;

			if(typeof(this._events[ev]) == 'undefined' || this._events[ev].length == 0)
			{
				// event isn't bound
				return this;
			}

			if(!callback)
			{
				// no callback given, unbind all events of type ev
				this._events[ev]	=	[];
				return this;
			}

			// remove all callback matches for the event type ev
			this._events[ev].erase(callback);
			
			return this;
		}
	});


	/**
	 * Models are the data class. They deal with loading and manipulating data from
	 * various sources (ajax, local storage, etc). 
	 *
	 * Models tie in very closely with the Sync construct, which attempts to make
	 * RESTful communication with a server or other data entity seamless.
	 */
	var Model	=	new Class({
		Implements: [Events],

		options: {},
		defaults: {},
		data: {},
		changed: false,
		collection: null,

		// what key to look under the data for the primary id for the object
		id_key: 'id',

		initialize: function(data, options)
		{
			data	=	Object.merge(this.defaults, data);

			this.set(data, {silent: true});
			this.init(options);
		},

		init: function() {},

		get: function(key)
		{
			if(typeof(this.data[key]) == 'undefined')
			{
				return null;
			}
			return this.data[key];
		},

		escape: function(key)
		{
			var data	=	this.get(key);
			if(data == null || typeof(data) != 'string')
			{
				return null;
			}

			// taken directly from backbone.js's escapeHTML() function... thanks!
			return data
				.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#x27;')
				.replace(/\//g,'&#x2F;');
		},

		has: function(key)
		{
			return this.data[key] != null;
		},

		set: function(data, options)
		{
			options || (options = {});

			if(!options.silent && !this.perform_validation(data, options)) return false;			

			var already_changing	=	this.changing;
			this.changing			=	true;
			Object.each(data, function(val, key) {
				if(val != this.data[key])
				{
					this.data[key]	=	val;
					this.changed	=	true;
					if(!options.silent)
					{
						this.trigger('change:'+key, this, val, options);
					}
				}
			}.bind(this));

			if(!already_changing && !options.silent && this.changed)
			{
				this.trigger('change', options);
			}

			this.changing	=	false;
		},

		unset: function(key, options)
		{
			if(!(key in this.data)) return this;
			options || (options = {});

			var obj		=	{};
			obj[key]	=	void(0);
			if(!options.silent && !this.perform_validation(obj, options)) return false;			

			delete this.data[key];
			this.changed	=	true;
			if(!options.silent)
			{
				this.trigger('change:'+key, this, void 0, options);
				this.trigger('change', this, options);
			}
		},

		clear: function(options)
		{
			options || (options = {});

			var old		=	this.data;
			var obj		=	{};
			for(key in old) obj[key] = void(0);
			if(!options.silent && !this.perform_validation(obj, options)) return false;			

			var old			=	this.data;
			this.data		=	{};
			this.changed	=	true;
			if(!options.silent)
			{
				for(key in old)
				{
					this.trigger('change:'+key, this, void 0, options)
				}
				this.trigger('change', this, options)
			}
		},

		fetch: function(options)
		{
			options || (options = {});

			var success	=	options.success;
			options.success	=	function(res)
			{
				this.set(this.parse(res), options);
				if(success) success(model, res);
			}.bind(this);
			options.error	=	wrap_error(options.error ? options.error.bind(this) : null, this, options);
			return (this.sync || Composer.sync).call(this, 'read', this, options);
		},

		save: function(data, options)
		{
			options || (options = {});

			this.set(data, options);

			var success	=	options.success;
			options.success	=	function(res)
			{
				this.set(this.parse(res), options);
				if(success) success(model, res);
			}.bind(this);
			options.error	=	wrap_error(options.error ? options.error.bind(this) : null, this, options);
			return (this.sync || Composer.sync).call(this, (this.is_new() ? 'create' : 'update'), this, options);
		},

		destroy: function(options)
		{
			options || (options = {});

			if(this.is_new())
			{
				return this.trigger('destroy', this, this.collection, options);
			}

			var success	=	options.success;
			options.success	=	function(res)
			{
				this.trigger('destroy', this, this.collection, options);
				if(success) success(model, res);
			}.bind(this);
			options.error	=	wrap_error(options.error ? options.error.bind(this) : null, this, options);
			return (this.sync || Composer.sync).call(this, 'delete', this, options);
		},

		parse: function(data)
		{
			return data;
		},

		id: function()
		{
			return this.get(this.id_key);
		},

		is_new: function()
		{
			return !this.get(this.id_key);
		},

		clone: function()
		{
			return new this.$constructor(this.toJSON());
		},

		toJSON: function()
		{
			return Object.clone(this.data);
		},

		perform_validation: function(data, options)
		{
			if(typeof(this.validate) != 'function')
			{
				return true;
			}

			var error	=	this.validate(data);
			if(error)
			{
				if(options.error)
				{
					options.error(this, error, options);
				}
				else
				{
					this.trigger('error', this, error, options);
				}
				return false;
			}
			return true;
		}
	});

	var Collection	=	new Class({
		Implements: [Events],

		model: Model,

		_models: [],

		sortfn: null,

		initialize: function(models, options)
		{
			if(models)
			{
				this.reset(models, options);
			}
			this.init();
		},

		init: function() {},

		toString: function()
		{
			return 'Composer.Model: ' + this.type + ': ' + this._models.length + ' models';
		},

		toJSON: function()
		{
			return this.models().map( function(model) { return model.toJSON(); } );
		},

		models: function()
		{
			return this._models;
		},

		add: function(model, options)
		{
			options || (options = {});

			// reference this collection to the model
			if(!model.collection == this)
			{
				model.collection	=	this;
			}

			if(this.sortfn)
			{
				var index	=	options.at ? parseInt(options.at) : this.sort_index(model);
				this._models.splice(index, 0, model);
			}
			else
			{
				this._models.push(model);
			}

			// trigger the change event
			model.bind('all', this._model_event.bind(this));
			this.trigger('add', model, this, options);
		},

		remove: function(model)
		{
			// remove this collection's reference(s) from the model
			model.collection	=	null;

			// save to trigger change event if needed
			var num_rec	=	this._models.length;

			// remove hte model
			this._models.erase(model);

			// if the number actually change, trigger our change event
			if(this._models.length != num_rec)
			{
				this.trigger('remove');
			}

			// remove the model from the collection
			this._remove_reference(model);
		},

		clear: function()
		{
			// save to trigger change event if needed
			var num_rec	=	this._models.length;

			this._models.each(function(model) {
				this._remove_reference(model);
			}, this);
			this._models	=	[];

			// if the number actually change, trigger our change event
			if(this._models.length != num_rec)
			{
				this.trigger('clear');
			}
		},

		reset: function(values, options)
		{
			options || (options = {});

			if(!options.append)
			{
				this.clear();
			}

			values.each(function(data) {
				this.add(new this.model(data));
			}.bind(this));

			this.trigger('reset');
		},

		sort: function(options)
		{
			if(!this.sortfn) return false;

			this._models.sort(this.sortfn);
			if(!options.silent)
			{
				this.trigger('reset', this, options);
			}
		},

		sort_index: function(model)
		{
			if(!this.sortfn) return false;

			for(var i = 0; i < this._models.length; i++)
			{
				if(this.sortfn(this._models[i], model) > 0)
				{
					return i;
				}
			}
			return this._models.length;
		},

		parse: function(data)
		{
			return data;
		},

		/**
		 * Find the first model that satisfies the callback. An optional sort function
		 * can be passed in to order the results of the find, which uses the usual 
		 * fn(a,b){return (-1|0|1);} syntax.
		 */
		find: function(callback, sortfn)
		{
			if(sortfn)
			{
				var models	=	shallow_array_clone(this.models()).sort(sortfn);
			}
			else
			{
				var models	=	this.models();
			}

			for(var i = 0; i < models.length; i++)
			{
				var rec	=	models[i];
				if(callback(rec))
				{
					return rec;
				}
			}
			return false;
		},

		exists: function(callback)
		{
			return this.models().some(callback);
		},

		find_by_id: function(id)
		{
			return this.find(function(model) {
				if(model.id() == id)
				{
					return true;
				}
			});
		},

		select: function(callback)
		{
			return this._models.filter(callback);
		},

		first: function(n)
		{
			var models	=	this.models();
			return (typeof(n) != 'undefined' && parseInt(n) != 0) ? models.slice(0, n) : models[0];
		},

		last: function(n)
		{
			var models	=	this.models();
			return (typeof(n) != 'undefined' && parseInt(n) != 0) ? models.slice(models.length - n) : models[0];
		},

		fetch: function(options)
		{
			options || (options = {});

			var success	=	options.success;
			options.success	=	function(res)
			{
				this.reset(this.parse(res), options);
				if(success) success(model, res);
			}.bind(this);
			options.error	=	wrap_error(options.error ? options.error.bind(this) : null, this, options);
			return (this.sync || Composer.sync).call(this, 'read', this, options);
		},

		_remove_reference: function(model)
		{
			if(model.collection == this)
			{
				delete model.collection;
			}

			// don't listen to this model anymore
			model.unbind('all', this._model_event.bind(this));
		},

		_model_event: function(ev, model, collections, options)
		{
			if((ev == 'add' || ev == 'remove') && !collections.contains(this)) return;
			if(ev == 'destroy')
			{
				this.remove(model, options);
			}
			this.trigger.apply(this, arguments);
		}
	});

	var Controller	=	new Class({
		Implements: [Events],

		event_splitter:	/^(\w+)\s*(.*)$/,
		tag: 'div',
		elements: {},
		events: {},

		initialize: function(params)
		{
			this.el || (this.el = new Element(this.tag));
			if(this.className)
			{
				this.el.addClass(this.className);
			}

			for(x in params)
			{
				this[x]	=	params[x];
			}

			this.refresh_elements();
			this.delegate_events();

			this.init();
		},

		init: function() {},		// lol
		render: function() { return this; },

		html: function(str)
		{
			this.el.set('html', str);
			this.refresh_elements();
		},

		release: function()
		{
			this.el.dispose();
			this.trigger('release');
		},

		replace: function(element)
		{
			var rep		=	[this.el, element.el || element];
			var prev	=	rep[0];
			this.el		=	rep[1];

			this.el.replaces(prev);

			this.refresh_elements();
			this.delegate_events();

			return this.el;
		},

		// TODO ...?
		append: function() {},
		appendTo: function() {},
		prepend: function() {},

		delegate_events: function()
		{
			// setup the events given
			for(ev in this.events)
			{
				var fn			=	this[this.events[ev]];
				if(typeof(fn) != 'function')
				{
					// easy, easy, whoa, you gotta calm down there, chuck
					continue;
				}
				fn	=	fn.bind(this);

				match			=	ev.match(this.event_splitter);
				var evname		=	match[1].trim();
				var selector	=	match[2].trim();

				if(selector == '')
				{
					this.el.removeEvent(evname, fn);
					this.el.addEvent(evname, fn);
				}
				else
				{
					this.el.addEvent(evname+':relay('+selector+')', fn);
				}
			}
		},

		refresh_elements: function()
		{
			// setup given elements as instance variables
			for(selector in this.elements)
			{
				var iname	=	this.elements[selector];
				this[iname]	=	this.el.getElement(selector);
			}
		}
	});

	/*
	---
	description: Added the onhashchange event

	license: MIT-style

	authors: 
	- sdf1981cgn
	- Greggory Hernandez

	requires: 
	- core/1.2.4: '*'

	provides: [Element.Events.hashchange]

	...
	*/
	Element.Events.hashchange = {
		onAdd: function() {
			var hash = self.location.hash;

			var hashchange = function(){
				if (hash == self.location.hash) return;
				else hash = self.location.hash;

				var value = (hash.indexOf('#') == 0 ? hash.substr(1) : hash);
				window.fireEvent('hashchange', value);
				document.fireEvent('hashchange', value);
			};

			if ("onhashchange" in window){
				window.onhashchange = hashchange;
			} else {
				hashchange.periodical(50);
			}
		}
	};

	var Router	=	new Class({
		last_hash:	false,
		routes:		{},
		callbacks:	[],

		options: {
			redirect_initial: true,
			suppress_initial_route: false,
			enable_cb: function() { return true; }
		},

		initialize: function(routes, options)
		{
			for(x in options)
			{
				this.options[x]	=	options[x];
			}

			this.routes	=	routes;

			this.register_callback(this.route.bind(this));

			// load the initial hash value
			var hash	=	self.location.hash;
			var value	=	(hash.indexOf('#') == 0 ? hash.substr(1) : hash);
			
			// if redirect_initial is true, then whatever page a user lands on, redirect
			// them to the hash version, ie
			//
			// gonorrhea.com/users/display/42
			// becomes:
			// gonorrhea.com/#!/users/display/42
			//
			// the routing system will pick this new hash up after the redirect and route
			// it normally
			if(this.options.redirect_initial && hash.trim() == '')
			{
				window.location	=	'/#!' + self.location.pathname;
			}

			// set up the hashchange event
			window.addEvent('hashchange', this.hash_change.bind(this));

			if(!this.options.suppress_initial_route)
			{
				// run the initial route
				window.fireEvent('hashchange', [value]);
			}
		},

		register_callback: function(cb)
		{
			this.callbacks.push(cb);
		},

		route: function(url)
		{
			if(!this.options.enable_cb())
			{
				return false;
			}

			var url		=	'/' + url.replace(/^!?\//g, '');
			var route	=	false;
			var match	=	[];
			for(var re in this.routes)
			{
				var regex	=	'/' + re.replace(/\//g, '\\\/') + '$/';
				match		=	eval(regex).exec(url);
				if(match)
				{
					route	=	this.routes[re];
					break;
				}
			}
			if(!route) return false;

			var handler	=	route[0];
			var action	=	route[1];
			if(!window[handler]) return false;

			var obj		=	window[handler];
			if(!obj[action] || typeof(obj[action]) != 'function') return false;
			var args	=	match;
			args.shift();
			obj[action].apply(obj, args);
		},

		setup_routes: function(routes)
		{
			this.routes	=	routes;
		},

		hash_change: function(hash, force)
		{
			var force	=	!!force;

			// remove the motherfucking ! at the beginning
			hash	=	hash.replace(/^!/, '');
			if(this.last_hash == hash && !force)
			{
				// no need to reload
				return false;
			}
			
			this.last_hash	=	hash;
			this.callbacks.each(function(fn) {
				if(typeof(fn) == 'function') fn.call(this, hash);
			}, this);
		}
	});


	// wraps error callbacks for syncing functions
	var wrap_error	=	function(callback, model, options)
	{
		return function(resp)
		{
			if(callback)
			{
				callback(model, resp, options);
			}
			else
			{
				model.trigger('error', model, resp, options);
			}
		};
	};

	// do a shallow clone of an array
	var shallow_array_clone	=	function(from)
	{
		var to	=	new Array();
		for(i in from)
		{
			to[i]	=	from[i];
		}
		return to;
	};

	// Creates a simple object with an "extends" function which returns a class
	// extended from class_type out of the given object
	var make_instance	=	function(class_type)
	{
		return {
			extend: function(obj)
			{
				if(obj.initialize)
				{
					var str	=	'You are creating a Composer object with an "initialize" method/' +
								'parameter, which is reserved. Unless you know what you\'re doing ' +
								'(and call this.parent.apply(this, arguments)), please rename ' +
								'your parameter to something other than "initialize"! Perhaps you' +
								'were thinking of init()?';
					console.log('----------WARNING----------');
					console.log(str);
					console.log('---------------------------');
				}
				var obj	=	Object.merge({Extends: class_type}, obj);
				return new Class(obj);
			}
		};
	};

	// list the items we're going to export with "extends" wrappers
	var exports		=	['Model', 'Collection', 'Controller'];

	// run the exports
	exports.each(function(ex) {
		Composer[ex]	=	make_instance(eval(ex));
	});
	Composer.Router	=	Router;
	window.Composer	=	Composer;
})();
