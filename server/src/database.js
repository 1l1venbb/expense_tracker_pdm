const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../expenses.db'));

db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        isRecurring INTEGER NOT NULL DEFAULT 0,
        type TEXT NOT NULL
    )
`);

module.exports = db;