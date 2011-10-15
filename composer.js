(function() {
	var Composer	=	{};

	var Log	=	new Class({
		_log: function()
		{
			console.log.apply(this, arguments);
		}
	});

	var Sync	=	function(method, model, success, error)
	{
	};

	var Events	=	new Class({
		Implements: [Log],

		_events: {},

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


	var Model	=	new Class({
		Implements: [Log, Events],

		options: {},
		defaults: {},
		data: {},
		changed: false,
		collections: [],

		initialize: function(data)
		{
			if(typeof(data) == 'undefined')
			{
				data	=	this.defaults;
			}

			this.data	=	data;
			this.init();
		},

		init: function() {},
		validate: function() { return true; },

		get: function(key)
		{
			if(typeof(this.data[key]) == 'undefined')
			{
				return null;
			}
			return this.data[key];
		},

		set: function(data, options)
		{
			options || (options = {});

			var already_changing	=	this.changing;
			this.changing			=	true;

			for(x in data)
			{
				var val	=	data[x];
				if(val != this.data.x)
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

		save: function(data)
		{
			this.set(data);


			// TODO: syncing shit
		},

		destroy: function(options)
		{
			this.collections.each(function(collection) {
				collection.remove(this);
			}, this);
			this.trigger('destroy', this, this.collections, options);
			// TODO: syncing shit
		},

		toJSON: function()
		{
			return Object.clone(this.data);
		}
	});

	var Collection	=	new Class({
		Implements: [Events, Log],

		model: Model,

		models: [],
		length: 0,

		type: 'MyModel',

		initialize: function()
		{
			this.init();
		},

		init: function() {},

		toString: function()
		{
			return 'Composer.Model: ' + this.type + ': ' + models.length + ' models';
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
			return !!this.find(callback);
		},

		findById: function(id)
		{
			return this.find(function(rec) {
				if(typeof(rec.id) != 'undefined' && rec.id == id)
				{
					return true;
				}
			});
		},

		refresh: function(values, options)
		{
			options || (options = {});

			if(options.clear)
			{
				this.clear();
			}

			values.each(function(rec) {
				this.models.push(new this.model(rec));
			});
			this.refresh_length();

			this.trigger('refresh');
		},

		select: function(callback)
		{
			var matches	=	[];
			this.models.each(function(rec) {
				if(callback(rec))
				{
					matches.push(rec);
				}
			});

			return matches;
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

		model_event: function(ev, model, collection, options)
		{
			if((ev == 'add' || ev == 'remove') && collection != this) return;
			if(ev == 'destroy')
			{
				this.remove(model, options);
			}
			this.trigger.apply(this, arguments);
		}
	});

	var Controller	=	new Class({
		Implements: [Events, Log],

		event_splitter:	/^(\w+)\s*(.*)$/,
		tag: 'div',
		elements: {},
		events: {},

		initialize: function(params)
		{
			this.el || (this.el = new Element(this.tag);
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

	// Creates a simple object with an "extends" function which returns a class
	// extended from class_type out of the given object
	var make_instance	=	function(class_type)
	{
		return {
			extend: function(obj)
			{
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
	window.Composer	=	Composer;
})();
