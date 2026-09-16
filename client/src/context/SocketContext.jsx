import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

export function SocketProvider({ children }) {
  const { isAuthenticated, token } = useAuth();

  const socketRef = useRef(null);
  const roomsRef = useRef(new Set());

  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      roomsRef.current.clear();

      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setConnected(false);
      setConnectionError(null);

      return undefined;
    }

    const nextSocket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = nextSocket;

    const joinActiveRooms = () => {
      roomsRef.current.forEach((room) => {
        const separatorIndex = room.indexOf(':');

        if (separatorIndex === -1) return;

        const type = room.slice(0, separatorIndex);
        const id = room.slice(separatorIndex + 1);

        if (!id) return;

        const event =
          type === 'workspace'
            ? 'workspace:join'
            : type === 'project'
              ? 'project:join'
              : null;

        if (event) {
          nextSocket.emit(event, id);
        }
      });
    };

    const handleConnect = () => {
      setConnected(true);
      setConnectionError(null);
      joinActiveRooms();
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleConnectError = (err) => {
      setConnected(false);
      setConnectionError(
        err?.message || 'Socket connection failed.'
      );
    };

    nextSocket.on('connect', handleConnect);
    nextSocket.on('disconnect', handleDisconnect);
    nextSocket.on('connect_error', handleConnectError);

    return () => {
      nextSocket.off('connect', handleConnect);
      nextSocket.off('disconnect', handleDisconnect);
      nextSocket.off('connect_error', handleConnectError);

      nextSocket.removeAllListeners();
      nextSocket.disconnect();

      if (socketRef.current === nextSocket) {
        socketRef.current = null;
      }

      setConnected(false);
    };
  }, [isAuthenticated, token]);

  const joinWorkspace = useCallback((workspaceId) => {
    if (!workspaceId) return;

    const room = `workspace:${workspaceId}`;

    roomsRef.current.add(room);

    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      return;
    }

    socket.emit('workspace:join', workspaceId);
  }, []);

  const leaveWorkspace = useCallback((workspaceId) => {
    if (!workspaceId) return;

    const room = `workspace:${workspaceId}`;

    roomsRef.current.delete(room);

    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      return;
    }

    socket.emit('workspace:leave', workspaceId);
  }, []);

  const joinProject = useCallback((projectId) => {
    if (!projectId) return;

    const room = `project:${projectId}`;

    roomsRef.current.add(room);

    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      return;
    }

    socket.emit('project:join', projectId);
  }, []);

  const leaveProject = useCallback((projectId) => {
    if (!projectId) return;

    const room = `project:${projectId}`;

    roomsRef.current.delete(room);

    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      return;
    }

    socket.emit('project:leave', projectId);
  }, []);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
      connectionError,
      joinWorkspace,
      leaveWorkspace,
      joinProject,
      leaveProject,
    }),
    [
      connected,
      connectionError,
      joinWorkspace,
      leaveWorkspace,
      joinProject,
      leaveProject,
    ]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error(
      'useSocket must be used within a SocketProvider'
    );
  }

  return context;
}