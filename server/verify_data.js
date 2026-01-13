const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, 'aims.db');
const db = new sqlite3.Database(DB_PATH);

db.all("SELECT COUNT(*) as count FROM transactions", (err, rows) => {
    if (err) console.error(err);
    else console.log('Tx Count:', rows[0].count);
    db.close();
});
