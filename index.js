require('dotenv').config();
const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);

const { uploadFile, getFileStream } = require('./s3');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "*",
    },
});

const PORT = process.env.PORT || 5000;
const adminPic = process.env.ADMIN_PIC;

const router = require('./router');
const { addUser, removeUser, getUserByName, getUserById, getUsersInRoom } = require('./data/users');
const { addMessage, getLast10RoomMessages } = require('./data/messages');

app.use(
    cors({
        origin: "*",
        methods: ['POST', 'PATCH', 'GET'],
        preflightContinue: false,
        optionsSuccessStatus: 204,
    })
);
app.use(router);

// send the profile pic from the s3 bucket to the client
app.get('/images/:key', (req, res) => {
    const key = req.params.key;
    const readStream = getFileStream(key);

    readStream.pipe(res);
})

// save the profile image to the server with multer and then save the file to the s3 bucket.
// return the image s3 bucket id key back to the client
app.post('/images', upload.single('profile-pic'), async (req, res) => {
    const file = req.file;

    const result = await uploadFile(file);
    await unlinkFile(file.path);
    res.send({ s3url: `images/${result.Key}` });
})

// all needed functions for the io socket enabling real-time chat
io.on('connection', (socket) => {

    socket.on('join', async ({ name, room, pic }, callback) => {
        if (name && room && name !== '' && room !== '') {
            const { error, user } = await addUser({ id: socket.id, name, room, pic });

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
                user: user.name, text: message, pic: user.pic
            });
        }

        callback();
    });

    socket.on('disconnect', async () => {
        const { user } = await getUserById(socket.id);
        if (user && user.id) {
            const room = user.room;
            const name = user.name;
            await removeUser(socket.id);
            const { users } = await getUsersInRoom(room);
            io.to(room).emit('message', {
                user: 'Admin', text: `${name} has left.`,
                pic: adminPic
            });
            io.to(room).emit('roomData', { room, users });
        }
    })
})

server.listen(PORT, () => console.log(`Server is listening on port ${PORT}`))