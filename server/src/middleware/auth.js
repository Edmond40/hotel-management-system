import { verifyJwt } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';

export async function requireAuth(req, res, next) {
	try {
		const auth = req.headers.authorization || '';
		const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
		if (!token) return res.status(401).json({ message: 'Missing token' });
		const payload = verifyJwt(token);
		const user = await prisma.user.findUnique({ where: { id: payload.id } });
		if (!user) return res.status(401).json({ message: 'Invalid token' });
		req.user = user;
		next();
	} catch (e) {
		return res.status(401).json({ message: 'Unauthorized' });
	}
}

export function requireAdmin(req, res, next) {
	if (req.user?.role !== 'ADMIN') {
		return res.status(403).json({ 
			message: 'Access denied. Admin privileges required.',
			error: 'INSUFFICIENT_PERMISSIONS',
			requiredRole: 'ADMIN',
			userRole: req.user?.role || 'NONE'
		});
	}
	next();
}

export function requireGuest(req, res, next) {
	if (req.user?.role !== 'GUEST') {
		return res.status(403).json({ 
			message: 'Access denied. Guest privileges required.',
			error: 'INSUFFICIENT_PERMISSIONS',
			requiredRole: 'GUEST',
			userRole: req.user?.role || 'NONE'
		});
	}
	next();
}

export function requireRole(roles) {
	return (req, res, next) => {
		if (!Array.isArray(roles)) roles = [roles];
		if (!roles.includes(req.user?.role)) {
			return res.status(403).json({ 
				message: 'Access denied. Insufficient privileges.',
				error: 'INSUFFICIENT_PERMISSIONS',
				requiredRoles: roles,
				userRole: req.user?.role || 'NONE'
			});
		}
		next();
	};
}



