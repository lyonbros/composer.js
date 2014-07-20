---
title: Examples | A form in a controller
layout: documentation
---

# A form in a controller

Let's now monitor a form with a controller and update any saved data back into
our heroic model.

<div id="form-example" class="example fade"></div>

{% highlight js %}
// create a simple dog model with a bark action
var Dog = Composer.Model.extend({
    bark: function()
    {
        alert(this.get('name') + ' says "woof"');
    }
});

// create a controller to show a dog in our view
var ShowDogController = Composer.Controller.extend({
    elements: {
        'input[name=name]': 'inp_name'
    },

    events: {
        'submit form': 'submit'
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
        html += '<h3>This dog\'s name is '+ data.name +'</h3>';
        html += '<form>';
        html += 'Rename dog: <input type="text" name="name" value="">';
        html += '<br>';
        html += '<input type="submit" value="Change dog name">';
        html += '</form>';
        this.html(html);
        // focus on the input element
        setTimeout(function() { this.inp_name.focus(); }.bind(this), 100);
    },

    submit: function(e)
    {
        if(e)
        {
            e.preventDefault();
            e.stopPropagation();
        }
        var name = this.inp_name.value;

        // save the name back into the dog. this fires our "change" event, which
        // re-renders
        this.model.set({name: name});
    }
});

var dog = new Dog({name: 'timmy'});
var controller = new ShowDogController({
    inject: '#form-example',
    model: dog
});
Composer.find(document, '#form-example').className += ' enabled';
{% endhighlight %}


