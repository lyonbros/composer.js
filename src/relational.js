/**
 * relational.js
 *
 * An extension of the Model to allow hierarchical data structures.
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

	var RelationalModel = Composer.Model.extend({
		relations: false,
		relation_data: {},

		// if true, toJSON will just call Model.toJSON instead of serializing
		// the relational data
		skip_relational_serialize: false,

		initialize: function(data, options)
		{
			options || (options = {});

			if(this.relations)
			{
				// cache the model/collection strings to real objects
				Composer.object.each(this.relations, function(relation, k) {
					// for each relation, make sure strings are referenced back to the catual
					// objects they refer to.
					if(relation.model && typeof(relation.model) == 'string')
					{
						relation.model = this._get_key(global, relation.model);
					}
					else if(relation.collection && typeof(relation.collection) == 'string')
					{
						relation.collection = this._get_key(global, relation.collection);
					}
					else if(relation.filter_collection && typeof(relation.filter_collection) == 'string')
					{
						// set up the filter collection. if one doesn't exist, create a function
						// that looks within the keys of the relational data to pull a master
						// collection out of.
						relation.filter_collection = this._get_key(global, relation.filter_collection);
						var master = relation.master;
						if(typeof(master) == 'string')
						{
							var master_key = relation.master;
							relation.master = function()
							{
								var master = this._get_key(this.relation_data, master_key);
								if(!master)
								{
									master = new this.relations[master_key].collection();
									this._set_key(this.relation_data, master_key);
								}
								return master;
							}.bind(this);
							relation.master();
						}
					}

					// unless otherwise specified, load relational objects up-front
					if(!relation.delayed_init)
					{
						var obj = this._create_obj(relation, k, {set_parent: true});
					}
				}, this);
			}

			// call Model.initialize()
			return this.parent(data, options);
		},

		/**
		 * extension of Model.toJSON() that also serializes the child
		 * (relational) objects
		 */
		toJSON: function()
		{
			// modify the underlying data to match the data of the relational models
			if(!this.skip_relational_serialize)
			{
				Composer.object.each(this.relations, function(relation, k) {
					var obj = this._get_key(this.relation_data, k);
					if(obj) this._set_key(this.data, k, obj.toJSON());
				}, this);
			}

			// call Model.toJSON()
			return this.parent();
		},

		/**
		 * extension of Model.set which creates sub-models/collections from the
		 * given data if specified by our relations
		 */
		set: function(data, options)
		{
			options || (options = {});

			if(this.relations && !options.skip_relational)
			{
				Composer.object.each(this.relations, function(relation, k) {
					var d = this._get_key(data, k);
					if(typeof(d) == 'undefined') return;

					var options_copy = Composer.object.clone(options);
					options_copy.data = d;
					var obj = this._create_obj(relation, k, options_copy);
				}, this);
			}

			// call Model.set()
			return this.parent(data, options);
		},

		/**
		 * extension of Model.get which returns our relational data if it exists
		 */
		get: function(key, def)
		{
			var obj = this._get_key(this.relation_data, key);
			if(typeof(obj) != 'undefined') return obj;

			// call Model.get()
			return this.parent(key, def);
		},

		/**
		 * a wrapper around bind that makes sure our relational objects exist
		 */
		bind_relational: function(key)
		{
			var relation = this.relations[key];
			if(!relation) return false;

			var obj = this._create_obj(relation, key);

			// bind the event to the object
			var args = Array.prototype.slice.call(arguments, 0);
			obj.bind.apply(obj, args.slice(1));
		},

		/**
		 * a wrapper around unbind that makes sure our relational objects exist
		 */
		unbind_relational: function(key)
		{
			var relation = this.relations[key];
			if(!relation) return false;

			// grab the object and unbind the event
			var obj = this._get_key(this.relation_data, key);
			if(!obj) return false;
			var args = Array.prototype.slice.call(arguments, 0);
			obj.unbind.apply(obj, args.slice(1));
		},

		/**
		 * creates a reference to the parent (owning) object from the child
		 */
		set_parent: function(parent, child)
		{
			child.get_parent = function() { return parent; };
		},

		/**
		 * get a sub-object's parent
		 */
		get_parent: function(child)
		{
			return child.get_parent();
		},

		/**
		 * wrapper around creation/retrieval of relational sub-objects
		 */
		_create_obj: function(relation, obj_key, options)
		{
			options || (options = {});
			var _data = options.data;
			delete options.data;

			// check if the object being passed in is already a Composer object
			if(_data && _data.__composer_type && _data.__composer_type != '')
			{
				// yes, we passed in a composer object...set it directly into
				// the relational data as a replacement for the old one.
				// TODO: maybe provide an option to specify replace/update
				var obj = _data;
			}
			else
			{
				// data passed is just a plain old object (or, at least, not a
				// Composer object). set the data into the relation object.
				var obj = this._get_key(this.relation_data, obj_key);
				var collection_or_model = (relation.collection || relation.filter_collection) ?
											'collection' : 'model';
				switch(collection_or_model)
				{
				case 'model':
					obj || (obj = new relation.model());
					if(options.set_parent) this.set_parent(this, obj);	// NOTE: happens BEFORE setting data
					if(_data) obj.set(_data);
					break;
				case 'collection':
					if(!obj)
					{
						if(relation.collection)
						{
							obj = new relation.collection();
						}
						else if(relation.filter_collection)
						{
							obj = new relation.filter_collection(relation.master(), Composer.object.merge({skip_initial_sync: true}, relation.options));
						}
					}
					if(options.set_parent) this.set_parent(this, obj);	// NOTE: happens BEFORE setting data
					if(_data) obj.reset(_data, options);
					break;
				}
			}

			// set the object back into our relational data objects
			this._set_key(this.relation_data, obj_key, obj);
			this.trigger('relation', obj, obj_key);
			this.trigger('relation:'+obj_key, obj);
			return obj;
		},


		/**
		 * wrapper around data[key] = value (equivelant:
		 *   _set_key(data, key, value)
		 * the VALUE ADD is that you can do things like:
		 *   _set_key(data, 'key.subkey', value)
		 * which yields:
		 *   {key: {subkey: value}}
		 */
		_set_key: function(object, key, value)
		{
			object || (object = {});
			var paths = key.split('.');
			var obj = object;
			for(var i = 0, n = paths.length; i < n; i++)
			{
				var path = paths[i];
				if(i == n - 1)
				{
					obj[path] = value;
					break;
				}

				if(!obj[path])
				{
					obj[path] = {};
				}
				else if(typeOf(obj[path]) != 'object')
				{
					obj[path] = {};
				}
				obj = obj[path];
			}
			return object;
		},

		/**
		 * the getter version of _set_key
		 */
		_get_key: function(object, key)
		{
			object || (object = {});
			var paths = key.split('.');
			var obj = object;
			for(var i = 0, n = paths.length; i < n; i++)
			{
				var path = paths[i];
				var type = typeof(obj[path]);
				if(type == 'undefined')
				{
					return obj[path];
				}
				obj = obj[path];
			}
			return obj;
		}
	});

	Composer.merge_extend(RelationalModel, ['relations']);

	Composer.exp0rt({
		HasOne: -1,		// no longer used but needed for backwards compat
		HasMany: -1,	// " "
		RelationalModel: RelationalModel
	});
}).apply((typeof exports != 'undefined') ? exports : this);

