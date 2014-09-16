---
title: Get Composer
layout: home
---

<div class="intro">
    <h1>Composer.js</h1>
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
replacement to handle more complex setups. Read [more on the differences between
Composer and other frameworks](/composer.js/pages/comparison).

Composer is also framework-agnostic: it can run on top of jQuery or MooTools,
allowing you to use it for a range of different projects and setups.

See [apps using Composer in production &raquo;](/composer.js/pages/apps)

## Dependencies

Composer needs a selector library from jQuery or Mootools (Sizzle or Slick).
jQuery or Mootools themselves can also be included. This dependency can be
skipped if you are only using the data-driven portion of Composer (so, anything
but Controllers).

If you plan on using [Composer's Router](/composer.js/docs/router) (which
provides application routing over pushState URL changes), you need to include
[History.js](https://github.com/browserstate/history.js/).

## Browser support

Composer is tested on recent versions of Firefox, Chrome, Safari, and IE >= 6.
Note that IE6 support is somewhat accidental (it was within reach so we did it)
and will not necessarily be supported in the future. For now, all tests pass in
all major browsers.

<a href="/composer.js/test" target="_blank">Run the test suite now!</a>

