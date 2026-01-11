import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.resolve(process.cwd(), 'aims.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

const initDb = () => {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            password TEXT,
            name TEXT,
            role TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Inventory Table
        db.run(`CREATE TABLE IF NOT EXISTS inventory (
            id TEXT PRIMARY KEY,
            name TEXT,
            sku TEXT UNIQUE,
            stock INTEGER,
            price TEXT,
            cat TEXT,
            img TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Seed Admin User
        db.get("SELECT * FROM users WHERE role = 'admin'", async (err, row) => {
            if (err) console.error(err);
            if (!row) {
                console.log('No admin found. Seeding initial admin.');
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('password123', salt);

                db.run(`INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)`,
                    [uuidv4(), 'admin@aims.com', hashedPassword, 'System Admin', 'admin'],
                    (err) => {
                        if (err) console.error('Error seeding admin:', err);
                        else console.log('Admin seeded: admin@aims.com / password123');
                    }
                );
            }
        });
    });
};

export default db;
