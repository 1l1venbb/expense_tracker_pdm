const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../expenses.db'));

db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        isRecurring INTEGER NOT NULL DEFAULT 0,
        type TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
    )
`);

module.exports = db;
