---
title: Relational model
layout: documentation
---

# Relational model

The relational model extends the [model](/composer.js/docs/model). The idea is
that while a model is great for a single record, sometimes you need hierarchies
in your data, and you need each part of the hierarchy to be a model/collection.
The relational model let's you specify a structure and will automatically
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

var owner_name = band.get('owner').get('name');
var first_member = band.get('members').first().get('name');
alert('Owner: '+ owner_name +' / first member: '+ first_member);
{% endhighlight %}


