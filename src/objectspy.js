"use strict";

var UtilsStore = {}, no = 0;

module.exports = class Objectspy {
  constructor(data, onchange) {
    UtilsStore[(this._no = no++)] = {
      _id: false,
      _changes: {},
      _onchange: onchange,
      _loop: this.loop.bind(this),
     };

    this.set('', data);
   }

  destructor() {
    delete(UtilsStore[this._no]);
   }

  loop() {
    var changes = UtilsStore[this._no]._changes;

    for (var key in changes)
      if (changes.hasOwnProperty(key)) {
        UtilsStore[this._no]._onchange(this);
        break;
       }

    changes = {};
   }

  get(path) {
    if (!(path.length) || !(path = path.split('.')))
      return this;

    for (var i = 0, l = path.length, result = this; i < l; i++)
      if (typeof (result = result[path[i]]) == 'undefined')
        return undefined;

    return result;
   }

  set(path, val) {
    UtilsStore[this._no]._changes[path] = true;
    cancelAnimationFrame(UtilsStore[this._no]._id);

    if (!(path.length) || !(path = path.split('.')))
      Object.assign(this, val);
    else
      for (var i = 0, n = path.length, result = this; i < n && result !== undefined; i++) {
        var field = path[i];

        if (i === n - 1) {
          if (result[field] != val)
            result[field] = val;
         }
        else if (typeof result[field] === 'undefined') {
          result[field] = {};
         }

        result = result[field];
       }

    UtilsStore[this._no]._id = requestAnimationFrame(UtilsStore[this._no]._loop);
    return this;
   }
 };
