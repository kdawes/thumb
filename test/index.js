var test = require('tape')
var Api = require('../Api')
var path = require('path')
var fs = require('fs')
var rmrf = require('rimraf')
var assert = require('assert')
var request = require('request')
var hat = require('hat')
var shell = require('shelljs')

function setup (opts) {
  var dbPath = ['./db/fake', hat()].join('')
  var opts = opts || {'path': path.resolve(dbPath)}
  api = new Api(opts)
  opts.api = api
  return opts
}

test('throws when options obj ismissing', function (t) {
  t.throws(function () {
    new Api()
  })
  t.end()
})

test('putMap to a legit link/image works', function (t) {
  var opts = setup()
  ;(function () {
    // XXX TODO mock
    opts.api.putMap({
      'url': 'https://s3.amazonaws.com/devchat.tv/javascript_jabber_thumb.jpg'
    }, function (e, r) {
      t.message('RESULTS ' + JSON.stringify(r, null, 2))
      t.equal(e, null, 'callback error object should be null')
      t.notEqual(r, null, 'results object should not be null')
      t.assert(r.url, 'results object should have a url property')
    })
  })()
  t.end()
})

test('putMap to a broken link/image returns an error', function (t) {
  var opts = setup()
  ;(function () {
    opts.api.putMap({
      'url': 'nope'
    }, function (e, r) {
      t.notEqual(e, null, 'callback error object should not be null')
      t.equal(r, null, 'results object should be null')
    })
  })()
  t.end()
})

test('putMap with missiong options', function (t) {
  var opts = setup()
  ;(function () {
    opts.api.putMap(function (e, r) {
      t.notEqual(e, null, 'callback error object should not be null')
      t.equal(r, null, 'results object should be null')
    })
  })()
  t.end()
})

test('getMaps returns something', function (t) {
  t.plan(2)
  var opts = setup()
  api = new Api(opts)
  ;(function () {
    api.getMaps(function (e, r) {
      t.equal(e, null, 'no error object')
      t.deepEqual(r, JSON.parse('{"total_rows":0,"offset":0,"rows":[]}'), 'equal ?? message')
    })
  })()
})

test('getByUrl[null] returns null', function (t) {
  var opts = setup()
  t.equal(opts.api.getByUrl(null), null, 'getByUrl(null) returns null')
  t.end()
})

test('getByUrl(undefined) returns null', function (t) {
  var opts = setup()
  t.equal(opts.api.getByUrl(undefined), null, 'getByUrl(null) returns null')
  t.end()
})

test('teardown', function (t) {
  var glob = path.resolve('./db')
  shell.exec('rm -rf ' + glob + '/fake*')
  t.end()
})
