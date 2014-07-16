---
title: Base
layout: documentation
---

# Base

The base object, which extends [Composer.Event](/composer.js/docs/event), is the
object that all other components are based off of.

## Composer.Base

The base class all others extend. All extending objects ([model](/composer.js/docs/model),
[collection](/composer.js/docs/collection), [controller](/composer.js/docs/controller),
etc) will have access to these attributes/functions (as well as any functions in
the [Composer.Event class](/composer.js/docs/event#composer-event), which
Composer.base extends).

### options :: attribute({})

This is an empty object. Extending objects can use this to store various
internal options. See [set_options](#set-options).

### cid :: function()

Returns the object's *client ID*. This is an auto-assigned string value, used to
distinguish various objects from each other *without* having to having to assign
them an ID manually.

See [Composer.cid](/composer.js/docs/util#composer-cid).

{% highlight js %}
// grab a cid!
var obj = new Composer.Model();
alert('cid: '+ obj.cid());
{% endhighlight %}

### set_options :: function(options)

This convenience function makes it easy for objects to set an options object
(many times passed into the `initialize` constructor) into [this.options](#options).

{% highlight js %}
var MyObj = Composer.Base.extend({
    initialize: function(options)
    {
        this.set_options(options);
    }
});

var obj = new MyObj({allow_clicks: true});
alert('Allow clicks? '+ obj.options.allow_clicks);
{% endhighlight %}

