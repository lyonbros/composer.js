---
title: Guide to getting started
layout: guide
---

# Guide to getting started

Welcome! Congratulations on picking Composer for your next app! This guide will
walk you through the basics of effectively using Composer.

Composer provides an MVC (Model, View, Controller) structure to build your app
on top of. What this means is that different pieces of your app are separated
into three basic components:

- [__Models__](/composer.js/docs/model) are responsible for processing and
handling data. This can mean calling an API or a local database, or just
crunching a bunch of numbers.
- __Views__ are what display everything in your app. In our case, the view is
the browser's DOM. Composer doesn't push any templating engine on you...you can
use hand-written HTML strings, or something like [Handlebars](http://handlebarsjs.com/).
- [__Controllers__](/composer.js/docs/controller) tie models and views together,
normally by listening to (and acting on) events. The model will fire events when
its data changes, and the view will fire events when a user performs some kind
of interaction (a click, a form post, etc).

## A basic example

Let's take the above gibberish and put it into practice. Hands on learning is
the best learning.

So how do we begin? Well, every app needs an interface, so let's build our
first controller.

<div id="guide-0"></div>

{% highlight js %}
var BasicController = Composer.Controller.extend({
    // render this controller into the current page's #guide-0 element
    inject: '#guide-0',

    // init() gets called whenever your controller object is instantiated
    init: function()
    {
        // immediately render our controller
        this.render();
    },

    // this is the standard render function. it is responsible for actually
    // showing the controller interface.
    render: function()
    {
        // build our "view." this is where your fancy templating engine could
        // be plugged in
        var html = '<h3>Hello world!</h3>';

        // set our html into this controller's main element
        this.html(html);
    }
});
// create our controller!
new BasicController();
{% endhighlight %}

Let's go over what's happening here. When we create our controller via
`new BasicController()`, the controller immediately [creates a new &lt;div&gt;](/composer.js/docs/controller#el)
element for itself, and injects that div into the element on the page with
`id="guide-0"`. The div the controller created and injected is referenced by
`this.el` within the controller's functions. When [html()](/composer.js/docs/controller#html)
is called in our `render()` function, the controller main element (`this.el`)
has its innerHTML set with the content passed to `html()`.

I know what you're thinking. "Great, this guy just reinvented `div.innerHTML = 'Hello world';`.
Don't lose hope yet, fellow front-end app developer! We'll start seeing the true
power of the controller pattern shortly.

## Getting more done

Let's tie a model into the controller, as well as listen for some DOM events to
make things a bit more interesting.

<div id="guide-1"></div>

{% highlight js %}
var GettingStartedController = Composer.Controller.extend({
    inject: '#guide-1',

    events: {
        // listen for a "click" event on any button inside our controller's main
        // element. if a click happens, run the controller's random_name()
        // function
        'click input[type=button]': 'random_name'
    },

    model: null,

    init: function()
    {
        // give this controller a dummy model if one wasn't passed in
        if(!this.model) this.model = new Composer.Model();
        this.render();

        // re-render this controller if any of our model's data changes
        this.model.bind('change', this.render.bind(this));
    },

    render: function()
    {
        var html = '<h3>My name is '+ this.model.get('name', '<blank>') +'</h3>';
        html += '<input type="button" value="Pick a random name">';

        this.html(html);
    },

    random_name: function(e)
    {
        // grab a random name.

        // note that this should actually live in the model (who's job is to
        // handle data) but for this example, this is a fine place for it.
        var names = ['Larry', 'Curly', 'Moe', 'Barry', 'Sandra', 'Lucy'];
        var name = names[Math.floor(Math.random() * names.length)];

        // set the name into our model
        //
        // the magic happens here. when we call model.set with new data, it
        // fires a 'change' event (as well as 'change:name' in this case). when
        // the 'change' event fires, the controller re-renders, showing us the
        // new name.
        this.model.set({name: name});
    }
});
new GettingStartedController();
{% endhighlight %}

Cool, now we have a controller that displays itself and is also listening for
any changes to data on its model. Give it a try! In fact, feel free to click
`Try it` multiple times. You will see multiple controllers render, each with its
own model and its own state. This demonstrates how controllers can be used to
describe and show interfaces in a compartmentalized fashion.

## Fixing the above example

So above, we're doing a few things wrong (some of which we addressed in the
comments). Let's go over our problems in detail.

### Using with_bind instead of direct binding

The first thing we did wrong was in our controller's `init()` function
when we called

<div class="noeval">
{% highlight js %}
    this.model.bind('change', this.render.bind(this));
{% endhighlight %}
</div>

At first glance it looks fine, and works great as you can see above. When the
model changes, we re-render, showing a new name. However, if the controller
is [released](/composer.js/docs/controller#release-1), it is never actually
garbage collected until the model is collected as well. This has the potential
to create memory leaks in your app, especially when rendering more complex
interfaces.

What's happening is that we [bind](/composer.js/docs/model#bind) the `change`
event to `render()`. This means that as long as that model exists, the reference
to `render()` (and all the state it requires, including the entire controller)
is kept alive.

The best way to handle this is to use [Controller.with_bind](/composer.js/docs/controller#with-bind),
which will automatically unbind itself from any bound events when the controller
is released:

<div class="noeval">
{% highlight js %}
    this.with_bind(this.model, 'change', this.render.bind(this));
{% endhighlight %}
</div>

### Handling data in a model

In our controller's `random_name()` function, we're grabbing a random name from
a set of data and putting it into the model. What we really need to do is build
random name selection into the model itself:

<div class="noeval">
{% highlight js %}
// notice we can extend the Composer.Model class to build custom models
var Namer = Composer.Model.extend({
    random_name: function()
    {
        var names = ['Larry', 'Curly', 'Moe', 'Barry', 'Sandra', 'Lucy'];
        var name = names[Math.floor(Math.random() * names.length)];
        this.set({name: name});
    }
});
{% endhighlight %}
</div>

Great. Let's put it all together.

<div id="guide-2"></div>

{% highlight js %}
var Namer = Composer.Model.extend({
    random_name: function()
    {
        var names = ['Larry', 'Curly', 'Moe', 'Barry', 'Sandra', 'Lucy'];
        var name = names[Math.floor(Math.random() * names.length)];
        this.set({name: name});
    }
});

var BetterController = Composer.Controller.extend({
    inject: '#guide-2',

    events: {
        'click input[rel=name]': 'random_name',

        // remember, release() is a built-in controller function that removes
        // the controller from the DOM and performs any cleanup needed
        'click input[rel=release]': 'release'
    },

    model: null,

    init: function()
    {
        // create an instance of Namer instead of Composer.Model
        if(!this.model) this.model = new Namer();
        this.render();

        // with_bind is a silent hero. things work great without it, but on a
        // long enough timeline, your app will eat more memory than an Eclipse
        // editor that's been open for a week
        this.with_bind(this.model, 'change', this.render.bind(this));
    },

    render: function()
    {
        var html = '<h3>My name is '+ this.model.get('name', '<blank>') +'</h3>';
        html += '<input type="button" rel="name" value="Pick a random name">';
        // add a release button
        html += '<input type="button" rel="release" value="Release">';
        this.html(html);
    },

    random_name: function(e)
    {
        // now we just call our model function
        this.model.random_name();
    }
});
new BetterController();
{% endhighlight %}

Siiiick. We created our own model type (`Namer`) and also updated the controller
to be smarter about how it binds to our model. These changes go great with the
new `[release]` button we put in. Give it a try.

