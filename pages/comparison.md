---
title: Framework comparison
layout: default
---

# Framework comparison

Obviously, we're going to be biased, but here's a quick comparison between
Composer and a few other projects.

<table>
    <tr>
        <th>Feature</th>
        <th>Composer.js</th>
        <th>Backbone.js</th>
    </tr>
    <tr>
        <td>Supports modules</td>
        <td>Yes</td>
        <td>Yes</td>
    </tr>
    <tr>
        <td>Dependencies</td>
        <td>jQuery or Mootools, History.js</td>
        <td>jQuery or Zepto, underscore.js</td>
    </tr>
    <tr>
        <td>Models can exist in multiple collections</td>
        <td>Yes</td>
        <td>Sort of</td>
    </tr>
    <tr>
        <td>Ships with a generic class system</td>
        <td><a href="/composer.js/docs/class">Yes</a></td>
        <td>No</td>
    </tr>
    <tr>
        <td>Provides hierarchical data relationships</td>
        <td><a href="/composer.js/docs/relational">Yes</a></td>
        <td><a href="http://backbonerelational.org/">As a module</a></td>
    </tr>
    <tr>
        <td>Provides filtered collections</td>
        <td><a href="/composer.js/docs/filtercollection">Yes</a></td>
        <td>No</td>
    </tr>
    <tr>
        <td>Provides AJAX API syncing out of the box</td>
        <td><a href="/composer.js/docs/util#composer-sync">Sort of</a></td>
        <td>Yes</td>
    </tr>
    <tr>
        <td>Allows granular silencing of specific events</td>
        <td><a href="/composer.js/docs/event#silencing">Yes</a></td>
        <td>No</td>
    </tr>
    <tr>
        <td>Supports using promises for async operations</td>
        <td><a href="/composer.js/docs/util#composer-promisify">Yes, via Bluebird et al</a></td>
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
        <td><a href="/composer.js/docs/router#bind-links">Yes</a></td>
        <td>No</td>
    </tr>
    <tr>
        <td>Comes with history management</td>
        <td>Requires <a href="https://github.com/browserstate/history.js/">History.js</a></td>
        <td>Requires jQuery</td>
    </tr>
    <tr>
        <td>Supports event binding contexts</td>
        <td><a href="http://lyonbros.github.io/composer.js/docs/event#bind">Yes, string-based</a></td>
        <td>Yes, object-based</td>
    </tr>
    <tr>
        <td>Provides Controller event inheritance</td>
        <td><a href="/composer.js/docs/class#composer-merge-extend">Yes</a></td>
        <td>No</td>
    </tr>
    <tr>
        <td>Supports IE 6+</td>
        <td>Yes (when using Mootools)</td>
        <td>No</td>
    </tr>
</table>

This list is not exhaustive. For instance, the relational models that Composer
and Backbone use are fairly different in the way they handle data (Backbone
forces one-instance-many-locations, Composer favors many-instances). There are
also utility functions in models/collections that one framework provides that
the other doesn't and vice versa.

The best way to get a good feeling for Composer's abilities is to
<a href="/composer.js/docs">read the docs</a>.

