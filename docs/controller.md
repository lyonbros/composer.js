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

### el :: attribute(false)

A param holding the current DOM element the controller is
attached to. This is the element the controller renders into and removes when
it is [released](#release-1).

If this param is a string, it is assumed to be a selector (Mootools/jQuery) and
that element is used as the el. If not found, a new element of type [tag](#tag)
is created.

### inject :: attribute(false)

A param holding a selector (or element) that we want to
inject the controller's [main element](#el) into on creation.

### tag :: attribute("div")

The type of tag that [el](#el) will be created as. For
instance, if the controller was to describe an item in a list, you might set
`tag` to be "li".

### elements :: attribute({})

An object that provides selector -> attribute mapping. Note that
the elements found by the selectors are searched for *within* the [el](#el)
element and are updated after calling [html](#html).

{% highlight js %}
var MyController = Composer.Controller.extend({
    elements: {
        'h1': 'the_title',
        'p': 'the_text'
    },

    init: function()
    {
        this.render();
    },

    render: function()
    {
        this.html('<h1>Test</h1><p>Hello</p>');
        console.log('html: ', this.el, this.the_title, this.the_text);
    }
});
var con = new MyController();
alert('Text: '+ JSON.stringify(con.elements));
{% endhighlight %}

### events :: attribute({})

Default: `{}`.

### initialize 
`options` can contain the following items:

- `at` - insert the model at a specific integer index in the collection's data

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

