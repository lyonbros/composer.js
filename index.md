---
title: Get Composer
layout: home
---

<div class="intro">
    <strong>Composer is a library for building complex single-page applications.</strong>

    <div class="button-row">
        <div class="button download min">
            <a href="/composer.js/composer.min.js" download="composer-{{ site.version }}.min.js">
                <h2>composer-{{ site.version }}.min.js</h2>
            </a>
        </div>
        <div class="button download dev">
            <a href="/composer.js/composer.js" download="composer-{{ site.version }}.js">
                <h2>composer-{{ site.version }}.js (dev)</h2>
            </a>
        </div>
    </div>
</div>

Composer is a javascript MVC library that provides a means to organize and scale
complex single-page applications. Composer was built specifically as a [Backbone.js](http://backbonejs.com)
replacement to support Mootools and handle more complex setups. Read
[more on the differences between Composer and Backbone](/composer.js/pages/comparison).

Composer is framework-agnostic: it can run on top of jQuery or MooTools,
allowing you to use it for a range of different projects and setups. Composer.js
is ~12K when minified/gzipped.

See [apps using Composer in production &raquo;](/composer.js/pages/apps)

## Dependencies

Composer requires either [jQuery](http://jquery.com/) or
[Mootools](http://mootools.net) (needed by Composer's [Controller](/composer.js/docs/controller))
as well as [History.js](https://github.com/browserstate/history.js/) (used by
Composer's [Router](/composer.js/docs/router)).

## Browser support

Composer is tested on recent versions of Firefox, Chrome, Safari, and IE >= 6.
Note that IE 6-9 support *is dependent on using Mootools* (and will not
necessarily be supported in the future). For now, all tests pass in all major
browsers.

<a href="/composer.js/test" target="_blank">Run the test suite now!</a>

