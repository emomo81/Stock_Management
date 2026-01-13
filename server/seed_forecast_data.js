const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.resolve(__dirname, 'aims.db');
const db = new sqlite3.Database(DB_PATH);

console.log(`Seeding data into ${DB_PATH}`);

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

db.serialize(() => {
    // Get all items
    db.all("SELECT id, price FROM inventory", (err, items) => {
        if (err) {
            console.error('Error fetching items:', err);
            return;
        }

        if (items.length === 0) {
            console.log('No items to seed history for.');
            return;
        }

        console.log(`Found ${items.length} items. Generating history...`);

        const stmt = db.prepare("INSERT INTO transactions (id, type, itemId, qty, price, vendor, date, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

        let count = 0;
        const now = new Date();

        items.forEach(item => {
            // Generate 3-8 transactions per item
            const txCount = getRandomInt(3, 8);

            for (let i = 0; i < txCount; i++) {
                const id = uuidv4();
                const type = 'OUT';
                const qty = getRandomInt(1, 5);
                const price = item.price;
                const vendor = 'Guest';
                const description = 'Seeded Data';

                // Random date in last 30 days
                const daysAgo = getRandomInt(1, 30);
                const date = new Date(now);
                date.setDate(date.getDate() - daysAgo);

                stmt.run(id, type, item.id, qty, price, vendor, date.toISOString(), description);
                count++;
            }
        });

        stmt.finalize();
        console.log(`Successfully seeded ${count} historical transactions.`);
    });
});

setTimeout(() => db.close(), 2000);
