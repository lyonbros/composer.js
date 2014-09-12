---
title: Framework comparison
layout: default
---

# Framework comparison

Obviously, we're going to be biased, but here's a quick comparison between
Composer and a few other projects.

<table>
    <tr>
        <th></th>
        <th>Composer.js</th>
        <th>Backbone.js</th>
    </tr>
    <tr>
        <td>Supports modules</td>
        <td>Yes</td>
        <td>Yes</td>
    </tr>
    <tr>
        <td>Models can exist in multiple collections</td>
        <td>Yes</td>
        <td>No</td>
    </tr>
    <tr>
        <td>Ships with a generic class system</td>
        <td>[Yes](/composer.js/docs/class)</td>
        <td>No</td>
    </tr>
    <tr>
        <td>Ships with relational data handline</td>
        <td>[Yes](/composer.js/docs/relational)</td>
        <td>No, but has an easy module</td>
    </tr>
    <tr>
        <td>Supports AJAX API syncing out of the box</td>
        <td>[Sort of](/composer.js/docs/util#composer-sync)</td>
        <td>Yes</td>
    </tr>
    <tr>
        <td>Allows granular silencing of specific events</td>
        <td>[Yes](/composer.js/docs/event#silencing)</td>
        <td>No</td>
    </tr>
    <tr>
        <td>Supports promises for async operations</td>
        <td>[Yes, works with Bluebird et al](/composer.js/docs/util#composer-promisify)</td>
        <td>Yes (via jQuery promises)</td>
    </tr>
    <tr>
        <td>"View" or "Controller"?</td>
        <td>Controller</td>
        <td>View</td>
    </tr>
    <tr>
        <td>Router supports named parameters</td>
        <td>No (regex only)</td>
        <td>Yes</td>
    </tr>
    <tr>
        <td>Router supports automatic link binding</td>
        <td>[Yes](/composer.js/docs/router#bind-links)</td>
        <td>No</td>
    </tr>
    <tr>
        <td>Comes with history management</td>
        <td>No (requires [History.js](https://github.com/browserstate/history.js/))</td>
        <td>Yes</td>
    </tr>
    <tr>
        <td>Supports out-of-the-box Controller event inheritance</td>
        <td>[Yes](/composer.js/docs/class#composer-merge-extend)</td>
        <td>No</td>
    </tr>
</table>

This list is not exhaustive. For instance, the relational models that Composer
and Backbone use are fairly different in the way they handle data (Backbone
favors one-instance-many-locations, Composer favors many-instances). There are
also utility functions in models/collections that one framework provides that
the other doesn't.

The best way to get a good feeling for Composer's abilities is to [read the docs](/composer.js/docs).

Keep in mind also that Backbone is highly capable and can be extended in many
ways to make it do what you want, but Composer makes a lot of these things
easier right off the bat and is also just as extendable.

