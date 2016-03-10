---
title: Your first interface | Composer Guide
layout: guide
---

# First interface

Controllers are what are responsible for loading our interaces and setting up
data exchange between your models and your view (the browser DOM). For our
simplest example, we don't have a data layer yet and we're just going to load a
simple HTML template.

## A basic example

We're going to walk through building a simple controller and using it to
display something in the browser. Our controller will be very basic and for now
is just going to render static HTML.

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
        // here's where you'd use Handlebars et al. we're sticking with raw
        // HTML for simplicity
        var html = '<h3>Hello world!</h3>';

        // set our html into this controller's main element
        this.html(html);
    }
});
// create our controller!
new BasicController();
{% endhighlight %}

Let's go over what's happening here. We define our controller by extending the
`Composer.Controller` class, giving us a custom controller class. When we create
our controller via `new BasicController()`, the controller immediately [creates a new &lt;div&gt;](docs/controller#el)
element for itself, and injects that div into the element on the page with
`id="guide-0"`. The div the controller created and injected is referenced by
`this.el` within the controller's functions. When [html()](docs/controller#html)
is called in our `render()` function, the controller main element (`this.el`)
has its innerHTML set with the content passed to `html()`.

I know what you're thinking. "Great, this guy just reinvented `div.innerHTML = 'Hello world';`.
Don't lose hope yet, fellow front-end app developer! We'll start seeing the true
power of the controller pattern shortly.

## Connecting data to the view

We're going to create a [model](docs/model) and have the controller listen to it
and re-render on changes. We're also going to listen to events in our view to
make changes to the model.

<div id="guide-1"></div>

{% highlight js %}
var DataController = Composer.Controller.extend({
    inject: '#guide-1',

    elements: {
        // when html() updates the DOM, we find our input element and store it
        // into the controller's scope under `this.inp_name`
        'input[name=name]': 'inp_name'
    },

    events: {
        // listen for the 'input' event on our text box and when it happens,
        // call `this.update_name`
        'input input[name=name]': 'update_name'
    },

    model: null,

    init: function()
    {
        // give this controller a dummy model
        this.model = new Composer.Model();

        // run an initial render. our html() call returns a promise that runs
        // once the DOM has been updated with our HTML
        this.render()
            .then(function() {
                // once our initial render is done, do any needed setup on our
                // view. for now we just want to focus our input
                this.inp_name.focus();
            }.bind(this));

        // re-render this controller if any of our model's data changes
        this.with_bind(this.model, 'change', this.render.bind(this));
    },

    render: function()
    {
        var name = this.model.get('name', '');
        var html = [
            '<h3>My name is '+ (name ? name : '(enter your name)') +'</h3>',
            '<input type="text" name="name" value="" placeholder="Name">'
        ].join('\n');
        return this.html(html);
    },

    update_name: function(e)
    {
        // this.inp_name is bound by our `elements` definition above
        var name = this.inp_name.value;

        // update the model with this name. this triggers a 'change' event on
        // the model, which our controller listens to and uses to re-render
        this.model.set({name: name});
    }
});
new DataController();
{% endhighlight %}

So what's happening here?  Our controller creates a blank model and stores it in
its scope. We then run our `render()` function and then call
[with_bind](docs/controller#with-bind) on our model, which means whenever the
data changes in the model we call `render()` again.

Our [event bindings](docs/controller#events) listen for `input` events on our
main text box, and when this happens, we update our model with the value from
the text box.

The interesting thing here is that even though we re-render each time the model
changes, our input element keeps its focus and value even though we're not
updating them after the render.

Why is this? Composer's [xdom rendering system](docs/xdom) makes it so that when
we call [Controller.html()](docs/controller#html), instead of replacing the
entire `innerHTML` of our controller's main element, we actually patch the DOM
and only change the bits that updated. This means that our DOM elements are
preserved across renders.

Thanks, xdom.

## Next up: models

We've created some basic interfaces, and even seen how to use eventing to
refresh interfaces based on model data. Next up, we're going to take a look at
how models are not just good for storing data, but also for retreiving and
saving it.

[Let's continue &raquo;](guide/using-models).

