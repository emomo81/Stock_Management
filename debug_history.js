const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(process.cwd(), 'server', 'aims.db'); // Note: utilizing server/aims.db as verified in previous steps
const db = new sqlite3.Database(DB_PATH);

console.log(`Checking history in ${DB_PATH}`);

db.serialize(() => {
    // Check total transactions
    db.get("SELECT COUNT(*) as count FROM transactions", (err, row) => {
        if (err) console.error('Error count:', err);
        else console.log('Total Transactions:', row.count);
    });

    // Check OUT transactions (sales)
    db.get("SELECT COUNT(*) as count FROM transactions WHERE type='OUT'", (err, row) => {
        if (err) console.error('Error count OUT:', err);
        else console.log('Total Sales (OUT):', row.count);
    });

    // Show a sample transaction
    db.all("SELECT * FROM transactions LIMIT 1", (err, rows) => {
        if (err) console.error('Error sample:', err);
        else if (rows.length > 0) console.log('Sample Transaction:', rows[0]);
        else console.log('No transactions found.');
    });
});

setTimeout(() => db.close(), 1000);
