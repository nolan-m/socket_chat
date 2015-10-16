var express = require('express'),
  path = require('path'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser');

var routes = require('./routes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', routes.index);

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
	// log a message to console!
});

module.exports = app;

//load angular
var app = angular.module('chat', ['ngMaterial', 'ngAnimate', 'ngMdIcons', 'btford.socket-io']);

//server url
var serverBaseUrl = 'http://localhost:2015';

//services to interact with nodewebkit GUI and Window
app.factory('GUI', function () {
	return require('nw.gui');
});
app.factory('Window', function (GUI) {
	return GUI.Window.get();
});

//service to interact with the socket library
app.factory('socket', function (socketFactory) {
	var myIoSocket = io.connect(serverBaseUrl);
	var socket = socketFactory({
		ioSocket: myIoSocket
	});

	return socket;
});

//ng-enter directive
app.directive('ngEnter', function () {
	return function (scope, element, attrs) {
		element.bind('keydown keypress', function (event) {
			if (event.which === 13) {
				scope.$apply(function() {
					scope.$eval(attrs.ngEnter);
				});

				event.preventDefault();
			}
		});
	};
});