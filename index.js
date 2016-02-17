'use strict';

function get(container, target, event) {
  const store = container.get(target) || {};
  if (event == null) return store;
  return store[event] || [];
}

function set(container, target, event, queue) {
  const store = container.get(target) || {};

  store[event] = queue || [];

  container.set(target, store);
}

function PAIR(container, target) {
  const store = container.get(target) || new Map();
  container.set(store);
  return function (event, error) {
    const EVENT = store.get(event) || new Map();
    store.set(EVENT);

    const ERROR = EVENT.get(error) || [event, error];
    EVENT.set(ERROR);
    return ERROR;
  }
}

function instantiate(queuing) {
  queuing = queuing || false;

  const pairs = new Map();
  const queues = new Map();
  const callbacks = new WeakMap();

  const call = Function.call.call.bind(Function.call);
  const clean = promise => (call(callbacks.get(promise)), promise);

  const on = Function.bind.apply(function(target, event, error) {
    const pair = PAIR(pairs, target)(event, error);
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

    const queue = get(queues, target, pair);
    const pick = $ => clean(queue.shift());
    const keep = $ => queuing && queue.push(promise());

    if (queue.length) return pick(event);
    set(queues, target, pair, queue);

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
