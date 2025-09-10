import { useState, useEffect, useRef } from 'react';
import { Bell, X, Clock, CreditCard, Calendar, Utensils, RotateCcw, Trash2, CheckCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import http from '../../features/shared/services/http.js';
import { formatDate } from '../../utils/dateUtils.js';

function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasNewNotifications, setHasNewNotifications] = useState(false);
    const [lastNotificationCount, setLastNotificationCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await http.get('/guest/notifications');
                
                // Check for new notifications
                const currentUnreadCount = data.filter(n => !n.isRead).length;
                if (currentUnreadCount > lastNotificationCount && lastNotificationCount > 0) {
                    setHasNewNotifications(true);
                    // Show new notification indicator until user interacts
                }
                setLastNotificationCount(currentUnreadCount);
                setNotifications(data);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        
        // Set up polling for real-time notifications
        const pollInterval = setInterval(fetchData, 10000); // Poll every 10 seconds
        
        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            clearInterval(pollInterval);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [lastNotificationCount]);


    async function refreshNotifications() {
        try {
            setIsRefreshing(true);
            const data = await http.get('/guest/notifications');
            setNotifications(data);
        } catch (error) {
            console.error('Failed to refresh notifications:', error);
        } finally {
            setIsRefreshing(false);
        }
    }

    async function markAsRead(notificationId) {
        try {
            await http.put(`/guest/notifications/${notificationId}/read`);
            setNotifications(prev => 
                prev.map(notif => 
                    notif.id === notificationId ? { ...notif, isRead: true } : notif
                )
            );
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    async function markAllAsRead() {
        try {
            await http.put('/guest/notifications/read-all');
            setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }

    async function deleteNotification(notificationId) {
        try {
            await http.delete(`/guest/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            toast.success('Notification deleted');
        } catch (error) {
            console.error('Failed to delete notification:', error);
            toast.error('Failed to delete notification');
        }
    }

    async function deleteAllNotifications() {
        if (!confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
            return;
        }
        
        try {
            await http.delete('/guest/notifications');
            setNotifications([]);
            toast.success('All notifications deleted');
        } catch (error) {
            console.error('Failed to delete all notifications:', error);
            toast.error('Failed to delete all notifications');
        }
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'MENU_UPDATE':
                return <Utensils size={16} className="text-orange-500" />;
            case 'BOOKING_CONFIRMED':
                return <Calendar size={16} className="text-green-500" />;
            case 'REQUEST_STATUS':
                return <Clock size={16} className="text-blue-500" />;
            case 'PAYMENT_UPDATE':
                return <CreditCard size={16} className="text-purple-500" />;
            default:
                return <Bell size={16} className="text-gray-500" />;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'MENU_UPDATE':
                return 'bg-orange-100';
            case 'BOOKING_CONFIRMED':
                return 'bg-green-100';
            case 'REQUEST_STATUS':
                return 'bg-blue-100';
            case 'PAYMENT_UPDATE':
                return 'bg-purple-100';
            default:
                return 'bg-gray-100';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
                <Bell size={20} className={`${unreadCount > 0 || hasNewNotifications ? 'animate-pulse' : ''} ${hasNewNotifications ? 'text-emerald-600' : ''}`} />
                {unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium transition-colors ${hasNewNotifications ? 'bg-emerald-500 animate-bounce' : 'bg-red-500'}`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                {hasNewNotifications && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 sm:max-h-96 overflow-hidden">
                    <div className="p-2 sm:p-3 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-800">Notifications</h3>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <button
                                    onClick={refreshNotifications}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    title="Refresh notifications"
                                >
                                    <RotateCcw size={12} className={`sm:w-3.5 sm:h-3.5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </button>
                                {notifications.some(n => !n.isRead) && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-[10px] sm:text-xs text-emerald-600 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
                                    >
                                        <CheckCheck size={12} />
                                        Mark all read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={deleteAllNotifications}
                                        className="text-[10px] sm:text-xs text-red-600 hover:text-red-800 font-medium inline-flex items-center gap-1"
                                    >
                                        <Trash2 size={12} />
                                        Delete all
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="max-h-64 sm:max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-6 sm:py-8">
                                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-gray-500">
                                <Bell size={20} className="sm:w-6 sm:h-6 mx-auto mb-2 opacity-50" />
                                <p className="text-xs sm:text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`group p-2 sm:p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                                            !notification.isRead ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                                        }`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                                                getNotificationColor(notification.type)
                                            }`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                                                    {notification.title}
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                                                    {formatDate(notification.createdAt)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {!notification.isRead && (
                                                    <div className="flex-shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                                                )}
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification.id);
                                                    }}
                                                    className="ml-1 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete notification"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
