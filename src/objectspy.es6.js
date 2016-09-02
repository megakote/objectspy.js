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
    delete(this.emmiter)
  }

  is_valid_key(path) {
    return typeof path !== 'undefined' && path !== null ? path : undefined
  }

  get(path) {
    if (!path || !(path.length) || !(path = path.split('.'))) return this.state

    for (var i = 0, l = path.length, result = this.state; i < l; i++)
      if (typeof (result = result[path[i]]) === 'undefined')
        return

    return result
  }

  fire(path) {
    this.changes[path] = true
    cancelAnimationFrame(this._loop)
    this._loop = requestAnimationFrame(() => this.loop())
  }

  loop() {
    const events = this.emmiter ? Object.keys(this.emmiter._events) : []
    const raw_changes = this.changes ? Object.keys(this.changes) : []

    if (!events || !raw_changes) return

    this.changes = {}
    raw_changes.sort()

    for (var i = 0, changes = [], n = raw_changes.length - 1, current, next; i <= n; i++) {
      current = raw_changes[i]
      changes.push(current)

      if (current === '') i = n

      // skip similar path
      while((next = raw_changes[i + 1])) {
        if (typeof next.indexOf === 'undefined' || next.indexOf(current + '.') !== 0) break
        i++
      }
    }

    if (!changes) return

    this.emmiter.emit('onchange', this.get(''), this, changes[i], '')

    for (var l = 0, m = events.length - 1, path; l <= m; l++) {
      path = events[l]
      for (var i = 0, n = changes.length - 1; i <= n; i++) {

        if (changes[i].indexOf(path) !== 0 && path.indexOf(changes[i]) !== 0) continue
        this.emmiter.emit(path, this.get(path), this, changes[i], path)
        break
      }
    }
  }

  gc() {
    const events = Object.keys(this.emmiter._events)

    var iterator = (object, callback) => {
      for (var key in object)
        if (object.hasOwnProperty(key))
          callback(key, object[key])
     }

    var callback = (key, item, path) => {
      if (key.indexOf('_') === 0) return

      path = (path ? path + '.' : '') + key

      for (var i = 0, n = events.length, listened, listened_strict; i < n; i++) {
        if (events[i] === path || path.indexOf(events[i]) === 0) return
        if (events[i].indexOf(path) === 0) listened = true
      }

      if (listened)
        iterator(item, (key, item) => callback(key, item, path))
      else
        this.del(path, false)
    }


    iterator(this.state, (key, item) => callback(key, item, ''))
  }

  set(path, value, silent = false) {
    if (typeof (path = this.is_valid_key(path)) === 'undefined') return
    const original_path = path

    if (!(path.length) || !(path = path.split('.'))) {
      Object.assign(this.state, value)
      if (!silent) this.fire(original_path)
      return this
    }

    for (var i = 0, n = path.length - 1, result = this.state, field, is_write = false; i <= n && result !== undefined; i++) {
      field = path[i]

      if (i !== n) {
        result = result[field] = result[field] || {}
        continue
      }

      if (typeof value === 'undefined' && (is_write = true)) // delete element
        delete(result[field])
      else if (typeof result[field] === 'object' && (is_write = true)) // overwrite { } w/o compare
        result[field] = value
      else if (result[field] !== value && (is_write = true)) // write plain object w compare
        result[field] = value
    }

    if (!silent && is_write) this.fire(original_path)
    return this
  }

  del(path, silent = false){
    return this.set(path, undefined, silent)
  }

  on(path, handler) {
    if (typeof (path = this.is_valid_key(path)) === 'undefined') return
    this.emmiter.addListener(path, handler)
  }

  off(path, handler) {
    if (typeof (path = this.is_valid_key(path)) === 'undefined') return
    this.emmiter.removeListener(path, handler)
  }
}

export default Objectspy
