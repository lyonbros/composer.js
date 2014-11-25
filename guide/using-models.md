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

This is done using the [Composer.sync](/composer.js/docs/util#composer-sync)
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
    url: '/composer.js/data/users.json'
});

// now create our collection and grab some data!
var users = new Users();
users.bind('reset', function() {
    alert('Got '+ this.size() + ' users: '+ JSON.stringify(this.toJSON()));
}.bind(users));
// fetch() calls Composer.sync in the background, which grabs our results and
// resets them into the collection
users.fetch();
{% endhighlight %}


