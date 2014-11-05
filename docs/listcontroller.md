---
title: List Controller
layout: documentation
---

# List Controller

The list controller is a wrapper around the [controller](/composer.js/docs/controller)
that allows you to easily create subcontrollers that track a
[collection](/composer.js/docs/collection) (or filtercollection).

The idea is that when a new model is added to the tracked collection, a new
sub-controller is created and injected into the correct position in the DOM
(based on the model's sort order in the collection). When the model is destroyed
or removed from the collection, the subcontroller is released and removed from
the DOM.

This is a very simple but highly effective way to update the DOM based on a
collection while only having to hook up a few wires.

## Events

The list controller fires all events that [Composer.Controller](/composer.js/docs/controller#events)
fires.

## Composer.ListController

This is the list controller class. It extends [Composer.Controller](/composer.js/docs/controller#composer-controller),
giving it all the Controller's abilities.

### track :: function(collection, create_fn, options)

This method starts tracking a `collection`, syncing the subcontrollers with the
models in that collection. Subcontrollers are created using the `create_fn`,
which takes two arguments (the `model` being tracked, and the `options` that
were passed to the collection's [add](/composer.js/docs/collection#add-1) or
[reset](/composer.js/docs/collection#reset-1) call) and returns an instance of
`Controller` or any class that extends it.

`options` is currently unused.

<div id="listtrack"></div>
{% highlight js %}
var UserItemController = Composer.Controller.extend({
    tag: 'li',
    model: null,

    init: function()
    {
        this.render();
    },

    render: function()
    {
        this.html('Hi, my name is '+ this.model.get('name'));
    }
});

var UserListController = Composer.ListController.extend({
    elements: {
        'ul': 'el_list'
    },

    collection: null,

    init: function()
    {
        this.render();

        // set up tracking to inject subcontrollers into our <ul>
        this.track(this.collection, function(model, options) {
            return new UserItemController({
                inject: this.el_list,
                model: model
            });
        }.bind(this))
    },

    render: function()
    {
        this.html('<h3>Users</h3><ul></ul>');
    }
});
new UserListController({
    inject: '#listtrack',
    collection: new Composer.Collection([
        {name: 'chuck'},
        {name: 'bruce'},
        {name: 'tony'}
    ])
});
{% endhighlight %}

### release :: function(options)

Exactly like [Controller.release](/composer.js/docs/controller#release-1) but on
top of releasing the current controller, releases all sub-controllers as well.

