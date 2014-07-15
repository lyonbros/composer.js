---
title: Eventing
layout: documentation
---

# Eventing

As mentioned in the [intro](/composer.js/docs/intro), eventing is the glue that
ties everything in your app together. Actions (and associated data) flow from
component to component using events. Instead of your objects needing to know the
implementation details of other objects (ie how do I re-render the three views
I'm in when my name changes?) objects can just register to listen to events of
those they are interested in.

A controller can listen to change events in a model to determine if it should
update the view. A controller can listen to events from the view (clicked link,
form submitted, etc) and can update its model(s) accordingly.

Events let you wire eveything in your app together while keeping things simple
and maintainable.

## Built-in events

Many objects (models, collections, controllers, etc) trigger built-in events
when certain actions happen on them. For instance, a model triggers a `change`
event when it is updated with new data.

This allows you to listen to events for many common actions in your objects and
act accordingly.

### Silencing

Many (if not all) built-in events can be silenced during various operations by
passing a special object into the triggering function's `options`.

This can be done in three ways:

<div class="noeval">
{% highlight js %}
// silence all events
mymodel.set({name: 'andrew'}, {silent: true});

// silence some events
mymodel.set({name: 'andrew'}, {silent: ['change', 'change:name']});

// silence all but some events
mymodel.set({name: 'andrew'}, {not_silent: ['change']});
{% endhighlight %}
</div>

## Composer.Event

This is the main class others that need eventing extend. It provides some simple
but powerful functions.

### bind (event_name, fn, bind_name)

Bind a function to an event on this object. `event_name` can be any string (ie
`change`, `click`, etc). Note that `event_name` can also be an array of strings,
and each one will have the same function bound to it.

`fn` is a function to call when the event is triggered on the object. It can
take any number of arguments, which are passed in verbatim from the
[trigger](#trigger) function.

`bind_name` is the name of the binding. This is mainly useful when you are
binding a function to an event that you don't want to keep a reference to (an
anonymous function, for instance) in the case that you later want to [unbind](#unbind)
it. Naming allows you to unbind by a unique name instead of keeping the
reference to the function.

{% highlight js %}
var obj = new Composer.Event();
obj.bind('hello', function() { alert('Hi!'); });
obj.trigger('hello');
{% endhighlight %}

### bind_once (event_name, fn, bind_name)

Exactly like bind, except that one the binding is triggered *once* it is unbound
from the object. Note that `event_name` can also be an array of strings, and
each one will have the same function bound to it.

This makes it easy to create one-off bindings to event on an object without
having to worry about manually unbinding the event.

### unbind (event_name, function_or_name)

Unbind an event from an object. `event_name` is the event name that's bound and
`function_or_name` is either the reference to `fn` (passed into [bind](#bind) or
[bind_once](#bind_once)) *or* the `bind_name` passed in.

Note that `event_name` can also be an array of strings, and each one will have
the same function (or binding name) unbound from it.

If `function_or_name` is falsy (null, false, etc) then *all* bindings under
`event_name` are removed.

If `event_name` is falsy (null, false, etc) then *all* bindings in the object
are removed. All of them.

Example usage:

<div class="noeval">
{% highlight js %}
var obj = new Composer.Event();
var fn = function() { alert('omg'); };

// bind our referenced function
obj.bind('alert', fn);

// bind an anonymous function, and assign the binding a name
obj.bind('yell', function() { alert('AHHHH'); }, 'obj:example:yell');

// bind an array of events
obj.bind(['walk', 'run', 'crawl'], function() { alert('moving...'); }, 'bind-arrays');

// here we unbind using the function reference, which we have to save if we use
// this method
obj.unbind('alert', fn);

// here we unbind using the binding name, which can not only make unbind easy
// (no need to keep a function reference around) but can also be used to
// document the binding in cetain instances
obj.unbind('yell', 'obj:example:yell');

// unbind all 'yell' events
obj.unbind('yell');

// unbind our array of bindings from above (by name)
obj.unbind(['walk', 'run', 'crawl'], 'bind-arrays');

// unbind ALL EVENTS
obj.unbind();
{% endhighlight %}
</div>

### trigger (event_name, ...)

Trigger an event on an object. `event_name` can be any string, and any other
arguments passed to `trigger` are available as the arguments the the functions
bound with [bind](#bind).

{% highlight js %}
var obj = new Composer.Event();
obj.bind('change', function(field) { alert('changed '+ field); });
obj.trigger('change', 'name');
{% endhighlight %}

