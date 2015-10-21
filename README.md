 trivial thumbnailer service thing with imagemagick
 ===================================================

Dependencies :

* node, imagemagick, npm, union, director, ecstatic, Pouchdb

 Usage :
=========

 Start it
 ========
$ npm install && npm start

 Now post a {url:...} to the server
====================================
$ curl -X POST -H 'Content-type: application/json' -d  '{"url":"http://host/some.imgage.jpg"}' 'http://localhost:5454/maps'


 Server returns you a url to the thumnailed image :
=====================================
{ 'url': 'http://localhost:5454/085c123a' }


[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)
