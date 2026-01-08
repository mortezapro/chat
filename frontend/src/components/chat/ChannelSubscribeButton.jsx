import { useState, useEffect } from 'react';
import { Button, Chip } from '@mui/material';
import { Notifications, NotificationsOff } from '@mui/icons-material';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const ChannelSubscribeButton = ({ chat, onUpdate }) => {
  const { user } = useAuthStore();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (chat?.subscribers) {
      const subscriber = chat.subscribers.find(
        s => (s.user?._id || s.user) === user?.id
      );
      setIsSubscribed(!!subscriber);
    } else if (chat?.participants?.some(p => (p._id || p) === user?.id)) {
      setIsSubscribed(true);
    }
  }, [chat, user]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await api.post(`/channels/${chat._id}/subscribe`);
      setIsSubscribed(true);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('خطا در عضویت در کانال');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!window.confirm('آیا از لغو عضویت مطمئن هستید؟')) {
      return;
    }
    setLoading(true);
    try {
      await api.post(`/channels/${chat._id}/unsubscribe`);
      setIsSubscribed(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error unsubscribing:', error);
      alert('خطا در لغو عضویت');
    } finally {
      setLoading(false);
    }
  };

  if (!chat || chat.type !== 'channel') {
    return null;
  }

  const isOwner = chat.createdBy?._id === user?.id || chat.createdBy === user?.id;
  const isAdmin = chat.admins?.some(a => a._id === user?.id || a === user?.id) || isOwner;

  if (isOwner || isAdmin) {
    return (
      <Chip
        label={isOwner ? 'صاحب کانال' : 'ادمین'}
        color="primary"
        size="small"
      />
    );
  }

  return (
    <Button
      variant={isSubscribed ? 'outlined' : 'contained'}
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      disabled={loading}
      startIcon={isSubscribed ? <NotificationsOff /> : <Notifications />}
      size="small"
    >
      {isSubscribed ? 'لغو عضویت' : 'عضویت در کانال'}
    </Button>
  );
};

export default ChannelSubscribeButton;


