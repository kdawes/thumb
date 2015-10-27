'use strict'
var Pouchdb = require('pouchdb')
Pouchdb.plugin(require('pouchdb-find'))
var hat = require('hat')
var fs = require('fs')
var path = require('path')
var request = require('request')
var easyimage = require('easyimage')

var log = (process.env.NODE_ENV === 'development') ?
  console.log.bind(console, 'DBG>') : function () {}

const STATIC_ROOT = './static'
const DEFAULT_WIDTH = 120
const DEFAULT_HEIGHT = 120

// todo make this a transform stream
function dlAndProcess (opts, cb) {
  var downloadTargetFile = [STATIC_ROOT, '/', hat().slice(0, 8)].join('')
  var resizedFile = [STATIC_ROOT, '/', hat().slice(0, 8)].join('')

  var osFull = fs.createWriteStream(downloadTargetFile)
  var p = new Promise(
    function (resolve, reject) {
      request(opts.url, function (err) {
        if (err) { reject(err) }
        resolve(downloadTargetFile)
      }).pipe(osFull)
    }
  ).then(function (f) {
    log('resizing ' + f + ' => ' + resizedFile)
    easyimage.resize({
      'src': downloadTargetFile,
      'dst': resizedFile,
      'width': opts.width || DEFAULT_WIDTH,
      'height': opts.height || DEFAULT_HEIGHT
    }).then(function (file) {
      log('done resizing!')
      fs.unlink(f, function (e) {
        if (e) {
          log('unlink : Error : ', JSON.stringify(e))
        }
        return cb(null, resizedFile)
      })
    }).catch(function (err) {
      log('resize fail :-/ retaining input file : ', f)
      return cb(err, null)
    })
  }).catch(function (err) {
    log('error resizing ', f)
    return cb(err, null)
  })
}

function Api (opts) {
  if (!opts) { throw new Error('Missing options argument') }
  if (!(this instanceof Api)) {
    return new Api(opts)
  }
  log('API ' + JSON.stringify(opts, null, 2))
  this.db = new Pouchdb(opts.path)
  this.mapping = (function () {
    var m = {}
    this.getMaps(function (e, r) {
      log('rebuilding mappings ')
      r.rows.forEach(function (row) {
        var k = path.basename(row.doc.static)
        m[row.doc.url] = [row.doc._id, k]
      })
      log(JSON.stringify(m))
    })
    return m
  }.bind(this))()
}

Api.prototype.getByUrl = function (url) {
  log('getByUrl ' + url)
  return this.mapping[url] ? this.mapping[url] : null
}

Api.prototype.getMaps = function (cb) {
  this.db.allDocs({include_docs: true})
    .then(function (r) {
      return cb(null, r)
    }).catch(function (err) {
    log('uh oh' + JSON.stringify(err))
    return cb(err, null)
  })
}

Api.prototype.putMap = function (opts, cb) {
  var self = this
  log('putMap : mappings ' + JSON.stringify(self.mapping))
  dlAndProcess(opts, function processedCallback (err, url) {
    if (err) { console.error('ERROR : dlAndProcess ' + err); return cb(err, null) }
    opts.static = url
    opts.timestamp = new Date().getTime()
    self.db.post(opts).then(function (r) {
      self.mapping[opts.url] = [r.id, path.basename(opts.static)]
      log('Mappings are now : ' + JSON.stringify(self.mapping, null, 2))
    }).catch(function (err) {
      console.error('error updating maps in putMap' + err)
    })
    return cb(null, url)
  }.bind(this))
}

exports = module.exports = Api
