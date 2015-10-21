'use strict'
var concat = require('concat-stream')
var director = require('director')
var union = require('union')
var router = new director.http.Router()
var ecstatic = require('ecstatic')
var path = require('path')

const DB_PATH = './db/maps.pouchdb'
const PROTO = 'http'
const HOST = 'localhost'
const PORT = 5454
const STATIC = './static'
const URL = [ PROTO, '://', HOST, (PORT) ? ':' : '', PORT, '/' ].join('')

var Api = require('./Api')
var api = new Api({
  'path': path.resolve(DB_PATH)
})

router.get('/maps', function () {
  api.getMaps(function (err, maps) {
    if (err) {
      this.res.writeHead(500)
      this.res.end(err)
      return
    }
    this.res.json(maps)
  }.bind(this))
})

router.post('maps', {stream: true}, function () {
  var self = this
  this.req.pipe(concat(function (body) {
    try {
      var obj = JSON.parse(body.toString('utf-8'))
      api.putMap(obj, function (err, url) {
        console.log('and done... ' + url)
        if (err) {
          console.log('error' + err)
          self.res.writeHead(500)
          self.res.end(err)
        }

        let ret = [URL, path.basename(url)].join('')
        self.res.json({'url': ret})
      })
    } catch (err) {
      console.log('trycatch error /maps')
      self.res.writeHead(500)
      self.res.end('error' + JSON.stringify(err))
    }
  }))
})

var server = union.createServer({
  buffer: false,
  before: [
    function (req, res) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      router.dispatch(req, res, function (err) {
        if (err) {
          res.emit('next')
        }
      })
    },
    ecstatic({
      root: path.resolve(STATIC),
      autoIndex: false,
      handleError: false,
      showDir: false
    })
  ]
})
server.listen(PORT)
console.log('Server listening : 5454 @' + path.resolve(STATIC))
