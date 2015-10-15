var express = require('express'),
	mongoose = require('mongoose'),	
	app 	= express(),
	server	= require('http').Server(app),
	io 		= require('socket.io')(server);

app.use(express.static(__dirname + '/public'));

mongoose.connect("mongodb://127.0.0.1:27017/chat");

// schema for the chat
var ChatSchema = mongoose.Schema({
	created: Date,
	content: String,
	username: String,
	room: String
});

// create a model from the chat schema
var Chat = mongoose.model('Chat', ChatSchema);

// allow CORS

app.all('*', function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
  	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  	res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');

  if (req.method === 'OPTIONS') {
  	res.status(200).end();
  } else {
  	next();
  }
});

/* ----------- ROUTES ------------- */
// route for index file
app.get('/', function (req, res) {
	res.sendfile('index.html')
});

app.post('/setup', function (req, res) {
	//mock chat data
	var chatData = [{
	    created: new Date(),
	    content: 'Hi',
	    username: 'Chris',
	    room: 'php'
	  }, {
	    created: new Date(),
	    content: 'Hello',
	    username: 'Obinna',
	    room: 'laravel'
	  }, {
	    created: new Date(),
	    content: 'Ait',
	    username: 'Bill',
	    room: 'angular'
	  }, {
	    created: new Date(),
	    content: 'Amazing room',
	    username: 'Patience',
	    room: 'socet.io'
	  }];

	//Loop through each chat data and insert into the database
	for (var c = 0; c < chatData.length; c++) {
		//Create an instance of the chat model
		var newChat = new Chat(chatData[c]);
		//Call save to insert the chat
		newChat.save(function (err, savedChat) {
			console.log(savedChat);
		});
	}
	//send a response to the serve does not get stuckq
	res.send('created');
});

// produces a list of chat as filtered by 'room' query
app.get('/msg', function (req, res) {
	Chat.find({
		'room': req.query.room.toLowerCase()
	}).exec(function (err, msgs) {
		res.json(msgs);
	});
});


io.on('connection', function (socket) {
	var defaultRoom = 'general';
	var rooms = ['General', 'angular', 'socket.io',  'express', 'node', 'mongo', 'PHP', 'laravel'];

	//emits the rooms array
	socket.emit('setup', {
		rooms: rooms
	});

	//Listens for new user
	socket.on('new user', function(data){
		data.room = defaultRoom;
		// New user joins the default room
		socket.join(defaultRoom);
		//tell all those in the room a new user joined
		io.in(defaultRoom).emit('user joined', data);
	});

	//listens for switch room
	socket.on('switch room', function (data) {
		//Handles joining and leaving rooms
		socket.leave(data.oldRoom);
		socket.join(data.newRoom);
		io.in(data.oldRoom).emit('user left', data);
		io.in(data.newRoom).emit('user joined', data);
	});

	socket.on('new message', function(data) {
		var newMsg = new Chat({
			username: data.username,
			content: data.message,
			room: data.room.toLowerCase(),
			created: new Date()
		});

		newMsg.save(function(err, msg) {
			io.in(msg.room).emit('message created', msg);
		});
	});
});

server.listen(2015);
