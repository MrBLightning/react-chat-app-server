const { pool } = require('./db.service');

const mysql = require('mysql');
const selectedDB = "baraktestchat";

const addMessage = async ({ name, room, message }) => {
    pool.config.connectionConfig.database = selectedDB;
    name = name.trim().toLowerCase();
    room = room.trim().toLowerCase();

    if (!name || !room) return { error: 'User name and room are required.' };

    try {
        const addm = await pool.query(`INSERT INTO messages(fromUserName, room, messageText) 
                        VALUES (${mysql.escape(name)}, ${mysql.escape(room)}, ${mysql.escape(message)})`);
    } catch (err) {
        return { error: `there was an error adding message: ${err}` };
    }
}

const getLast10RoomMessages = async (room) => {
    pool.config.connectionConfig.database = selectedDB;
    try {
        const allMessages = await pool.query(`SELECT m.Id,m.messageText,u.name,u.pic FROM messages m, users u 
                                            WHERE u.name=m.fromUserName ORDER BY m.timestamp DESC LIMIT 10`);
        allMessages.sort((a, b) => (a.Id > b.Id) ? 1 : -1)
        return { messages: allMessages || [] };
    } catch (err) {
        return { err: `there was an error getting last 10 messages for room ${room}: ${err}` };
    }
}

module.exports = { addMessage, getLast10RoomMessages };