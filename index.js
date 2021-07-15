const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "*",
    },
});

const config = require('./config');

const { app: { port }, data: {adminPic} } = config;

const router = require('./router');
const { addUser, removeUser, getUserByName, getUserById, getUsersInRoom } = require('./data/users');
const { addMessage, getLast10RoomMessages } = require('./data/messages');

app.use(router);

io.on('connection', (socket) => {

    socket.on('join', async ({ name, room }, callback) => {
        if (name && room && name !== '' && room !== '') {
            const { error, user } = await addUser({ id: socket.id, name, room });

            if (error) return callback(error);

            socket.join(user.room);

            let { err, messages } = await getLast10RoomMessages(user.room);
            if (err) return callback(err);

            // emit last 10 messages in this room
            for (let i = 0; i < messages.length; i++) {
                socket.emit('message', { user: messages[i].name, text: messages[i].messageText, pic: messages[i].pic });
            }
            // send a personal welcome message to the new user (not added to room messages)
            socket.emit('message', {
                user: 'admin', text: `${user.name}, welcome to the chat`,
                pic: adminPic
            });
            // transmit to the room the 'joined' message
            socket.broadcast.to(user.room).emit('message', {
                user: 'admin', text: `${user.name} has joined!`,
                pic: adminPic
            });

            const { errar, users } = await getUsersInRoom(user.room);
            if (errar) return callback(error);

            io.to(user.room).emit('roomData', { room: user.room, users });

            callback();
        }
    });

    socket.on('sendMessage', async ({ name, message }, callback) => {
        const { error, user } = await getUserByName(name, socket.id);
        if (error) return callback(error);

        if (user.id) {
            await addMessage({ name: user.name, room: user.room, message });
            io.to(user.room).emit('message', {
                user: user.name, text: message,
                pic: adminPic
            });
        }

        callback();
    });

    socket.on('disconnect', async () => {
        const { error, user } = await getUserById(socket.id);
        // if (error) {
        //     throw new Error(error);
        // }
        if (user && user.id) {
            const room = user.room;
            const name = user.name;
            await removeUser(socket.id);
            const users = await getUsersInRoom(room);
            io.to(room).emit('message', {
                user: 'Admin', text: `${name} has left.`,
                pic: adminPic
            });
            io.to(room).emit('roomData', { room, users });
        }
    })
})

server.listen(port, () => console.log(`Server is listening on port ${port}`))