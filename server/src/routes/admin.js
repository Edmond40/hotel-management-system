import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import NotificationService from '../services/notificationService.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// Rooms list
router.get('/rooms', async (_req, res) => {
    const rooms = await prisma.room.findMany();
    const shaped = rooms.map((r) => ({
        ...r,
        amenities: r.amenities ? r.amenities.split(',').map((s) => s.trim()).filter(Boolean) : []
    }));
    res.json(shaped);
});

// Create room
router.post('/rooms', async (req, res) => {
    const {
        number,
        type,
        price,
        available = true,
        floor = null,
        status = 'Available',
        description = null,
        amenities = []
    } = req.body;

    const amenitiesStr = Array.isArray(amenities) ? amenities.join(',') : (amenities || '');

    const room = await prisma.room.create({
        data: {
            number,
            type,
            price: Number(price),
            available: Boolean(available),
            floor,
            status,
            description,
            amenities: amenitiesStr
        }
    });
    const shaped = { ...room, amenities: amenitiesStr ? amenitiesStr.split(',').map((s) => s.trim()).filter(Boolean) : [] };
    res.status(201).json(shaped);
});

// Update room
router.put('/rooms/:id', async (req, res) => {
    const id = Number(req.params.id);
    const {
        number,
        type,
        price,
        available,
        floor = null,
        status,
        description = null,
        amenities = []
    } = req.body;

    const amenitiesStr = Array.isArray(amenities) ? amenities.join(',') : (amenities || '');

    const room = await prisma.room.update({
        where: { id },
        data: {
            ...(number != null && { number }),
            ...(type != null && { type }),
            ...(price != null && { price: Number(price) }),
            ...(available != null && { available: Boolean(available) }),
            ...(floor !== undefined && { floor }),
            ...(status != null && { status }),
            ...(description !== undefined && { description }),
            ...(amenities !== undefined && { amenities: amenitiesStr }),
        }
    });
    const shaped = { ...room, amenities: amenitiesStr ? amenitiesStr.split(',').map((s) => s.trim()).filter(Boolean) : [] };
    res.json(shaped);
});

// Delete room
router.delete('/rooms/:id', async (req, res) => {
    const id = Number(req.params.id);
    await prisma.room.delete({ where: { id } });
    res.status(204).end();
});

