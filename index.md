---
title: Build awesome apps
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
complex single-page applications. For the curious, read about
[the differences between Composer and Backbone](/composer.js/pages/comparison).

Composer is framework-agnostic: it does not require jQuery, Mootools, or any other
framework to function (however, to support older versions of IE, Mootools is
reccommended). As of version 1.1.0, Composer's only external dependency is 
[History.js](https://github.com/browserstate/history.js/).

See [apps using Composer in production &raquo;](/composer.js/pages/apps)

## Dependencies

Composer's [router](/composer.js/docs/router) requires [History.js](https://github.com/browserstate/history.js/)
to function properly.

## Browser support

Composer is tested on recent versions of Firefox, Chrome, Safari, and IE >= 6.
Note that IE 6-9 support *is dependent on using Mootools* (and will not
necessarily be supported in the future). For now, all tests pass in all major
browsers.

<a href="/composer.js/test" target="_blank">Run the test suite now!</a>

