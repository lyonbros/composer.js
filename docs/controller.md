---
title: Controller
layout: documentation
---

# Controller

The controller is the piece that ties your view (generally HTML rendered in a
browser) to your models/collections.

It's main function is to listen to events from both the models (updating the
view according to new data) and to the view (clicks, form posts, etc).

It also provides a handful of utilities to make rendering views and cleaning
things up a bit easier.

__Note__: Composer doesn't actually have a templating engine. You are free to
use any engine you wish, or none at all (hand-made HTML strings).

## Events

These are the event(s) fired by controllers.

### release

Triggered when a controller is [released](#release-1) (removed from the view).
Arguments passed:

- the controller being released

## Composer.Controller

The main controller class. Extends [Composer.Base](/composer.js/docs/base),
giving it access to all of Base's abilities.

### el

Default: `false`. A param holding the current DOM element the controller is
attached to. This is the element the controller renders into and removes when
it is [released](#release-1).

If this param is a string, it is assumed to be a selector (Mootools/jQuery) and
that element is used as the el. If not found, a new element of type [tag](#tag)
is created.

### inject

Default: `false`. A param holding a selector (or element) that we want to
inject the controller's [main element](#el) into on creation.

### initialize 
`options` can contain the following items:

- `at` - insert the model at a specific integer index in the collection's data

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

