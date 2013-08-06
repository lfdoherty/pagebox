
var express = require('express');
var app = express();

var plantbox = require('plantbox')(module)
var pagebox = require('./../main')(module)

var indexPlant = plantbox('./js/indexplant')
var indexPage = pagebox(indexPlant, './css/index')//you could also just use pagebox('./js/indexplant', './css/index')

var StaticPrefix = '/static/'

indexPage.serve(app, '/index', StaticPrefix)

app.listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');

