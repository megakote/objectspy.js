/* jshint esnext: true, strict: true */

import { EventEmitter } from 'events'

class Objectspy {
  constructor(init_state, props = {}) {
    this.state = {}
    this.changes = {}
    this.emmiter = new EventEmitter()
    this.set('', init_state, true)

    if (props.gc) this._gc = setInterval(() => this.gc(), (props.gc_interval || 30) * 1000)
  }

  destructor() {
    this.emmiter.removeAllListeners()
    clearTimeout(this._gc)
    cancelAnimationFrame(this._loop)
    delete this.emmiter
  }

  is_valid_key(path) {
    let valid = typeof path !== 'undefined' && path !== null ? path : undefined
    if (valid === '*') valid = ''
    if (valid === 'onchange') valid = ''
    return valid
  }

  get(path) {
    if (!path || !(path.length) || !(path = path.split('.'))) return this.state

    for (var i = 0, l = path.length, result = this.state; i < l; i++) {
      result = result[path[i]]
      if (typeof result === 'undefined') return
    }

    return result
  }

  fire(path) {
    this.changes[path] = true
    cancelAnimationFrame(this._loop)
    this._loop = requestAnimationFrame(() => this.loop())
  }

  getchanges() {
    const raw_changes = this.changes ? Object.keys(this.changes) : []
    if (!raw_changes) return

    this.changes = {}
    raw_changes.sort()

    for (var i = 0, changes = [], k = raw_changes.length - 1, current, next; i <= k; i++) {
      current = raw_changes[i]
      changes.push(current)

      if (current === '') break

      // skip similar path
      while((next = raw_changes[i + 1])) {
        if (typeof next.indexOf === 'undefined' || next.indexOf(`${current}.`) !== 0) break
        i++
      }
    }

    return changes
  }

  loop() {
    const events = this.emmiter ? Object.keys(this.emmiter._events) : []
    if (!events) return

    const changes = this.getchanges()
    if (!changes) return

    for (var l = 0, m = events.length - 1, path; l <= m; l++) {
      path = events[l]

      for (var n = 0, o= changes.length - 1; n <= o; n++) {
        if (changes[n].indexOf(path) !== 0 && path.indexOf(changes[n]) !== 0) continue
        this.emmiter.emit(path, this.get(path), this, changes[n], path)
        break
      }
    }
  }

  gc() {
    const events = Object.keys(this.emmiter._events)

    const iterator = (object, callback) => {
      for (var key in object) if (object.hasOwnProperty(key))
        callback(key, object[key])
     }

    const callback = (key, item, path) => {
      if (key.indexOf('_') === 0) return

      path = (path ? path + '.' : '') + key

      for (var i = 0, n = events.length, listened; i < n; i++) {
        if (events[i] === path || path.indexOf(events[i]) === 0) return
        if (events[i].indexOf(path) === 0) listened = true
      }

      if (listened) iterator(item, (key, item) => callback(key, item, path))
      else this.del(path, false)
    }

    iterator(this.state, (key, item) => callback(key, item, ''))
  }

  set(path, value, silent = false) {
    if (typeof (path = this.is_valid_key(path)) === 'undefined') return this
    if (!path.length) return this.setRoot(path, value, silent)

    const split_path = path.split('.')
    let is_write = false
    for (let i = 0, n = split_path.length - 1, result = this.state, field; i <= n && result !== undefined; i++) {
      field = split_path[i]

      if (i !== n) {
        result = result[field] = result[field] || {}
        continue
      }

      if (typeof value === 'undefined' && (is_write = true)) delete result[field]                   // delete element
      else if (typeof result[field] === 'object' && (is_write = true)) result[field] = value        // overwrite { } w/o compare
      else if (result[field] !== value && (is_write = true)) result[field] = value                  // write plain object w compare
    }

    if (!silent && is_write) this.fire(path)
    return this
  }

  setRoot(path, value, silent) {
    if (value) Object.assign(this.state, value)
    else this.state = {}

    if (!silent) this.fire(path)
    return this
  }

  del(path, silent = false) {
    return this.set(path, undefined, silent)
  }

  on(path, handler) {
    return this.event('on', path, handler)
  }

  off(path, handler) {
    return this.event('off', path, handler)
  }

  event(mode, path, handler) {
    if (typeof (path = this.is_valid_key(path)) === 'undefined') return
    if (mode === 'on') this.emmiter.addListener(path, handler)
    if (mode === 'off') this.emmiter.removeListener(path, handler)
  }
}

export default Objectspy
