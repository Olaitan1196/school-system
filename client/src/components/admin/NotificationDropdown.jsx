import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../../hooks/useNotifications';

const typeIcon = (type) => {
    const icons = {
        payment_received: '💰',
        payment_approved: '✅',
        payment_rejected: '❌',
        result_available: '📋',
        token_generated: '🔑',
        invoice_generated: '🧾',
        exam_scheduled: '📅',
        exam_started: '🖥️',
        result_published: '📢',
        attendance_alert: '📍',
        promotion_done: '🎓',
        book_overdue: '📚',
        fee_reminder: '💳',
        system_alert: '⚠️',
        general: '🔔',
    };
    return icons[type] || '🔔';
};

const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationDropdown = () => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) markAsRead(notification.id);
        if (notification.action_url) navigate(notification.action_url);
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>

            {/* BELL BUTTON */}
            <button
                onClick={() => setOpen(prev => !prev)}
                className="relative p-2 rounded-lg hover:bg-purple-50 transition-colors"
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold px-0.5">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {/* DROPDOWN PANEL */}
            {open && (
                <div className="absolute right-0 top-12 w-80 bg-white border border-purple-100 rounded-xl shadow-xl z-50 overflow-hidden">

                    {/* HEADER */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-purple-50">
                        <h3 className="font-semibold text-purple-900 text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-purple-500 hover:text-purple-700 transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* LIST */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center text-purple-300 text-sm">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-purple-50 transition-colors border-b border-purple-50 last:border-0 ${!n.is_read ? 'bg-purple-50/60' : ''}`}
                                >
                                    <span className="text-lg mt-0.5">{typeIcon(n.notification_type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${!n.is_read ? 'font-semibold text-purple-900' : 'text-purple-700'}`}>
                                            {n.title}
                                        </p>
                                        <p className="text-xs text-purple-400 mt-0.5 line-clamp-2">{n.message}</p>
                                        <p className="text-[10px] text-purple-300 mt-1">{timeAgo(n.created_at)}</p>
                                    </div>
                                    {!n.is_read && (
                                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;