'use strict';

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

app.controlller('MainCtrl', function ($scope, Window, GUI, $mdDialog, socket, $http) {

  //menu setup
  $scope.messages = [];
  $scope.room   = '';

  var windowMenu = new GUI.Menu({
    type: 'menubar'
  });
  var roomsMenu = new GUI.Menu();

  windowMenu.append(new GUI.MenuItem({
    label: 'Rooms',
    submenu: roomsMenu
  }));

  windowMenu.append(new GUI.MenuItem({
    label: 'Exit',
    click: function () {
      Window.close();
    }
  }));
});