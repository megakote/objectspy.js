// import test from 'tape';
const test = require('tape')
const Objectspy = require('../lib/objectspy.js')

// polyfill
global.cancelAnimationFrame = id => clearTimeout(id);
global.requestAnimationFrame = callback => setTimeout(callback, 1);

const initial_state = { foo: 1, bar: 2 }

test('Empty construct', (assert) => {
  assert.plan(1)

  const state = new Objectspy()
  assert.deepEqual(state.get(), {})
})


test('Construct with state', (assert) => {
  assert.plan(1)

  const state = new Objectspy(initial_state)
  assert.deepEqual(state.get(), initial_state)
})


test('Update some state', (assert) => {
  assert.plan(1)

  const state = new Objectspy(initial_state);
  state.set('foo', 2)
  assert.deepEqual(state.get(), Object.assign({}, initial_state , { foo: 2 }))
})


test('Delete some state', (assert) => {
  assert.plan(1)

  const state = new Objectspy(initial_state);
  state.del('foo')

  const expected_result = Object.assign({}, initial_state, {foo: null})
  delete(expected_result.foo)

  assert.deepEqual(state.get(), expected_result)
})


test('Add onchange callback', (assert) => {
  assert.plan(2)

  const state = new Objectspy(initial_state)

  let n = 0
  state.on('onchange', () => n++)

  // async call && requestAnimationFrame
  setTimeout(() => {
    state.set('foo', 2)
    assert.equal(n, 0)
    setTimeout(() => assert.equal(n, 1), 10) // only async callback execeution
  }, 10)
})


test('Remove onchange callback', (assert) => {
  assert.plan(1);
  const state = new Objectspy(initial_state)

  let n = 0
  const callback = () => n++
  state.on('onchange', callback)

  state.set('foo', 2)

  setTimeout(() => {
    state.off('onchange', callback)
    state.set('foo', 3)
    setTimeout(() => assert.equal(n, 1), 10)
  })
})


test('Update without onchange callback (silent mode)', (assert) => {
  assert.plan(1);
  const state = new Objectspy(initial_state)
  let n = 0
  state.on('onchange', () => n++)
  state.set('foo', 2, true)
  setTimeout(() => assert.equal(n, 0), 20)
})


test('Add path callback', (assert) => {
  assert.plan(1);
  const state = new Objectspy(initial_state)

  let n = 0
  state.on('foo', () => n++)

  state.set('foo', 2)
  state.set('bar', 2)
  setTimeout(() => assert.equal(n, 1), 10)
})

test('Add null callback', (assert) => {
  assert.plan(1);
  const state = new Objectspy(initial_state)

  let n = 0
  state.on(null, () => n++)

  state.set('foo', 2)
  state.set('bar', 2)
  state.set(null, 3)
  state.set(null, {foo: 3})

  setTimeout(() => assert.equal(n, 0), 10)
})


test('Remove path callback', (assert) => {
  assert.plan(1);
  const state = new Objectspy(initial_state)
  let n = 0
  const callback = () => n++
  state.on('foo', callback)

  state.set('foo', 1)

  setTimeout(() => {
    state.off('foo', callback)
    state.set('foo', 2)
    setTimeout(() => assert.equal(n, 1), 10)
  })
})


test('Update without path callback (silent mode)', (assert) => {
  assert.plan(1)
  const state = new Objectspy(initial_state)
  let n = 0

  state.on('foo', () => n++)
  state.set('foo', 2, true)
  setTimeout(() => assert.equal(n, 0), 20)
})


test('GC', (assert) => {
  assert.plan(1)

  const state = new Objectspy(initial_state, { gc: true, gc_interval: 1 })
  state.on('foo', () => {})

  const expected_result = Object.assign({}, initial_state)
  delete(expected_result.bar)

  setTimeout(() => {
    assert.deepEqual(state.get(), expected_result)
    state.destructor()
  }, 1500)
})
