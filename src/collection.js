/**
 * collection.js
 *
 * Provides an object used to handle groups of models.
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

	/**
	 * Collections hold lists of models and contain various helper functions for
	 * finding and selecting subsets of model data. They are basically a wrapper
	 * around an array, thats function is dealing with large amounts of model data.
	 *
	 * Collections can also sync with the server like models. They tie into model
	 * events in such a way that if a model's data changes, the collection will be
	 * notified, and anybody listinging to the collection (ie, a controller) can
	 * react to that event (re-display the view, for instance).
	 */
	var Collection = Composer.Base.extend({
		/**
		 * Track this object's type. Useful for debugging, mainly
		 */
		__composer_type: 'collection',

		// the TYPE of model in this collection
		model: Composer.Model,

		// "private" array holding all the models in this collection
		_models: [],

		// model.id/cid -> model hashes for fast id lookups
		_id_idx: {},
		_cid_idx: {},

		// function used for sorting. override to sort on a criteria besides order of
		// addition to collection
		sortfn: null,

		// the base url for this collection. if you update a model, the default url
		// sent to the sync function would be PUT /[collection url]/[model id].
		url: '/mycollection',

		// when a model belongs to many collections, it will generate its url from the
		// collection having the highest priority. if all have the same priority, then
		// the first collection from the list will have its url used for the model's
		// sync operation.
		priority: 1,

		/**
		 * allow the passing in of an array of data to instantiate a collection with a
		 * pre-set number of models. models will be created via this.model.
		 */
		initialize: function(models, params, options)
		{
			params || (params = {});
			for(var x in params)
			{
				this[x] = params[x];
			}

			// call Base.initialize
			this.parent();

			// allow Collection.model to be a string so load-order dependencies can be
			// kept to a minimum. here, we convert the string to an object on collection
			// instantiation and store it back into Collection.model.
			//
			// NOTE: this happens before the initial reset =]
			this.model = typeof(this.model) == 'string' ? global[this.model] : this.model;

			if(models)
			{
				this.reset(models, options);
			}

			this.init();
		},

		/**
		 * override me
		 */
		init: function() {},

		/**
		 * for each model in this collection, get its raw data, then return all of the
		 * raw data in an array
		 */
		toJSON: function()
		{
			return this.models().map( function(model) { return model.toJSON(); } );
		},

		/**
		 * wrapper to get the models under this collection for direct selection (often
		 * via MooTools' array helper/selection functions)
		 */
		models: function()
		{
			return this._models;
		},

		/**
		 * get the number of models in the collection
		 */
		size: function()
		{
			return this.models().length;
		},

		/**
		 * add a model to this collection, and hook up the correct wire in doing so
		 * (events and setting the model's collection).
		 */
		add: function(data, options)
		{
			if(Composer.array.is(data))
			{
				return data.forEach(function(model) { this.add(model, options); }.bind(this));
			}

			options || (options = {});

			// if we are passing raw data, create a new model from data
			var model = data instanceof Composer.Model ? data : new this.model(data, options);

			// reference this collection to the model
			if(model.collections.indexOf(this) == -1)
			{
				model.collections.push(this);
				options.is_new = true;
			}

			if(this.sortfn)
			{
				// if we have a sorting function, get the index the model should exist at
				// and add it to that position
				var index = options.at ? parseInt(options.at) : this.sort_index(model);
				this._models.splice(index, 0, model);
			}
			else
			{
				if (typeof(options.at) == 'number')
					this._models.splice(options.at, 0, model);
				else
					this._models.push(model);
			}

			// listen to the model's events so we can propogate them
			model.bind('all', this._model_event.bind(this, model), 'collection:'+this.cid()+':listen:model:all');

			// index the model (if we have a real id)
			this._index_model(model);

			this.fire_event('add', options, model, this, options);

			return model;
		},

		/**
		 * remove a model(s) from the collection, unhooking all necessary wires (events, etc)
		 */
		remove: function(model, options)
		{
			if(Composer.array.is(model))
			{
				return model.slice(0).forEach(function(m) { this.remove(m, options); }.bind(this));
			}
			if(!model) return;

			options || (options = {});

			// remove this collection's reference(s) from the model
			Composer.array.erase(model.collections, this);

			// save to trigger change event if needed
			var num_rec = this._models.length;

			// remove the model
			Composer.array.erase(this._models, model);

			// remove the model from the collection
			this._remove_reference(model);

			// if the number actually change, trigger our change event
			if(this._models.length != num_rec)
			{
				this.fire_event('remove', options, model);
			}
		},

		/**
		 * given a model, check if its ID is already in this collection. if so,
		 * replace is with the given model, otherwise add the model to the collection.
		 */
		upsert: function(data, options)
		{
			if(Composer.array.is(data))
			{
				return data.forEach(function(model) { this.upsert(model, options); }.bind(this));
			}

			options || (options = {});

			// if we are passing raw data, create a new model from data
			var model = data instanceof Composer.Model ? data : new this.model(data, options);

			var existing = this.find_by_id(model.id(), options);
			if(existing)
			{
				// reposition the model if necessary
				var existing_idx = this.index_of(existing);
				if(typeof(options.at) == 'number' && existing_idx != options.at)
				{
					this._models.splice(existing_idx, 1);
					this._models.splice(options.at, 0, existing);
					this.fire_event('sort', options);
				}

				// replace the data in the existing model with the new model's
				existing.set(model.toJSON(), Composer.object.merge({}, {silent: true, upsert: true}, options));
				this.fire_event('upsert', options, existing, options);

				return existing;
			}

			// model is not in this collection, add it
			this.add(model, options);
			return model;
		},

		/**
		 * remove all the models from the collection
		 */
		clear: function(options)
		{
			options || (options = {});

			// save to trigger change event if needed
			var num_rec = this._models.length;

			if(num_rec == 0) return;

			this.remove(this._models, options);
			this._models = [];

			// if the number actually change, trigger our change event
			if(this._models.length != num_rec)
			{
				this.fire_event('clear', options, options);
			}
		},

		/**
		 * reset the collection with all new data. it can also be appended to the
		 * current set of models if specified in the options (via "append").
		 */
		reset: function(data, options)
		{
			options || (options = {});

			if(!options.append && !options.upsert) this.clear(options);
			if(options.upsert)
			{
				this.upsert(data, options);
			}
			else
			{
				this.add(data, options);
			}

			this.fire_event('reset', options, options);
		},

		/**
		 * reset the collection with all new data. it does this asynchronously
		 * for each item in the data array passed. this is good for setting
		 * large amounts of data into a collection whose models may do heavy
		 * processing. this way, the browser is able to process other events (ie
		 * not freeze) while adding the models to the collection.
		 *
		 * data can be appended by setting the {append: true} flag in the
		 * options.
		 *
		 * when ALL models have been added, this function calls the
		 * options.complete callback.
		 */
		reset_async: function(data, options)
		{
			options || (options = {});

			if(data == undefined) return;
			if(!Composer.array.is(data)) data = [data];

			data = data.slice(0);

			if(!options.append && !options.upsert) this.clear();
			if(data.length > 0)
			{
				var batch = options.batch || 1;
				var slice = data.splice(0, batch);
				if(options.upsert)
				{
					this.upsert(slice, options);
				}
				else
				{
					this.add(slice, options);
				}
			}
			if(data.length == 0)
			{
				this.fire_event('reset', options, options);
				if(options.complete) options.complete()
				return;
			}
			setTimeout(function() {
				this.reset_async(data, Composer.object.merge({append: true}, options));
			}.bind(this), 0);
		},

		/**
		 * not normally necessary to call this, unless collection.sortfn changes after
		 * instantiation of the data. sort order is normall maintained upon adding of
		 * data viw Collection.add().
		 *
		 * However, since the sorting criteria for the models can be modified manually
		 * and it's not always desired to sort automatically, you can call this method
		 * to re-sort the data in the collection via the bubble-up eventing:
		 *
		 * mycollection.bind('change:sort_order', mycollection.sort.bind(mycollection))
		 */
		sort: function(options)
		{
			if(!this.sortfn) return false;

			this._models.sort(this.sortfn);
			this.fire_event('reset', options, options);
		},

		/**
		 * given the current sort function and a model passecd in, determine the
		 * index the model should exist at in the collection's model list.
		 */
		sort_index: function(model)
		{
			if(this._models.length == 0) return 0;

			if(!this.sortfn)
			{
				var idx = this.index_of(model);
				if(idx === false || idx < 0) return this.size();
				return idx;
			}

			var sorted = this._models.slice(0).sort(this.sortfn);
			for(var i = 0; i < sorted.length; i++)
			{
				if(model == sorted[i]) return i;
				if(this.sortfn(sorted[i], model) > 0) return i;
			}
			var index = sorted.indexOf(model);
			if(index == sorted.length - 1) return index;
			return sorted.length;
		},

		/**
		 * overridable function called when the collection is synced with the server
		 */
		parse: function(data)
		{
			return data;
		},

		/**
		 * convenience function to loop over collection's models
		 */
		each: function(cb, bind)
		{
			bind || (bind = this);
			this.models().forEach(cb.bind(bind));
		},

		/**
		 * convenience function to execute a function on a collection's models
		 */
		map: function(cb, bind)
		{
			bind || (bind = this);
			return this.models().map(cb.bind(bind));
		},

		/**
		 * Find the first model that satisfies the callback. An optional sort function
		 * can be passed in to order the results of the find, which uses the usual
		 * fn(a,b){return (-1|0|1);} syntax.
		 */
		find: function(callback, sortfn)
		{
			var models = this.models();
			if(sortfn) models = models.slice(0).sort(sortfn);

			for(var i = 0; i < models.length; i++)
			{
				var rec = models[i];
				if(callback(rec))
				{
					return rec;
				}
			}
			return false;
		},

		/**
		 * given a callback, returns whether or not at least one of the models
		 * satisfies that callback.
		 */
		exists: function(callback)
		{
			for(var i = 0; i < this.size(); i++)
			{
				if(callback(this.models()[i])) return true;
			}
			return false;
		},

		/**
		 * convenience function to find a model by id
		 */
		find_by_id: function(id, options)
		{
			options || (options = {});
			var model = this._id_idx[id];
			if(options.fast) return model || false;
			return model || this.find(function(model) {
				if(model.id(options.strict) == id)
				{
					return true;
				}
				if(options.allow_cid && model.cid() == id)
				{
					return true;
				}
			});
		},

		/**
		 * convenience function to find a model by cid
		 */
		find_by_cid: function(cid, options)
		{
			options || (options = {});
			var model = this._cid_idx[cid];
			if(options.fast) return model || false;
			return model || this.find(function(model) {
				if(model.cid() == cid)
				{
					return true;
				}
			});
		},

		/**
		 * get the index of an item in the list of models. useful for sorting items.
		 */
		index_of: function(model_or_id)
		{
			var id = model_or_id.__composer_type == 'model' ? model_or_id.id() : model_or_id;
			for(var i = 0; i < this._models.length; i++)
			{
				if(this._models[i].id() == id)
				{
					return i;
				}
			}
			return false;
		},

		/**
		 * Filter this collection's models by the given callback. Works just
		 * like Array.filter in JS.
		 */
		filter: function(callback, bind)
		{
			bind || (bind = this);
			return this._models.filter(callback.bind(bind));
		},

		/**
		 * query the models in the collection with a callback and return ALL that
		 * match. takes either a function OR a key-value object for matching:
		 *
		 * mycol.select(function(data) {
		 *		if(data.get('name') == 'andrew' && data.get('age') == 24)
		 *		{
		 *			return true
		 *		}
		 * });
		 *
		 * is the same as:
		 *
		 * mycol.select({
		 *		name: andrew,
		 *		age: 24
		 * });
		 *
		 * in other words, it's a very simple version of MongoDB's selection syntax,
		 * but with a lot less functionality. the only selection is direct value
		 * matching. still nice, though.
		 */
		select: function(selector)
		{
			if(typeof(selector) == 'object')
			{
				var params = selector;
				var keys = Object.keys(params);
				selector = function(model) {
					for(var i = 0; i < keys.length; i++)
					{
						var key = keys[i];
						var compare = params[key];
						if(model.get(key) !== compare) return false;
					}
					return true;
				};
			}
			return this._models.filter(selector);
		},

		/**
		 *	Convenience functon to just select one model from a collection
		 */
		select_one: function(selector)
		{
			var result = this.select(selector);

			if(result.length) return result[0];

			return null;
		},

		/**
		 * return the first model in the collection. if n is specified, return the
		 * first n models.
		 */
		first: function(n)
		{
			var models = this.models();
			return (typeof(n) != 'undefined' && parseInt(n) != 0) ? models.slice(0, n) : models[0];
		},

		/**
		 * returns the last model in the collection. if n is specified, returns the
		 * last n models.
		 */
		last: function(n)
		{
			var models = this.models();
			return (typeof(n) != 'undefined' && parseInt(n) != 0) ? models.slice(models.length - n) : models[models.length - 1];
		},

		/**
		 * returns the model at the specified index. if there is no model there,
		 * return false
		 */
		at: function(n)
		{
			var model = this._models[n];
			return (model || false);
		},

		/**
		 * given the current sort function, find the model at the given position
		 */
		sort_at: function(n)
		{
			if(!this.sortfn) return false;

			var sorted = this._models.slice(0).sort(this.sortfn);
			return sorted[n];
		},

		/**
		 * sync the collection with the server.
		 */
		fetch: function(options)
		{
			options || (options = {});

			var success = options.success;
			options.success = function(res)
			{
				this.reset(this.parse(res), options);
				if(success) success(this, res);
			}.bind(this);
			options.error = Composer.wrap_error(options.error ? options.error.bind(this) : null, this, options).bind(this);
			return (this.sync || Composer.sync).call(this, 'read', this, options);
		},

		/**
		 * simple wrapper to get the collection's url
		 */
		get_url: function()
		{
			return this.url;
		},

		/**
		 * Index a model by its id/cid
		 */
		_index_model: function(model)
		{
			var id = model.id(true);
			if(id)
			{
				this._unindex_model(model);
				// index the new, and track the ids
				this._id_idx[id] = model;
				model._tracked_ids.push(id);
			}
			this._cid_idx[model.cid()] = model;
		},

		_unindex_model: function(model)
		{
			// unindex old ids
			if(!model._tracked_ids) model._tracked_ids = [];
			model._tracked_ids.forEach(function(id) {
				delete this._id_idx[id];
			}.bind(this));
			delete this._cid_idx[model.cid()];
		},

		/**
		 * remove all ties between this colleciton and a model
		 */
		_remove_reference: function(model)
		{
			// unindex the model
			this._unindex_model(model);

			// defref this collection from the model
			Composer.array.erase(model.collections, this);

			// don't listen to this model anymore
			model.unbind('all', 'collection:'+this.cid()+':listen:model:all');
		},

		/**
		 * bound to every model's "all" event, propagates or reacts to certain events.
		 */
		_model_event: function(model, ev, _)
		{
			// reindex the model if its id changed
			if(ev == 'change:'+ model.id_key) this._index_model(model);
			if(ev == 'destroy') this.remove(model, arguments[4]);

			// forward the event
			var args = Array.prototype.slice.call(arguments, 1);
			this.trigger.apply(this, args);
		}
	});
	this.Composer.exp0rt({ Collection: Collection });
}).apply((typeof exports != 'undefined') ? exports : this);

