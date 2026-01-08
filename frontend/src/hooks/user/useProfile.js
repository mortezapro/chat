import { useState, useEffect } from 'react';
import api from '@/services/api';

export const useProfile = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sharedChats, setSharedChats] = useState([]);
  const [sharedMedia, setSharedMedia] = useState([]);

  const fetchUser = async (id) => {
    if (!id || id === 'undefined') {
      setLoading(false);
      setError('شناسه کاربر معتبر نیست');
      return;
    }
    try {
      setLoading(true);
      console.log('[useProfile] Fetching user:', id);
      const response = await api.get(`/users/${id}`);
      console.log('[useProfile] User fetched:', {
        id: response.data.user?._id || response.data.user?.id,
        avatar: response.data.user?.avatar,
        hasAvatar: !!response.data.user?.avatar
      });
      setUser(response.data.user);
      setError('');
    } catch (err) {
      console.error('[useProfile] Error fetching user:', err);
      setError('خطا در بارگذاری پروفایل');
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedChats = async (id) => {
    if (!id || id === 'undefined') {
      setSharedChats([]);
      return;
    }
    try {
      const response = await api.get(`/users/${id}/shared-chats`);
      setSharedChats(response.data.chats || []);
    } catch (err) {
      console.error('Error fetching shared chats:', err);
      setSharedChats([]);
    }
  };

  const fetchSharedMedia = async (id) => {
    if (!id || id === 'undefined') {
      setSharedMedia([]);
      return;
    }
    try {
      const response = await api.get(`/users/${id}/shared-media`);
      setSharedMedia(response.data.media || []);
    } catch (err) {
      console.error('Error fetching shared media:', err);
      setSharedMedia([]);
    }
  };

  useEffect(() => {
    if (userId && userId !== 'undefined') {
      fetchUser(userId);
      fetchSharedChats(userId);
      fetchSharedMedia(userId);
    } else {
      setLoading(false);
      setError('شناسه کاربر معتبر نیست');
      setSharedChats([]);
      setSharedMedia([]);
    }
  }, [userId]);

  const refetch = () => {
    if (userId && userId !== 'undefined') {
      console.log('[useProfile] Refetching user data:', userId);
      fetchUser(userId);
      fetchSharedChats(userId);
      fetchSharedMedia(userId);
    } else {
      console.warn('[useProfile] Cannot refetch - invalid userId:', userId);
    }
  };

  return { user, loading, error, sharedChats, sharedMedia, refetch };
};

