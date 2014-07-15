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

## Composer.Event

This is the main class others that need eventing extend. It provides some simple
but powerful functions.

### bind (event_name, fn, bind_name)

Bind a function to an event on this object. `event_name` can be any string (ie
`change`, `click`, etc).

`fn` is a function to call when the event is triggered on the object. It can
take any number of arguments, which are passed in verbatim from the
[trigger](#trigger) function.

`bind_name` is the name of the binding. This is mainly useful when you are
binding a function to an event that you don't want to keep a reference to (an
anonymous function, for instance) in the case that you later want to [unbind](#unbind)
it. Naming allows you to unbind by a unique name instead of keeping the
reference to the function.

### bind_once (event_name, fn, bind_name)


