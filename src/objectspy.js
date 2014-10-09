"use strict";

function Data(state, callback) {
  if (!(this instanceof Data))
    throw new Error("Data needs to be called with the new keyword");

  var data = this,
      dirty = false,
      requestAnimationFrame = window.requestAnimationFrame       ||
                              window.webkitRequestAnimationFrame ||
                              window.mozRequestAnimationFrame    ||
                              window.oRequestAnimationFrame      ||
                              window.msRequestAnimationFrame     ||
                              function (callback, element) { window.setTimeout(callback, 1000 / 30); };

  var loop = function() {
    if (dirty && !(dirty = false)) callback(data);
    requestAnimationFrame(loop);
   };

  var extend = function(dst, src) {
    for (var p in src)
      dst[p] = src[p];

    return dst;
   };

  data.get = function (path) {
    if ((path.length) && (path = path.split('.')))
      for (var i = 0, l = path.length, result = data; i < l; i++)
        if (typeof (result = result[path[i]]) == 'undefined')
          return undefined;

     return result;
   };

  data.set = function(path, val) {
    if (!(path.length) || !(path = path.split('.')))
      return;

    for (var i = 0, n = path.length, result = data; i < n && result !== undefined; i++) {
      var field = path[i];

      if (i === n - 1) {
        if (result[field] != val && (dirty = true))
          result[field] = val;
       }
      else if (typeof result[field] === 'undefined') {
        result[field] = {};
        result = result[field];
       }
     }

    return this;
  };

  loop();
  return extend(data, state);
 }

 module.exports = Data;