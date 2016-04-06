var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var path    = require('path');
var fs      = require('fs');
// var config  = require('config');

var assets  = require('./assets');

// use ejs templating
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

// configure static assets
app.locals.getCachebustedPath = assets.getCachebustedPath;

// serve static assets on /public (and cache them)
var staticDir = path.join(__dirname + '/public');
app.use(assets.assetVirtualDir, express.static(staticDir, { maxAge: '30d' }));

// hello, world!
app.get('/', function (req, res) {
    res.render('index.ejs', {});
});

var port = process.env.PORT || 7080;
var server = http.listen(port, function() {
    console.log('listening on *:' + port);
});

module.exports = server;
