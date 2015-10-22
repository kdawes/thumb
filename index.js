'use strict'
var concat = require('concat-stream')
var director = require('director')
var union = require('union')
var router = new director.http.Router()
var ecstatic = require('ecstatic')
var path = require('path')
var cors = require('cors')

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

router.post('/maps', {stream: true}, function () {
  console.log('router POST maps')
  var self = this
  this.req.pipe(concat(function (body) {
    try {
      var obj = JSON.parse(body.toString('utf-8'))
      var premapped = api.getByUrl(obj.url)
      if (premapped) {
        var combined = [URL, premapped[1]].join('')
        console.log('Using PREMAP ' + JSON.stringify(premapped) + ' => ' + combined)
        return self.res.json({'url': combined})
      }
      api.putMap(obj, function (err, url) {
        // console.log('and done... ' + url)
        if (err) {
          console.log('error' + err)
          self.res.writeHead(500)
          self.res.end(err)
          return
        }

        let ret = [URL, path.basename(url)].join('')
        self.res.json({'url': ret})
        return
      })
    } catch (err) {
      console.log('trycatch error /maps')
      self.res.writeHead(500)
      self.res.end('error' + err)
    }
  }))
})

var server = union.createServer({
  buffer: false,
  before: [
    cors(),
    function (req, res) {
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
