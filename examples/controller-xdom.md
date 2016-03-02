---
title: Examples | A form in an XDOM controller
layout: examples
---

# A form in an XDOM controller

Let's use XDOM to build a form that can re-render without losing its state.
Notice how we re-render the the controller each time the dog's name changes,
*however* the input element's state is not reset like it is in the [regular
controller form example](/composer.js/examples/controller-form).

<div id="form-example" class="example fade"></div>

{% highlight js %}
// create a simple dog model
var Dog = Composer.Model.extend({});

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
        if(!this.model) return this.release();
        this.with_bind(this.model, 'change', this.render.bind(this));
        this.render()
            .bind(this)
            .then(function() { this.inp_name.focus(); });
    },

    render: function()
    {
        // we're going to inject data directly into the view. this is the simple
        // way to do things, but is vulnerable to XSS attacks. in general, use a
        // real templating engine to avoid such things =]
        var data = this.model.toJSON();
        var html = [
            '<h3>This dog\'s name is '+ data.name +'</h3>',
            '<form>',
            '   Rename dog: <input type="text" name="name" value="">',
            '   <br>',
            '   <input type="submit" value="Change dog name">',
            '</form>'
        ].join('\n');
        return this.html(html);
    },

    submit: function(e)
    {
        if(e) e.preventDefault();
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

