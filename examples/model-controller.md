---
title: Examples | A simple model/controller setup
layout: page
---

# A simple model/controller setup

Here we're going to tie a model and controller together using eventing. Notice
that if you click "Try it" multiple times, it loads multiple controllers and
each one manages its own state without butting heads with the others. Very nice.

<div id="simple" class="example fade"></div>

{% highlight js %}
// create a model that counts stuff
var Counter = Composer.Model.extend({
    get_count: function()
    {
        return this.get('num', 0);
    },

    count: function()
    {
        var num = this.get_count();
        num++;
        this.set({num: num});
    }
});

// create a controller that's capable of showing the current count from our
// model but also allows us to increase the count by pushing a button
var DisplayCounterController = Composer.Controller.extend({
    events: {
        'click input[type=button]': 'increase_count'
    },

    // it's fairly standard convention to use this.model if a controller only
    // tracks one model. if it tracks multiple, feel free to name them as you
    // wish.
    model: false,

    init: function()
    {
        // no model present? bail. (you could also throw an exception here)
        if(!this.model) return this.release();

        // use this.with_bind instead of this.model.bind so when the controller
        // is released, it cleans up any objects it bound itself to
        this.with_bind(this.model, 'change', this.render.bind(this));

        this.render();
    },

    // the render function shows our current count AND gives us a button to up
    // the count
    render: function()
    {
        var html = '';
        html += 'Current count is '+ this.model.get_count();
        html += '&nbsp;&nbsp;';
        html += '<input type="button" value="Increase">'
        this.html(html);
    },

    // this will be called by out event mapping when the button is clicked
    increase_count: function(e)
    {
        if(e)
        {
            e.preventDefault();
            e.stopPropagation();
        }

        // this will change the `num` field in the model which triggers a
        // "change" event, which in turn re-renders the view =]
        this.model.count();
    }
});

var counter = new Counter();
var controller = new DisplayCounterController({
    inject: '#simple',

    // be sure to pass in the model!
    model: counter
});

// add the "enabled" class to our example container to get a cheesy CSS fade-in
// effect. Note that although undocumented, Composer.find is the abstraction
// around the included selector engine (note that it always returns raw DOM
// elements instead of jQuery-esque wrapped objects).
Composer.find(document, '#simple').className += ' enabled';
{% endhighlight %}

