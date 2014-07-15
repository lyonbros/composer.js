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
events will fire *before* `change` is fired

### change:&lt;field&gt;

Whenever the value of &lt;field&gt; is changed, this is fired. For instance:

<div class="noeval">
{% highlight js %}
// fires 'change:name' as well as 'change'
mymodel.set({name: 'larry'});
{% endhighlight %}
</div>

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

This function fires both the [change:&lt;field&gt;](change-field) and [change](#change)
events.

{% highlight js %}
var model = new Composer.Model();
model.set({dogs: ['larry', 'curly', 'moe']});
alert('Dog 1: ' + model.get('dogs')[1]);
{% endhighlight %}

### unset (key, options)

Unset an item in a model. `key` is the key to unset in the model's data.

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

{% highlight js %}
var model = new Composer.Model({name: 'Scooter'});
model.unset('name');
alert('Name? '+ model.get('name'));
{% endhighlight %}


