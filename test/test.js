'use strict';

const co = require('co');
const on = require('..');
const EE = require('events');

const expect = require('chai').expect;

describe('promonce', () => {
  describe('once', () => {
    it('should resolve event', () => {
      return co(function * () {
        const ee = new EE();
        const data = { data: 'test' };
        setImmediate(() => ee.emit('event', data));

        var event = yield on(ee, 'event');
        expect(event).to.be.equal(data);
        expect(ee.listeners('event')).to.have.length(0);
      });
    });

    it('should return same unresolved promise', () => {
      return co(function * () {
        const ee = new EE();
        const data = { data: 'test' };
        const event1 = on(ee, 'event');
        const event2 = on(ee, 'event');
        expect(event1).to.equal(event2);

        setImmediate(() => ee.emit('event', data));
        const result = yield event1;
        expect(result).to.be.equal(data);
        expect(ee.listeners('event')).to.have.length(0);
      });
    });

    it('should return new promise if previous is resolved', () => {
      return co(function * () {
        const ee = new EE();
        const data = { data: 'test' };
        const event1 = on(ee, 'event');
        setImmediate(() => ee.emit('event', data));
        yield event1;

        const event2 = on(ee, 'event');
        expect(event1).to.not.equal(event2);
        setImmediate(() => ee.emit('event', data));
        yield event2;

        expect(ee.listeners('event')).to.have.length(0);
      });
    });

    it('should throw an error if has chaught listener', () => {
      return co(function * () {
        const ee = new EE();
        const data = { data: 'test' };
        setImmediate(() => ee.emit('error', data));
        const event = on(ee, 'event', 'error');
        try {
          var result = yield event;
        } catch (e) {
          var error = e;
        }

        expect(error).to.equal(data);
        expect(result).to.equal(undefined);
        expect(ee.listeners('event')).to.have.length(0);
        expect(ee.listeners('error')).to.have.length(0);
      });
    });

    it('should return different promises for different chaught listeners', () => {
      return co(function * () {
        const ee = new EE();
        const data = { data: 'test' };
        setImmediate(() => ee.emit('error1', data));
        setImmediate(() => ee.emit('error2', data));
        const event1 = on(ee, 'event', 'error1');
        const event2 = on(ee, 'event', 'error2');
        expect(event1).to.not.equal(event2);
        try {
          var result = yield event1;
        } catch (e) {
          var error1 = e;
          try {
            result = yield event2;
          } catch (e) {
            var error2 = e;
          }
        }

        expect(error1).to.equal(data);
        expect(error1).to.equal(error2);
        expect(result).to.equal(undefined);
        expect(ee.listeners('event')).to.have.length(0);
        expect(ee.listeners('event1')).to.have.length(0);
        expect(ee.listeners('event2')).to.have.length(0);
      });
    });
  });

  describe('queue', () => {
    it('should not miss events in queue mode', () => {
      return co(function * () {
        const ee = new EE();
        const data = { data: 'test' };
        const events = [];
        const unqueue = on.queue(ee, 'event');

        setImmediate(() => {ee.emit('event', 1)});
        setImmediate(() => {ee.emit('event', 2)});
        setImmediate(() => {ee.emit('event', 3)});
        setImmediate(() => {ee.emit('event', 4)});

        let event;
        while (event = yield unqueue()) {
          yield new Promise(resolve => setImmediate(resolve));
          if (events.push(event) === 4) break;
        }

        expect(events).to.deep.equal([1, 2, 3, 4]);
      });
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
});
