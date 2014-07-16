---
title: Utilities
layout: documentation
---

# Utilities

Composer has a number of utilities that are used throughout the framework, but
can also be used by your app as well.

## Composer.sync (method, model, options)

Composer's syncing function. It provides a central location for models and
collections to grab and post data to your servers. By default, it does nothing
and should be overridden by you.

`method` is one of "create", "read", "update", "delete". `model` is the model
the sync function is being called on. `options` is the options object passed to
the model/collection's `save`, `fetch`, `destroy` function.

Note that `options` also has two functions in it: `success` and `error`.
`success` should be called when the call to your API finishes, the only argument
being the data returned from the API. `error` should be called if any errors
happen (first arg is the error, second is the XHR object).

Example:

<div class="noeval">
{% highlight js %}
Composer.sync = function(method, model, options)
{
    var http_method = 'get';
    switch(method)
    {
    case 'read': http_method = 'GET'; break;
    case 'create': http_method = 'POST'; break;
    case 'update': http_method = 'PUT'; break;
    case 'delete': http_method = 'DELETE'; break;
    }

    if(['POST', 'PUT'].indexOf(http_method) >= 0)
    {
        var data = model.toJSON();
    }
    else
    {
        var data = {};
    }

    FictionalApp.API.call(http_method, model.get_url(), data, {
        success: options.success,
        error: options.error
    });
};
{% endhighlight %}
</div>

## Composer.cid :: function()

A function that generates client-ids for every object instantiated by Composer.
This function can be replaced with your own.

{% highlight js %}
// assign our own CID generating function
Composer.cid = (function() {
    var x = 0;
    return function() {
        x++;
        return 'z'+x;
    }
})();
alert('CID: '+ new Composer.Model().cid());
{% endhighlight %}

## Composer.eq :: function(a, b)

Determines if two objects are equal. Does a deep-inspection of objects and
arrays.

{% highlight js %}
alert('eq? ' + Composer.eq(
    {name: 'andrew', friends: ['larry', 'curly', 'moe']},
    {name: 'andrew', friends: ['larry', 'curly', 'moe']}
));
{% endhighlight %}

## Composer.merge_extend (class, properties)

See [Composer.merge_extend](/composer.js/docs/class#composer-merge-extend).

## Composer.array

A collection of array utilities, mimicked after Mootools.

### erase :: function(array, item)

Erase all instances of an item from an array.

{% highlight js %}
var arr = [1,2,3];
Composer.array.erase(arr, 2);
alert('Result: '+ JSON.stringify(arr));
{% endhighlight %}

## Composer.object

A collection of object utilities, mimicked after Mootools.

### each :: function(obj, fn, bind)

Call `fn` for each key/value pair on `obj` (optionally binding `bind` to `fn`'s
scope).

<div class="noeval">
{% highlight js %}
Composer.object.each({name: 'andrew', age: 27}, function(val, key) {
    console.log('k/v', key, val);
});
{% endhighlight %}
</div>

### clone :: function(obj)

Clone an object.

<div class="noeval">
{% highlight js %}
var clone = Composer.object.clone({horses: 'goodbye'});
{% endhighlight %}
</div>

### merge :: function(to, ...)

Merge a number of objects into `to`, objects being listed later having
preference.

{% highlight js %}
var obj = {};
Composer.object.merge(obj, {name: 'fisty'}, {age: 69});
alert('Obj: ' + JSON.stringify(obj));
{% endhighlight %}

