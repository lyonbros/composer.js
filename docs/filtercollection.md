---
title: Filter collection
layout: documentation
---

# Filter collection

The filter collection is a fine specimen. It latches onto another collection
(known as the "master" collection) and listens to various events, keeping its
models up-to-date based on various criteria it is given.

For instance, a filter collection could attach to your "users" collection in
your app, but only contain users that begin with the letter "a" or users under
the age of 30.

You can arbitrarily set the filtering, sorting, and limiting of the items in the
filter collection as you see fit.

This gives you a very powerful tool to show specific slices of data without
having to worry about keeping that slice up to date. It all just works. You can
event attach a filter collection to *another* filter collection to narrow down
your data even more.

## Events

The filter collection fires all events that [Composer.Collection](/composer.js/docs/collection#composer-collection)
fires, with no material differences.

## Composer.FilterCollection

This is the filter collection class. It extends [Composer.Collection class](/composer.js/docs/collection#composer-collection),
giving it all the Collection's abilities.

### master :: attribute(null)

This parameter is the master collection this filter collection
latches on to. It must be preset for the filter collection to function properly,
and is generally set by [initialize](#initialize).

### filter :: function(model)

Default: `function() { return true; }`. The main filter function. This will
return either true or false for every model passed (true meaning "yes this
filter collection should contain this model", false meaning "exclude this model
from the filter collection").

### transform :: function(model, action)

Default: `null`. A function you set that will run any needed data transformation
on models [added](#add) or [removed](#remove) from the filter collection.
`model` is the model being added/removed, `action` will be one of "add" or
"remove".

### limit :: attribute(false)

Either false (disabled) or an integer value that determines
the max number of models this filter collection should hold. This is applied
*after* the [sortfn](/composer.js/docs/collection#sortfn).

### options :: attribute

{% highlight js %}
{
    forward_all_events: false,
    refresh_on_change: false,
    sort_event: false
}
{% endhighlight %}

`forward_all_events` tells the filter collection whether or not to forward all
events that happen on the master colleciton through itself. This can be useful
if you have a view that needs to be updated for every change in the underlying
data (it makes the filter collection much more trigger happy) but probably isn't
needed in most instances.

`refresh_on_change` tells the filter collection that when any data changes, we
want to clear out the models, re-filter them, re-sort them, and apply our limit.
This is a *very* expensive operation depending our your filter collection model
set, and generally shouldn't be used (it's mainly provided for backwards
compatibility). If this is false, the filter collection is smarter about what
data changes will trigger what events.

`sort_event` tells the filter collection to fire a "sort" event whenever the
sort order of items changes.

### initialize :: function(master, options)

Constructor. `master` is the collection (or filter collection) to attach to and
start filtering on.

`options` can contain both [filter collection options](#options) as well as
various parameters to set into the filter collection itself (`sortfn`,
[filter](#filter), [transform](#transform), etc) on instantiation.

<div class="noeval">
{% highlight js %}
var filter = new Composer.FilterCollection(new Composer.Collection, {
    refresh_on_change: true,
    filter: function(model) { return model.get('name').toLowerCase() == 'larry'; }
});
{% endhighlight %}
</div>

### attach :: function()

Attach the filter collection to the [master](#master) collection. This is called
by default by [initialize](#initialize).

### detach :: function()

Stop listening to events on the [master](#master). This should be called on any
filter collection you wish to remove from your app after it has been
instantiated, otherwise it will not be garbage collected.

### refresh :: function(options)

Refresh the models in the filter collection (brute force). This will clear the
filter collection, re-filter the models from the master, re-sort them, and then
apply the limit (if it exists).

`options` can contain the following items:

- `diff_events` - if true, `refresh` will track which models have been added /
removed during the process and trigger "add" or "remove" events for them.

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

### add :: function(data, options)

Like [Collection.add](/composer.js/docs/collection#add-1), but will apply the
[transform](#transform) function to the model (with the "add" action) and also
will return false if after transformation the model does not result in
[filter](#filter) returning true.

This function also adds the model to the [master](#master) collection.

`options` can contain the following items:

- `at` - insert the model at a specific integer index in the collection's data

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

### remove :: function(model, options)

Like [Collection.remove](/composer.js/docs/collection#remove-1), but will apply
the [transform](#transform) function the the model (with the "remove" action).
Removes the passed model from the [master](#master) collection as well as the
filter collection.

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

