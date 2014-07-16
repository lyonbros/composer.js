---
title: Relational model
layout: documentation
---

# Relational model

The relational model extends the [model](/composer.js/docs/model). The idea is
that while a model is great for a single record, sometimes you need hierarchies
in your data, and you need each part of the hierarchy to be a model/collection.
The relational model lets you specify a structure and will automatically
convert data passed in into that structure.

This can be very useful if your backing store is a document store, or if your
API returns nested data.

## Composer.RelationalModel

The main relational class. Extends [Composer.Model](/composer.js/docs/model), so
anything the model has, this has as well.

That said, we're going to re-document some of the behavior of `Composer.Model`
here because `RelationalModel` overrides it and changes it.

### Specification

Without a specification, a relational model will act exactly like a model. The
specification lets the model know which pieces of data should be
models/collections and where to find them.

Let's do an example *without* a relational model and see the result:

{% highlight js %}
var Band = Composer.Model.extend({});
var band = new Band({
    owner: {name: 'harry'},
    members: [{name: 'larry'}, {name: 'curly'}, {name: 'moe'}]
});

// note we access the items inside the nested model data as we passed it
var owner_name = band.get('owner').name;
var first_member = band.get('members')[0].name;
alert('Owner: '+ owner_name +' / first member: '+ first_member);
{% endhighlight %}

Note that the data exists in the model as we passed it. We have to specifically
ask for various parts of the data using object/array syntax. This may be what
you want, or you may want a hierarchy of models/collections:

{% highlight js %}
var BandMember = Composer.Model.extend({});
var Members = Composer.Collection.extend({
    model: BandMember
});
var Band = Composer.RelationalModel.extend({
    relations: {
        members: {
            collection: Members
        },
        owner: {
            model: BandMember
        }
    }
});

var band = new Band({
    owner: {name: 'harry'},
    members: [{name: 'larry'}, {name: 'curly'}, {name: 'moe'}]
});

// note we have converted our nested data into a tree of collections/models
var owner_name = band.get('owner').get('name');
var first_member = band.get('members').first().get('name');
alert('Owner: '+ owner_name +' / first member: '+ first_member);
{% endhighlight %}

The obvious benefit to using the relational model is that your nested data now
has the same capabilities your top-level items do (including eventing).

Example relation specification, showing all options:

<div class="noeval">
{% highlight js %}
var MyModel = Composer.RelationalModel.extend({
    relations: {
        // data passed with an `items` key will be converted to a collection
        items: {
            collection: Composer.Collection
        },

        // data passed nested, ie {extra: {user: {...}}} would be parsed such that
        // the resulting nested `user` key would be the model.
        //
        // You'd access like so:
        //  mymodel.get('extra').user.get('username')
        //
        // (note that we don't create models for each level of nesting, only the
        // final layer)
        'extra.user': {
            model: MyUser
        },

        // we can also create filter collections
        filtered: {
            filter_collection: Composer.FilterCollection,
            // allows creation of a master collection on instantiation, OR you
            // return one from another object
            master: function() {
                return new Composer.Collection()
            },
            // options only applies if you're passing a FilterCollection, 
            options: {
                // these are all FilterCollection options, which are explained
                // in the Composer.FilterCollection docs
                filter: function(model) { return true; },
                transform: ...,
                sortfn: ...,
                limit: ...
            }
        },

        // you can also specify a delayed init, meaning the sub-object won't be
        // created until data is set into it (the default is to set up all
        // sub-object on instantiation).
        delay: {
            delayed_init: true,
            model: Composer.Model
        }
    }
});
{% endhighlight %}
</div>

### Specification merging

Relational models that extend others automatically get the relationships defined
in the parent class, even if the child specifies another set of relations:

{% highlight js %}
var Animal = Composer.RelationalModel.extend({
    relations: {
        legs: { model: Composer.Model }
    }
});
var Dog = Animal.extend({
    // we'll get `legs` here even if we don't specify it because the relations
    // are merged from the parent
    relations: {
        tail: { model: Composer.Model }
    }
});

var dog = new Dog({legs: {num: 4}, tail: {name: 'waggy'}});
var legs = dog.get('legs').get('num');
var tail = dog.get('tail').get('name');
alert('Legs / tail name: '+ legs + ' / ' + tail);
{% endhighlight %}

### toJSON ()

Like [Model.toJSON](/composer.js/docs/model#tojson), this function serializes
the data contained in the model into objects/arrays. However, this function also
aggregates the serialized results from all its sub-objects:

{% highlight js %}
var MyModel = Composer.RelationalModel.extend({
    relations: {
        friends: { collection: Composer.Collection }
    }
});
var model = new MyModel({
    friends: [{name: 'larry'}, {name: 'curly'}, {name: 'moe'}]
});

var serialized = model.toJSON();
alert('Second friend: '+ serialized.friends[1].name);
{% endhighlight %}

### set (data, options)

Set, like [Model.set](/composer.js/docs/model#set), sets data into the
relational model, but is also responsible for turning the nested data into your
object hierarchy.

While its funcationality is the same as `Model.set`, it's worth mentioning that
this function does most of the magic.


