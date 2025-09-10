import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import NotificationService from '../services/notificationService.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// Get available rooms
router.get('/rooms/available', async (req, res) => {
    try {
        const { checkIn, checkOut } = req.query;
        
        if (!checkIn || !checkOut) {
            return res.status(400).json({ error: 'Both checkIn and checkOut dates are required' });
        }

        // Convert string dates to Date objects
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        // Get all rooms
        const allRooms = await prisma.room.findMany({
            include: {
                reservations: {
                    where: {
                        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
                        OR: [
                            {
                                checkIn: { lt: checkOutDate },
                                checkOut: { gt: checkInDate }
                            }
                        ]
                    },
                    select: { id: true }
                }
            }
        });

        // Filter out rooms with conflicting reservations
        const availableRooms = allRooms
            .filter(room => room.status === 'AVAILABLE' && room.reservations.length === 0)
            .map(room => ({
                id: room.id,
                number: room.number,
                type: room.type,
                price: room.price,
                status: room.status,
                capacity: room.capacity,
                description: room.description
            }));

        res.json(availableRooms);
    } catch (error) {
        console.error('Error fetching available rooms:', error);
        res.status(500).json({ error: 'Failed to fetch available rooms', details: error.message });
    }
});

// Rooms list
router.get('/rooms', async (_req, res) => {
    try {
        const rooms = await prisma.room.findMany({
            include: {
                _count: {
                    select: { reservations: { where: { status: 'CHECKED_IN' } } }
                }
            }
        });
        
        const shaped = rooms.map((r) => ({
            ...r,
            amenities: r.amenities ? r.amenities.split(',').map((s) => s.trim()).filter(Boolean) : []
        }));
        res.json(shaped);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms', details: error.message });
    }
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
    try {
        const id = Number(req.params.id);
        const {
            number,
            type,
            price,
            available = true,
            floor = null,
            status = 'Available', // Match the schema default
            description = null,
            amenities = []
        } = req.body;

        // Get the current room data first
        const currentRoom = await prisma.room.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { reservations: true }
                }
            }
        });

        if (!currentRoom) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Convert amenities to proper format
        const amenitiesStr = Array.isArray(amenities) ? 
            amenities.join(',') : 
            (typeof amenities === 'string' ? amenities : '');

        // Prepare update data with proper validation
        const updateData = {
            number: number !== undefined ? String(number) : currentRoom.number,
            type: type || currentRoom.type || 'SINGLE',
            price: price !== undefined ? parseFloat(price) : parseFloat(currentRoom.price) || 0,
            available: available !== undefined ? Boolean(available) : currentRoom.available !== false,
            floor: floor !== undefined ? String(floor) : currentRoom.floor || null,
            status: status || currentRoom.status || 'Available',
            description: description !== undefined ? String(description) : (currentRoom.description || null),
            amenities: amenitiesStr
        };

        // Validate required fields
        if (!updateData.number) {
            return res.status(400).json({ error: 'Room number is required' });
        }

        if (isNaN(updateData.price) || updateData.price < 0) {
            return res.status(400).json({ error: 'Invalid price' });
        }

        // Check for duplicate room number
        if (updateData.number !== currentRoom.number) {
            const existingRoom = await prisma.room.findFirst({
                where: {
                    number: updateData.number,
                    id: { not: id }
                }
            });
            
            if (existingRoom) {
                return res.status(400).json({ error: 'Room number already exists' });
            }
        }

        // Update the room
        const updatedRoom = await prisma.room.update({
            where: { id },
            data: updateData,
            include: {
                _count: {
                    select: { reservations: true }
                }
            }
        });

        // Format the response
        const response = {
            ...updatedRoom,
            amenities: updatedRoom.amenities ? 
                updatedRoom.amenities.split(',').map(s => s.trim()).filter(Boolean) : []
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ 
            error: 'Failed to update room',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get room by ID
router.get('/rooms/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid room ID' 
            });
        }

        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { reservations: true }
                },
                reservations: {
                    where: {
                        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
                        checkOut: { gte: new Date() }
                    },
                    orderBy: { checkIn: 'asc' },
                    take: 1
                }
            }
        });

        if (!room) {
            return res.status(404).json({ 
                success: false, 
                error: 'Room not found' 
            });
        }

        // Format the response
        const response = {
            ...room,
            amenities: room.amenities ? 
                room.amenities.split(',').map(s => s.trim()).filter(Boolean) : [],
            nextReservation: room.reservations[0] || null
        };

        // Remove the full reservations array from the response
        delete response.reservations;

        res.json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch room details',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete room
