'use strict'
var test = require('tape')
var Api = require('../Api')
var path = require('path')
var fs = require('fs')
var assert = require('assert')
var request = require('request')
var hat = require('hat')
var shell = require('shelljs')
var _ = require('lodash')
var async = require('async')

const DB_PATH = './db'
const DB_FILE_GLOB = '/fake*'
const RESIZE_TARGET = './test/fixtures/chart.png'

const PUTMAP_ROUTE = '/maps'
const PUTMAP_PORT = _.random(5000, 8000)
// set in tests
var server = null

function fakeDbName () {
  return ['./db/fake', hat()].join('')
}
// Common setup function -
// @opts - optional options object
function setup (opts) {
  var tmp = _.cloneDeep(opts || {'path': path.resolve(fakeDbName())})
  tmp.api = new Api(tmp)
  return tmp
}

test('setup', function (t) {
  server = require('http').createServer(function (request, response) {
    var tf = path.resolve(RESIZE_TARGET)
    var rs = fs.createReadStream(tf).on('error', function (e) {
      console.error('read stream error! ' + JSON.stringify(e))
    })
    rs.pipe(response)
  })
  server.listen(PUTMAP_PORT)
  t.end()
})

test('throws when options obj ismissing', function (t) {
  t.throws(function () {
    new Api()
  })
  t.end()
})

test('putMap to a broken link/image returns an error', function (t) {
  var opts = setup()
  opts.api.putMap({
    'url': 'nope'
  }, function (e, r) {
    t.notEqual(e, null, 'callback error object should not be null')
    t.equal(r, null, 'results object should be null')
  })
  t.end()
})

test('putMap with missiong options', function (t) {
  var opts = setup()
  opts.api.putMap(function (e, r) {
    t.notEqual(e, null, 'callback error object should not be null')
    t.equal(r, null, 'results object should be null')
  })
  t.end()
})

test('getMaps returns something', function (t) {
  t.plan(2)
  var opts = setup()
  opts.api.getMaps(function (e, r) {
    t.equal(e, null, 'no error object')
    t.deepEqual(r, JSON.parse('{"total_rows":0,"offset":0,"rows":[]}'),
      'maps object exists with total_rows, offset and rows keys')
  })
})

test('getByUrl[null] returns null', function (t) {
  var opts = setup()
  t.equal(opts.api.getByUrl(null), null, 'getByUrl(null) returns null')
  t.end()
})

test('getByUrl(undefined) returns null', function (t) {
  var opts = setup()
  t.equal(opts.api.getByUrl(undefined), null, 'getByUrl(undefined) returns null')
  t.end()
})

test('the instanceof magic works', function (t) {
  t.ok(Api({'path': fakeDbName()}) instanceof Api, 'Api instanceof Api')
  t.end()
})

test('putMap to a legit link/image works', function (t) {
  var url = ['http://localhost:', PUTMAP_PORT, PUTMAP_ROUTE].join('')
  var opts = setup()
  opts.api.putMap({
    'url': url
  }, function (e, r) {
    if (e) {
      console.error('putMap failed : ' + JSON.stringify(e))
    }
    t.equal(e, null, 'callback error object should be null')
    t.notEqual(r, null, 'results object should not be null')
    t.assert('string' === typeof (r), 'result is a string : ' + r)
    t.end()
  })
})

test('teardown', function (t) {
  var glob = path.resolve(DB_PATH)
  var cmd = ['rm -rf ', glob, DB_FILE_GLOB].join('')
  shell.exec(cmd, function (code, output) {})
  if (server) {
    server.close()
  }
  t.end()
})
