import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUser } from '../store';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// Middleware to check if user is Admin
const verifyAdmin = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await findUser(email);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            success: true,
            token,
            user: { id: user.id, email: user.email, role: user.role, name: user.name }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error check' });
    }
});

// Admin-Only Route to Create New Users
router.post('/create-user', verifyAdmin, async (req, res) => {
    const { email, password, name, role } = req.body;

    if (await findUser(email)) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        const newUser = await createUser({
            email,
            password: hashedPassword,
            name: name || 'New Staff',
            role: role || 'staff'
        });

        res.json({ success: true, message: 'User created successfully', user: { email: newUser.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error creating user' });
    }
});

export default router;
