require('raf.js');
Object.assign = require('object-assign');

module.exports = require('./src/objectspy');

if(typeof window !== "undefined" && window !== null)
  window.Objectspy = module.exports;
