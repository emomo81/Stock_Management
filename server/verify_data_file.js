const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(__dirname, 'aims.db');
const db = new sqlite3.Database(DB_PATH);

db.all("SELECT COUNT(*) as count FROM transactions", (err, rows) => {
    let output = '';
    if (err) output = `ERROR: ${err.message}`;
    else output = `COUNT: ${rows[0].count}`;

    fs.writeFileSync(path.resolve(__dirname, 'db_status.txt'), output);
    db.close();
});
