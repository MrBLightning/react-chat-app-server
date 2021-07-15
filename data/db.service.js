const util = require('util');
const mysql = require('mysql');
const config = require('../config');

const { db: { host, user, password, database } } = config;


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