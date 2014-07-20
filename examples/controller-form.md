---
title: Examples: A form in a controller
layout: documentation
---

# A form in a controller

Let's now monitor a form with a controller and update any saved data back into
our heroic model.

{% highlight js %}
// create a simple dog model with a bark action
var Dog = Composer.Model.extend({
    bark: function()
    {
        alert(this.get('name') + ' says "woof"');
    }
});

// create a controller to show a dog in our view
var ShowDog = Composer.Controller.extend({
    elements: {
        'input[name=name]': 'inp_name'
    },

    events: {
        'click input[type=button]': 'update_dog'
    },

    model: false,

    init: function()
    {
        if(!this.model) return false;
        this.with_bind(this.model, 'change', this.render.bind(this));
        this.render();
    },

    render: function()
    {
        // we're going to inject data directly into the view. this is the simple
        // way to do things, but is vulnerable to XSS attacks. in general, use a
        // real templating engine to avoid such things =]
        var data = this.model.toJSON();
        var html = '';
        html += '<h1>Dog ('+ data.name +')</h1>';
        html += 'Rename dog: <input type="text" name="name" value="'+ data.name +'">';
        html += '<input type="button"
        this.html(html);
    }
});

var dog = new Dog();

{% endhighlight %}

<div id="example"></div>


