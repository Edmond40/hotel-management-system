import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Mail, User, LogOut, Settings, ChevronDown, X, Trash2, CheckCheck, PanelLeftClose, UserRound, Cog } from 'lucide-react';
import { toast } from 'react-toastify';
import http from '../../features/shared/services/http.js';
import { useAuth } from '../../features/shared/auth/AuthProvider.jsx';

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  return { open, setOpen, ref };
}

function Topbar({ collapsed, onToggleSidebar }) {
  const navigate = useNavigate();
  const { signout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [emails, setEmails] = useState([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  const notifDd = useDropdown();
  const mailDd = useDropdown();
  const profileDd = useDropdown();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notifsData, emailsData] = await Promise.all([
          http.get('/admin/notifications'),
          http.get('/admin/emails')
        ]);
        
        // Check for new notifications
        const currentUnreadCount = notifsData.filter(n => !n.read).length;
        if (currentUnreadCount > lastNotificationCount && lastNotificationCount > 0) {
          setHasNewNotifications(true);
          // Auto-clear the new notification indicator after 5 seconds
          setTimeout(() => setHasNewNotifications(false), 5000);
        }
        setLastNotificationCount(currentUnreadCount);
        
        setNotifications(notifsData);
        setEmails(emailsData);
      } catch (error) {
        console.error('Failed to fetch notifications/emails:', error);
      }
    };

    fetchData();
    
    // Set up polling for real-time notifications
    const pollInterval = setInterval(fetchData, 30000); // Poll every 30 seconds
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [lastNotificationCount]);


  async function markAllNotificationsRead() {
    try {
      await http.post('/admin/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }

  async function markAllEmailsRead() {
    try {
      await http.post('/admin/emails/read');
      setEmails(prev => prev.map(e => ({ ...e, read: true })));
    } catch (error) {
      console.error('Failed to mark emails as read:', error);
    }
  }

  async function deleteNotification(notificationId) {
    try {
      await http.delete(`/admin/notifications/${notificationId}`);
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
      await http.delete('/admin/notifications');
      setNotifications([]);
      toast.success('All notifications deleted');
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      toast.error('Failed to delete all notifications');
    }
  }

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const unreadEmails = emails.filter((e) => !e.read).length;

  async function handleLogout() {
    await signout();
    profileDd.setOpen(false);
    navigate('/admin/signin');
  }

  return (
    <header className="fixed top-0 right-0 bg-white shadow-sm border-b border-slate-200 px-3 sm:px-6 py-3 z-40 duration-500"
      style={{
        left: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (collapsed ? '5rem' : '14rem') : '0'
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={onToggleSidebar} className="hidden lg:flex p-2   hover:bg-slate-100 rounded-md transition-colors">
            <PanelLeftClose size={20} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
          <h1 className="text-base sm:text-lg md:text-xl font-semibold text-slate-800 ml-12 lg:ml-0 truncate">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 ">
          {/* Notifications */}
          <div className="relative" ref={notifDd.ref}>
            <button
              className="relative p-2 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Notifications"
              onClick={() => notifDd.setOpen((v) => !v)}
            >
              <Bell size={18} className={`sm:w-5 sm:h-5 text-slate-600 ${unreadNotifs > 0 || hasNewNotifications ? 'animate-pulse' : ''} ${hasNewNotifications ? 'text-emerald-600' : ''}`} />
              {unreadNotifs > 0 && (
                <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs transition-colors ${hasNewNotifications ? 'bg-emerald-500 animate-bounce' : 'bg-red-500'}`}>
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
              {hasNewNotifications && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
              )}
            </button>
            {notifDd.open && (
              <div className="absolute right-0 mt-2 w-64 sm:w-72 md:w-80 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50 max-h-96">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50">
                  <span className="text-sm font-medium text-slate-700">Notifications</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { markAllNotificationsRead(); notifDd.setOpen(false); }} className="text-xs inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700">
                      <CheckCheck size={14} /> Mark all read
                    </button>
                    <button onClick={() => { deleteAllNotifications(); notifDd.setOpen(false); }} className="text-xs inline-flex items-center gap-1 text-red-600 hover:text-red-700">
                      <Trash2 size={14} /> Delete all
                    </button>
                  </div>
                </div>
                <ul className="max-h-64 overflow-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <li key={n.id} className={`px-3 py-2 border-t first:border-t-0 hover:bg-slate-50 ${!n.read ? 'bg-blue-50' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-slate-800">{n.text}</p>
                            <span className="text-xs text-slate-500">{n.time} ago</span>
                          </div>
                          <button 
                            onClick={() => deleteNotification(n.id)}
                            className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Delete notification"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-4 text-center text-slate-500 text-sm">No notifications</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Messages - Hidden on small screens */}
          <div ref={mailDd.ref} className="relative hidden sm:block">
            <button
              className="relative p-2 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Email"
              onClick={() => mailDd.setOpen((v) => !v)}
            >
              <Mail size={18} className="sm:w-5 sm:h-5 text-slate-600" />
              {unreadEmails > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs">
                  {unreadEmails > 9 ? '9+' : unreadEmails}
                </span>
              )}
            </button>
            {mailDd.open && (
              <div className="absolute right-0 mt-2 w-64 sm:w-72 md:w-80 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50 max-h-96">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50">
                  <span className="text-sm font-medium text-slate-700">Recent Emails</span>
                  <button onClick={() => { markAllEmailsRead(); mailDd.setOpen(false); }} className="text-xs inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700">
                    <CheckCheck size={14} /> Mark all read
                  </button>
                </div>
                <ul className="max-h-64 overflow-auto">
                  {emails.length > 0 ? (
                    emails.map((m) => (
                      <li key={m.id} className={`px-3 py-2 border-t first:border-t-0 hover:bg-slate-50 ${!m.read ? 'bg-blue-50' : ''}`}>
                        <p className="text-sm text-slate-800">{m.subject}</p>
                        <span className="text-xs text-slate-500">{m.from}</span>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-4 text-center text-slate-500 text-sm">No emails</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileDd.ref}>
            <button
              className="flex items-center gap-1 sm:gap-2 p-2 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Profile"
              onClick={() => profileDd.setOpen((v) => !v)}
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <User size={14} className="sm:w-4 sm:h-4 text-emerald-600" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-700 hidden sm:inline">Admin</span>
            </button>
            {profileDd.open && (
              <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50">
                <ul>
                  <li>
                    <button onClick={() => { navigate('/profile'); profileDd.setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2 text-slate-700">
                      <UserRound size={16} /> Profile
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { navigate('/settings'); profileDd.setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2 text-slate-700">
                      <Cog size={16} /> Settings
                    </button>
                  </li>
                  <li className="border-t">
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2 text-rose-600">
                      <LogOut size={16} /> Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
