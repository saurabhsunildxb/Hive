import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Button from '../components/ui/Button';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { socket } = useSocket();
  const { unreadCount, refreshUnreadCount } = useNotifications();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/notifications');
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
        refreshUnreadCount();
      }
    } catch (err) {
      console.error('[Notifications Fetch Error]', err.message);
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;

    const handleNotificationNew = (notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev].slice(0, 20);
      });
    };

    const handleNotificationRead = ({ id }) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    };

    const handleNotificationReadAll = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    socket.on('notification:new', handleNotificationNew);
    socket.on('notification:read', handleNotificationRead);
    socket.on('notification:read-all', handleNotificationReadAll);

    return () => {
      socket.off('notification:new', handleNotificationNew);
      socket.off('notification:read', handleNotificationRead);
      socket.off('notification:read-all', handleNotificationReadAll);
    };
  }, [socket]);

  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.patch('/notifications/read-all');
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        refreshUnreadCount();
      }
    } catch (err) {
      console.error('[Mark All Read Error]', err.message);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        refreshUnreadCount();
      }
    } catch (err) {
      console.error('[Mark Read Error]', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay updated on task assignments, status changes, and team comments in real time.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllAsRead}>
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="md" />
          </div>
        ) : error ? (
          <div className="p-6 space-y-4">
            <ErrorMessage message={error} />
            <Button variant="secondary" size="sm" onClick={fetchNotifications}>
              Retry Loading Notifications
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No notifications yet"
              description="Notifications for task assignments, status updates, and comments will appear here in real time."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 p-2 sm:p-4 space-y-2.5">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  !item.read
                    ? 'bg-indigo-50/40 border-indigo-200/80 shadow-2xs'
                    : 'bg-white border-slate-200/70 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                      !item.read
                        ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                        : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    {item.actor?.name ? item.actor.name.charAt(0).toUpperCase() : 'N'}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm tracking-tight ${!item.read ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                      {item.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      {item.actor && (
                        <span className="font-semibold text-slate-700">by {item.actor.name}</span>
                      )}
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>

                {!item.read && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100/60 px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer border border-indigo-200/80"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
