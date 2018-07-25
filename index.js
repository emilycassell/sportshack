var express = require('express');
var app = express();
var bodyParser = require('body-parser'); // BodyParser pour POST
var winston = require('winston');
var morgan = require('morgan');

winston.log('info', 'Starting up the app server.');
app.use(morgan('combined'));

// parsing
app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
    res.sendfile('default.html', { root: __dirname + "/public/views/home" });
});

/*
app.get('/', function(req, res) {
    res.send('Hello World!');
});
*/


app.listen(process.env.PORT || 8080, function() {
    console.log('Example app listening.');
});