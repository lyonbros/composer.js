---
title: Adapter
layout: documentation
---

# Adapter

The Composer DOM adapter creates a common interface over a *minimal* set of
features. These are, by default, provided by the browser natively. However, in
the case of crappy browsers, the adapter also can use the facilities of various
DOM libraries (currently jQuery and Mootools only). It
mainly exists to assist the [Controller](docs/controller) in its
work, but also exposes one or two useful functions you can use in your app that
don't directly wrap DOM libraries.

## Composer.fire_event :: function(element, type, options)

Trigger an event of type `type` on an `element`. Does its best to simulate the
event actually occuring as if the user had done an action in their browser.

`options` can contain the following items:

- `args` - The arguments passed into the `CustomEvent` class if `type` is any
value other than `"click"`.

## Composer.find_parent :: function(selector, element[, stop])

Find the first parent node of `element` that matches the given CSS `selector`.

If, during the recursion, the element being tested == `stop`, then return false.
The idea is that if you know the element you're looking for is not above a
certain element, then don't bother recursing up to the body element.

