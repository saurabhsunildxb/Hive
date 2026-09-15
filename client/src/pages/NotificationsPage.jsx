import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Button from '../components/ui/Button';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/notifications');
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('[Notifications Fetch Error]', err.message);
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.patch('/notifications/read-all');
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
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
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('[Mark Read Error]', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay updated on task assignments, status changes, and comments.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllAsRead}>
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
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
              description="Notifications for task assignments, status updates, and comments will appear here."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  !item.read ? 'bg-indigo-50/40' : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      !item.read ? 'bg-indigo-600' : 'bg-transparent'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{item.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      {item.actor && <span>by {item.actor.name}</span>}
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {!item.read && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 shrink-0 cursor-pointer"
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
