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

If this param is a string, it is assumed to be a selector and
that element is used as the el. If not found, a new element of type [tag](#tag)
is created.

### inject :: attribute(false)

A param holding a selector (or element) that we want to
inject the controller's [main element](#el) into on creation.

### tag :: attribute("div")

The type of tag that [el](#el) will be created as. For
instance, if the controller was to describe an item in a list, you might set
`tag` to be "li".

### class_name :: attribute(false)

If present, sets `this.el.className` on initialization, providing an easy way to
give a CSS classname to the controller's main element.

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

<div id="event-test"></div>
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

### html :: function(element_or_string, options)

Update the controller's [el](#el)'s inner HTML. This also refreshes the
[controller's elements](#elements), making sure they reflect the elements in the
passed HTML.

See [render](#render) for example usage.

Note that this function can take document fragments as of v1.1.12.

`options` can contain the following items:

- `complete` - Only used when [XDOM](#XDOM) is enabled, this function is called
when batched rendering has completed. Note that when [Composer.promisify()](/docs/util#composer-promisify)
is called, `html()` returns a promise that resolves when rendering is complete
and `options.complete` is not needed.

### with_bind :: function(object, ev, fn, name)

This function wraps `object`'s [bind](/composer.js/docs/event#bind) and tracks
the binding internally in the controller. When [release](#release-1) is called
on the controller, all the bindings created with `with_bind` are unbound
automatically.

This is mainly to alleviate a common pattern of having to do manually clean up
bound events in a custom release function. When your controller binds to events
on, say, a model, it previously had to remember to [unbind](/composer.js/docs/event#unbind)
the event otherwise the controller would never be garbage collected (even after
all references to it are gone from your app) because the model still holds a
reference to its function(s) that were bound.

__Note:__ `object`s passed to `with_bind` *must* extend [Composer.event](/composer.js/docs/event#composer-event).

Here's an example of the traditional way of binding/cleaning up:

<div class="noeval">
{% highlight js %}
var MyController = Composer.Controller.extend({
    model: false,

    init: function()
    {
        // re-render when the model's data changes. note we have to name the
        // binding so we can reference it later
        this.model.bind('change', this.render.bind(this), 'model:change:render');

        // manually unbind our 'change' event on release
        this.bind('release', function() {
            this.model.unbind('change', 'model:change:render');
        }.bind(this));
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
        this.with_bind(this.model, 'change', this.render.bind(this));
    }
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

### remove_subcontroller :: function(name, options)

Recently used [track_subcontroller](#track-subcontroller)? Use
`remove_subcontroller` is a helper function that removes and releases a tracked
sub-controller by the name given in the call to `track_subcontroller`. It allows
you to manually untrack and release a subcontroller without having to pull it
out via [get_subcontroller](#get-subcontroller) and check if it exists.

`options` can contain the following items:

- `skip_release` - If true, remove the subcontroller from the parent's tracking
without releasing it. There are very few cases where this would ever be needed.

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

## XDOM

New in Composer v1.2 is a feaure we call XDOM. It is a diffing / patching
implementation for the DOM which does a few things:

1.  Instead of replacing the DOM entirely when calling [Controller.html()](/composer.js/docs/controller#html),
XDOM compares the differences in the HTML being handed to `html()` and what is
currently in the DOM and uses that to patch the DOM. This is a large shift from
before, where re-rendering a controller meant actually swapping out all the DOM
nodes under [Controller.el](/composer.js/docs/controller#el) for new ones. XDOM
compares the differences and only change what's needed.

    This is important because without XDOM, developers had to be cautious about
how to manage state in the DOM while rendering. You had to be careful about how
re-rendering might lose certain classes on elements, or how your form fields
would lose the values users input into them (or lose focus). This is no longer
an issue...calling `Controller.html()` several times will only update the pieces
that have changed and leave everything else untouched.

   What this means is that with XDOM, it's actually much better to re-render as
much as possible. You don't have to apply classes to DOM elements directly. You
don't have to worry about losing form field values. Just re-render and it all
works.

1.  XDOM batches calls to [Controller.html()](/composer.js/docs/controller#html)
so many changes at once are saved up and applied on the browser's animation
frame. This frees the developer from having to think about the most efficient
rendering strategy and allows them to re-render whenever they want and have it
be performant.

This can be compared to frameworks like Angular or React, which use Virtual DOM
implementations to patch the DOM sa changes are made. The difference is we don't
use a Virtual DOM implementation, we just use the DOM itself. Not only is this
more efficient in a lto of cases but also creates less of a gap when having to
think about building apps. You're already used to using the DOM. Why should you
have to give it up entirely and let a framework manage it for you?

### Using XDOM

There are two ways to use XDOM. You can enable it on a per-controller basis:

<div class="noeval">
{% highlight js %}
var HiController = Composer.Controller.extend({
    xdom: true,
    ...
});
{% endhighlight %}
</div>

This is great for existing composer projects that want to slowly move to the
XDOM model. Alternatively, you can enable XDOM for all controllers:

<div class="noeval">
{% highlight js %}
Composer.Controller.xdomify();
{% endhighlight %}
</div>

This goes great with a [Composer.promisify()](/docs/util#composer-promisify)
call =].

### Examples

Check out some [XDOM controllers on the examples page.](/composer.js/examples/controller-xdom)

### Caveats

There are some differences you need to be aware of when using XDOM:

- You need to include some form of DOM diffing library. The default supported
library is [morphdom](https://github.com/patrick-steele-idem/morphdom). You can
[hook in your own diffing/patching library](#composer-xdom-hooks) if desired.
- [Controller.html()](/composer.js/docs/controller#html) is asynchronous. It
will passes your DOM element/HTML string off to the XDOM rendering system and
doesn't update the Controller's [elements](/composer.js/docs/controller#elements)
until rendering is complete.
- You can still make incremental updates to the DOM after rendering, however
with XDOM it conceptually makes much more sense to just re-render your
controller instead. So if you are used to writing non-XDOM controllers, this may
be a bit of a paradigm shift in some cases (like when rendering forms, for
instance). Re-rendering is (nearly) free, so it's much better to overuse it.

### Composer.xdom.hooks :: function(options)

If you don't want to use [morphdom](https://github.com/patrick-steele-idem/morphdom)
(the default supported DOM diffing implementation) you are free to use your own
by hooking it into Composer. Simply call `Composer.xdom.hooks`.

`options` can contain the following items:

- `diff` - A function (`function(from_element, to_element)`) that takes two DOM
elements and returns a diff between them. The result of this function will be
passed directly to `patch`:
- `patch`- A function (`function(root_element, diff, options)`) that takes a
root DOM element to apply the patch to, a diff created by the `diff` function,
and a set of options (passed down from [Controller.html()](/composer.js/docs/controller#html)).

## Composer.find_parent :: function(selector, element)

This is a utility for (recursively) finding the first parent of `element` that
matches the `selector`. If `element` matches `selector`, it is returned without
grabbing any parent elements.

For instance, if you [bind an event](#events-1) to an &lt;a&gt; element but there
is an image/button/etc inside of the &lt;a&gt;, often times when the event comes
through, `event.target` will be the image/button/etc instead of the &lt;a&gt;
element. In that case, you'd use `find_parent` to grab the correct element:

<div id="example-find-parent"></div>
{% highlight js %}
var ParentTestController = Composer.Controller.extend({
    events: {
        'click a.say-hi': 'say_hi'
    },

    init: function()
    {
        this.render();
    },

    render: function()
    {
        var html = '';
        html += '<div>';
        html += '<a href="#" class="say-hi" rel="larry"><img src="http://killtheradio.net/images/uploads/turtl.png" width="128" height="128"><br>CLICK THIS ^</a>';
        html += '</div>';
        this.html(html);
    },

    say_hi: function(e)
    {
        e.preventDefault();
        e.stopPropagation();

        // instead of trusting e.target is the element we want, make sure of it.
        var atag = Composer.find_parent('a.say-hi', e.target);
        var name = atag.getAttribute('rel');
        alert('Hello, '+ name);
    }
});
var test = new ParentTestController({inject: '#example-find-parent'});
{% endhighlight %}

