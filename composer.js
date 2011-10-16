(function() {
	var Composer	=	{};

	var Sync	=	function(method, model, success, error)
	{
	};

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
	var Events	=	new Class({
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
			// allow adding of multiple events split by space
			name.trim().split(' ').each(function(ev) {
				this._events[ev] || (this._events[ev] = []);
				if(!this._events[ev].contains(callback))
				{
					this._events[ev].push(callback);
				}
			}, this);

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
		collections: [],

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

			var already_changing	=	this.changing;
			this.changing			=	true;

			// TODO: validation

			for(x in data)
			{
				var val	=	data[x];
				if(val != this.data[x])
				{
					this.data[x]	=	val;
					this.changed	=	true;
					if(!options.silent)
					{
						this.trigger('change:'+x, this, val, options);
					}
				}
			}

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

			// TODO: validation

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

			// TODO: validation

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

			// TODO: syncing shit
		},

		save: function(data, options)
		{
			options || (options = {});

			this.set(data);

			// TODO: syncing shit
		},

		destroy: function(options)
		{
			options || (options = {});

			this.collections.each(function(collection) {
				collection.remove(this);
			}, this);
			this.trigger('destroy', this, this.collections, options);
			// TODO: syncing shit
		},

		parse: function(data)
		{
			return data;
		},

		clone: function()
		{
			return new this.$constructor(this.toJSON());
		},

		toJSON: function()
		{
			return Object.clone(this.data);
		}
	});

	var Collection	=	new Class({
		Implements: [Events],

		model: Model,

		models: [],
		length: 0,

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
			return 'Composer.Model: ' + this.type + ': ' + models.length + ' models';
		},

		toJSON: function()
		{
			return this.models.map( function(model) { return model.toJSON(); } );
		},

		find: function(callback)
		{
			for(var i = 0; i < this.models.length; i++)
			{
				var rec	=	this.models[i];
				if(callback(rec))
				{
					return rec;
				}
			}
			return false;
		},

		exists: function(callback)
		{
			return this.models.some(callback);
		},

		findById: function(id)
		{
			return this.find(function(model) {
				if(typeof(model[model.id_key]) != 'undefined' && model[mode.id_key] == id)
				{
					return true;
				}
			});
		},

		reset: function(values, options)
		{
			options || (options = {});

			if(options.clear)
			{
				this.clear();
			}

			values.each(function(data) {
				this.models.push(new this.model(data));
			});
			this.refresh_length();

			this.trigger('reset');
		},

		select: function(callback)
		{
			return this.models.filter(callback);
		},

		models: function()
		{
			return this.models();
		},

		add: function(model, options)
		{
			// reference this collection to the model
			if(!model.collections.contains(this))
			{
				model.collections.push(this);
			}

			this.models.push(model);
			this.refresh_length();

			// trigger the change event
			model.bind('all', this.model_event.bind(this));
			this.trigger('add', model, this, options);
		},

		remove: function(model)
		{
			// remove this collection's reference(s) from the model
			model.collections.erase(this);

			// save to trigger change event if needed
			var num_rec	=	this.models.length;

			// don't listen to this model anymore
			model.unbind('all', this.model_event.bind(this));

			// remove the model from the collection
			this.models.erase(model);
			this.refresh_length();

			// if the number actually change, trigger our change event
			if(this.models.length != num_rec)
			{
				this.trigger('remove');
			}
		},

		clear: function()
		{
			// save to trigger change event if needed
			var num_rec	=	this.models.length;

			this.models	=	[];
			this.refresh_length();

			// if the number actually change, trigger our change event
			if(this.models.length != num_rec)
			{
				this.trigger('clear');
			}
		},

		first: function(n)
		{
			return (typeof(n) != 'undefined' && parseInt(n) != 0) ? this.models.slice(0, n) : this.models[0];
		},

		last: function(n)
		{
			return (typeof(n) != 'undefined' && parseInt(n) != 0) ? this.models.slice(this.models.length - n) : this.models[0];
		},

		// TODO
		fetch: function(options)
		{
		},

		refresh_length: function()
		{
			this.length	=	this.models.length;
		},

		model_event: function(ev, model, collections, options)
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

		init: function() {},
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
			redirect_initial: true
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

			// run the initial route
			window.fireEvent('hashchange', [value]);
		},

		register_callback: function(cb)
		{
			this.callbacks.push(cb);
		},

		route: function(url)
		{
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
			obj[action].apply(this, args);
		},

		setup_routes: function(routes)
		{
			this.routes	=	routes;
		},

		hash_change: function(hash)
		{
			// remove the motherfucking ! at the beginning
			hash	=	hash.replace(/^!/, '');
			if(this.last_hash == hash)
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