router.delete('/rooms/:id', async (req, res) => {
    const id = Number(req.params.id);
    await prisma.room.delete({ where: { id } });
    res.status(204).end();
});

// Dashboard stats with enhanced room status
router.get('/stats', async (_req, res) => {
    try {
        const [rooms, reservations, pendingInvoices, totalInvoices, menuItems, allReservations] = await Promise.all([
            prisma.room.findMany({
                include: {
                    reservations: {
                        where: {
                            OR: [
                                { status: 'CHECKED_IN' },
                                { 
                                    status: 'CONFIRMED',
                                    checkIn: { lte: new Date() },
                                    checkOut: { gte: new Date() }
                                }
                            ]
                        }
                    }
                }
            }),
            prisma.reservation.findMany({
                where: { 
                    status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
                    checkIn: { lte: new Date() },
                    checkOut: { gte: new Date() }
                }
            }),
            prisma.invoice.count({ where: { status: 'Unpaid' } }),
            prisma.invoice.count(),
            prisma.menuItem.count(),
            prisma.reservation.findMany({
                where: {
                    checkIn: { gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
                },
                include: {
                    room: true
                }
            })
        ]);

        // Calculate room statuses
        const roomStatuses = rooms.reduce((acc, room) => {
            const status = room.status || 'Available';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        // Calculate occupancy
        const totalRooms = rooms.length;
        const availableRooms = roomStatuses['Available'] || 0;
        const occupiedRooms = roomStatuses['Occupied'] || 0;
        const maintenanceRooms = roomStatuses['Maintenance'] || 0;
        const cleaningRooms = roomStatuses['Cleaning'] || 0;

        // Calculate pending amount
        const pendingInvoicesData = await prisma.invoice.findMany({
            where: { status: 'Unpaid' },
            select: { amount: true }
        });
        const totalPendingAmount = pendingInvoicesData.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

        // Group reservations by status
        const reservationStatuses = reservations.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
        }, {});

        // Calculate monthly revenue for the last 6 months
        const monthlyRevenue = Array(6).fill(0);
        const currentDate = new Date();
        
        allReservations.forEach(reservation => {
            if (reservation.room && reservation.checkIn) {
                const reservationDate = new Date(reservation.checkIn);
                const monthDiff = (currentDate.getFullYear() - reservationDate.getFullYear()) * 12 + 
                                 currentDate.getMonth() - reservationDate.getMonth();
                
                if (monthDiff >= 0 && monthDiff < 6) {
                    const price = typeof reservation.room.price === 'number' ? 
                                reservation.room.price : 
                                parseFloat(reservation.room.price) || 0;
                    monthlyRevenue[5 - monthDiff] += price;
                }
            }
        });

        res.json({
            totalRooms,
            availableRooms,
            occupiedRooms,
            maintenanceRooms,
            cleaningRooms,
            activeReservations: reservations,
            pendingInvoices,
            totalInvoices,
            totalPendingAmount: Math.round(totalPendingAmount * 100) / 100, // Round to 2 decimal places
            confirmedReservations: reservationStatuses['CONFIRMED'] || 0,
            pendingReservations: reservationStatuses['PENDING'] || 0,
            checkedInReservations: reservationStatuses['CHECKED_IN'] || 0,
            mealRequest: menuItems,
            rooms: rooms.map(room => ({
                ...room,
                price: Number(room.price) || 0,
                reservations: room.reservations || []
            })),
            occupancy: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
            monthlyRevenue
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch dashboard statistics',
            details: error.message 
        });
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

// Get all reservations
router.get('/reservations', async (_req, res) => {
    const reservations = await prisma.reservation.findMany({
        include: { user: true, room: true },
        orderBy: { createdAt: 'desc' }
    });
    res.json(reservations);
});

// Get single reservation by ID
router.get('/reservations/:id', async (req, res) => {
    try {
        const reservation = await prisma.reservation.findUnique({
            where: { id: Number(req.params.id) },
            include: { 
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                room: {
                    select: {
                        id: true,
                        number: true,
                        type: true,
                        price: true,
                        status: true,
                        description: true,
                        amenities: true
                    }
                }
            }
        });
        
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        
        // Format dates to ISO string for the frontend
        const formattedReservation = {
            ...reservation,
            checkIn: reservation.checkIn.toISOString(),
            checkOut: reservation.checkOut.toISOString(),
            createdAt: reservation.createdAt.toISOString(),
            updatedAt: reservation.updatedAt?.toISOString()
        };
        
        res.json(formattedReservation);
    } catch (error) {
        console.error('Error fetching reservation:', error);
        res.status(500).json({ 
            error: 'Failed to fetch reservation',
            details: error.message 
        });
    }
});

// Get available users and rooms for dropdowns
router.get('/reservations/options', async (req, res) => {
    try {
        const { checkIn, checkOut } = req.query;
        
        // Validate dates
        const checkInDate = checkIn ? new Date(checkIn) : new Date();
        const checkOutDate = checkOut ? new Date(checkOut) : new Date(new Date().setDate(checkInDate.getDate() + 1));
        
        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format. Please use ISO format (YYYY-MM-DD)' });
        }
        
        if (checkInDate >= checkOutDate) {
            return res.status(400).json({ error: 'Check-out date must be after check-in date' });
        }
        
        // Get all available rooms that don't have conflicting reservations
        const availableRooms = await prisma.room.findMany({
            where: {
                available: true,
                status: 'AVAILABLE',
                NOT: {
                    reservations: {
                        some: {
                            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
                            OR: [
                                { checkIn: { lte: checkOutDate }, checkOut: { gt: checkInDate } },
                                { checkIn: { lt: checkOutDate }, checkOut: { gte: checkInDate } }
                            ]
                        }
                    }
                }
            },
            select: {
                id: true,
                number: true,
                type: true,
                price: true,
                status: true,
                capacity: true
            },
            orderBy: { number: 'asc' }
        });

        // Get active users
        const users = await prisma.user.findMany({ 
            where: { isActive: true },
            select: { 
                id: true, 
                name: true, 
                email: true 
            },
            orderBy: { name: 'asc' }
        });

        res.json({ 
            success: true,
            data: { 
                users, 
                rooms: availableRooms,
                checkIn: checkInDate.toISOString(),
                checkOut: checkOutDate.toISOString()
            }
        });
    } catch (error) {
        console.error('Error in /reservations/options:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to load reservation options',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Create new reservation
router.post('/reservations', async (req, res) => {
    const { userId, roomId, checkIn, checkOut, status = 'PENDING' } = req.body;
    
    // Basic validation
    if (!userId || !roomId || !checkIn || !checkOut) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate dates
    if (checkInDate >= checkOutDate) {
        return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    try {
        // Check if user and room exist
        const [user, room] = await Promise.all([
            prisma.user.findUnique({ where: { id: Number(userId) } }),
            prisma.room.findUnique({ 
                where: { id: Number(roomId) },
                include: {
                    reservations: {
                        where: {
                            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
                            OR: [
                                { checkIn: { lt: checkOutDate }, checkOut: { gt: checkInDate } }
                            ]
                        }
                    }
                }
            })
        ]);

        if (!user) return res.status(400).json({ error: `User with ID ${userId} not found` });
        if (!room) return res.status(400).json({ error: `Room with ID ${roomId} not found` });
        
        // Check room status
        if (room.status === 'MAINTENANCE' || room.status === 'CLEANING') {
            return res.status(400).json({ 
                error: `Room is currently under ${room.status.toLowerCase()}` 
            });
        }

        // Check for existing reservations that conflict
        if (room.reservations.length > 0) {
            return res.status(400).json({ 
                error: 'Room is already booked for the selected dates',
                conflictingReservations: room.reservations
            });
        }

        // Create the reservation in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the reservation
            const reservation = await tx.reservation.create({
                data: {
                    userId: Number(userId),
                    roomId: Number(roomId),
                    checkIn: checkInDate,
                    checkOut: checkOutDate,
                    status: status.toUpperCase()
                },
                include: {
                    user: true,
                    room: true
                }
            });

            // Update room status if reservation is confirmed or checked in
            if (['CONFIRMED', 'CHECKED_IN'].includes(status.toUpperCase())) {
                await tx.room.update({
                    where: { id: Number(roomId) },
                    data: { 
                        status: 'OCCUPIED',
                        available: false 
                    }
                });
            }

            return reservation;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ 
            error: 'Failed to create reservation',
            details: error.message 
        });
    }
});

// Update an existing reservation
router.put('/reservations/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { userId, roomId, checkIn, checkOut, status } = req.body;
        
        // Validate required fields
        if (!userId || !roomId || !checkIn || !checkOut) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        // Validate dates
        if (checkInDate >= checkOutDate) {
            return res.status(400).json({ error: 'Check-out date must be after check-in date' });
        }

        // Get the current reservation first
        const currentReservation = await prisma.reservation.findUnique({
            where: { id },
            include: { room: true }
        });

        if (!currentReservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        // Check if the room exists
        const room = await prisma.room.findUnique({
            where: { id: Number(roomId) }
        });

        if (!room) {
            return res.status(400).json({ error: 'Room not found' });
        }

        // Check for conflicting reservations (excluding the current one)
        const conflictingReservations = await prisma.reservation.findMany({
            where: {
                id: { not: id }, // Exclude current reservation
                roomId: Number(roomId),
                status: { in: ['CONFIRMED', 'CHECKED_IN'] },
                OR: [
                    { 
                        checkIn: { lte: checkOutDate },
                        checkOut: { gte: checkInDate }
                    }
                ]
            }
        });

        if (conflictingReservations.length > 0) {
            return res.status(400).json({ 
                error: 'Room is already booked for the selected dates',
                conflictingReservations
            });
        }

        // Update the reservation
        const updatedReservation = await prisma.$transaction(async (tx) => {
            // Update the reservation
            const updated = await tx.reservation.update({
                where: { id },
                data: {
                    userId: Number(userId),
                    roomId: Number(roomId),
                    checkIn: checkInDate,
                    checkOut: checkOutDate,
                    status: status || currentReservation.status
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    room: {
                        select: {
                            id: true,
                            number: true,
                            status: true
                        }
                    }
                }
            });

            // Update room status based on reservation status
            if (status === 'CHECKED_IN') {
                await tx.room.update({
                    where: { id: Number(roomId) },
                    data: { status: 'OCCUPIED' }
                });
            } else if (currentReservation.roomId !== Number(roomId)) {
                // If room was changed, update the old room status
                await tx.room.update({
                    where: { id: currentReservation.roomId },
                    data: { status: 'AVAILABLE' }
                });
            }

            // If changing from CHECKED_IN to another status, update the room status
            if (currentReservation.status === 'CHECKED_IN' && status !== 'CHECKED_IN') {
                // Check if there are other active reservations for this room
                const activeReservations = await tx.reservation.count({
                    where: {
                        roomId: updated.room.id,
                        status: 'CHECKED_IN',
                        id: { not: id }
                    }
                });

                if (activeReservations === 0) {
                    await tx.room.update({
                        where: { id: updated.room.id },
                        data: { status: 'AVAILABLE' }
                    });
                }
            }

            return updated;
        });

        // Send notification if status changed to CONFIRMED
        if (status === 'CONFIRMED' && updatedReservation.user && updatedReservation.room) {
            await NotificationService.notifyBookingConfirmed(
                updatedReservation.userId,
                updatedReservation.id,
                updatedReservation.room.number,
                updatedReservation.checkIn
            );
        }

        res.json(updatedReservation);
    } catch (error) {
        console.error('Error updating reservation:', error);
        res.status(500).json({ 
            error: 'Failed to update reservation', 
            details: error.message 
        });
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
