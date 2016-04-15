thumbnailer / service
=====================

Dependencies :

* node, imagemagick, npm, union, director, ecstatic, Pouchdb

 Usage :
========

* $ npm install && npm start

OR - with docker :

* $ IP=$(docker-machine ip) && docker run --rm -it -e "HOST=${IP}" -e "WIDTH=120" -e "HEIGHT=120" -p 5454:5454 thumb


 ** Now post a {url:http://url.to.image/image.png} to the server

* $ curl -X POST -H 'Content-type: application/json' -d  '{"url":"http://host/some.imgage.jpg"}' 'http://${IP}:5454/maps'


** Server returns you a url to the thumbnailed image :

{ 'url': 'http://localhost:5454/085c123a' }


[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)
