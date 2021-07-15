const { pool } = require('./db.service');

const mysql = require('mysql');
const selectedDB = "baraktestchat";

const addUser = async ({ id, name, room }) => {
  pool.config.connectionConfig.database = selectedDB;
  name = name.trim().toLowerCase();
  room = room.trim().toLowerCase();

  if (!name || !room) return { error: 'User name and room are required.' };

  try {
    const existingUser = await pool.query(`SELECT * FROM users WHERE name=${mysql.escape(name)} LIMIT 1`);
    if (existingUser[0] && existingUser[0].Id) {
      await pool.query(`UPDATE users SET Id=${mysql.escape(id)}, room=${mysql.escape(room)} WHERE name=${mysql.escape(name)}`);
    } else {
      await pool.query(`INSERT INTO users(Id, name, room) VALUES (${mysql.escape(id)}, ${mysql.escape(name)}, ${mysql.escape(room)})
      ON DUPLICATE KEY UPDATE Id=${mysql.escape(id)}, name=${mysql.escape(name)}, room=${mysql.escape(room)}`);
    }

    const user = { id, name, room };
    return { user };
  } catch (err) {
    return { error: `there was an error adding user: ${err}` };
  }
}

const removeUser = async (id) => {
  pool.config.connectionConfig.database = selectedDB;
  try {
    await pool.query(`UPDATE users SET room=NULL WHERE Id=${mysql.escape(id)}`);
  } catch (err) {
    return { error: `there was an error removing user with Id ${id}: ${err}` };
  }
}

const getUserByName = async (name, id) => {
  pool.config.connectionConfig.database = selectedDB;
  name = name.trim().toLowerCase();
  try {
    const rep = await pool.query(`SELECT * FROM users WHERE name=${mysql.escape(name)} LIMIT 1`);
    if (rep && rep[0].Id !== id) {
      await pool.query(`UPDATE users SET Id=${mysql.escape(id)} WHERE name=${mysql.escape(name)}`);
    }
    if (rep[0]) {
      const user = { id: rep[0].Id, name: rep[0].name, room: rep[0].room, pic: rep[0].pic };
      return { user };
    } else {
      return { user: {} };
    }
  } catch (err) {
    return { error: `there was an error getting user with name ${name}}: ${err}` };
  }
}

const getUserById = async (id) => {
  pool.config.connectionConfig.database = selectedDB;
  try {
    const rep = await pool.query(`SELECT * FROM users WHERE Id=${mysql.escape(id)} LIMIT 1`);
    if (rep[0]) {
      const user = { id: rep[0].Id, name: rep[0].name, room: rep[0].room, pic: rep[0].pic };
      return { user };
    } else {
      return { user: {} };
    }
  } catch (err) {
    return { error: `there was an error getting user with Id ${id}: ${err}` };
  }
}

const getUsersInRoom = async (room) => {
  pool.config.connectionConfig.database = selectedDB;
  try {
    const users = [];
    const allusers = await pool.query(`SELECT * FROM users WHERE room=${mysql.escape(room)}`);
    for (let i = 0; i < allusers.length; i++) {
      const user = { id: allusers[i].Id, name: allusers[i].name, room: allusers[i].room };
      users.push(user);
    }
    return { users };
  } catch (err) {
    return { errar: `there was an error getting all users for room ${room}: ${err}` };
  }
}

module.exports = { addUser, removeUser, getUserByName, getUserById, getUsersInRoom };