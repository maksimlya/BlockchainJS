// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var node = require('./server/node.js')

var app = express();
var server = http.Server(app);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'static/index.html'));
});

// Starts the server.
server.listen(5000, function() {
  console.log('Starting server on port 5000');
});


