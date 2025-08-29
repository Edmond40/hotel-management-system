import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import NotificationService from '../services/notificationService.js';

const router = Router();
router.use(requireAuth);

// Get guest dashboard stats
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get upcoming stay (next confirmed reservation)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today
        
        const upcomingStay = await prisma.reservation.findFirst({
            where: {
                userId: userId,
                status: 'Confirmed',
                checkOut: {
                    gte: today // Check-out date should be today or later (stay is active or upcoming)
                }
            },
            include: {
                room: true
            },
            orderBy: {
                checkIn: 'asc'
            }
        });

        // Get total nights for upcoming stay
        let upcomingNights = 0;
        let checkInDate = '';
        let checkOutDate = '';
        if (upcomingStay) {
            const checkIn = new Date(upcomingStay.checkIn);
            const checkOut = new Date(upcomingStay.checkOut);
            upcomingNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            checkInDate = checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            checkOutDate = checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        // Get meal requests this week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const mealRequests = await prisma.request.count({
            where: {
                userId: userId,
                createdAt: {
                    gte: weekStart,
                    lt: weekEnd
                }
            }
        });

        // Get total spent this month
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        const totalSpent = await prisma.invoice.aggregate({
            where: {
                userId: userId,
                createdAt: {
                    gte: monthStart,
                    lt: monthEnd
                }
            },
            _sum: {
                amount: true
            }
        });

        res.json({
            upcomingStay: upcomingStay ? {
                room: upcomingStay.room,
                checkInDate,
                checkOutDate,
                nights: upcomingNights
            } : null,
            mealRequests,
            totalSpent: totalSpent._sum.amount || 0
        });
    } catch (error) {
        console.error('Error fetching guest dashboard:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
    }
});

// Get guest's bookings
router.get('/bookings', async (req, res) => {
    try {
        const userId = req.user.id;
        const bookings = await prisma.reservation.findMany({
            where: { userId: userId },
            include: {
                room: true
            },
            orderBy: {
                checkIn: 'desc'
            }
        });

        const formattedBookings = bookings.map(booking => ({
            id: booking.id,
            room: `${booking.room.number} • ${booking.room.type}`,
            checkIn: booking.checkIn.toISOString().split('T')[0],
            checkOut: booking.checkOut.toISOString().split('T')[0],
            status: booking.status
        }));

        res.json(formattedBookings);
    } catch (error) {
        console.error('Error fetching guest bookings:', error);
        res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
    }
});

// Get guest's payments/invoices
router.get('/payments', async (req, res) => {
    try {
        const userId = req.user.id;
        const invoices = await prisma.invoice.findMany({
            where: { userId: userId },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const formattedInvoices = invoices.map(invoice => ({
            id: invoice.id,
            amount: invoice.amount,
            status: invoice.status,
            createdAt: invoice.createdAt,
            userId: invoice.userId
        }));

        res.json(formattedInvoices);
    } catch (error) {
        console.error('Error fetching guest payments:', error);
        res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
    }
});

// Get guest's meal requests
router.get('/requests', async (req, res) => {
    try {
        const userId = req.user.id;
        const requests = await prisma.request.findMany({
            where: { userId: userId },
            include: {
                menuItem: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const formattedRequests = requests.map(request => ({
            id: request.id,
            menuItemId: request.menuItemId,
            menuItem: request.menuItem,
            quantity: request.quantity,
            specialInstructions: request.specialInstructions,
            status: request.status,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        }));

        res.json(formattedRequests);
    } catch (error) {
        console.error('Error fetching guest requests:', error);
        res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
    }
});

// Create new meal request
router.post('/requests', async (req, res) => {
    try {
        const userId = req.user.id;
        const { menuItemId, quantity = 1, specialInstructions = '' } = req.body;

        // Validate menu item exists
        const menuItem = await prisma.menuItem.findUnique({
            where: { id: Number(menuItemId) }
        });

        if (!menuItem) {
            return res.status(400).json({ message: 'Menu item not found', error: 'Invalid menu item ID' });
        }

        if (!menuItem.available) {
            return res.status(400).json({ message: 'Menu item is not available', error: 'Menu item is not available' });
        }

        const request = await prisma.request.create({
            data: {
                userId: userId,
                menuItemId: Number(menuItemId),
                quantity: Number(quantity),
                specialInstructions,
                status: 'Pending'
            },
            include: {
                menuItem: true,
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Notify admins about the new food order
        await NotificationService.notifyAdminNewOrder(
            request.user.name,
            request.menuItem.name,
            request.quantity,
            request.id
        );

        res.status(201).json(request);
    } catch (error) {
        console.error('Error creating meal request:', error);
        res.status(500).json({ message: 'Failed to create request', error: error.message });
    }
});

// Get available menu items
router.get('/menu', async (req, res) => {
    try {
        const menuItems = await prisma.menuItem.findMany({
            where: { available: true },
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        });

        // Group by category
        const groupedMenu = menuItems.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push({
                id: item.id,
                name: item.name,
                price: item.price,
                description: item.description || '',
                available: item.available
            });
            return acc;
        }, {});

        res.json(groupedMenu);
    } catch (error) {
        console.error('Error fetching menu:', error);
        res.status(500).json({ message: 'Failed to fetch menu', error: error.message });
    }
});

// Get guest notifications
router.get('/notifications', async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma.notification.findMany({
            where: { userId: userId },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await prisma.notification.updateMany({
            where: { 
                id: parseInt(id),
                userId: userId // Ensure user can only mark their own notifications
            },
            data: { 
                isRead: true,
                updatedAt: new Date()
            }
        });

        if (notification.count === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
    }
});

// Mark all notifications as read
router.put('/notifications/read-all', async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.notification.updateMany({
            where: { 
                userId: userId,
                isRead: false
            },
            data: { 
                isRead: true,
                updatedAt: new Date()
            }
        });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Failed to mark all notifications as read', error: error.message });
    }
});

// Delete a notification
router.delete('/notifications/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await prisma.notification.delete({
            where: { 
                id: parseInt(id),
                userId: userId // Ensure user can only delete their own notifications
            }
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

// Delete all notifications for guest
router.delete('/notifications', async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.notification.deleteMany({
            where: { userId: userId }
        });

        res.json({ message: 'All notifications deleted successfully' });
    } catch (error) {
        console.error('Error deleting all notifications:', error);
        res.status(500).json({ message: 'Failed to delete all notifications', error: error.message });
    }
});

export default router;
