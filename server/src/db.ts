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
            attributes TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Transactions Table
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            type TEXT,
            itemId TEXT,
            qty INTEGER,
            price TEXT,
            vendor TEXT,
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            description TEXT
        )`);

        // Migration: Add attributes to inventory if missing
        db.all("PRAGMA table_info(inventory)", (err: any, rows: any[]) => {
            if (!err) {
                const hasAttributes = rows.some(r => r.name === 'attributes');
                if (!hasAttributes) {
                    db.run("ALTER TABLE inventory ADD COLUMN attributes TEXT", (err: any) => {
                        if (err) console.error("Migration 'attributes' failed:", err);
                        else console.log("Migration: Added 'attributes' to inventory.");
                    });
                }
            }
        });

        // Migration: Add description to transactions if missing
        db.all("PRAGMA table_info(transactions)", (err: any, rows: any[]) => {
            if (!err) {
                const hasDesc = rows.some(r => r.name === 'description');
                if (!hasDesc) {
                    db.run("ALTER TABLE transactions ADD COLUMN description TEXT", (err: any) => {
                        if (err) console.error("Migration 'description' failed:", err);
                        else console.log("Migration: Added 'description' to transactions.");
                    });
                }
            }
        });

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
