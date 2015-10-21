var test = require('tape')
var Api = require('../Api')
var path = require('path')
var fs = require('fs')

test('throws when options obj ismissing', function (t) {
  t.throws(function () {
    new Api()
  })
  t.end()
})

test('getMaps returns something', function (t) {
  t.plan(2)
  var opts = {'path': path.resolve('./db/fake')}
  api = new Api(opts)
  api.getMaps(function (e, r) {
    t.equal(e, null, 'no error object')
    t.deepEqual(r, JSON.parse('{"total_rows":0,"offset":0,"rows":[]}'), 'equal ?? message')
  })

// todo - cleanup
})
