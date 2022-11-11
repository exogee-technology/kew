var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/.pnpm/is-obj@1.0.1/node_modules/is-obj/index.js
var require_is_obj = __commonJS({
  "../../node_modules/.pnpm/is-obj@1.0.1/node_modules/is-obj/index.js"(exports, module) {
    "use strict";
    module.exports = function(x) {
      var type = typeof x;
      return x !== null && (type === "object" || type === "function");
    };
  }
});

// ../../node_modules/.pnpm/deep-assign@3.0.0/node_modules/deep-assign/index.js
var require_deep_assign = __commonJS({
  "../../node_modules/.pnpm/deep-assign@3.0.0/node_modules/deep-assign/index.js"(exports, module) {
    "use strict";
    var isObj = require_is_obj();
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;
    function toObject(val) {
      if (val === null || val === void 0) {
        throw new TypeError("Sources cannot be null or undefined");
      }
      return Object(val);
    }
    function assignKey(to, from, key) {
      var val = from[key];
      if (val === void 0 || val === null) {
        return;
      }
      if (hasOwnProperty.call(to, key)) {
        if (to[key] === void 0 || to[key] === null) {
          throw new TypeError("Cannot convert undefined or null to object (" + key + ")");
        }
      }
      if (!hasOwnProperty.call(to, key) || !isObj(val)) {
        to[key] = val;
      } else {
        to[key] = assign(Object(to[key]), from[key]);
      }
    }
    function assign(to, from) {
      if (to === from) {
        return to;
      }
      from = Object(from);
      for (var key in from) {
        if (hasOwnProperty.call(from, key)) {
          assignKey(to, from, key);
        }
      }
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(from);
        for (var i = 0; i < symbols.length; i++) {
          if (propIsEnumerable.call(from, symbols[i])) {
            assignKey(to, from, symbols[i]);
          }
        }
      }
      return to;
    }
    module.exports = function deepAssign(target) {
      target = toObject(target);
      for (var s = 1; s < arguments.length; s++) {
        assign(target, arguments[s]);
      }
      return target;
    };
  }
});

// ../../node_modules/.pnpm/@react-native-async-storage+async-storage@1.15.5/node_modules/@react-native-async-storage/async-storage/lib/module/AsyncStorage.js
var import_deep_assign = __toESM(require_deep_assign());
var mergeLocalStorageItem = (key, value) => {
  const oldValue = window.localStorage.getItem(key);
  const oldObject = JSON.parse(oldValue);
  const newObject = JSON.parse(value);
  const nextValue = JSON.stringify((0, import_deep_assign.default)({}, oldObject, newObject));
  window.localStorage.setItem(key, nextValue);
};
var createPromise = (getValue, callback) => {
  return new Promise((resolve, reject) => {
    try {
      const value = getValue();
      if (callback) {
        callback(null, value);
      }
      resolve(value);
    } catch (err) {
      if (callback) {
        callback(err);
      }
      reject(err);
    }
  });
};
var createPromiseAll = (promises, callback, processResult) => {
  return Promise.all(promises).then((result) => {
    const value = processResult ? processResult(result) : null;
    callback && callback(null, value);
    return Promise.resolve(value);
  }, (errors) => {
    callback && callback(errors);
    return Promise.reject(errors);
  });
};
var AsyncStorage = class {
  static getItem(key, callback) {
    return createPromise(() => {
      return window.localStorage.getItem(key);
    }, callback);
  }
  static setItem(key, value, callback) {
    return createPromise(() => {
      window.localStorage.setItem(key, value);
    }, callback);
  }
  static removeItem(key, callback) {
    return createPromise(() => {
      return window.localStorage.removeItem(key);
    }, callback);
  }
  static mergeItem(key, value, callback) {
    return createPromise(() => {
      mergeLocalStorageItem(key, value);
    }, callback);
  }
  static clear(callback) {
    return createPromise(() => {
      window.localStorage.clear();
    }, callback);
  }
  static getAllKeys(callback) {
    return createPromise(() => {
      const numberOfKeys = window.localStorage.length;
      const keys = [];
      for (let i = 0; i < numberOfKeys; i += 1) {
        const key = window.localStorage.key(i);
        keys.push(key);
      }
      return keys;
    }, callback);
  }
  static flushGetRequests() {
  }
  static multiGet(keys, callback) {
    const promises = keys.map((key) => AsyncStorage.getItem(key));
    const processResult = (result) => result.map((value, i) => [keys[i], value]);
    return createPromiseAll(promises, callback, processResult);
  }
  static multiSet(keyValuePairs, callback) {
    const promises = keyValuePairs.map((item) => AsyncStorage.setItem(item[0], item[1]));
    return createPromiseAll(promises, callback);
  }
  static multiRemove(keys, callback) {
    const promises = keys.map((key) => AsyncStorage.removeItem(key));
    return createPromiseAll(promises, callback);
  }
  static multiMerge(keyValuePairs, callback) {
    const promises = keyValuePairs.map((item) => AsyncStorage.mergeItem(item[0], item[1]));
    return createPromiseAll(promises, callback);
  }
};

// ../../node_modules/.pnpm/@react-native-async-storage+async-storage@1.15.5/node_modules/@react-native-async-storage/async-storage/lib/module/index.js
var module_default = AsyncStorage;

// src/asyncstorage.ts
var asyncStoragePlugin = (key) => ({
  storage: {
    async load() {
      return await module_default.getItem(key).then(
        (tasksJSON) => tasksJSON ? JSON.parse(tasksJSON) : []
      ).catch(() => []);
    },
    async sync(queue) {
      await module_default.setItem(key, JSON.stringify(queue));
    }
  }
});
export {
  asyncStoragePlugin
};
