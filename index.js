'use strict';

function STORE(container, target, fallback) {
  const store = container.get(target) || fallback || new Map();
  container.set(target, store);
  return store;
}

function QUEUE(container, target, pair) {
  const store = STORE(container, target);
  const queue = STORE(store, pair, []);
  return queue;
}

function PAIR(container, target) {
  const store = STORE(container, target);
  return function (event, error) {
    const EVENT = STORE(store, event);
    const ERROR = STORE(EVENT, error, [event, error]);
    return ERROR;
  }
}

function instantiate(queuing) {
  queuing = queuing || false;

  const pairs = new Map();
  const queues = new Map();
  const cleanups = new WeakMap();
  const cleanup = promise => cleanups.get(promise);

  const call = Function.call.call.bind(Function.call);
  const clean = promise => (promise && cleanup(promise).map(call), promise);

  const on = Function.bind.apply(function(target, event, error) {
    const pair = PAIR(pairs, target)(event, error);
    const once = Function.call.bind(on.once, target);
    const off = Function.call.bind(on.off, target);

    const next = $ => {
      const clean = $ => actions.map(call);
      const actions = [];
      const promise = new Promise((resolve, reject) => {
        const onevent = $ => (keep(event), clean(), resolve($));
        once(event, onevent);
        actions.push($ => off(event, onevent));

        if (error == null) return;

        const onerror = $ => (keep(error), clean(), reject($));
        once(error, onerror);
        actions.push($ => off(error, onerror));
      });
      cleanups.set(promise, actions);
      return promise;
    };

    const pick = $ => clean(queue.shift());
    const keep = $ => queuing && queue.push(next());

    const queue = QUEUE(queues, target, pair);
    if (queue.length) return queuing ? pick() : queue[0];
    if (queuing) return next();

    const promise = next();
    queue.push(promise);

    cleanup(promise).push(pick);
    return promise;
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
