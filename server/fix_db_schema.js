const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(process.cwd(), 'aims.db');
const db = new sqlite3.Database(DB_PATH);

console.log(`Connected to ${DB_PATH}`);

db.serialize(() => {
    db.all("PRAGMA table_info(transactions)", (err, rows) => {
        if (err) {
            console.error('Error getting table info:', err);
            return;
        }

        const columns = rows.map(r => r.name);
        console.log('Current columns:', columns);

        if (!columns.includes('description')) {
            console.log('Column "description" is MISSING. Adding it now...');
            db.run("ALTER TABLE transactions ADD COLUMN description TEXT", (err) => {
                if (err) {
                    console.error('FAILED to add column:', err.message);
                } else {
                    console.log('Configuration SUCCESS: Added description column.');
                }
            });
        } else {
            console.log('Column "description" already exists.');
        }

        if (!columns.includes('vendor')) {
            console.log('Checking vendor column (should exist)...');
        }
    });
});

// Wait a bit then close
setTimeout(() => {
    db.close((err) => {
        if (err) console.error('Error closing DB:', err.message);
        else console.log('Database connection closed.');
    });
}, 2000);
