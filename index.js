'use strict'

/**
 * Module dependencies
 */

var map = require('lodash.map')
var keys = require('lodash.keys')
var assign = require('lodash.assign')
var toArray = require('lodash.toarray')
var forEach = require('lodash.foreach')

/**
 * Constructor
 *
 * @param  {Injector} [injector] Optional instance of injector
 *                               for merging dependencies from.
 * @return {Injector}            Instance of injector.
 */
var Injector = module.exports = function(injector) {
  this.dependencies = {}
  if (injector instanceof Injector) {
    this.merge(injector)
  }
}

/**
 * Set a dependency.
 *
 * @param {String|Object} name       Name of the dependency to set (String).
 *                                   Or a hash of names and dependencies pairs (Object).
 * @param {Any} dependency           The dependency object.
 */
Injector.prototype.set = function(name, dependency) {
  if (typeof name === 'object') {
    var self = this
    forEach(keys(name), function(key) {
      self.set(key, name[key])
    })
    return
  }
  this.dependencies[name] = dependency
}

/**
 * Get a dependency
 *
 * @param  {String} name  Name of the dependency to get.
 * @return {Any}          The dependency object.
 */
Injector.prototype.get = function(name) {
  return this.dependencies[name]
}

/**
 * Check existent of a dependency.
 *
 * @param  {String} name  Name of the dependency to check.
 * @return {Boolean}      True if exists. Otherwise False.
 */
Injector.prototype.has = function(name) {
  return this.dependencies.hasOwnProperty(name)
}

/**
 * Get many dependencies at once by array of names.
 *
 * @param  {Array} names          Array of names of dependencies need to be retrieved.
 * @param  {Object} defaultValues Hash of default values for dependencies.
 * @return {Array}                Array of dependencies retrieved.
 */
Injector.prototype.getAll = function(names, defaultValues) {
  var self = this
  defaultValues = defaultValues || {}
  if (!names) {
    return defaultValues
  }

  return map(names, function(dependencyName, idx) {
    if (dependencyName && 'object' === typeof dependencyName) {
      var hashedDeps = {}
      forEach(keys(dependencyName), function(depKey) {
        var depName = dependencyName[depKey]
        hashedDeps[depKey] = self.get(depName)
      })
      return hashedDeps
    } else if (dependencyName === null) {
      return defaultValues[idx]
    } else {
      return self.get(dependencyName)
    }
  })
}

/**
 * Merge current dependencies with another injector instance.
 *
 * @param  {Injector} otherInjector The injector to merge with.
 */
Injector.prototype.merge = function(otherInjector) {
  assign(this.dependencies, otherInjector.dependencies)
}

/**
 * Convert a normal function into a dependency injectable function.
 *
 * @param  {Function} fn     The original function to be injected.
 * @param  {Array}   names   Array of names of dependencies need to be injected.
 * @return {Function}        The dependency injectable function converted.
 */
Injector.prototype.inject = function(fn, names) {
  var __original_fn__ = fn
  var self = this
  fn = function() {
    var defaultArgs = toArray(arguments)
    var ctx
    var injector

    if (this instanceof Injector) {
      ctx = 0
      injector = this
    } else {
      ctx = this
      injector = this.injector || self
    }

    var _args = injector.getAll(names, defaultArgs)
    return __original_fn__.apply(ctx, _args)
  }
  // keep the original function as a reference
  fn.__original_fn__ = __original_fn__
  return fn
}
