---
title: Controller xdom
layout: documentation
---

# Controller xdom

New in Composer v1.2 is a Controller feaure we call xdom. It is a patching
implementation for the DOM which does a few things:

1.  Instead of replacing the DOM entirely when calling [Controller.html()](docs/controller#html),
xdom compares the differences in the HTML being handed to `html()` and what is
currently in the DOM and uses that to patch the DOM. This is a large shift from
before, where re-rendering a controller meant actually swapping out all the DOM
nodes under [Controller.el](docs/controller#el) for new ones. xdom
compares the differences and only changes what's needed.

    This is important because without xdom, you had to be cautious about
how to manage state in the DOM while rendering. You had to be careful about how
re-rendering might lose certain classes on elements, or how your form fields
would lose the values users input into them (or lose focus). This is no longer
an issue...calling `Controller.html()` several times will only update the pieces
that have changed and leave everything else untouched.

    What this means is that with xdom, it's actually much better to re-render as
much as possible. You don't have to apply classes to DOM elements directly. You
don't have to worry about losing form field values. Just re-render and it all
works. *All of your view state can now live in your templates*!

1.  xdom batches calls to [Controller.html()](docs/controller#html)
so many changes at once are saved up and applied on the browser's animation
frame. This frees you from having to think about the most efficient
rendering strategy and allows you to render often without sacrificing
performance.

1.  xdom preserves [subcontrollers](docs/controller#sub) and [ListController](docs/listcontroller)
children. This means if you have a subcontroller attached to a DOM element you
created in [Controller.html()](docs/controller#html), that DOM element will be
left untouched if you call `html` again. The old way of doing things, you would
have to recreate your tree of subcontrollers if you wanted to re-render. This
places a lot of burden on re-rendering and leads to manual DOM manuipulations
outside of the `render`/`html` functions.

Composer's xdom can be compared to frameworks like Angular or React, which use
Virtual DOM implementations to patch the DOM as changes are made. The difference
is we don't use a Virtual DOM implementation, we just use the DOM itself. Not
only is this more efficient in a lot of cases but also creates less of a gap
when having to think about building apps. You're already used to using the DOM.
Why should you have to give it up entirely and let a framework manage it for
you?

## Using xdom

Since Composer strives to maintain backwards compatibility with old versions,
you have to explicitely enable xdom. There are two ways to do this. You can
enable it on a per-controller basis:

<div class="noeval">
{% highlight js %}
var HiController = Composer.Controller.extend({
    xdom: true,
    ...
});
{% endhighlight %}
</div>

This is great for existing Composer projects that want to slowly move to the
xdom model. Secondly, you can enable xdom for all controllers:

<div class="noeval">
{% highlight js %}
Composer.Controller.xdomify();
{% endhighlight %}
</div>

This goes great with a [Composer.promisify()](docs/util#composer-promisify)
call =].

### General strategy

In the old days, back before Composer v1.2, re-rendering a Controller that had
subcontrollers meant re-creating the subcontroller tree each time. That meant
releasing the subcontrollers and initializing them after each render. Same with
ListControllers: you had to be careful about re-rendering or the element the
ListController injected its children into would disappear.

With xdom, instead of setting up your [subcontrollers](#subcontrollers) or
[tracking](#listcontroller) on each render, you just set them up once
after the first render:

<div class="noeval">
{% highlight js %}
var ExampleController = Composer.ListController.extend({
    xdom: true,

    model: null,
    init: function()
    {
        // this assumes Composer.promisify() has been called
        this.render()
            .then(function() {
                // init your subcontrollers/tracking once after the first render
                this.sub(...);
                this.track(...);
            });

        // re-render all we want on changes...our subcontrollers/list tracking
        // will not be affected
        this.with_bind(this.model, 'change', this.render.bind(this));
    },

    render: function()
    {
        var html = 'Generate some html';
        return this.html(html);
    }
});
{% endhighlight %}
</div>

This simplifies your setup and also makes things a lot more efficient. Instead
of destroying/recreating trees of Javascript objects and DOM nodes on each
render, you're creating an initial object/DOM tree and letting xdom make
incremental patches to it for you from then on.

This also frees you from having to do DOM updates by hand. Just let your view
layer keep the DOM up-to-date and let your Controller focus on tying the
DOM/data layer together via eventing.

### Subcontrollers

When using xdom, calling [html()](docs/controller#html) will preserve the elements
of the sub-controllers. What this means is you can re-render your controller as
many times as you want and your sub-controller's [main elements](docs/controller#el)
will not be removed from the DOM, even though their DOM tree(s) are not part of
your template.

This may change the way you use subcontrollers a bit:

<div id="sub-xdom"></div>
{% highlight js %}
var AnimalController = Composer.Controller.extend({
    tag: 'span',
    model: null,
    init: function()
    {
        // create a simple user model
        this.model = new Composer.Model({name: 'Barky'});
        this.render();

        // re-render on all model changes
        this.with_bind(this.model, 'change', this.render.bind(this));

        // update name every 2-4s
        setInterval(function() {
            var names = ['Barky', 'Purry', 'Hoppy', 'Flappy'];
            var name = names[Math.floor(Math.random() * names.length)];
            this.model.set({name: name});
        }.bind(this), 2000 + (Math.random() * 2000));
    },

    render: function()
    {
        this.html(this.model.get('name'));
    }
});

var FarmController = Composer.Controller.extend({
    xdom: true,

    elements: {
        '.animal1': 'el_animal1',
        '.animal2': 'el_animal2'
    },

    model: null,
    user: null,

    init: function()
    {
        // create a simple farm model
        this.model = new Composer.Model({date: new Date().toISOString()});
        this.render({complete: function() {
            // when our render is complete, create two animal controllers
            this.sub('animal1', function() {
                return new AnimalController({ inject: this.el_animal1 });
            }.bind(this));
            this.sub('animal2', function() {
                return new AnimalController({ inject: this.el_animal2 });
            }.bind(this));
        }.bind(this)});

        // re-render on all model changes
        this.with_bind(this.model, 'change', this.render.bind(this));

        // update date every 3s
        setInterval(function() { this.model.set({date: new Date().toISOString()}); }.bind(this), 1000);
    },

    render: function(options)
    {
        var html = [
            '<h3>Animal farm</h3>',
            '<div>The time is '+ this.model.get('date') +'</div>',
            '<div>Our first animal is called <span class="animal1"></span></div>',
            '<div>Our second animal is called <span class="animal2"></span></div>'
        ].join('\n');

        // note that with xdom, we can call this as many times as we want and
        // our subcontrollers' main element is left untouched
        this.html(html, options);
    }
});

new FarmController({ inject: document.getElementById('sub-xdom') });
{% endhighlight %}

So what happened here? We call an initial `FarmController.render()` from our `init()` function
and have it pass our `complete` function to [html()](docs/controller#html). Once
rendered, we set up our subcontrollers *once* and from then on we can call
`render()` all we want without having to set up our subcontrollers again.

This is great because we don't need to completely re-render our entire tree of
subcontrollers just because the top one needs to render. We set up our
subcontrollers *once* and can re-render as much as needed after that.

### ListController

The [ListController](docs/listcontroller) also plugs into the xdom renderer to
make things easier on us. Much like subcontrollers, the ListController lets the
rendering system know it should ignore the element it renders its children into
so they aren't removed/overwritten when `html()` is called again.

It does this by looking for a new option in its [track() function](docs/listcontroller#track)
called `container`. Here's a quick example:

<div id="lc-xdom"></div>
{% highlight js %}
var UserItemController = Composer.Controller.extend({
    tag: 'li',
    xdom: true,
    model: null,

    init: function()
    {
        this.render();
    },

    render: function()
    {
        this.html('My name is '+ this.model.get('name'));
    }
});

var UsersController = Composer.ListController.extend({
    xdom: true,

    elements: {
        'input[name=name]': 'inp_name',
        'ul': 'el_users'
    },

    events: {
        'submit form': 'add_user'
    },

    model: null,
    collection: null,

    init: function()
    {
        this.model = new Composer.Model();
        this.collection = new Composer.Collection();

        this.render({complete: function() {
            this.track(this.collection, function(model, options) {
                return new UserItemController({
                    // NOTE: options.container can be either this.el_users OR
                    // it can be a DOM fragment the listcontroller is gathering
                    // its children into for efficient rendering
                    inject: options.container,
                    model: model
                });
            }.bind(this), {container: this.el_users});
            this.inp_name.focus();
        }.bind(this)});

        // re-render when our model changes
        this.with_bind(this.model, 'change', this.render.bind(this));
    },

    render: function(options)
    {
        var last_user = this.model.get('last')
        var html = [
            '<form>',
            '   <input name="name" placeholder="Add a new user">',
            '   <input type="submit" value="Add">',
                (last_user ? '<span>Last user added was: '+ last_user +'</span>' : ''),
            '</form>',
            '<ul></ul>'
        ].join('\n');
        this.html(html, options);
    },

    add_user: function(e)
    {
        e.preventDefault();
        var name = this.inp_name.value;
        if(!name) return;
        // add the new user to the list
        this.collection.add({name: name});
        // update our model for "Last user added" display
        this.model.set({last: name});
    }
});
new UsersController({inject: document.getElementById('lc-xdom')});
{% endhighlight %}

## Examples

Check out some [xdom controllers on the examples page](examples/controller-xdom).

## Caveats

There are some differences you need to be aware of when using xdom:

- You need to include some form of DOM diffing library. The default supported
library is [morphdom](https://github.com/patrick-steele-idem/morphdom). You can
[hook in your own diffing/patching library](#composer-xdom-hooks) if desired.
- [Controller.html()](docs/controller#html) is asynchronous. It
passes your DOM element/HTML string off to the xdom rendering system and doesn't
update the Controller's [elements](docs/controller#elements) until
rendering is complete. See the `Composer.html()` docs for ways to know when
rendering is complete.
- You can still make incremental updates to the DOM after rendering, however
with xdom it conceptually makes much more sense to just re-render your
controller instead. So if you are used to writing non-xdom controllers, this may
be a bit of a paradigm shift in some cases (like when rendering forms, for
instance). Re-rendering is (nearly) free, so it's much better to overuse it.

## Tying into xdom

You can hook into various aspects of xdom yourself if you need custom behavior,
and can even supply your own DOM patching library if need be.

### html()'s options argument

[Controller.html()](dccs/controller#html) now accepts an `options` object as its
second argument. Options can contain:

- `complete` - A function of zero arguments that gets called when rendering has
completed for this call of `html()`. Note that when [Composer.promisify()](/docs/util#composer-promisify)
is called, `html()` returns a promise that resolves when rendering is complete
and `options.complete` is not needed.
- `ignore_elements` - An array of existing DOM elements that will not be
discarded by xdom should they not match the content being passed to `html()`.
This is how the Controller preserves [subcontrollers](docs/controller#sub)
when re-rendering. You can supply your own elements as well (which will be
appended to by `html`).
- `ignore_children` - An array of existing DOM elements whose children will be
ignored by xdom if they do not match the content being passed to `html()`.
This is how the ListController preserves child controllers when re-rendering.
You can supply your own elements as well (which will be appended to by `html`).
- `reset_inputs` - If set to true, form elements in your view will have their
`.value` and `.checked` attributes reset to the form default. The default
mode of operation is to leave form element values/focus untouched, but there
may be cases where you also want a hard reset of the form/template.

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
and a set of options (passed down from [Controller.html()](docs/controller#html)).

Keep in mind that if implementing your own DOM patching system, you will want to
implement the [available options that Controller.html() handles](#htmls-options-argument)
for everything to function properly. For an idea of how this is done, check out
the `xdom` section of [src/adapter.js in the current codebase](https://github.com/lyonbros/composer.js/blob/master/src/adapter.js).

