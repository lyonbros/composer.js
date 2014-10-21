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
    }
});
var con = new MyController();
alert('Text: '+ con.the_text.innerHTML);
{% endhighlight %}

### events :: attribute({})

An object that provides event monitoring for elements within [el](#el). It sets
up events in '<event> [selector]' -> 'function_name' mapping:

{% highlight js %}
var MyController = Composer.Controller.extend({
    events: {
        'click h1': 'click_title',
        'click input[type=button]': 'close'
    },

    init: function()
    {
        var tpl = '<input type="button" value="Close" style="float:right">';
        tpl += '<h1>Click me!</h1>';
        this.html(tpl);
        this.el.style.background = '#fcc';
    },

    click_title: function(e)
    {
        this.el.style.background = '#cfc';
    },

    close: function(e)
    {
        this.release();
    }
});
new MyController({ inject: '#event-test' });
{% endhighlight %}
<div id="event-test"></div>

### initialize :: function(params, options)

Controller constructor. Don't extend unless you know what you're doing (use
[init](#init)) instead.

`params` is a collection of parameters to set (top-level) into the controller.
For instance you can choose your [el](#el) or [inject](#inject) selector here.

`options` can contain the following items:

- `clean_injection` - If true, will clear the object that contains the
controller's [el](#el) before injecting the el. Otherwise (the default) is to
append the controller into the container (at the end).

<div class="noeval">
{% highlight js %}
var MyController = Composer.Controller.extend({
    model: null,

    init: function()
    {
        if(!this.model) return this.release();
        ...
    }
});
// all parameters can be changed on instantiation, although it's recommended to
// keep the event/element/function definitions in your class definition and use
// instantiation parameters for more temporary data. here we set the inject and
// model params (very common to change on instantiation):
var mymodel = new Composer.Model({ says: 'hello' });
var con = new MyController({
    inject: '#setting-on-initialize',
    model: mymodel
});
{% endhighlight %}
</div>

### init :: function()

Per-controller initialization function. Gets run on each controller
instantiation. Override me!

{% highlight js %}
var MyController = Composer.Controller.extend({
    num_messages: false,
    init: function()
    {
        alert('Hello, Mr. Wayne. You have '+ this.num_messages +' new messages.');
    }
});
var con = new MyController({ num_messages: 17 });
{% endhighlight %}

### render :: function()

Your controller's render function. This function's purpose is to generate the
view for your controller and update it (probably using [html](#html)). Override
me! 

{% highlight js %}
var MyController = Composer.Controller.extend({
    init: function()
    {
        this.render();
    },

    render: function()
    {
        // you can generate your HTML any way you like...pure javascript strings
        // or some form of templating engine. here we do strings for simplicity.
        this.html('<h1>HELLO!!</h1>');
    }
});
var con = new MyController({ inject: '#render-test' });
{% endhighlight %}
<div id="render-test"></div>

### html :: function(element_or_string)

Update the controller's [el](#el)'s inner HTML. This also refreshes the
[controller's elements](#elements), making sure they reflect the elements in the
passed HTML.

See [render](#render) for example usage.

### with_bind :: function(object, ev, fn, name)

This function wraps `object`'s [bind](/composer.js/docs/event#bind) and tracks
the binding internally in the controller. When [release](#-1release) is called
on the controller, all the bindings created with `with_bind` are unbound
automatically.

This is mainly to alleviate a common pattern of having to do manually clean up
bound events in a custom release function. When your controller binds to events
on, say, a model, it previously had to remember to [unbind](/composer.js/docs/event#unbind)
the event otherwise the controller would never be garbage collected (even after
all references to it are gone from your app) because the model still holds a
reference to its function(s) that were bound.

__Note:__ `object`s passed to `with_bind` *must* extend [Composer.event](/composer.js/docs/event#composer-event).

Here's an example of the old way of binding/unbinding:

<div class="noeval">
{% highlight js %}
var MyController = Composer.Controller.extend({
    model: false,

    init: function()
    {
        // re-render when the model's data changes
        this.model.bind('change', this.render.bind('this'), 'model:change:render');
    },

    release: function()
    {
        // manually unbind our 'change' event
        this.model.unbind('change', 'model:change:render');
        return this.parent.apply(this, arguments);
    }
});
{% endhighlight %}
</div>

Here's how it works now:

<div class="noeval">
{% highlight js %}
var MyController = Composer.Controller.extend({
    model: false,

    init: function()
    {
        // notice we don't need to use a named event here because the controller
        // mangages the binding for us. you can still specify a name if you plan
        // to unbind the event yourself, but it's optional.
        this.with_bind(this.model.bind, 'change', this.render.bind('this'));
    }

    // notice we don't have to extend Controller.release here!
});
{% endhighlight %}
</div>

### with_bind_once :: function(object, ev, fn, name)

This function is *exactly* like [with_bind](#with-bind), except that instead of
calling `object.bind`, it calls `object.bind_once`. This lets you add one-time
events on any object that extends [Composer.Event](/composer.js/docs/event#composer-event)
without worrying about cleaning them up if your controller is released.

See [with_bind](#with-bind) for full usage examples.

__Note:__ `object`s passed to `with_bind_once` *must* extend [Composer.Event](/composer.js/docs/event#composer-event).

### track_subcontroller :: function(name, create_fn)

A common pattern is for a controller to have one or more sub-controllers. So you
may have a Dashboard controller and it could have a UserList controller and a
RecentComments controller.

When the Dashboard controller [releases](#release-1), you want it to release its
sub-controllers automatically. `track_subcontroller` does this for you! It keeps
track of sub-controllers you are using and frees them on release.

`name` is the (string) name you wish to give your sub-controller. It must be
unique from other sub-controllers you're tracking.

`create_fn` is a function of zero arguments that *must return a controller
instance*. This function is where you create, set up, and return your
sub-controller.

Note that `track_subcontroller` will check if a controller is already stored
under the given `name`. If one exists, it is released and removed from tracking
before the new one is put into its place. This is very useful in situations
where your master controller re-creates its sub-controllers on [render](#render)
and you don't want to have to worry about dangling controllers not being cleaned
up. `track_subcontrollers` handles everything for you.

<div class="noeval">
{% highlight js %}
var UserListController = Composer.Controller.extend({
    init: function()
    {
        this.render();
    },

    render: function()
    {
        this.html('<ul><li>user1</li><li>user2</li>...</ul>');
    }
});
var DashboardController = Composer.Controller.extend({
    elements: {
        'div.users': 'user_list'
    },

    init: function()
    {
        this.render();
    },

    render: function()
    {
        this.html('<h1>Dashboard</h1><div class="users"></div>');
        // track our UserListController. if DashboardController renders again,
        // the sub-controller will be released and recreated. if the Dashboard
        // is released, so is the sub-controller.
        this.track_subcontroller('users', function() {
            return new UserListController({
                // put the subcontroller into our <div class="users"> element
                inject: this.user_list
            });
        }.bind(this));
    }
});
{% endhighlight %}
</div>

In the above, `DashboardController` will automatically clean its
`UserListController` sub-controller each time it renders (or when it's released)
so you can focus on building your app and not a bunch of boilerplate cleanup BS.

### get_subcontroller :: function(name)

Recently used [track_subcontroller](#track-subcontroller)? Use
`get_subcontroller` to retrieve the tracked sub-controller by the name given in
the call to `track_subcontroller`.

### release :: function(options)

Remove the controller from the DOM (removes [el](#el)) and perform any cleanup
needed (such as unbinding events bound using [with_bind](#with-bind)).

Fires the [release event](#release).

Note that `options` can contain [silencing directives](/composer.js/docs/event#silencing).

See the [events section](#events-1) for a release example.

### replace :: function(element)

Replace the controller's [el](#el) with another DOM element. Once the replace is
complete, the [elements](#elements) and [events](#events-1) are refreshed for
the controller.

