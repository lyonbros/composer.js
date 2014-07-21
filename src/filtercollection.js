/**
 * filtercollection.js
 *
 * Provides a collection type that utilizes automatic filtering to create what
 * are essentially materialized views.
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
	 * Collection that exists solely to be a "materialized view" of another
	 * "master" collection. Whenever items are added/removed from the master
	 * collection, the changes are filtered and applied to this collection as well.
	 * This is useful for keeping many collections in sync with one master list
	 * without having to manually update them all.
	 */
	var FilterCollection = Composer.Collection.extend({
		/**
		 * Track this object's type. Useful for debugging, mainly
		 */
		__composer_type: 'filtercollection',

		// holds the master collection, used to derive the items in this
		// filtercollection
		master: null,

		// the filter function, used to determine if a model should be included
		// in the filtercollection's results
		filter: function() { return true },

		// transformation function, called on a model when it's added or removed
		// to the collection
		transform: null,

		// if set to an integer will limit the amount of models this collection
		// will keep (post sort)
		limit: false,

		options: {
			forward_all_events: false,
			refresh_on_change: false,	// performance hit, but needed for backward compat
			sort_event: false,			// if true, fires a 'sort' event instead of 'reset' when sorting
		},

		initialize: function(master, options)
		{
			options || (options = {});

			var optkeys = Object.keys(this.options);
			Object.keys(options).forEach(function(k) {
				var v = options[k];
				if(typeof(v) == 'function') v = v.bind(this);
				if(optkeys.indexOf(k) >= 0)
				{
					this.options[k] = v;
				}
				else
				{
					this[k] = v;
				}
			}.bind(this));

			// call Base.initialize
			this.parent();

			this.master = master;

			if(!this.master) return false;
			if(!this.filter) return false;

			this.attach(options);
			if(!options.skip_initial_sync) this.refresh();
		},

		/**
		 * bind our events to the master collection and start filtering
		 */
		attach: function()
		{
			this.master.bind('all', this.match_action.bind(this), 'filtercollection:'+this.cid()+':all');
			this.bind('reset', function(options) {
				options || (options = {});
				if(options.has_reload) return false;
				this.refresh(options);
			}.bind(this), 'filtercollection:reset');
		},

		/**
		 * detach from the master collection (stop listening and filtering)
		 */
		detach: function()
		{
			this.master.unbind('all', 'filtercollection:'+this.cid()+':all');
			this.unbind('reset', 'filtercollection:reset');
		},

		/**
		 * internal function used to match events from the master collection.
		 */
		match_action: function(event, model)
		{
			var args = Array.prototype.slice.call(arguments, 0);
			switch(event)
			{
			case 'add':
				this.add_event(model, {from_event: true}); break;
			case 'reset':
				this.refresh(); break;
			case 'clear':
				this.clear(); break;
			case 'remove':
				this.remove_event(model, {from_event: true}); break;
			case 'change':
				this.change_event(model, {}, args); break;
			case 'sort':
				this.refresh(); break;
			default:
				this.forward_event(event, model, args); break;
			}
		},

		/**
		 * match our models to the master collection
		 *
		 * works by filtering the master's models then comparing the original
		 * models to the new (filtered) ones and firing the add/remove events
		 * for each model respectively.
		 *
		 * also performs sorting/limiting.
		 */
		refresh: function(options)
		{
			options || (options = {});

			if(options.diff_events)
			{
				var old_models = this._models;
			}
			this._models = this.master._models.filter(function(model) {
				return this.filter(model, this);
			}.bind(this));
			this.sort({silent: true});
			if(this.limit) this._models.splice(this.limit);
			if(options.diff_events)
			{
				var arrdiff = function(arr1, arr2) { return arr1.filter(function(el) { return arr2.indexOf(el) < 0; }); };

				arrdiff(old_models, this._models).forEach(function(model) {
					this.fire_event('remove', options, model);
				}, this);

				arrdiff(this._models, old_models).forEach(function(model) {
					this.fire_event('add', options, model);
				}, this);
			}
			this.fire_event('reset', options, {has_reload: true});
		},

		/**
		 * fired when a model changes. when this happens, we have to make sure
		 * the model still meets the filtercollection's criteria so we call
		 * tihs.filter on it to see if it "fits in."
		 */
		change_event: function(model, options, forward_args)
		{
			options || (options = {});

			// see if this model even belongs to this collection
			if(!model || this.models().indexOf(model) < 0 || !this.filter(model, this)) return false;

			// track the current number of items and reloda the data
			var num_items = this._models.length;

			if(this.options.refresh_on_change)
			{
				// the brute force option (re-sort everything, re-filter everything)
				// VERY expensive
				this.refresh({silent: true});
			}
			else
			{
				// a more tactful approach
				var cur_index = this._models.indexOf(model);
				var new_index = this.sort_index(model);

				if(cur_index == -1 && this.filter(model, this))
				{
					// welcome to the team!
					this.add(model, options);
				}
				else if(cur_index > -1 && !this.filter(model, this))
				{
					// we feel that your interests no longer align with the team's
					// ...we're going to have to let you go.
					//
					// You BASTARDS I've poured my LIFE into this collection!!
					//
					// Yes and we're thankful for your hard work, but feel it's
					// time to move on. Your replacement is a potted plant (come
					// to think of it, so is your severance). Think of this as a
					// new beginning! Now get out of my office.
					this.remove(model, options);
				}
				else if(cur_index != new_index)
				{
					// sort order changed
					if(this.options.sort_event)
					{
						this.sort(Composer.object.merge({}, options, {silent: true}));
						this.fire_event('sort', options);
					}
					else
					{
						this.sort(options);
					}
				}
			}

			// if the number of elements in the FC changed, just fire a standard
			// "change" event (with the forwarded args), otherwise the change
			// triggered a membership change, so fire a "reset"
			if(this._models.length == num_items)
			{
				forward_args.shift();
				var args = ['change', options].concat(forward_args);
				this.fire_event.apply(this, args);
			}
			else
			{
				this.fire_event('reset', options);
			}
		},

		/**
		 * extension of Collection.add that makes sure our model passes the
		 * filter test, and also adds the model into the master collection
		 * instead of the filtercollection's models dircetly.
		 */
		add: function(data, options)
		{
			if (data instanceof Array)
			{
				return Composer.object.each(data, function(model) { this.add(model, options); }, this);
			}
			
			options || (options = {});
			if(typeof(options.transform) == 'undefined') options.transform = true;

			// if we are passing raw data, create a new model from data
			var model = data.__composer_type == 'model' ? data : new this.master.model(data, options);

			if(this.transform && options.transform)
			{
				model = this.transform.call(this, model, 'add');
			}

			// model doesn't match filter. NICE TRY
			if(!this.filter(model, this)) return false;

			if(typeof(options.at) == 'number')
			{
				// find the correct insertion point in the master it options.at is set.
				var current = this.at(options.at);
				var master_idx = this.master.index_of(current);
				if(master_idx !== false)
				{
					options.at = master_idx;
				}
			}
			
			// if this model exists in the master already, we call our special
			// _do_add method, which manually adds, sorts, and limits for us.
			// otherwise, we just call master.add() and the model will be added
			// here via our wonderful events
			if(this.master.index_of(model))
			{
				this._do_add(model, options);
			}
			else
			{
				this.master.add(model, options);
				if(this.limit) this._models.splice(this.limit);
			}
			return model;
		},

		/**
		 * Manually add a model to this collection. Sorts and limits as well.
		 */
		_do_add: function(model, options)
		{
			// master already has item, so we don't need to add it to
			// master (it will just fire "upsert"). what we need is to
			// add the model to this collection's models, sorted, and
			// apply the limit.
			this._models.push(model);
			var old_idx = this._models.indexOf(model);
			this.sort({silent: true});
			var new_idx = this._models.indexOf(model);
			if(this.limit) this._models.splice(this.limit);
			// after sort/limit, model may not actually be in the FC, so
			// check before wildly firing add/sort events
			if(this.index_of(model))
			{
				// model was actually added, fire "add" event
				this.fire_event('add', options, model, this, options);
				if(old_idx != new_idx)
				{
					// sort changed! fire appropriate event
					if(this.options.sort_event)
					{
						this.fire_event('sort', options);
					}
					else
					{
						this.fire_event('reset', options);
					}
				}
			}
		},

		/**
		 * extension of Colleciton.remove that removes the model from the
		 * collection but only if it exists
		 */
		remove: function(model, options)
		{
			if (model instanceof Array)
			{
				return Composer.object.each(model, function(m) { this.remove(m); }, this);
			}
			
			options || (options = {});
			if(typeof(options.transform) == 'undefined') options.transform = true;

			if(this._models.indexOf(model) < 0) return false;

			if(this.transform && options.transform)
			{
				model = this.transform.call(this, model, 'remove');
			}

			// remove the model
			Composer.array.erase(this._models, model);

			this.fire_event('remove', options, model);

			// remove the model from the collection
			this._remove_reference(model);
		},

		add_event: function(model, options)
		{
			if(!this.filter(model, this)) return false;
			this.refresh({silent: true});
			if(this.options.sort_event) this.fire_event('sort', options);
			this.fire_event('add', options, model, this, options);
		},

		remove_event: function(model, options)
		{
			if(this._models.indexOf(model) < 0) return false;
			this.refresh({silent: true});
			this.fire_event('remove', options, model);
		},

		forward_event: function(event, model, args)
		{
			// return if not forwarding events
			if(!this.options.forward_all_events) return false;

			// we're forwarding events, but we're not about to forward them for
			// a model that doesn't "fit in" around here
			if(model && model.__composer_type == 'model' && !this.filter(model, this))
			{
				return false;
			}
			this.trigger.apply(this, args);
		}
	});

	Composer.exp0rt({ FilterCollection: FilterCollection });
})();
