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
alert('Name: ', new MyModel().get('name'));
{% endhighlight %}

### initialize (data, options)

The model's constructor. `data` is a hash object that contains the initial data
to set into the model.

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

