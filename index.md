---
title: Try Composer
layout: default
---

<div class="download">
    <a href="/composer.js/js/composer.js" download="composer-{{ site.version }}.js">Composer v{{ site.version }}</a>
</div>

<strong>
Composer is a powerful MVC-based framework for building applications in
Javascript.
</strong>

It is designed to allow more complicated setups than can be achieved easily
with frameworks like the excellent Backbone.js. Composer makes no assumptions
about the structure of your data or your architecture; it provides a set of
tools to help you build your app then politely bows out of your way.

Composer.js is currently being used as the driving force of
[Turtl](https://turtl.it) and [Musio](http://musio.com), both being data-driven
apps that run completely in the client.

Composer used to only run on top of Mootools, but as of version 1.0 is now
framework agnostic (jQuery/Mootools can be used interchangeably with Composer).

## Dependencies

Composer needs a selector library from jQuery or Mootools (Sizzle or Slick).
jQuery or Mootools themselves can also be included. This dependency can be
skipped if you are only using the data-driven portion of Composer (so, anything
but Controllers).

If you plan on using [Composer's Router](/composer.js/docs/router) (which
provides an easy way to run code when certain URLs are encountered), you need
[History.js](https://github.com/browserstate/history.js/).

