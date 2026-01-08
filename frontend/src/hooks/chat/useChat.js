import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { getSocket } from '@/services/socket';
import { notificationService } from '@/services/notifications';

export const useChat = (chatId, user, navigate) => {
  const [chat, setChat] = useState(null);
  const [error, setError] = useState('');

  const fetchChat = useCallback(async () => {
    try {
      const response = await api.get(`/chats/${chatId}`);
      setChat(response.data.chat);
      setError('');
    } catch (err) {
      setError('خطا در بارگذاری چت');
    }
  }, [chatId]);

  useEffect(() => {
    if (chatId) {
      fetchChat();
    }
  }, [chatId, fetchChat]);

  return { chat, error, refetch: fetchChat };
};

export const useChatSocket = (chatId, user, navigate, onNewMessage, onMessageUpdated, onMessageDeleted) => {
  useEffect(() => {
    if (!chatId) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit('join:chat', { chatId });

    const chatTitle = 'چت';

    const handleNewMessage = (message) => {
      if (message.chat === chatId) {
        onNewMessage(message);
        if (message.sender?._id !== user?.id) {
          socket.emit('message:read', {
            messageId: message._id,
            chatId
          });
          if (document.hidden) {
            notificationService.showMessageNotification(
              message,
              chatTitle,
              () => {
                window.focus();
                navigate(`/chat/${chatId}`);
              }
            );
          }
        }
      }
    };

    const handleMentioned = (data) => {
      if (data.chatId === chatId) {
        notificationService.showMentionNotification(
          data,
          chatTitle,
          () => {
            window.focus();
            navigate(`/chat/${chatId}`);
            setTimeout(() => {
              const element = document.getElementById(`message-${data.messageId}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.style.backgroundColor = 'rgba(25, 118, 210, 0.2)';
                setTimeout(() => {
                  element.style.backgroundColor = '';
                }, 3000);
              }
            }, 500);
          }
        );
      }
    };

    const handleUpdated = (updatedMessage) => {
      if (updatedMessage.chat === chatId) {
        onMessageUpdated(updatedMessage);
      }
    };

    const handleDeleted = (deletedMessageId) => {
      onMessageDeleted(deletedMessageId);
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:mentioned', handleMentioned);
    socket.on('message:updated', handleUpdated);
    socket.on('message:deleted', handleDeleted);

    return () => {
      socket.emit('leave:chat', { chatId });
      socket.off('message:new', handleNewMessage);
      socket.off('message:mentioned', handleMentioned);
      socket.off('message:updated', handleUpdated);
      socket.off('message:deleted', handleDeleted);
    };
  }, [chatId, user?.id, navigate, onNewMessage, onMessageUpdated, onMessageDeleted]);
};

