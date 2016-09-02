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
        if (typeof next.indexOf === 'undefined' || next.indexOf(current + '.') !== 0) break
        i++
      }
    }

    return changes
  }

  loop() {
    let events, changes
    if (!(events = this.emmiter ? Object.keys(this.emmiter._events) : [])) return
    if (!(changes = this.getchanges())) return

    this.emmiter.emit('onchange', this.get(''), this, changes, '')

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

    var iterator = (object, callback) => {
      for (var key in object)
        if (object.hasOwnProperty(key))
          callback(key, object[key])
     }

    var callback = (key, item, path) => {
      if (key.indexOf('_') === 0) return

      path = (path ? path + '.' : '') + key

      for (var i = 0, n = events.length, listened; i < n; i++) {
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
    return this.event('on', path, handler)
  }

  off(path, handler) {
    return this.event('off', path, handler)
  }

  event (mode, path, handler) {
    if (typeof (path = this.is_valid_key(path)) === 'undefined') return
    if (mode === 'on') this.emmiter.addListener(path, handler)
    if (mode === 'off') this.emmiter.removeListener(path, handler)
  }
}

export default Objectspy
