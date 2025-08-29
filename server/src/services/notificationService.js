import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class NotificationService {
    // Create a notification for a specific user
    static async createNotification(userId, title, message, type, relatedId = null) {
        try {
            const notification = await prisma.notification.create({
                data: {
                    userId,
                    title,
                    message,
                    type,
                    relatedId
                }
            });
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    // Notify about menu updates
    static async notifyMenuUpdate(menuItemName, isNewItem = false) {
        try {
            // Get all guest users
            const guests = await prisma.user.findMany({
                where: { role: 'GUEST' }
            });

            const title = isNewItem ? 'New Menu Item Added!' : 'Menu Item Updated!';
            const message = isNewItem 
                ? `New item "${menuItemName}" has been added to our menu. Check it out!`
                : `"${menuItemName}" has been updated. Check out the changes!`;

            // Create notifications for all guests
            const notifications = guests.map(guest => ({
                userId: guest.id,
                title,
                message,
                type: 'MENU_UPDATE'
            }));

            await prisma.notification.createMany({
                data: notifications
            });

            console.log(`Created menu update notifications for ${guests.length} guests`);
        } catch (error) {
            console.error('Error creating menu update notifications:', error);
        }
    }

    // Notify about booking confirmation
    static async notifyBookingConfirmed(userId, reservationId, roomNumber, checkInDate) {
        try {
            await this.createNotification(
                userId,
                'Booking Confirmed!',
                `Your booking for Room ${roomNumber} starting ${new Date(checkInDate).toLocaleDateString()} has been confirmed.`,
                'BOOKING_CONFIRMED',
                reservationId
            );
        } catch (error) {
            console.error('Error creating booking confirmation notification:', error);
        }
    }

    // Notify about request status changes
    static async notifyRequestStatusChange(userId, requestId, newStatus, menuItemName) {
        try {
            let title, message;
            
            switch (newStatus) {
                case 'Confirmed':
                    title = 'Request Confirmed!';
                    message = `Your request for "${menuItemName}" has been confirmed and is being prepared.`;
                    break;
                case 'Completed':
                    title = 'Request Completed!';
                    message = `Your request for "${menuItemName}" has been completed and is ready!`;
                    break;
                case 'Cancelled':
                    title = 'Request Cancelled';
                    message = `Your request for "${menuItemName}" has been cancelled. Please contact us if you have questions.`;
                    break;
                default:
                    return; // Don't notify for other status changes
            }

            await this.createNotification(
                userId,
                title,
                message,
                'REQUEST_STATUS',
                requestId
            );
        } catch (error) {
            console.error('Error creating request status notification:', error);
        }
    }

    // Notify about payment updates
    static async notifyPaymentUpdate(userId, invoiceId, amount, status) {
        try {
            let title, message;
            
            switch (status) {
                case 'Paid':
                    title = 'Payment Received!';
                    message = `Your payment of $${amount.toFixed(2)} has been successfully processed.`;
                    break;
                case 'Unpaid':
                    title = 'Payment Due';
                    message = `You have an outstanding payment of $${amount.toFixed(2)}. Please settle your bill.`;
                    break;
                case 'Overdue':
                    title = 'Payment Overdue';
                    message = `Your payment of $${amount.toFixed(2)} is overdue. Please contact us immediately.`;
                    break;
                default:
                    return;
            }

            await this.createNotification(
                userId,
                title,
                message,
                'PAYMENT_UPDATE',
                invoiceId
            );
        } catch (error) {
            console.error('Error creating payment notification:', error);
        }
    }

    // Notify about new booking (for guests who made the booking)
    static async notifyNewBooking(userId, reservationId, roomNumber, checkInDate, checkOutDate) {
        try {
            await this.createNotification(
                userId,
                'Booking Created!',
                `Your booking for Room ${roomNumber} from ${new Date(checkInDate).toLocaleDateString()} to ${new Date(checkOutDate).toLocaleDateString()} has been created and is pending confirmation.`,
                'BOOKING_CONFIRMED',
                reservationId
            );
        } catch (error) {
            console.error('Error creating new booking notification:', error);
        }
    }

    // Notify admins about new guest food orders
    static async notifyAdminNewOrder(guestName, menuItemName, quantity, requestId) {
        try {
            // Get all admin users
            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN' }
            });

            const title = 'New Food Order!';
            const message = `${guestName} has ordered ${quantity}x "${menuItemName}". Please review and confirm the request.`;

            // Create notifications for all admins
            const notifications = admins.map(admin => ({
                userId: admin.id,
                title,
                message,
                type: 'NEW_ORDER',
                relatedId: requestId
            }));

            await prisma.notification.createMany({
                data: notifications
            });

            console.log(`Created new order notifications for ${admins.length} admins`);
        } catch (error) {
            console.error('Error creating new order notifications for admins:', error);
        }
    }
}

export default NotificationService;
