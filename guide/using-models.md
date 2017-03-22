---
title: Using models for fun and profit
layout: guide
---

# Using models for fun and profit

Models are what drive the data portion of your app. They talk to your local
browser databases, they talk to your API, and they talk to any other portion of
your app that supplies or stores data.

So how does this talking actually happen?

## Getting data into models

Before your app can display all the wonderful data you want to show (dog photos,
user profiles, leaked government defense contract documents), it needs to get
this data from somewhere.

This is easy using the [Composer.sync](/composer.js/docs/util#composer-sync)
function. This function is meant to be replaced by you, and is called whenever
one of your models calls [fetch](/composer.js/docs/model#fetch),
[save](/composer.js/docs/model#save), or [destroy](/composer.js/docs/model#destroy-1).

It allows you to hook up the wiring between your models and your external data.

Let's grab a list of users from our API and create a set of models from them:

<div id="model-0"></div>
{% highlight js %}
// set up a sync function that uses Mootools' Request object to grab server data
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

    // mootools ajax
    new Request({
        url: model.get_url(),
        method: http_method,
        data: data,
        onSuccess: function(res) {
            options.success && options.success(JSON.parse(res));
        },
        onFailure: function(xhr) {
            var err = JSON.decode(xhr.responseText);
            options.error && options.error(err);
        }
    }).send();
};

var User = Composer.Model.extend({});
var Users = Composer.Collection.extend({
    model: User,
    // sets the URL that this collection will pull data from
    url: '/composer.js/data/users.json'
});

// now create our collection and grab some data!
var users = new Users();
users.bind('reset', function() {
    var str = 'Got '+ this.size() + ' users:\n';
    str += this.map(function(u) { return u.get('name'); }).join(', ');
    alert(str);
}.bind(users));
// fetch() calls Composer.sync in the background, which grabs our results and
// resets them into the collection
users.fetch();
{% endhighlight %}

Let's go over what's happening. First, we set the `Composer.sync` function to
interpret what operation we're performing and turn it into an HTTP verb (GET,
POST, etc). Then it calls our ajax function to grab our remote data. This all
happens asynchronously. Once the data is returned from the server, it is
JSON parsed and sent into `Composer.sync`'s `options.success` function, which
processes the data and then passed it into the collection via [reset](/composer.js/docs/collection#reset-1),
firing a `reset` event once complete.

We bind to the `reset` event, showing an alert with lots of juicy information
once called.

### Notes on Composer.sync

`Composer.sync`, as we saw above, is a place in your app you can call out to
exgternaxternal data sources. It can use the browser's local storage, indexedDB,
external APIs, etc.

Although `Composer.sync` ties well into models and collections, it will not
cover every use-case. Feel free to write custom queries or API calls in your
models/collections as needed. Don't try to force everything into the `.sync()`
paradigm.

Note that not only can you set `Composer.sync` globally, you can set it on a
per-model or per-collection basis by changing that object's `.sync` property.

<div class="noeval">
{% highlight js %}
// you can set .sync in the class itself ...
var Dog = Composer.Model.extend({
    sync: function(method, model, options) { ... }
});

// ...or on a per-object basis:
var dog = new Dog();
dog.sync = function(method, model, options) { ... };
{% endhighlight %}
</div>

This lets you have per-class or per-object custom sync functionality, and even
lets you easily switch out one datastore for another if desired.

## Saving data

At some point, you'll probably want to take data from a user interface and save
it to a database. Models are well-equipped for this, providing a very nice
[save](/composer.js/docs/model#save) function which uses `Composer.sync` to send
data to where it needs to go.

