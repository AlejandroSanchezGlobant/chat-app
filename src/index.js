const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');

const {
  generateMessage,
  generateLocationMessage,
} = require('./utils/messages');

const {
  addUser,
  removeUser,
  getUser,
  getUsersInroom,
} = require('./utils/users');

const port = process.env.PORT || 3000;
const publicFolder = path.join(__dirname, '../public');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Setup static directory to serve
app.use(express.static(publicFolder));

io.on('connection', (socket) => {
  socket.on('join', (options, callback) => {
    const { user, error } = addUser({
      id: socket.id,
      ...options,
    });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit('message', generateMessage('Welcome!'));
    socket.broadcast
      .to(user.room)
      .emit('message', generateMessage(`${user.username} has joined!`));

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInroom(user.room),
    });
    callback();
  });

  // Callback is not mandatory, is just in case that acknowledgement is needed
  socket.on('sendMessage', (msg, callback) => {
    const filter = new Filter();

    if (filter.isProfane(msg)) {
      return callback('Profanity is not allowed! :(');
    }

    const user = getUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', generateMessage(msg, user.username));
      callback('Delivered!');
    }
  });

  socket.on('sendLocation', (location, callback) => {
    const user = getUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        'locationMessage',
        generateLocationMessage(location, user.username)
      );

      callback('Location delivered!');
    }
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage(` ${user.username} has left!`)
      );

      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInroom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
