---
title: Collection
layout: documentation
---

# Collection

A collection is an object that stores a flat list of models. Essentially an
array. However, collections are important because, like models, they emit
various events you can hook into to make building your app a lot easier. They
also provide a number of convenience functions for handling the contained
models.

A collection can contain many models, and a model can exist in many collections.
This is in contrast to many other MVC frameworks where a model is only allowed
to exist in one collection.

Collections will also forward various events from the contained models
(triggering the events that happen to the models on itself), which allows for
monitoring a group of models all together.

## Events

Collections have a number of built-in events you can tie into:

### add

Triggered when a new model is added to a collection. Arguments passed:

- the model being added
- the collection adding the new model
- the options passed to the [add](#add-1) function.

### remove

Triggered when a model is removed from the collection. Arguments passed:

- the model being removed

### sort

Fired when an upserted model is put into a new position (it wasn't added, but
its position changed). No arguments passed.

### upsert

Fired when an existing model is upserted. If a new model is upserted, [add](#add)
is triggered instead. Arguments passed:

- the model being upserted
- the options passed to [upsert](#upsert)

### clear

Fired when a collection is [cleared](#clear-1). No arguments passed.

### reset

Triggered when a collection is [reset](#reset-1) with new data. Arguments
passed:

- the options passed to [reset](#reset-1).

## Composer.Collection

This is the collection class. It extends [Composer.Base](/composer.js/docs/base),
giving you everything base has.

### model :: attribute(Composer.Model)

This is a parameter tells the collection what object to use for newly created
models.

### sortfn :: function(a, b)

If specified, newly added models will be sorted based on this function before
being inserted into the collection. Note that sorting is only done on insertion,
and if the data in your models changes, the sort may not be correct.

If you need a collection that maintains sort order of your models as they
update, see the [Filter collection](/composer.js/docs/filtercollection).

### url :: attribute("/mycollection")

Tells the collection what URL base the models should
use (assuming they don't have a URL manually specified) when calling the [Composer.sync](/composer.js/docs/util#composer-sync)
function.

### priority :: attribute(1)

Used mainly to determine which collection to derive the URL from
when a model calls [get_url](/composer.js/docs/model#get-url).

### initialize :: function(models, params, options)

The constructor. `models` can be an array of either [Composer.Model](/composer.js/docs/model)
objects, or an array of flat data. If data is passed instead of models, the
[model parameter](#model) is used to determine what kind of model to create.

`params` allows setting top-level values into the collection on instantiation
(such as [the model parameter](#model) or [sortfn](#sortfn)).

`options` is a hash object that can be passed in to various operations in the
contructor. Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

__Note:__ unless you know what you're doing, you shouldn't overwrite the
initialize function. Use [init](#init) instead.

### init :: function()

Called on creation of a new collection. Can be used to set up bindings or other
initialization work. Meant to be overridden.

### toJSON :: function()

Calls [Model.toJSON](/composer.js/docs/model#tojson) on every contained model
and shoves the results into a nice array. This is nice for serializing a
collection into JSON or another format.

### models :: function()

Returns a javascript array of the contained models.

### size :: function()

Returns the number of models held in this collection.

{% highlight js %}
var collection = new Composer.Collection([{name: 'bella'}, {name: 'sally'}, {name: 'andrea'}]);
alert('Size: '+ collection.size());
{% endhighlight %}

### add :: function(data, options)

Add a new model to the collection. `data` can be a javascript hash object, a
Composer model, or an array of either. In the case that `data` is a javascript
object (or an array of objects), each object is used to create the model object
given under [Collection.model](#model). This lets a collection maintain a
certain model type for added data.

`options` can contain the following items:

- `at` - insert the model at a specific integer index in the collection's data

Note that `options` can also contain [silencing directives](/composer.js/docs/event#silencing).

{% highlight js %}
var collection = new Composer.Collection();
collection.add([{name: 'larry'}, {name: 'curly'}, {name: 'moe'}]);
alert('Hello, '+ collection.at(2).get('name'));
{% endhighlight %}

### remove :: function(model, options)

Remove a model from the collection. `model` must be a Composer model object. If
a model is passed that isn't in the current collection, no changes are made.

Note that `options` can also contain [silencing directives](/composer.js/docs/event#silencing).

### upsert :: function(data, options)

Upsert a model (insert if it doesn't exist, otherwise update the existing model
with the given data). `data` can be a javascript hash object, a Composer model,
or an array of either. The model passed to `upsert` doesn't need to be the same
reference as the existing model, only the IDs ([model.id()](/composer.js/docs/model#id))
need to match.

`options` can contain the following items:

- `at` - insert the model at a specific integer index in the collection's data

Note that `options` can also contain [silencing directives](/composer.js/docs/event#silencing).

{% highlight js %}
var collection = new Composer.Collection();
collection.add({id: '1212', name: 'larry'});
collection.upsert(new Composer.Model({id: '1212', name: 'sandra'}));
alert('New name: '+ collection.first().get('name'));
{% endhighlight %}

### clear :: function(options)

Clear (remove) all models from the collection. Fires [remove](#remove) events
for each model removed. Also fires the [clear](#clear) event if any models were
removed.

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

### reset :: function(data, options)

Reset the models in the collection with new ones. This is the same as a [clear](#clear-1)
followed by an [add](#add-1).

Fires the [reset](#reset) event.

`options` can contain the following items:

- `append` - boolean indicating of the given data should be appended to the
current data (as opposed to the current data being wiped first)
- `upsert` - boolean indicating that the given data should be [upserted](#upsert-1)
(updated if existing, added otherwise). Forces `{append: true}`. This is useful
for updating a large number of items in the collection with new data without
removing/re-adding everything.

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

{% highlight js %}
var collection = new Composer.Collection({name: 'shemp'});
collection.reset([{name: 'larry'}, {name: 'curly'}, {name: 'moe'}]);
alert('Have '+ collection.size() +' models!');
{% endhighlight %}

### reset_async :: function(data, options)

Like [reset](#reset-1), except that data is added incrementally per event cycle,
triggering a [reset](#reset) event when complete.

`options` can contain the following items:

- `append` - boolean indicating of the given data should be appended to the
current data (as opposed to the current data being wiped first)
- `upsert` - boolean indicating that the given data should be [upserted](#upsert-1)
(updated if existing, added otherwise). Forces `{append: true}`. This is useful
for updating a large number of items in the collection with new data without
removing/re-adding everything.
- `complete` - a function of 0 arguments that gets called when the operation
completes
- `batch` - an integer telling `reset_async` how many items of our given `data`
to add to the collection at once (defaults to `1`). Useful for tunning your
latency-to-loop-blocking ratio.

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

{% highlight js %}
var collection = new Composer.Collection();
collection.reset_async([{name: 'larry'}, {name: 'curly'}, {name: 'moe'}], {
    complete: function() {
        alert('Done, have '+ collection.size() +' models!');
    }
});
{% endhighlight %}

### sort :: function(options)

Sorts the models in the collection, manually, using [sortfn](#sortfn). Fires the
[reset](#reset) event on completion.

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

### sort_index :: function(model)

Returns the index (in [Collection.models()](#models)) of the given model. If no
[sortfn](#sortfn) property is present in the collection, returns false.

### parse :: function(data)

Allows pre-processing of data from external API sources before adding to the
collection (see [Model.parse](/composer.js/docs/model#parse)).

### each :: function(callback, bind)

Runs the given `callback` (optionally bound to `bind`'s scope) on each model in
the collection (the only argument being the model itself).

{% highlight js %}
var collection = new Composer.Collection([{name: 'sasha'}, {name: 'sandra'}]);
var res = [];
collection.each(function(m) { res.push(m.get('name')); });
alert('Names: '+ JSON.stringify(res));
{% endhighlight %}

### map :: function(callback, bind)

Runs a javascript `map` on the models in the collection using the `callback` as
the map function (optionally bound to `bind`'s scope), aggregating the results
into the returned array.

{% highlight js %}
var collection = new Composer.Collection([{name: 'sasha'}, {name: 'sandra'}]);
var res = collection.map(function(m) { return m.get('name'); });
alert('Names: '+ JSON.stringify(res));
{% endhighlight %}

### find :: function(callback, sortfn)

Finds the first model that `callback` returns `true` for. Optionally allows
specifying a `sortfn`, which is applied on a *copy* of the models (doesn't
actually change the model sort in the collection) before the find operation
begins.

{% highlight js %}
var collection = new Composer.Collection([{name: 'larry'}, {name: 'curly'}, {name: 'moe'}]);
var moe = collection.find(function(m) { return m.get('name') == 'moe'; });
alert('Found moe? '+ (moe ? true : false));
{% endhighlight %}

### exists :: function(callback)

Like [find](#find), but just returns `true` if at least one model is found that
satisfies `callback`.

{% highlight js %}
var collection = new Composer.Collection([{name: 'larry'}, {name: 'curly'}, {name: 'moe'}]);
alert('Found curly? '+ collection.exists(function(m) { return m.get('name') == 'curly'; }));
{% endhighlight %}

### find_by_id :: function(id, options)

Find a model in the collection by its ID.

`options` can contain the following items:

- `fast` - boolean, tells find\_by\_id to only lookup models by their index
(collections store an id -> model hash lookup, but the feature is new and this
flag will remain off by default until it's better vetted).
- `strict` - boolean passed to the call to [Model.id](/composer.js/docs/model#id)
- `allow_cid` - boolean indicating if we are allowing a match on CID (client ID)
as well as a normal ID.

{% highlight js %}
var collection = new Composer.Collection([{id: 3, name: 'larry'}, {id: 6, name: 'curly'}, {id: 9, name: 'moe'}]);
var larry = collection.find_by_id(3);
alert('Found larry? '+ (larry ? true : false));
{% endhighlight %}

### find_by_cid :: function(cid, options)

Exactly like [find_by_id](#find-by-id), except that it specifically searches
using models' CID values instead of ID. This is useful if you need to look for
models that may or may not have a real ID (but all objects have a CID assigned
on creation, so there will always be a CID).

`options` can contain the following items:

- `fast` - boolean, tells find\_by\_cid to only lookup models by their index
(collections store an cid -> model hash lookup, but the feature is new and this
flag will remain off by default until it's better vetted).

### index_of :: function(model_or_id)

Returns the index of the given model (or model's ID) in the collections models.

{% highlight js %}
var collection = new Composer.Collection([{id: 3, name: 'larry'}, {id: 6, name: 'curly'}, {id: 9, name: 'moe'}]);
var larry = collection.index_of(6);
alert('Larry index: '+ larry);
{% endhighlight %}

### filter :: function(callback, bind)

Returns an array of models that `callback` (optionally bound to `bind`'s scope)
returns `true` for.

{% highlight js %}
var collection = new Composer.Collection([{name: 'larry'}, {name: 'curly'}, {name: 'moe'}]);
var has_r = collection.filter(function(m) {
    return m.get('name', '').match(/r/i);
});
alert(has_r.length + ' models have "r" in the name');
{% endhighlight %}

### select :: function(selector)

Convenience function that allows "selecting" models based on an object query
language (a very, very limited language!). Returns an array of models where the
values given in the `selector` object match those keys in the models (using an
`and` (&&) logic operation...all key/value pairs must match).

{% highlight js %}
var collection = new Composer.Collection([{name: 'larry'}, {name: 'curly'}, {name: 'moe'}]);
var res = collection.select({name: 'curly'});
alert('Found '+ res.length + ' result(s)');
{% endhighlight %}

### select_one :: function(selector)

Exactly like [select](#select), but only returns the first match.

### first :: function(n)

Returns the first model in the collection. If `n` is optionally specified,
returns an array of the first `n` models in the collection.

{% highlight js %}
var collection = new Composer.Collection([{name: 'larry'}, {name: 'curly'}, {name: 'moe'}]);
var first = collection.first()
alert('First is '+ first.get('name'));
{% endhighlight %}

### last :: function(n)

Returns the last model in the collection. If `n` is optionally specified,
returns an array of the last `n` models in the collection.

{% highlight js %}
var collection = new Composer.Collection([{name: 'larry'}, {name: 'curly'}, {name: 'moe'}]);
var last = collection.last()
alert('Last is '+ last.get('name'));
{% endhighlight %}

### at :: function(n)

Returns the model at the index `n` (zero-based indexing).

{% highlight js %}
var collection = new Composer.Collection([{name: 'larry'}, {name: 'curly'}, {name: 'moe'}]);
var second = collection.at(1);
alert('Second is '+ second.get('name'));
{% endhighlight %}

### fetch :: function(options)

This function uses the [Composer.sync](/composer.js/docs/util#composer-sync) to
grab a list of models from your app's API. If successful, the data returned is
[reset](#reset-1) into the collection.

`options` can contain the following items:

- `success` - callback called if the operation completed successfully
- `error` - callback called if operation failed

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).


