const test = require('tape')
const Objectspy = require('../src/objectspy.es6.js')

// polyfill
global.cancelAnimationFrame = id => clearTimeout(id);
global.requestAnimationFrame = callback => setTimeout(() => callback(), 1);

const initial_state = { foo: Math.random(), bar: Math.random(), deep: { deep1: Math.random(), deep2: Math.random() } }

test('Empty construct', assert => {
  assert.plan(1)

  const state = new Objectspy()
  assert.deepEqual(state.get(), {})
})


test('Construct with state', assert => {
  assert.plan(1)

  const state = new Objectspy(initial_state)
  assert.deepEqual(state.get(), initial_state)
})


test('Get exist path', assert => {
  assert.plan(1)

  const state = new Objectspy(initial_state)
  assert.deepEqual(state.get('foo'), initial_state.foo)
})


test('Get nested exist path', assert => {
  assert.plan(1)

  const state = new Objectspy(initial_state)
  assert.deepEqual(state.get('deep.deep1'), initial_state.deep.deep1)
})


test('Get no exist path', assert => {
  assert.plan(1)

  const state = new Objectspy(initial_state)
  assert.deepEqual(state.get('__' + Math.random()), undefined)
})


test('Get nested no exist path', assert => {
  assert.plan(1)

  const state = new Objectspy(initial_state)
  assert.deepEqual(state.get('deep.deep1.test'), undefined)
})


test('Update state', assert => {
  assert.plan(1)
  const value = Math.random()
  const state = new Objectspy(initial_state);
  state.set('foo', value)
  assert.deepEqual(state.get(), Object.assign({}, initial_state , { foo: value }))
})


test('Update nested state', assert => {
  assert.plan(1)
  const value = Math.random()
  const state = new Objectspy(initial_state);
  state.set('deep.deep1', value)

  const expected_result = Object.assign({}, initial_state)
  expected_result.deep.deep1 = value

  assert.deepEqual(state.get(), expected_result)
})


test('Delete state', assert => {
  assert.plan(1)

  const state = new Objectspy(initial_state);
  state.del('foo')

  const expected_result = Object.assign({}, initial_state)
  delete(expected_result.foo)

  assert.deepEqual(state.get(), expected_result)
})

test('Delete nested state', assert => {

  assert.plan(1)

  const state = new Objectspy(initial_state);
  state.del('deep.deep1')

  const expected_result = Object.assign({}, initial_state)
  delete(expected_result.deep.deep1)

  assert.deepEqual(state.get(), expected_result)
})


test('Add onchange callback', assert => {
  assert.plan(2)

  const state = new Objectspy(initial_state)

  let n = 0
  state.on('onchange', () => n++)

  // async call && requestAnimationFrame
  setTimeout(() => {
    state.set('foo', Math.random())
    assert.equal(n, 0)
    setTimeout(() => assert.equal(n, 1), 1) // only async callback execeution
  }, 1)
})


test('Remove onchange callback', assert => {
  assert.plan(1);
  const state = new Objectspy(initial_state)

  let n = 0
  const callback = () => n++
  state.on('onchange', callback)

  state.set('foo', Math.random())

  setTimeout(() => {
    state.off('onchange', callback)
    state.set('foo', Math.random())
    setTimeout(() => assert.equal(n, 1), 1)
  }, 1)
})


test('Update w/o run onchange callback (silent mode)', assert => {
  assert.plan(1);
  const state = new Objectspy(initial_state)
  let n = 0
  state.on('onchange', () => n++)
  state.set('foo', Math.random(), true)
  setTimeout(() => assert.equal(n, 0), 20)
})


test('Add path callback', assert => {
  assert.plan(1);
  const state = new Objectspy(initial_state)

  let n = 0
  state.on('foo', () => n++)

  state.set('foo', Math.random())
  state.set('bar', Math.random())
  setTimeout(() => assert.equal(n, 1), 1)
})

test('Add nested path callback', assert => {
  assert.plan(1);
  const state = new Objectspy(initial_state)

  let n = 0
  state.on('deep.deep1', () => n++)

  state.set('deep.deep1', Math.random())
  state.set('deep.deep2', Math.random())

  setTimeout(() => assert.equal(n, 1), 1)
})

test('Prevent callback on set similar value', assert => {
  assert.plan(2);
  const state = new Objectspy(initial_state)

  let n = 0
  const val = Math.random()

  state.on('foo', () => n++)
  state.set('foo', val)

  setTimeout(() => {
    assert.equal(n, 1)
    state.set('foo', val)
    setTimeout(() => assert.equal(n, 1), 1)
  }, 1)
})


test('Add null callback', assert => {
  assert.plan(1);
  const state = new Objectspy(initial_state)

  let n = 0
  state.on(null, () => n++)

  state.set('foo', 2)
  state.set('bar', 2)
  state.set(null, 3)
  state.set(null, {foo: 3})

  setTimeout(() => assert.equal(n, 0), 1)
})


test('Remove path callback', assert => {
  assert.plan(1);
  const state = new Objectspy(initial_state)
  let n = 0
  const callback = () => n++
  state.on('foo', callback)
  state.set('foo', Math.random())

  setTimeout(() => {
    state.off('foo', callback)
    state.set('foo', Math.random())
    setTimeout(() => assert.equal(n, 1), 1)
  }, 1)
})


test('Update w/o call path callback (silent mode)', assert => {
  assert.plan(1)
  const state = new Objectspy(initial_state)
  let n = 0

  state.on('foo', () => n++)
  state.set('foo', Math.random(), true)
  setTimeout(() => assert.equal(n, 0), 1)
})


test('GC', assert => {
  assert.plan(1)

  const state = new Objectspy(initial_state, { gc: true, gc_interval: 1 })
  state.on('foo', () => {})

  setTimeout(() => {
    assert.deepEqual(state.get(), { foo: initial_state.foo })
    state.destructor()
  }, 1001)
})
