---
title: Model
layout: documentation
---

# Model

The model object is the *heart* of composer. Almost all data in your app will
exist in one model or another. Models not only store data, but make it very
easy to tie into various actions that occur on models (via [eventing](docs/event))
as well as syncing your data to your servers (assuming you have them).

## Events

Models have a number of built-in events you can tie into.

### change

Fired any time data in the model is changed. Note that all [change:&lt;field&gt;](#change-field)
events will fire *before* `change` is fired. Arguments passed:

- the model being changed
- the options passed to the changing function (set, unset, etc)
- the full data the change occured on

### change:&lt;field&gt;

Whenever the value of &lt;field&gt; is changed, this is fired. For instance:

<div class="noeval">
{% highlight js %}
// fires 'change:name' as well as 'change'
mymodel.set({name: 'larry'});
{% endhighlight %}
</div>

Arguments passed:

- the model being changed
- the value of the changed field
- the options passed to the changing function (set, unset, etc)

The first argument of the bound function will be the model, the second is the
value of the changed field.

### destroy

Fired whenever [destroy](#destroy) is called on a model. Arguments passed:

- the model being destroyed
- the model being destroyed's collections array
- the options passed to the destroying function

### error

Fired when the model's [validate](#validate) function fails when data is being
set. Arguments passed:

- the model the validation error occured on
- the error that occurred
- the options passed to the validation function

## Composer.Model

The model class.

### defaults :: attribute({})

`Model.defaults` is an object that can be used to populate default data into the
model on instantiation.

{% highlight js %}
var MyModel = Composer.Model.extend({
    defaults: { name: 'sandra' }
});
alert('Name: '+ new MyModel().get('name'));
{% endhighlight %}

### id_key :: attribute("id")

Tells the model where to look for the ID when calling [id](#id)
or other ID-related functions.

### base_url :: attribute(false)

DEPRECATED. Just use [url()](#url) instead.
Prepended to the model's ID when doing syncing calls. See
[get_url](#get-url).

### initialize :: function(data, options)

The model's constructor. `data` is a hash object that contains the initial data
to set into the model. Sets `data` into the model via [set](#set).

`options` is a hash object that can be passed in to various operations in the
contructor. Note that `options` can contain [silencing directives](docs/event#silencing).
The `options` value is also passed into [init](#init).

__Note:__ unless you know what you're doing, you shouldn't overwrite the
initialize function. Use [init](#init) instead.

### init :: function(options)

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

### get :: function(key, default)

Gets data out of the model by its key. If the value is not present, `default` is
used instead.

{% highlight js %}
var model = new Composer.Model({name: 'larry'});
alert('Data: '+ model.get('name') + ' / ' + model.get('test', 'nope'));
{% endhighlight %}

### escape :: function(key)

Like [get](#get), grabs data out of a model, but escapes it for inclusion in an
HTML view.

### has :: function(key)

Returns `true` if the model contains the `key` in its data.

{% highlight js %}
var model = new Composer.Model({age: 27});
alert('Has key? '+ model.has('age') + ' / ' + model.has('tears'));
{% endhighlight %}

### set :: function(data, options)

Sets data into the model. `data` is a hash object of data to set into the model,
`options` is a hash of options.

Note that `options` can contain [silencing directives](docs/event#silencing).

This function fires both the [change:&lt;field&gt;](#change-field) and [change](#change)
events.

{% highlight js %}
var model = new Composer.Model();
model.bind('change:dogs', function(model, dogs) {
    alert('Dogs: ' + dogs[1] + ', eq: ' + (dogs == this.get('dogs')));
});
model.set({dogs: ['larry', 'curly', 'moe']});
{% endhighlight %}

#### get / set (a warning)

A common pattern is to grab an object from a model, set a key in it, and set the
object back into the model:

<div class="noeval">
{% highlight js %}
var MyModel = Composer.Model.extend({
    set_meta: function(key, value)
    {
        var meta = this.get('meta', {});
        meta[key] = value;
        this.set({meta: meta});
    }
});
{% endhighlight %}
</div>

The above *seems fine* but there's a problem. Try this:

{% highlight js %}
var MyModel = Composer.Model.extend({
    set_meta: function(key, value)
    {
        var meta = this.get('meta', {});
        meta[key] = value;
        this.set({meta: meta});
    }
});
var model = new MyModel({meta: {}});

// let us know when the meta changes
model.bind('change:meta', function() { alert('meta changed!'); });

// this should fire our alert!! right?
model.set_meta('updated', true);
{% endhighlight %}

Our alert should fire, but for some reason it doesn't. The reason is because we
grab the meta object via `Model.get()`, which returns an actual reference to the
object in the model's data. When we update that object, we're actually updating
the model's internal data as well. When we set the object back in via
`Model.set()`, the model checks the data being set against its internal data to
look for changes and finds none *because the two objects are the same*.

To solve this, we need to clone our object we grab from `Model.get()`:

{% highlight js %}
var MyModel = Composer.Model.extend({
    set_meta: function(key, value)
    {
        var meta = Composer.object.clone(this.get('meta', {}));
        meta[key] = value;
        this.set({meta: meta});
    }
});
var model = new MyModel({meta: {}});

// let us know when the meta changes
model.bind('change:meta', function() { alert('meta changed!'); });

// this should fire our alert!!
model.set_meta('updated', true);
{% endhighlight %}

### unset :: function(key, options)

Unset an item in a model. `key` is the key to unset in the model's data.

This function fires both the [change:&lt;field&gt;](#change-field) and [change](#change)
events.

Note that `options` can contain [silencing directives](docs/event#silencing).

{% highlight js %}
var model = new Composer.Model({name: 'Scooter'});
model.unset('name');
alert('Name? '+ model.get('name'));
{% endhighlight %}

### reset :: function(data, options)

Like [set](#set), but removes any data from the model that is absent in `data`.
Useful for replacing a model's entire data object. Sends out `change:<field>`
events for any removed/changed fields.

Note that `options` can contain [silencing directives](docs/event#silencing).

This function fires both the [change:&lt;field&gt;](#change-field) and [change](#change)
events.

{% highlight js %}
var model = new Composer.Model();
model.set({name: 'testy', age: 19});
model.bind('change:age', function(model, dogs) {
    alert('Age changed: '+model.get('name')+'/'+model.get('age'));
});
model.reset({name: 'testy'});
{% endhighlight %}

### clear :: function(options)

Clear all data from the model. 

This function fires both the [change:&lt;field&gt;](#change-field) and [change](#change)
events.

Note that `options` can contain [silencing directives](docs/event#silencing).

{% highlight js %}
var model = new Composer.Model({name: 'andrew', age: 27});
model.clear();
alert('model data: '+ model.get('name') + ' / '+ model.get('age'));
{% endhighlight %}

### fetch :: function(options)

This function uses the [Composer.sync](docs/util#composer-sync) to
grab the model from your app's API. If successful, the data returned is set into
to model.

`options` can contain the following items:

- `success` - callback called if the operation completed successfully
- `error` - callback called if operation failed

This function fires both the [change:&lt;field&gt;](#change-field) and [change](#change)
events.

Note that `options` can contain [silencing directives](docs/event#silencing).

### save :: function(options)

This function uses the [Composer.sync](docs/util#composer-sync) to
save the model to your app's API. If successful, the data returned is set into
to model. Depending on the result of [is_new](#is-new), will perform either a
'create' or 'update'.

`options` can contain the following items:

- `success` - callback called if the operation completed successfully
- `error` - callback called if operation failed

This function fires both the [change:&lt;field&gt;](#change-field) and [change](#change)
events.

Note that `options` can contain [silencing directives](docs/event#silencing).

### destroy :: function(options)

This function uses the [Composer.sync](docs/util#composer-sync) to
delete the model to your app's API. If successful, the data returned is set into
to model.

`options` can contain the following items:

- `success` - callback called if the operation completed successfully
- `error` - callback called if operation failed

This function fires both the [change:&lt;field&gt;](#change-field) and [change](#change)
events.

Note that `options` can contain [silencing directives](docs/event#silencing).

### parse :: function(data)

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

### id :: function(no_cid)

Returns the model's `id` field. If `id` doesn't exist, returns the model's
[CID](docs/base#cid). If `no_cid` is true, returns `false` if no
`id` field is present.

{% highlight js %}
var model = new Composer.Model({id: '1234'});
alert('ID: ' + model.id());
{% endhighlight %}

### clone :: function()

Clone a model into a new model.

{% highlight js %}
var model = new Composer.Model({name: 'andrew'});
var clone = model.clone();
alert('Clone '+ clone.get('name') + ' / ' + (clone == model));
{% endhighlight %}

### toJSON :: function()

Returns a bare copy of the model's data. Good for passing into views or for
serializing into JSON.

{% highlight js %}
var model = new Composer.Model({id: '888', name: 'fisty'});
alert('Data '+ JSON.stringify(model.toJSON()));
{% endhighlight %}

### validate :: function(data, options)

Validate data passed to the model. This happens whenever dat in the model
changes. Return `false` from this function to signify a *success*.

### url :: function()

Called by Composer before [fetch](#fetch)/[save](#save)/[destroy](#destroy-1)
and builds a URL for this model:

{% highlight js %}
var Doge = Composer.Model.extend({
    url: function() {
        var base = '/top-doge';
        if(!this.is_new()) base += '/'+this.id();
        return base;
    }
});
Composer.sync = function(action, model, options) {
    alert('Our URL is: '+model.get_url());
    options.success({doge_id: 1, top_doge: true, avatar: 'https://yt3.ggpht.com/-dt2AThCWCfQ/AAAAAAAAAAI/AAAAAAAAAAA/1g2E-fl-b6I/s900-c-k-no-mo-rj-c0xffffff/photo.jpg'});
}
var doge = new Doge({id: 1});
doge.fetch();
{% endhighlight %}

### get_url :: function()

DEPRECATED. Use [url()](#url) instead.

Returns the model's URL, as it relates to your API. Uses `Model.base_url` to
determine the base, and then appends the ID from there (if it exists).

For instance:

{% highlight js %}
var model = new Composer.Model({id: '69'});
model.base_url = '/users';
alert('URL: '+ model.get_url());
{% endhighlight %}

*Also*, model's can pull a URL from a collection they exist in. See
[Collection.url](docs/collection#url).

