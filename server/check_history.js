const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, 'aims.db');
const db = new sqlite3.Database(DB_PATH);

console.log(`Checking history in ${DB_PATH}`);

const fs = require('fs');

db.serialize(() => {
    db.get("SELECT COUNT(*) as count FROM transactions", (err, row) => {
        let output = '';
        if (err) output += `Error count: ${err}\n`;
        else output += `Total Transactions: ${row.count}\n`;

        db.get("SELECT COUNT(*) as count FROM transactions WHERE type='OUT'", (err, row) => {
            if (err) output += `Error count OUT: ${err}\n`;
            else output += `Total Sales (OUT): ${row.count}\n`;

            fs.writeFileSync(path.resolve(__dirname, 'history_log.txt'), output);
            db.close();
        });
    });
});
