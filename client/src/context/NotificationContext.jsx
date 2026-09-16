import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const [unreadCount, setUnreadCount] = useState(0);
  const seenIdsRef = useRef(new Set());

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/notifications?limit=1');
      if (response.success && response.data) {
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('[NotificationContext] Failed to fetch unread count:', err.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      seenIdsRef.current.clear();
      return;
    }

    refreshUnreadCount();
  }, [isAuthenticated, refreshUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated || !socket) return;

    const handleNotificationNew = (notification) => {
      if (!notification || !notification.id) return;

      if (seenIdsRef.current.has(notification.id)) {
        return;
      }
      seenIdsRef.current.add(notification.id);

      // Keep seenIdsRef set bounded in size
      if (seenIdsRef.current.size > 200) {
        const arr = Array.from(seenIdsRef.current).slice(-100);
        seenIdsRef.current = new Set(arr);
      }

      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleNotificationRead = () => {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const handleNotificationReadAll = () => {
      setUnreadCount(0);
    };

    socket.on('notification:new', handleNotificationNew);
    socket.on('notification:read', handleNotificationRead);
    socket.on('notification:read-all', handleNotificationReadAll);

    return () => {
      socket.off('notification:new', handleNotificationNew);
      socket.off('notification:read', handleNotificationRead);
      socket.off('notification:read-all', handleNotificationReadAll);
    };
  }, [isAuthenticated, socket]);

  const value = {
    unreadCount,
    refreshUnreadCount,
    setUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
