---
title: Build awesome apps
layout: home
---

<div class="intro">
    <strong>Composer is a set of stackable libraries for building complex single-page apps.</strong>

    <div class="button-row">
        <div class="button download min">
            <a href="composer.min.js" download="composer-{{ site.version }}.min.js">
                <h2>composer-{{ site.version }}.min.js</h2>
            </a>
        </div>
        <div class="button download dev">
            <a href="composer.js" download="composer-{{ site.version }}.js">
                <h2>composer-{{ site.version }}.js (dev)</h2>
            </a>
        </div>
    </div>
</div>

<div class="features">
    <ul>
        <li>
            <h3><a href="docs/xdom">DOM patching</a></h3>
            Only renders the parts of your templates that have changed,
            batching updates for efficiency.
        </li>
        <li>
            <h3><a href="docs/listcontroller">List tracking</a></h3>
            Mirrors a set of elements in the DOM from models in a collection,
            preserving sort order.
        </li>
        <li>
            <h3><a href="docs/event">Eventing</a></h3>
            Loosely tie your app's systems together using the independent
            eventing module.
        </li>
        <li>
            <h3><a href="docs/util#composer-promisify">Promise integration</a></h3>
            Include your favorite promise library, call one function, and
            all async functions return promises.
        </li>
        <li>
            <h3><a href="docs/router">Router</a></h3>
            Easily segment portions of your app by URL. Automatically route
            links in your app.
        </li>
        <li>
            <h3><a href="docs/filtercollection">Filtered collections</a></h3>
            Create collections that attach to other collections and apply
            filters and sorting.
        </li>
        <li>
            <h3><a href="docs/class">Class system</a></h3>
            Use the tiny base class system for making your own extendable
            modules.
        </li>
        <li>
            <h3><a href="docs/class#composer-merge-extend">Controller event merging</a></h3>
            Controllers inherit DOM event tracking from the controller they
            extend.
        </li>
        <li>
            <h3><a href="docs/">Documentation</a></h3>
            Easy to understand docs with lots of runnable examples make learning
            Composer easy.
        </li>
    </ul>
</div>

Composer is framework-agnostic: it does not require jQuery, Mootools, or any other
framework to function (however, to support older versions of IE, Mootools is
reccommended). As of version 1.1.0, Composer's only external dependency is 
[History.js](https://github.com/browserstate/history.js/) (and as of 1.2.0,
Composer uses [morhpdom](https://github.com/patrick-steele-idem/morphdom)
for its optional [xdom feature](docs/controller#xdom)).

For the curious, read about [the differences between Composer and Backbone](pages/comparison).

Also see [apps using Composer in production &raquo;](pages/apps)

## Dependencies

Composer's [router](docs/router) requires [History.js](https://github.com/browserstate/history.js/)
to function properly. Composer's [xdom system](docs/controller#dom)
requires some form of DOM diffing/patching library
([morphdom](https://github.com/patrick-steele-idem/morphdom) is the supported
default, although you can [provide your own](docs/xdom#composer-xdom-hooks)).

## Browser support

Composer is tested on recent versions of Firefox, Chrome, Safari, and IE >= 6.
Note that IE 6-9 support *is dependent on Mootools being present* (and will not
necessarily be supported in the future). For now, all tests pass in all major
browsers.

<a href="test" target="_blank">Run the test suite now!</a>

