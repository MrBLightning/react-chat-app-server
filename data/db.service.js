require('dotenv').config();
const util = require('util');
const mysql = require('mysql');

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_DATABASE;

const pool = mysql.createPool({
    connectionLimit: 20,
    host,
    user,
    password,
    database,
    dateStrings: true
});

// Promisify for Node.js async/await.
const queryPromise = util.promisify(pool.query);
pool.query = queryPromise;

exports.init = () => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err)
                reject(err);
            else {
                connection.release();
                resolve();
            }
        });
    });
};
exports.pool = pool;
exports.query = queryPromise;