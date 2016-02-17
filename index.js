'use strict';

function get(container, target, event) {
  const store = container.get(target) || {};
  if (event == null) return store;
  return store[event] || [];
}

function set(container, target, event, queue) {
  const store = container.get(target) || {};

  if (typeof event == 'object') store = event;
  else store[event] = queue || [];

  container.set(target, store);
}

function instantiate(queuing) {
  queuing = queuing || false;

  const onces = new Map();
  const thrownes = new Map();
  const callbacks = new WeakMap();

  const call = Function.call.call.bind(Function.call);
  const clean = promise => (call(callbacks.get(promise)), promise);

  const on = Function.bind.apply(function(target, event, error) {
    const container = error == null ? onces : thrownes;

    const once = Function.call.bind(on.once, target);
    const off = Function.call.bind(on.off, target);

    const promise = () => {
      const cleans = [];
      const clean = $ => cleans.map(call);
      const promise = new Promise((resolve, reject) => {
        once(event, $ => (keep(event), clean(), resolve($)));
        cleans.push($ => off(event, resolve));

        if (error == null) return;

        once(error, $ => (keep(event), clean(), reject($)));
        cleans.push($ => off(error, reject));
      });

      callbacks.set(promise, clean);
      return promise;
    };

    const queue = get(container, target, event);
    const pick = event => clean(queue.shift());
    const keep = event => (queuing && queue.push(promise()));

    if (queue.length) return pick(event);
    set(container, target, event, queue);

    return promise();
  }, arguments);

  on.clean = function() {
    callbacks.values.map(call);
  };

  on.queue = function() {
      const args = Array.prototype.concat.apply([true], arguments);
      return instantiate.apply(null, args);
  };

  on.instantiate = instantiate;
  on.once = require('events').prototype.once;
  on.off = require('events').prototype.removeListener;

  return on;
}


module.exports = instantiate();
