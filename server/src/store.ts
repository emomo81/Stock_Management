import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    stock: number;
    price: string;
    cat: string;
    img: string;
    attributes?: Record<string, string>;
}

export interface Transaction {
    id: string;
    type: 'IN' | 'OUT';
    itemId: string;
    qty: number;
    price: number;
    vendor?: string;
    date?: string;
    description?: string;
}

export interface User {
    id: string;
    email: string;
    password: string;
    role: 'admin' | 'manager' | 'staff';
    name: string;
}

// --- Inventory Operations ---

export const getItems = async (): Promise<InventoryItem[]> => {
    const items = await prisma.inventory.findMany();
    return items.map(item => ({
        ...item,
        attributes: item.attributes ? JSON.parse(item.attributes) : {}
    }));
};

export const addItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    const { name, sku, stock, price, cat, img, attributes } = item;
    const newItem = await prisma.inventory.create({
        data: {
            name,
            sku,
            stock,
            price,
            cat,
            img,
            attributes: JSON.stringify(attributes || {})
        }
    });
    return {
        ...newItem,
        attributes: newItem.attributes ? JSON.parse(newItem.attributes) : {}
    };
};

export const updateItem = async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> => {
    // Process updates to match Prisma schema
    const data: any = { ...updates };
    if (updates.attributes) {
        data.attributes = JSON.stringify(updates.attributes);
    }

    try {
        const updatedItem = await prisma.inventory.update({
            where: { id },
            data
        });
        return {
            ...updatedItem,
            attributes: updatedItem.attributes ? JSON.parse(updatedItem.attributes) : {}
        };
    } catch (error) {
        // Record to update not found
        return null;
    }
};

export const deleteItem = async (id: string): Promise<boolean> => {
    try {
        await prisma.inventory.delete({
            where: { id }
        });
        return true;
    } catch (error) {
        return false;
    }
};

export const addTransaction = async (transaction: Transaction): Promise<void> => {
    const { itemId, type, qty, price, vendor, description } = transaction;
    // Ensure price is stored as string in DB but number here? Schema says String.
    await prisma.transaction.create({
        data: {
            type,
            itemId,
            qty,
            price: String(price),
            vendor: vendor || null,
            description: description || null
        }
    });
};

export const getVendors = async (): Promise<string[]> => {
    const results = await prisma.transaction.findMany({
        where: {
            vendor: {
                not: null
            }
        },
        distinct: ['vendor'],
        select: {
            vendor: true
        }
    });
    // Filter out nulls explicitly if TS complains, though query handles it
    return results.map(r => r.vendor as string).filter(Boolean);
};

export const getTransactions = async (itemId?: string): Promise<Transaction[]> => {
    const where = itemId ? { itemId } : {};
    const transactions = await prisma.transaction.findMany({
        where,
        orderBy: {
            date: 'desc'
        }
    });

    return transactions.map(t => ({
        id: t.id,
        type: t.type as 'IN' | 'OUT',
        itemId: t.itemId,
        qty: t.qty,
        price: Number(t.price),
        vendor: t.vendor || undefined,
        date: t.date.toISOString(),
        description: t.description || undefined
    }));
};

export const clearTransactions = async (): Promise<number> => {
    const result = await prisma.transaction.deleteMany();
    return result.count;
};

// --- User Operations ---

export const findUser = async (email: string): Promise<User | undefined> => {
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user) return undefined;
    return {
        ...user,
        role: user.role as 'admin' | 'manager' | 'staff'
    };
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    const newUser = await prisma.user.create({
        data: user
    });
    return {
        ...newUser,
        role: newUser.role as 'admin' | 'manager' | 'staff'
    };
};

export const updateUserPassword = async (id: string, hashedPassword: string): Promise<void> => {
    await prisma.user.update({
        where: { id },
        data: { password: hashedPassword }
    });
};
