'use strict'
var concat = require('concat-stream')
var director = require('director')
var union = require('union')
var router = new director.http.Router().configure({recurse: null})
var ecstatic = require('ecstatic')
var path = require('path')
var cors = require('cors')

var log = (process.env.NODE_ENV === 'development')
  ? console.log.bind(console, 'DBG>') : function () {}

const DB_PATH = './db/maps.pouchdb'
const PROTO = process.env.PROTO || 'http'
const HOST = process.env.HOST || 'localhost'
const PORT = process.env.PORT || 5454
const STATIC = './static'
const SERVER_URL = [ PROTO, '://', HOST, (PORT) ? ':' : '', PORT, '/' ].join('')

var Api = require('./Api')
var api = new Api({
  path: path.resolve(DB_PATH),
  width: 120,
  height: 120
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
  var self = this
  this.req.pipe(concat(function (body) {
    try {
      var obj = JSON.parse(body.toString('utf-8'))
      var premapped = api.getByUrl(obj.url)
      if (premapped) {
        var combined = [SERVER_URL, premapped[1]].join('')
        log('Using PREMAP ' + JSON.stringify(premapped) + ' => ' + combined)
        return self.res.json({'url': combined})
      }
      api.putMap(obj, function (err, file) {
        if (err) {
          console.error('putMap error' + JSON.stringify(err))
          self.res.writeHead(500)
          self.res.end()
          return
        }

        // strip the leading ./
        let url = [SERVER_URL, path.basename(file)].join('')
        return self.res.json({'url': url})
      })
    } catch (err) {
      console.error('trycatch error /maps' + JSON.stringify(err) + ' ' + err)
      self.res.writeHead(500)
      return self.res.end()
    }
  }))
})

function go () {
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
    ] // ,
  //    https: {
  //      cert: './ca.crt',
  //      key: './ca.key',
  //    },
  })
  server.listen(PORT, function () {
    console.log('Server listening : 5454 @' + path.resolve(STATIC))
  })
}

go()
