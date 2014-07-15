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
Wheneve the value of &lt;field&gt; is changed, this is fired. For instance:

<div class="noeval">
{% highlight js %}
// fires 'change:name' as well as 'change'
mymodel.set({name: 'larry'});
{% endhighlight %}
</div>


