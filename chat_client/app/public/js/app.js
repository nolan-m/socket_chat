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

	//listen for setup event and create rooms
	socket.on('setup', function (data) {
		var rooms = data.rooms;

		for (var r = 0; r < rooms.length; r++) {
			//loop and appeand room to the window room menu
			handleRoomSubMenu(r);
		}

		//handle creation of room
		function handleRoomSubMenu(r) {
			var clickedRoom = rooms[r];
			//append each room to menu
			roomsMenu.append(new GUI.MenuItem({
				label: clickedRoom.toUpperCase()
				click: function () {
					$scope.room = clickedRoom.toUpperCase();

					//notify the server that the user changed their room
					socket.emit('switch room', {
						newRoom: clickedRoom,
						username: $scope.username
					});

					$http.get(serverBaseUrl + '/msg?room=' + clickedRoom).success(function(msgs) {
						$scope.messages = msgs;
					});
				}
			}));
		}
		//Attach menu
		GUI.Window.get().menu = windowMenu;
	});

	$scope.usernameModal = function (ev) {
		//Launch Modale to get username
		$mdDialog.show({
			controlller: UsernameDialogController,
			templateUrl: 'partials/username.tmpl.html',
			parent: angular.element(document.body),
			targetEvent: ev
		})
		.then(function (answer) {
			//Set username with the value returned from the modal
			$scope.username = answer;
			//Tell the server there is a new user
			socket.emit('new user', {
				username: answer
			});
			//set the room to general
			$scope.room = 'GENERAL';
			//fetch the chat message in General
			$http.get(serverBaseUrl + '/msg?room=' + $scope.room).success(function (msgs) {
				$scope.messages = msgs;
			});
		}, function () {
			Window.close();
		});
	};
});