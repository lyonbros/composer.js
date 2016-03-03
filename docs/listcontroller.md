---
title: List Controller
layout: documentation
---

# List Controller

The list controller is a wrapper around the [controller](docs/controller)
that allows you to easily create subcontrollers that track a
[collection](docs/collection) (or
[filtercollection](docs/filtercollection)).

The idea is that when a new model is added to the tracked collection, a new
sub-controller is created and injected into the correct position in the DOM
(based on the model's sort order in the collection). When the model is destroyed
or removed from the collection, the subcontroller is released and removed from
the DOM.

This is a very simple but highly effective way to update the DOM based on a
collection while only having to hook up a few wires.

## Events

The list controller fires all events that [Composer.Controller](docs/controller#events)
fires, but also fires a few events to help you manage your views. The following
events allow you to show empty state views depending on how the data in the
collection changes (for instance, you'd show a "No items!" view when `list:empty`
is fired, and you'd render your `<ul class="items"></ul>` when `list:notempty`
fires:

### list:empty

Triggered when the collection the list controller listens to becomes empty
after previously not being empty.

### list:notempty

Triggered when the collection the list controller listend to has elements added
to it after previously being empty.

## Composer.ListController

This is the list controller class. It extends [Composer.Controller](docs/controller#composer-controller),
giving it all the Controller's abilities.

### track :: function(collection, create_fn, options)

This method starts tracking a `collection`, syncing the subcontrollers with the
models in that collection. Subcontrollers are created using the `create_fn`,
which takes two arguments (the `model` being tracked, and the `options` that
were passed to the collection's [add](docs/collection#add-1) or
[reset](docs/collection#reset-1) call) and returns an instance of
`Controller` or any class that extends it.

`options` can contain the following items:

- `bind_reset` - If true, will bind to the collection's [reset](docs/collection/#reset)
event. Because the ListController already binds to `add`, `remove`, and `clear`,
binding to reset isn't really needed and doing so may hinder performance.
However if you need to be able to refresh the list in its entirety, pass `true`
to `bind_reset` and any `reset` event on the collection will refresh all the
subcontrollers.
- `accurate_sort` - passed in to [sort_index](docs/collection#sort-index)
and [sort_at](docs/collection#sort-at) when adding items
- `fragment_on_reset` - This is a function that should return the main element
you're injecting subcontrollers into. If this option is provided, then the
`create_fn` will receive a `DocumentFragment` as one of its options (the second
value passed to `create_fn`). If the fragment is present in the options, you
can pass it to your subcontroller's `inject:` key. This allows fragment
rendering, which on larger lists can significantly reduce the overhead of
resetting the entire list (which happens when initially calling `track()`.
[See a usage example below.](#example-using-fragmentonreset)

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

#### Example: using fragment_on_reset

This is very similar to the above example, but we'll be using the `fragment_on_reset`
option here.

<div id="listtrack-frag"></div>
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
            options || (options = {});
            var fragment = options.fragment;
            return new UserItemController({
                // notice here we test for the fragment existing before using
                // because it's not always passed (only on reset)
                inject: fragment ? fragment : this.el_list,
                model: model
            });
        }.bind(this), {
            // note that fragment_on_reset is a function returning the same list
            // element we pass to the subcontroller's inject key in the create_fn
            // above
            fragment_on_reset: function() { return this.el_list; }.bind(this)
        })
    },

    render: function()
    {
        this.html('<h3>Users</h3><ul></ul>');
    }
});
new UserListController({
    inject: '#listtrack-frag',
    collection: new Composer.Collection([
        {name: 'chuck'},
        {name: 'bruce'},
        {name: 'tony'}
    ])
});
{% endhighlight %}

### release :: function(options)

Exactly like [Controller.release](docs/controller#release-1) but on
top of releasing the current controller, releases all sub-controllers as well.

