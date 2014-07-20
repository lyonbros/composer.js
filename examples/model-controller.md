---
title: Examples | A simple model/controller setup
layout: documentation
---

# A simple model/controller setup

Here we're going to tie a model and controller together using eventing.

<div id="example" class="fade"></div>

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
        if(!this.model) return false;

        // use this.with_bind instead of this.model.bind so when the controller
        // is released, it cleans up any objects it bound itself to
        this.with_bind(this.model, 'change', this.render.bind(this));

        this.render();
    },

    render: function()
    {
        this.html('Current count is '+ this.model.get_count());
    },

    increase_count: function(e)
    {
        if(e) e.stop();
        // this will change the `num` field in the model which triggers a
        // "change" event, which in turn re-renders the view =]
        this.model.count();
    }
});

var counter = new Counter();
var controller = new DisplayCounterController({
    inject: '#example'
});
document.getElementById('example').className += ' enabled';
{% endhighlight %}
