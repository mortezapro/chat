import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { getSocket } from '@/services/socket';

export const useChats = (activityFilter) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activityFilter) {
        params.append('activityFilter', activityFilter);
      }
      const response = await api.get(`/chats?${params.toString()}`);
      setChats(response.data.chats || []);
      setError('');
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError('خطا در بارگذاری چت‌ها');
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, [activityFilter]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = () => {
      fetchChats();
    };

    socket.on('message:new', handleNewMessage);
    socket.on('chat:new', handleNewMessage);
    socket.on('chat:updated', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('chat:new', handleNewMessage);
      socket.off('chat:updated', handleNewMessage);
    };
  }, [fetchChats]);

  return { chats, loading, error, refetch: fetchChats };
};