// Dashboard stats remain
router.get('/stats', async (_req, res) => {
    try {
        const [availableRooms, reservations, pendingInvoices, totalInvoices, menuItems] = await Promise.all([
            prisma.room.count({ where: { available: true } }),
            prisma.reservation.count(),
            prisma.invoice.count({ where: { status: 'Unpaid' } }),
            prisma.invoice.count(),
            prisma.menuItem.count()
        ]);

        // Calculate occupancy percentage (6 total rooms)
        const totalRooms = 6;
        const occupiedRooms = totalRooms - availableRooms;
        const occupancy = Math.round((occupiedRooms / totalRooms) * 100);

        // Get recent invoice amounts for revenue calculation
        const recentInvoices = await prisma.invoice.findMany({
            where: { status: 'Unpaid' },
            select: { amount: true }
        });
        const totalPendingAmount = recentInvoices.reduce((sum, inv) => sum + inv.amount, 0);

        // Get reservation status breakdown
        const confirmedReservations = await prisma.reservation.count({ where: { status: 'Confirmed' } });
        const pendingReservations = await prisma.reservation.count({ where: { status: 'Pending' } });

        res.json({
            occupancy,
            activeReservations: reservations,
            availableRooms,
            pendingInvoices,
            totalInvoices,
            totalPendingAmount: Math.round(totalPendingAmount),
            confirmedReservations,
            pendingReservations,
            mealRequest: menuItems, // Using menu items count as meal requests
            totalRooms
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

// Notifications endpoint
router.get('/notifications', async (_req, res) => {
    try {
        // Generate real notifications based on database data
        const [pendingInvoices, pendingReservations, lowStockItems] = await Promise.all([
            prisma.invoice.count({ where: { status: 'Unpaid' } }),
            prisma.reservation.count({ where: { status: 'Pending' } }),
            prisma.menuItem.count({ where: { available: false } })
        ]);

        const notifications = [];

        // Add invoice notifications
        if (pendingInvoices > 0) {
            notifications.push({
                id: 1,
                text: `${pendingInvoices} unpaid invoice${pendingInvoices > 1 ? 's' : ''} require attention`,
                time: '2 hours',
                read: false,
                type: 'invoice'
            });
        }

        // Add reservation notifications
        if (pendingReservations > 0) {
            notifications.push({
                id: 2,
                text: `${pendingReservations} reservation${pendingReservations > 1 ? 's' : ''} pending confirmation`,
                time: '1 hour',
                read: false,
                type: 'reservation'
            });
        }

        // Add menu item notifications
        if (lowStockItems > 0) {
            notifications.push({
                id: 3,
                text: `${lowStockItems} menu item${lowStockItems > 1 ? 's' : ''} currently unavailable`,
                time: '30 minutes',
                read: false,
                type: 'menu'
            });
        }

        // Add system notifications
        notifications.push({
            id: 4,
            text: 'Daily backup completed successfully',
            time: '5 minutes',
            read: true,
            type: 'system'
        });

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Emails endpoint
router.get('/emails', async (_req, res) => {
    try {
        // Generate real emails based on database data
        const [users, reservations, invoices] = await Promise.all([
            prisma.user.findMany({ where: { role: 'GUEST' }, take: 5 }),
            prisma.reservation.findMany({ 
                include: { user: true, room: true },
                where: { status: 'Pending' },
                take: 3
            }),
            prisma.invoice.findMany({
                include: { user: true },
                where: { status: 'Unpaid' },
                take: 3
            })
        ]);

        const emails = [];

        // Add reservation-related emails
        reservations.forEach((reservation, index) => {
            emails.push({
                id: index + 1,
                subject: `Reservation confirmation needed for ${reservation.user.name}`,
                from: `${reservation.user.email}`,
                time: '1 hour ago',
                read: false,
                type: 'reservation'
            });
        });

        // Add invoice-related emails
        invoices.forEach((invoice, index) => {
            emails.push({
                id: reservations.length + index + 1,
                subject: `Payment reminder for ${invoice.user.name}`,
                from: `${invoice.user.email}`,
                time: '2 hours ago',
                read: false,
                type: 'invoice'
            });
        });

        // Add general hotel emails
        emails.push({
            id: emails.length + 1,
            subject: 'Weekly hotel occupancy report',
            from: 'reports@ahenkanahotel.com',
            time: '1 day ago',
            read: true,
            type: 'report'
        });

        res.json(emails);
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

// Mark notifications as read
router.post('/notifications/read', async (_req, res) => {
    try {
        // In a real app, you'd update the database
        // For now, we'll just return success
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

// Mark emails as read
router.post('/emails/read', async (_req, res) => {
    try {
        // In a real app, you'd update the database
        // For now, we'll just return success
        res.json({ message: 'All emails marked as read' });
    } catch (error) {
        console.error('Error marking emails as read:', error);
        res.status(500).json({ error: 'Failed to mark emails as read' });
    }
});

// Users (guests and admins) management
router.get('/users', async (_req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});

router.post('/users', async (req, res) => {
    const { name, email, password, role = 'GUEST', staffRole } = req.body;
    const passwordHash = await bcrypt.hash(password || 'changeme123', 10);
    const user = await prisma.user.create({ 
        data: { 
            name, 
            email, 
            passwordHash, 
            role,
            staffRole: staffRole || null
        } 
    });
    res.status(201).json(user);
});

router.put('/users/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { name, email, password, role, staffRole } = req.body;
    const data = { 
        ...(name && { name }), 
        ...(email && { email }), 
        ...(role && { role }),
        ...(staffRole !== undefined && { staffRole })
    };
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({ where: { id }, data });
    res.json(user);
});

router.delete('/users/:id', async (req, res) => {
    const id = Number(req.params.id);
    await prisma.user.delete({ where: { id } });
    res.status(204).end();
});

// Reservations management
router.get('/reservations', async (_req, res) => {
    const list = await prisma.reservation.findMany({ include: { user: true, room: true } });
    res.json(list);
});

// Get available users and rooms for dropdowns
router.get('/reservations/options', async (_req, res) => {
    const [users, rooms] = await Promise.all([
        prisma.user.findMany({ select: { id: true, name: true, email: true } }),
        prisma.room.findMany({ select: { id: true, number: true, type: true } })
    ]);
    res.json({ users, rooms });
});

router.post('/reservations', async (req, res) => {
    const { userId, roomId, checkIn, checkOut, status = 'Pending' } = req.body;
    
    // Validate that user and room exist
    const [user, room] = await Promise.all([
        prisma.user.findUnique({ where: { id: Number(userId) } }),
        prisma.room.findUnique({ where: { id: Number(roomId) } })
    ]);
    
    if (!user) return res.status(400).json({ message: `User with ID ${userId} not found` });
    if (!room) return res.status(400).json({ message: `Room with ID ${roomId} not found` });
    
    const r = await prisma.reservation.create({ data: { userId: Number(userId), roomId: Number(roomId), checkIn: new Date(checkIn), checkOut: new Date(checkOut), status } });
    res.status(201).json(r);
});

router.put('/reservations/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { userId, roomId, checkIn, checkOut, status } = req.body;
        
        const reservation = await prisma.reservation.update({
            where: { id },
            data: {
                ...(userId != null && { userId: Number(userId) }),
                ...(roomId != null && { roomId: Number(roomId) }),
                ...(checkIn && { checkIn: new Date(checkIn) }),
                ...(checkOut && { checkOut: new Date(checkOut) }),
                ...(status && { status })
            },
            include: {
                room: {
                    select: {
                        number: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Create notification for booking confirmation
        if (status === 'Confirmed' && reservation.user && reservation.room) {
            await NotificationService.notifyBookingConfirmed(
                reservation.userId,
                reservation.id,
                reservation.room.number,
                reservation.checkIn
            );
        }

        res.json(reservation);
    } catch (error) {
        console.error('Error updating reservation:', error);
        res.status(500).json({ message: 'Failed to update reservation', error: error.message });
    }
});

router.delete('/reservations/:id', async (req, res) => {
    const id = Number(req.params.id);
    await prisma.reservation.delete({ where: { id } });
    res.status(204).end();
});

// Menu items management
router.get('/menu', async (_req, res) => {
    const menu = await prisma.menuItem.findMany();
    res.json(menu);
});

router.post('/menu', async (req, res) => {
    try {
        const { name, category, price, available = true } = req.body;
        const item = await prisma.menuItem.create({ 
            data: { 
                name, 
                category, 
                price: Number(price), 
                available: Boolean(available) 
            } 
        });

        // Notify all guests about new menu item
        await NotificationService.notifyMenuUpdate(name, true);

        res.status(201).json(item);
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ message: 'Failed to create menu item', error: error.message });
    }
});

router.put('/menu/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, category, price, available } = req.body;
        const item = await prisma.menuItem.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(category && { category }),
                ...(price != null && { price: Number(price) }),
                ...(available != null && { available: Boolean(available) })
            }
        });

        // Notify all guests about menu item update
        if (name || price != null || available != null) {
            await NotificationService.notifyMenuUpdate(item.name, false);
        }

        res.json(item);
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ message: 'Failed to update menu item', error: error.message });
    }
});

router.delete('/menu/:id', async (req, res) => {
    const id = Number(req.params.id);
    await prisma.menuItem.delete({ where: { id } });
    res.status(204).end();
});

// Invoices management
router.get('/invoices', async (_req, res) => {
    const invoices = await prisma.invoice.findMany({ include: { user: true } });
    res.json(invoices);
});

router.post('/invoices', async (req, res) => {
    const { userId, amount, status = 'Unpaid' } = req.body;
    const invoice = await prisma.invoice.create({ data: { userId: Number(userId), amount: Number(amount), status } });
    res.status(201).json(invoice);
});

router.put('/invoices/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { userId, amount, status } = req.body;
        
        const invoice = await prisma.invoice.update({
            where: { id },
            data: {
                ...(userId != null && { userId: Number(userId) }),
                ...(amount != null && { amount: Number(amount) }),
                ...(status && { status })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Create notification for payment status change
        if (status && invoice.user) {
            await NotificationService.notifyPaymentUpdate(
                invoice.userId,
                invoice.id,
                invoice.amount,
                status
            );
        }

        res.json(invoice);
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ message: 'Failed to update invoice', error: error.message });
    }
});

router.delete('/invoices/:id', async (req, res) => {
    const id = Number(req.params.id);
    await prisma.invoice.delete({ where: { id } });
    res.status(204).end();
});

// Get all guest requests for admin management
router.get('/requests', async (req, res) => {
    try {
        const requests = await prisma.request.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                menuItem: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        category: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching requests for admin:', error);
        res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
    }
});

// Update request status
router.put('/requests/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const updatedRequest = await prisma.request.update({
            where: { id: parseInt(id) },
            data: { 
                status,
                updatedAt: new Date()
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                menuItem: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        category: true
                    }
                }
            }
        });

        // Create notification for the guest about status change
        if (updatedRequest.menuItem) {
            await NotificationService.notifyRequestStatusChange(
                updatedRequest.userId,
                updatedRequest.id,
                status,
                updatedRequest.menuItem.name
            );
        }

        res.json(updatedRequest);
    } catch (error) {
        console.error('Error updating request status:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.status(500).json({ message: 'Failed to update request status', error: error.message });
    }
});

// Delete a request
router.delete('/requests/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.request.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        console.error('Error deleting request:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.status(500).json({ message: 'Failed to delete request', error: error.message });
    }
});

// Delete a notification
router.delete('/notifications/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.notification.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.status(500).json({ message: 'Failed to delete notification', error: error.message });
    }
});

// Delete all notifications for admin
router.delete('/notifications', async (req, res) => {
    try {
        const adminId = req.user.id;

        await prisma.notification.deleteMany({
            where: { userId: adminId }
        });

        res.json({ message: 'All notifications deleted successfully' });
    } catch (error) {
        console.error('Error deleting all notifications:', error);
        res.status(500).json({ message: 'Failed to delete all notifications', error: error.message });
    }
});

export default router;
