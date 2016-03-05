---
title: Examples | A form in an xdom controller
layout: examples
---

# A form in an xdom controller

Let's use xdom to build a form that can re-render without losing its state.
Notice how we re-render the the controller each time the dog's name changes,
*however* the input element's state is not reset like it is in the [regular
controller form example](examples/controller-form).

<div id="form-example" class="example fade"></div>

{% highlight js %}
// create a controller to show a dog in our view
var ShowDogController = Composer.Controller.extend({
    // enable xdom
    xdom: true,

    elements: {
        'input[name=name]': 'inp_name'
    },

    events: {
        'input input[name=name]': 'change_name'
    },

    model: null,

    init: function()
    {
        // re-render on all model changes
        this.with_bind(this.model, 'change', this.render.bind(this));

        // we only need to focus once since our input will never be replaced
        this.render({complete: function() { this.inp_name.focus(); }.bind(this)});
    },

    render: function(options)
    {
        var data = this.model.toJSON();
        var html = [
            '<h3>Woof, I\'m '+ data.name +'</h3>',
            'Rename dog: <input type="text" name="name" value="">',
        ].join('\n');
        this.html(html, options);
    },

    change_name: function(e)
    {
        var name = this.inp_name.value;
        this.model.set({name: name});
    }
});

// create a simple dog model
var Dog = Composer.Model.extend({});

new ShowDogController({
    inject: '#form-example',
    model: new Dog({name: 'timmy'})
});
Composer.find(document, '#form-example').className += ' enabled';
{% endhighlight %}

