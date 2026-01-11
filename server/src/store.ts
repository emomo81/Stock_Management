import db from './db';
import { v4 as uuidv4 } from 'uuid';

export interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    stock: number;
    price: string;
    cat: string;
    img: string;
}

export interface User {
    id: string;
    email: string;
    password: string;
    role: 'admin' | 'manager' | 'staff';
    name: string;
}

// --- Inventory Operations ---

export const getItems = (): Promise<InventoryItem[]> => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM inventory", (err, rows) => {
            if (err) reject(err);
            else resolve(rows as InventoryItem[]);
        });
    });
};

export const addItem = (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    return new Promise((resolve, reject) => {
        const id = uuidv4();
        const { name, sku, stock, price, cat, img } = item;
        db.run(
            `INSERT INTO inventory (id, name, sku, stock, price, cat, img) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, name, sku, stock, price, cat, img],
            function (err) {
                if (err) reject(err);
                else resolve({ id, ...item });
            }
        );
    });
};

export const updateItem = (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> => {
    return new Promise((resolve, reject) => {
        // Construct dynamic UPDATE query
        const keys = Object.keys(updates);
        if (keys.length === 0) return resolve(null);

        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);

        db.run(
            `UPDATE inventory SET ${setClause} WHERE id = ?`,
            [...values, id],
            function (err) {
                if (err) reject(err);
                else if (this.changes === 0) resolve(null);
                else {
                    // Return full updated item
                    db.get(`SELECT * FROM inventory WHERE id = ?`, [id], (err, row) => {
                        if (err) reject(err);
                        else resolve(row as InventoryItem);
                    });
                }
            }
        );
    });
};

export const deleteItem = (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM inventory WHERE id = ?`, [id], function (err) {
            if (err) reject(err);
            else resolve(this.changes > 0);
        });
    });
};

// --- User Operations ---

export const findUser = (email: string): Promise<User | undefined> => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
            if (err) reject(err);
            else resolve(row as User);
        });
    });
};

export const createUser = (user: Omit<User, 'id'>): Promise<User> => {
    return new Promise((resolve, reject) => {
        const id = uuidv4();
        const { email, password, name, role } = user;
        db.run(
            `INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)`,
            [id, email, password, name, role],
            function (err) {
                if (err) reject(err);
                else resolve({ id, email, password, name, role });
            }
        );
    });
};
