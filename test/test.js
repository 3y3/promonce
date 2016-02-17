'use strict';

const co = require('co');
const on = require('..');
const EE = require('events');

const expect = require('chai').expect;

describe('promonce', () => {
  it('should work in `once` mode', () => {
    return co(function * () {
      const ee = new EE();
      const data = { data: 'test' };
      setImmediate(() => ee.emit('event', data));

      var event = yield on(ee, 'event');
      expect(event).to.be.equal(data);
      expect(ee.listeners('event')).to.have.length(0);
    });
  });

  it('should work in debounced `on` mode', () => {
    return co(function * () {
      const ee = new EE();
      const data = { data: 'test' };
      const events = [];
      setImmediate(() => ee.emit('event', 1));
      setImmediate(() => ee.emit('event', 2));

      let event;
      while (event = yield on(ee, 'event')) {
        setImmediate(() => ee.emit('event', 3));
        if (events.push(event) == 2) break;
      }

      expect(events).to.deep.equal([1, 3]);
    });
  });

  it('should work in queue `on` mode', () => {
    return co(function * () {
      const ee = new EE();
      const data = { data: 'test' };
      const events = [];
      const unqueue = on.queue(ee, 'event');

      setImmediate(() => {ee.emit('event', 1)});
      setImmediate(() => {ee.emit('event', 2)});
      setImmediate(() => {ee.emit('event', 3)});

      let event;
      while (event = yield unqueue()) {
        if (events.push(event) === 3) break;
      }

      expect(events).to.deep.equal([1, 2, 3]);
    });
  });
});
