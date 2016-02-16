'use strict';

const onces = new WeakMap();
const thrownes = new WeakMap();

function get(container, target) {
  return container.get(target) || {};
}

function set(container, target, wait) {
  container.set(target, wait || {});
}

function instantiate() {
  function on(target, event, error) {
    const container = error != null ? thrownes : onces;
    const clear = (event) => get(container, target).remove(event);
    const wait = get(container, target);

    if (wait[event]) return wait[event];

    set(container, target, wait);

    const once = Function.call.bind(on.once, target);
    const off = Function.call.bind(on.off, target);

    return wait[event] = new Promise((resolve, reject) => {
      once(event, $ => (clear(error), clear(event), off(error, reject), resolve($)));
      if (error == null) return;
      once(error, $ => (clear(error), clear(event), off(event, resolve), reject($)));
    });
  }

  on.instantiate = instantiate;
  on.once = require('events').once;
  on.off = require('events').removeListener;
}


module.exports = instantiate();
