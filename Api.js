'use strict'
var Pouchdb = require('pouchdb')
Pouchdb.plugin(require('pouchdb-find'))
var hat = require('hat')
var fs = require('fs')
var path = require('path')
var request = require('request')
var easyimage = require('easyimage')

const STATIC = './static'
const WIDTH = 120
const HEIGHT = 120

// todo make this a transform stream
function dlAndProcess (opts, cb) {
  console.log('dl and proccess, fn1')
  var fn = [STATIC, '/', hat().slice(0, 8)].join('')
  console.log('fn2')
  var fn2 = [STATIC, '/', hat().slice(0, 8)].join('')
  console.log('dl and proccess ' + fn + ' ' + fn2)
  var osFull = fs.createWriteStream(fn)
  console.log('constructing promise')
  var p = new Promise(
    function (resolve, reject) {
      console.log('dl promise ' + opts.url)
      request(opts.url, function (err) {
        if (err) { console.log('err'); reject(err) }
        console.log('done?')
        resolve(fn)
      }).pipe(osFull)
    }
  )

  p.then(function (f) {
    console.log('resize ' + f)
    easyimage.resize({
      'src': f,
      'dst': fn2,
      'width': WIDTH,
      'height': HEIGHT
    }).then(function (file) {
      console.log('done!')
      fs.unlink(f)
      cb(null, fn2)
    }).catch(function (err) {
      console.log('error resizing ' + err)
      fs.unlink(f)
      cb(err, null)
    })
  }).catch(function (err) {
    console.log('error resizing ' + err)
    cb(err, null)
  })
}

function Api (opts) {
  if (!opts) { throw new Error('Missing options argument') }
  if (!(this instanceof Api)) {
    return new Api(opts)
  }
  console.log('API ' + JSON.stringify(opts, null, 2))
  this.db = new Pouchdb(opts.path)
  this.mapping = (function () {
    var m = {}
    this.getMaps(function (e, r) {
      console.log('rebuilding mappings ')
      r.rows.forEach(function (row) {
        var k = path.basename(row.doc.static)
        m[row.doc.url] = [row.doc._id, k]
      })
      console.log(JSON.stringify(m))
    })
    return m
  }.bind(this))()

}

Api.prototype.getByUrl = function (url) {
  console.log('getByUrl ' + url)
  return this.mapping[url]
}

Api.prototype.getMaps = function (cb) {
  this.db.allDocs({include_docs: true})
    .then(function (r) {
      return cb(null, r)
    }).catch(function (err) {
    console.log('uh oh' + JSON.stringify(err))
    return cb(err, null)
  })
}

Api.prototype.putMap = function (opts, cb) {
  var self = this
  console.log('putMap : mappsings ' + JSON.stringify(self.mapping))
  dlAndProcess(opts, function (err, url) {
    if (err) { return cb(err, null) }
    opts.static = url
    opts.timestamp = new Date().getTime()
    self.db.post(opts).then(function (r) {
      console.log('Recorded : ' + JSON.stringify(r))
      console.log('Mappings before : ' + JSON.stringify(self.mapping, null, 2))
      self.mapping[opts.url] = [r.id, path.basename(opts.static)]
      console.log('Mappings are now : ' + JSON.stringify(self.mapping, null, 2))
    }).catch(function (err) {
      console.log('error updating maps in putMap' + err)
    })
    return cb(null, url)
  }.bind(this))
}

exports = module.exports = Api
