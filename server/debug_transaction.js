const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.resolve(process.cwd(), 'aims.db');
const db = new sqlite3.Database(DB_PATH);

console.log('Checking transactions table schema...');

db.all("PRAGMA table_info(transactions)", (err, rows) => {
    if (err) {
        console.error('Error fetching table info:', err);
        return;
    }
    console.log('Columns:', rows.map(r => r.name));

    const hasDescription = rows.some(r => r.name === 'description');
    console.log('Has "description" column:', hasDescription);

    // Try Insert
    console.log('Attempting insert...');
    const id = uuidv4();
    const type = 'OUT';
    const itemId = 'CUSTOM';
    const qty = 1;
    const price = '200'; // Testing string price
    const vendor = 'Guest';
    const description = 'Test Item';

    db.run('INSERT INTO transactions (id, type, itemId, qty, price, vendor, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, type, itemId, qty, price, vendor, description],
        function (err) {
            if (err) {
                console.error('Insert FAILED:', err.message);
            } else {
                console.log('Insert SUCCESS');
            }
            db.close();
        }
    );
});
