import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { signJwt } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const signupSchema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
	password: z.string().min(6),
	role: z.enum(['ADMIN','GUEST']).optional().default('GUEST')
});

router.post('/signup', async (req, res) => {
	try {
		const { name, email, password, role } = signupSchema.parse(req.body);
		const exists = await prisma.user.findUnique({ where: { email } });
		if (exists) return res.status(409).json({ message: 'Email already in use' });
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await prisma.user.create({ data: { name, email, passwordHash, role } });
		const token = signJwt({ id: user.id, role: user.role });
		return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
	} catch (e) {
		return res.status(400).json({ message: e.message });
	}
});

const signinSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6)
});

router.post('/signin', async (req, res) => {
	try {
		const { email, password } = signinSchema.parse(req.body);
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) return res.status(401).json({ message: 'Invalid credentials' });
		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
		const token = signJwt({ id: user.id, role: user.role });
		return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
	} catch (e) {
		return res.status(400).json({ message: e.message });
	}
});

router.get('/me', requireAuth, async (req, res) => {
	const u = req.user;
	return res.json({ id: u.id, name: u.name, email: u.email, role: u.role });
});

export default router;



