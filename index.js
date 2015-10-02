'use strict';

/**
 * Module dependencies
 */
var assign = require('lodash.assign');
var toArray = require('lodash.toarray');

/**
 * RegExp for gettting the arguments of a function
 * @type {RegExp}
 */
var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

/**
 * The constructor of the injector
 * @param  {Object} [injector] optional insider instance for merging dependencies
 * @return {Object}            instance of insider
 */
var Insider = module.exports = function(injector) {
  this.dependencies = {};
  if (injector instanceof Insider) {
    this.mergeInjector(injector);
  }
};

Insider.prototype = {

  regDependency: function(name, dependency) {
    if (typeof name === 'object') {
      var self = this;
      Object.keys(name).forEach(function(key) {
        self.regDependency(key, name[key]);
      });
      return;
    }
    this.dependencies[name] = dependency;
  },

  getDependency: function(name) {
    return this.dependencies[name];
  },

  hasDependency: function(name) {
    return this.dependencies.hasOwnProperty(name);
  },

  getDependencies: function(fnArgs, defaultValues) {
    var self = this;
    defaultValues = defaultValues || {};
    if (!fnArgs) {
      return defaultValues;
    }

    return fnArgs.map(function(dependencyName, idx) {
      if (dependencyName && 'object' === typeof dependencyName) {
        var hashedDeps = {};
        Object.keys(dependencyName).forEach(function(depKey) {
          var depName = dependencyName[depKey];
          hashedDeps[depKey] = self.getDependency(depName);
        });
        return hashedDeps;
      } else if (dependencyName === null) {
        return defaultValues[idx];
      } else {
        return self.getDependency(dependencyName);
      }
    });
  },

  mergeInjector: function(otherInjector) {
    assign(this.dependencies, otherInjector.dependencies);
  },

  getFnArgs: function(fn) {
    return fn.toString().replace(STRIP_COMMENTS, '').match(FN_ARGS)[1].replace(/[\t\s\r\n]+/mg, '').split(',');
  },

  inject: function(fn, fnArgs) {
    var _fn = fn;
    var self = this;
    fn = function() {
      var defaultArgs = toArray(arguments);
      var ctx;
      var injector;

      if (this instanceof Insider) {
        ctx = 0;
        injector = this;
      } else {
        ctx = this;
        injector = this.injector || self;
      }
      if (!fnArgs) {
        fnArgs = self.getFnArgs(_fn);
      }
      var _args = injector.getDependencies(fnArgs, defaultArgs);
      return _fn.apply(ctx, _args);
    };
    return fn;
  }
};
