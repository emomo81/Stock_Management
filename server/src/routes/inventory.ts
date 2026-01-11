import express from 'express';
import { getItems, addItem, updateItem, deleteItem } from '../store';

const router = express.Router();

// GET all items
router.get('/', async (req, res) => {
    try {
        const items = await getItems();
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching items', error });
    }
});

// POST new item
router.post('/', async (req, res) => {
    try {
        const newItem = await addItem(req.body);
        res.status(201).json(newItem);
    } catch (error) {
        res.status(400).json({ message: 'Error creating item', error });
    }
});

// POST batch items
router.post('/batch', async (req, res) => {
    try {
        const items = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ message: 'Input must be an array' });
        }
        // Sequential await to prevent locking issues or use Promise.all if supported
        const newItems = [];
        for (const item of items) {
            newItems.push(await addItem(item));
        }
        res.status(201).json({ count: newItems.length, items: newItems });
    } catch (error) {
        res.status(400).json({ message: 'Error batch creating items', error });
    }
});

// PUT update item
router.put('/:id', async (req, res) => {
    try {
        const updated = await updateItem(req.params.id, req.body);
        if (updated) {
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error updating item', error });
    }
});

// DELETE item
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await deleteItem(req.params.id);
        if (deleted) {
            res.json({ message: 'Item deleted' });
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error deleting item', error });
    }
});

export default router;
