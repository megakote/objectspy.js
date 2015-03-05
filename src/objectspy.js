/* jshint esnext: true, strict: true */

(function () {
  'use strict';

  let GC_INTERVAL = 5;

  var Emmiter = require('events').EventEmitter;
  var UtilsStore = {}, no = 0;

  var iterator = function(object, callback) {
    for (var key in object)
      if (object.hasOwnProperty(key))
        callback(key, object[key]);
   };

  module.exports = class Objectspy {
    constructor(state, callback, params) {
      params = typeof callback === 'object' ? callback : params;
      callback = callback instanceof Function ? callback : params.callback;

      this._no = no++;
      this.utils();

      if (typeof callback !== 'undefined' )
        this.utils('emmiter').on('onchange', callback);

      if (params && params.gc)
        this.utils('gc_id', setInterval(this.utils('gc'), GC_INTERVAL * 1000));

      this.set('', state);
     }

    utils(key, val) {
      if (typeof UtilsStore[this._no] === 'undefined')
        UtilsStore[this._no] = {
          gc_id: false,
          loop_id: false,
          changes: {},
          emmiter: new Emmiter(),
          gc: this.gc.bind(this),
          loop: this.loop.bind(this),
         };

      if (typeof val !== 'undefined')
        UtilsStore[this._no][key] = val;

      return key ? UtilsStore[this._no][key] : UtilsStore[this._no];
     }

    destructor() {
      clearInterval(this.utils('gc_id'));
      cancelAnimationFrame(this.utils('loop_id'));
      delete(UtilsStore[this._no]);
     }

    on(event, fn) {
      this.utils('emmiter').addListener(event, fn);
     }

    off(event, fn) {
      this.utils('emmiter').removeListener(event, fn);
     }

    // ['block.index', 'block.index.debug', 'block.index.url'] => ['block.index']
    __getChanges() {
      var changes = [], triger, raw_changes = Object.keys(this.utils('changes'));
      raw_changes.push('onchange');
      raw_changes.sort();

      for (var i = 0, ii = raw_changes.length; i < ii; i++) {
        if (typeof raw_changes[i] === 'undefined')
          continue;

        triger = false;

        for (var n = 0; n < ii; n++) {
          if (n == i || typeof raw_changes[n] === 'undefined')
            continue;

          if (raw_changes[n].indexOf(raw_changes[i]) === 0 && (triger = true))
            raw_changes[n] = undefined;
         }

        if (triger)
          changes.push(raw_changes[i]);
       }

      return changes;
     }

    // compare emmiter._events <==> changes: block.index block.index.debug <==> block.index
    loop() {
      var changes = this.__getChanges(), ii = changes.length;
      var emmiter = this.utils('emmiter');

      iterator(emmiter._events, (event, fn) => {
        for (var i = 0; i < ii; i++)
          if (changes[i].indexOf(event) === 0 || event.indexOf(changes[i]) === 0) {
            emmiter.emit(event, this, event, changes[i]);
            break;
           }
       });

      this.utils('changes', {});
     }

    gc() {
      var events = Object.keys(this.utils('emmiter')._events);

      var callback = (key, item, path) => {
        if (key.indexOf('_') === 0)
          return;

        path = (path ? path + '.' : '') + key;

        var listened = false,
            listened_strict = false;

        for (var i = 0, ii = events.length; i < ii; i++) {
          if (events[i] === path && (listened_strict = true))
            break;
          else if (events[i].indexOf(path) === 0)
            listened = true;
         }

        if (listened_strict)
          return;
        else if (listened)
          iterator(item, (key, item) => { callback(key, item, path); });
        else {
          console.warn('GC: ' + path + ' ->', item);
          this.del(path, true);
         }
       };

      iterator(this, (key, item) => callback(key, this[key], ''));
     }

    get(path) {
      if (!(path.length) || !(path = path.split('.')))
        return this;

      for (var i = 0, l = path.length, result = this; i < l; i++)
        if (typeof (result = result[path[i]]) == 'undefined')
          return undefined;

      return result;
     }

    set(path, val, silent_mode) {
      if (!path) path = '';

      if (!silent_mode) {
        this.utils('changes')[path] = true;
        cancelAnimationFrame(this.utils('loop_id'));
       }

      if (!(path.length) || !(path = path.split('.')))
        Object.assign(this, val);
      else
        for (var i = 0, n = path.length, result = this; i < n && result !== undefined; i++) {
          var field = path[i];

          if (i === n - 1) {
            if (typeof val === 'undefined')
              delete(result[field]);
            else if (typeof result[field] === 'object')
              result[field] = val;
            else if (result[field] != val)
              result[field] = val;
           }
          else if (typeof result[field] === 'undefined') {
            result[field] = {};
           }

          result = result[field];
         }

      if (!silent_mode)
        this.utils('loop_id', requestAnimationFrame(this.utils('loop')));

      return this;
     }

    del(path, silent_mode) {
      this.set(path, undefined, silent_mode);
    }
   };

 })();