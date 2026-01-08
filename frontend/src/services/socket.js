import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

let socket = null;

export const initializeSocket = () => {
  if (socket?.connected) {
    return socket;
  }

  const { token } = useAuthStore.getState();
  
  if (!token) {
    console.warn('No token available for socket connection');
    return null;
  }
  
  try {
    // In Docker, nginx proxies /socket.io to backend, so use relative URL
    // In development, use full URL
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
    socket = io(socketUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return socket;
  } catch (error) {
    console.error('Error initializing socket:', error);
    return null;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export default getSocket;



