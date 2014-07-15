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
its position changed). Triggering arguments are the model and the options pass

## Composer.Collection

This is the collection class. It extends [Composer.Base](/composer.js/docs/base),
giving you everything base has.

### model

This is a parameter (default: `Composer.Model`) that tells the collection what
object to use for newly created models.

### sortfn (a, b)

If specified, newly added models will be sorted based on this function before
being inserted into the collection. Note that sorting is only done on insertion,
and if the data in your models changes, the sort may not be correct.

If you need a collection that maintains sort order of your models as they
update, see the [Filter collection](/composer.js/docs/filtercollection).

### url

Default `'/mycollection'`. Tells the collection what URL base the models should
use (assuming they don't have a URL manually specified) when calling the [Composer.sync](/composer.js/docs/util#composer-sync)
function.

### priority

Default `1`. Used mainly to determine which collection to derive the URL from
when a model calls [get_url](/composer.js/docs/model#get-url).

### initialize (models, params, options)

The constructor. `models` can be an array of either [Composer.Model](/composer.js/docs/model)
objects, or an array of flat data
