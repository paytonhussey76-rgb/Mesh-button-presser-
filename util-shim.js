// Replaces esm.sh's unenv shim for node:util, whose types.isNativeError
// throws instead of working. The import map in index.html points
// "https://esm.sh/node/util.mjs" at this file. We load the real shim under a
// different URL (so the import map does not catch it) and proxy around the
// broken bits.

const REAL = 'https://esm.sh/node/util.mjs?shimbypass=1';

const real = await import(REAL);

function isNativeError(e) {
  return e instanceof Error ||
         Object.prototype.toString.call(e) === '[object Error]';
}

function isAsyncFunction(f) {
  return typeof f === 'function' && f.constructor && f.constructor.name === 'AsyncFunction';
}

function isGeneratorFunction(f) {
  return typeof f === 'function' && f.constructor && f.constructor.name === 'GeneratorFunction';
}

const overrides = {
  isNativeError,
  isAsyncFunction,
  isGeneratorFunction,
  isPromise: (v) => v instanceof Promise,
  isDate: (v) => v instanceof Date,
  isRegExp: (v) => v instanceof RegExp,
  isMap: (v) => v instanceof Map,
  isSet: (v) => v instanceof Set,
  isTypedArray: (v) => ArrayBuffer.isView(v) && !(v instanceof DataView),
  isUint8Array: (v) => v instanceof Uint8Array,
  isArrayBuffer: (v) => v instanceof ArrayBuffer
};

export const types = new Proxy(overrides, {
  get(target, prop) {
    if (prop in target) return target[prop];
    try {
      const v = real.types ? real.types[prop] : undefined;
      if (typeof v === 'function') return v;
    } catch (_) { /* the real shim throws on unimplemented getters */ }
    return () => false;
  },
  has() { return true; }
});

export * from 'https://esm.sh/node/util.mjs?shimbypass=1';

const realDefault = (real && real.default) ? real.default : {};

export default new Proxy(realDefault, {
  get(target, prop) {
    if (prop === 'types') return types;
    return target[prop];
  }
});
