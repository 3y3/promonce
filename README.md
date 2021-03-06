# Promonce
Promisification of EventEmitter.once


##API
```js
on(target, event, [error])
```
- **target** - EventEmitter based object.
- **event** - A name of event which you want to listen on.
- **error** - A name of error event. `on` will be rejected when this event fired.


##Usage
###ES6 example
- simple `once` alternative
```js
const on = require('promonce');
const net = require('net');

const connection = net.createConnection(5858);
on(connection, 'connect').then(console.log);
```
- debounced `on` alternative
```js
const co = require('co');
const on = require('promonce');
const get = require('net').get;

function yandex() {
  return co(function * () {
    const response = yield on(get('ya.ru'), 'response', 'error');
    const data = '';

    // there an event is debounced
    // you will not listen on new one while processing current
    while (yield on(response, 'readable')) {
      const chunk = response.read();
      if (chunk) data += chunk;
      else break;
    }

    return data;
  })
}
```
- custom `on` event
```js
const co = require('co');
const on = require('promonce');
const get = require('net').get;

function yandex() {
  return co(function * () {
    const response = yield on(get('ya.ru'), 'response', 'error');
    const queue = on.queue();
    const data = '';

    // there an event is debounced
    // you will not listen on new one while processing current
    while (yield queue(response, 'readable')) {
      const chunk = response.read();
      if (chunk) data += chunk;
      else break queue.clean();
    }

    return data;
  });
}
```

###ES7 example
```js
const on = require('promonce');
const get = require('net').get;

async function yandex() {
  const response = await on(get('ya.ru'), 'response', 'error');
  let data = '';

  while (await on(response, 'readable')) {
    const chunk = response.read();
    if (chunk) data += chunk;
    else break;
  }

  return data;
}
```
