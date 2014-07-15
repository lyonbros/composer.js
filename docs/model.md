---
title: Model
layout: documentation
---

# Model

The model object is the *heart* of composer. Almost all data in your app will
exist in one model or another. Models not only store data, but make it very
easy to tie into various actions that occur on models (via [eventing](/composer.js/docs/event))
as well as syncing your data to your servers (assuming you have them).

## Events

Models have a number of built-in events you can tie into.

### change

Fired any time data in the model is changed. Note that all [change:&lt;field&gt;](#change-field)
events will fire *before* `change` is fired. The only argument to the bound
function is the model.

### change:&lt;field&gt;

Whenever the value of &lt;field&gt; is changed, this is fired. For instance:

<div class="noeval">
{% highlight js %}
// fires 'change:name' as well as 'change'
mymodel.set({name: 'larry'});
{% endhighlight %}
</div>

The first argument of the bound function will be the model, the second is the
value of the changed field.

### destroy

Fired whenever [destroy](#destroy) is called on a model.

### error

Fired when the model's [validate](#validate) function fails when data is being
set.

## Composer.Model

The model class.

### defaults
`Model.defaults` is an object that can be used to populate default data into the
model on instantiation.

{% highlight js %}
var MyModel = Composer.Model.extend({
    defaults: { name: 'sandra' }
});
alert('Name: '+ new MyModel().get('name'));
{% endhighlight %}

### id_key

Default: `'id'`. Tells the model where to look for the ID when calling [id](#id)
or other ID-related functions.

### url

Default: `false`. Tells the model what *exact* URL endpoint to use for [get_url](#get-url)
when using the syncing functions. It's more pragmatic to use [base_url](#base-url)
instead, but this can be a useful override in some instances.

### base_url

Default: `false`. Prepended to the model's ID when doing syncing calls. See
[get_url](#get-url).

### initialize (data, options)

The model's constructor. `data` is a hash object that contains the initial data
to set into the model. Sets `data` into the model via [set](#set).

`options` is a hash object that can be passed in to various operations in the
contructor. Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).
The `options` value is also passed into [init](#init).

__Note:__ unless you know what you're doing, you shouldn't overwrite the
initialize function. Use [init](#init) instead.

### init (options)

Local contructor for the model, passed the `options` object given to the
constructor. If you want any operations to be run when a model is created, this
is the function to use.

{% highlight js %}
var MyModel = Composer.Model.extend({
    init: function(options)
    {
        alert(this.get('name') + ' is ' + (options.is_cool ? 'cool' : 'totally not cool'));
    }
});
new MyModel({name: 'larry'}, {is_cool: true});
{% endhighlight %}

### get (key, default)

Gets data out of the model by its key. If the value is not present, `default` is
used instead.

{% highlight js %}
var model = new Composer.Model({name: 'larry'});
alert('Data: '+ model.get('name') + ' / ' + model.get('test', 'nope'));
{% endhighlight %}

### escape (key)

Like [get](#get), grabs data out of a model, but escapes it for inclusion in an
HTML view.

### has (key)

Returns `true` if the model contains the `key` in its data.

{% highlight js %}
var model = new Composer.Model({age: 27});
alert('Has key? '+ model.has('age') + ' / ' + model.has('tears'));
{% endhighlight %}

### set (data, options)

Sets data into the model. `data` is a hash object of data to set into the model,
`options` is a hash of options.

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

This function fires both the [change:&lt;field&gt;](#change-field) and [change](#change)
events.

{% highlight js %}
var model = new Composer.Model();
model.bind('change:dogs', function(model, dogs) {
    alert('Dogs: ' + dogs[1] + ', eq: ' + (dogs == this.get('dogs')));
});
model.set({dogs: ['larry', 'curly', 'moe']});
{% endhighlight %}

### unset (key, options)

Unset an item in a model. `key` is the key to unset in the model's data.

This function fires both the [change:&lt;field&gt;](#change-field) and [change](#change)
events.

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

{% highlight js %}
var model = new Composer.Model({name: 'Scooter'});
model.unset('name');
alert('Name? '+ model.get('name'));
{% endhighlight %}

### clear (options)

Clear all data from the model. 

This function fires both the [change:&lt;field&gt;](#change-field) and [change](#change)
events.

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

{% highlight js %}
var model = new Composer.Model({name: 'andrew', age: 27});
model.clear();
alert('model data: '+ model.get('name') + ' / '+ model.get('age'));
{% endhighlight %}

### fetch (options)

This function uses the [Composer.sync](/composer.js/docs/util#composer-sync) to
grab the model from your app's API. If successful, the data returned is set into
to model.

`options` can contain both `success` and `fail` callbacks, fired depending on
the result of the operation.

This function fires both the [change:&lt;field&gt;](#change-field) and [change](#change)
events.

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

### save (options)

This function uses the [Composer.sync](/composer.js/docs/util#composer-sync) to
save the model to your app's API. If successful, the data returned is set into
to model. Depending on the result of [is_new](#is-new), will perform either a
'create' or 'update'.

`options` can contain both `success` and `fail` callbacks, fired depending on
the result of the operation.

This function fires both the [change:&lt;field&gt;](#change-field) and [change](#change)
events.

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

### destroy (options)

This function uses the [Composer.sync](/composer.js/docs/util#composer-sync) to
delete the model to your app's API. If successful, the data returned is set into
to model.

`options` can contain both `success` and `fail` callbacks, fired depending on
the result of the operation.

This function fires both the [change:&lt;field&gt;](#change-field) and [change](#change)
events.

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

### parse (data)

Replace this function to handle any data returned from your API before it's set
into the model. For instance, if your API returns JSON and your method of
calling the API doesn't parse JSON, you could do it here:

<div class="noeval">
{% highlight js %}
var model = new Composer.Model({id: '1234'});
model.parse = function(data) { return JSON.parse(data); };
model.fetch();
{% endhighlight %}
</div>

### id (no_cid)

Returns the model's `id` field. If `id` doesn't exist, returns the model's
[CID](/composer.js/docs/base#cid). If `no_cid` is true, returns `false` if no
`id` field is present.

{% highlight js %}
var model = new Composer.Model({id: '1234'});
alert('ID: ' + model.id());
{% endhighlight %}

### clone ()

Clone a model into a new model.

{% highlight js %}
var model = new Composer.Model({name: 'andrew'});
var clone = model.clone();
alert('Clone '+ clone.get('name') + ' / ' + (clone == model));
{% endhighlight %}

### toJSON ()

Returns a bare copy of the model's data. Good for passing into views or for
serializing into JSON.

{% highlight js %}
var model = new Composer.Model({id: '888', name: 'fisty'});
alert('Data '+ JSON.stringify(model.toJSON()));
{% endhighlight %}

### validate (data, options)

Validate data passed to the model. This happens whenever dat in the model
changes. Return `false` from this function to signify a *success*.

### get_url ()

Returns the model's URL, as it relates to your API. Uses `Model.base_url` to
determine the base, and then appends the ID from there (if it exists).

For instance:

{% highlight js %}
var model = new Composer.Model({id: '69'});
model.base_url = '/users';
alert('URL: '+ model.get_url());
{% endhighlight %}

*Also*, model's can pull a URL from a collection they exist in. See
[Collection.url](/composer.js/docs/collection#url).

