---
title: Build awesome apps
layout: home
---

<div class="intro">
    <strong>Composer is a set of stackable libraries for building complex single-page apps.</strong>

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

Composer is a set of stackable libraries that follow the MVC pattern, providing
a means to organize and scale complex single-page applications. On top of normal
MVC, Composer provides

- [An independent eventing module](/composer.js/docs/event) to encourage loose
coupling between components.
- [An efficient DOM diffing/patching/batching system](/composer.js/docs/controller#xdom)
that lets you re-render your views often and without having to worry about
losing form state or making incremental DOM updates.
- [A simple routing system](/composer.js/docs/router) that lets you segment
portions of your app by URL. It also has the ability to bind links in your pages
and automatically route them correctly (without breaking ctrl/command+click like
many others).
- [Simple collection tracking](/composer.js/docs/listcontroller) which monitors
your collections and updates your view accordingly.
- [Filtered collections](/composer.js/docs/filtercollection) that act as views
into your data based on arbitrary filters and sorting.
- [First-class Promise integration](/composer.js/docs/util#composer-promisify)
that makes asynchronous programming much simpler.
- [A tiny base class system](/composer.js/docs/class) for making your own
extendable modules.
- [Controller event extension merging](/composer.js/docs/class#composer-merge-extend)
so child Controllers can inherit DOM event tracking from parent Controllers.
- [In-depth and understandable documentation](/composer.js/docs) with lots of
runnable examples sprinkled in.

Composer is framework-agnostic: it does not require jQuery, Mootools, or any other
framework to function (however, to support older versions of IE, Mootools is
reccommended). As of version 1.1.0, Composer's only external dependency is 
[History.js](https://github.com/browserstate/history.js/) (and as of 1.2.0,
Composer *suggests* [morhpdom](https://github.com/patrick-steele-idem/morphdom)
for its [XDOM feature](/composer.js/docs/controller/#xdom).

For the curious, read about [the differences between Composer and Backbone](/composer.js/pages/comparison).

Also see [apps using Composer in production &raquo;](/composer.js/pages/apps)

## Dependencies

Composer's [router](/composer.js/docs/router) requires [History.js](https://github.com/browserstate/history.js/)
to function properly. Composer's [XDOM system](/composer.js/docs/controller#dom)
requires some form of DOM diffing/patching library
([morphdom](https://github.com/patrick-steele-idem/morphdom) is the supported
default, although you can [provide your own](/composer.js/docs/controller#composer-xdom-hooks)).

## Browser support

Composer is tested on recent versions of Firefox, Chrome, Safari, and IE >= 6.
Note that IE 6-9 support *is dependent on Mootools being present* (and will not
necessarily be supported in the future). For now, all tests pass in all major
browsers.

<a href="/composer.js/test" target="_blank">Run the test suite now!</a>

