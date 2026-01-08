import { useState, useCallback } from 'react';
import { getSocket } from '@/services/socket';
import api from '@/services/api';

export const useChatActions = (chatId) => {
  const [error, setError] = useState('');

  const sendMessage = useCallback(async (data) => {
    try {
      const socket = getSocket();
      const messageData = typeof data === 'string'
        ? { content: data, type: 'text' }
        : { ...data, type: 'text' };

      socket.emit('message:send', {
        chatId,
        ...messageData,
        replyTo: messageData.replyTo || (typeof data === 'object' ? data.replyTo : null)
      });
    } catch (err) {
      setError('خطا در ارسال پیام');
    }
  }, [chatId]);

  const sendVoice = useCallback(async (audioBlob, replyToId) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice.webm');

      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const socket = getSocket();
      socket.emit('message:send', {
        chatId,
        content: 'پیام صوتی',
        type: 'audio',
        media: {
          url: uploadResponse.data.file.url,
          mimeType: uploadResponse.data.file.mimetype,
          size: uploadResponse.data.file.size
        },
        replyTo: replyToId
      });
    } catch (err) {
      setError('خطا در ارسال پیام صوتی');
    }
  }, [chatId]);

  const sendFile = useCallback(async (file, replyToId) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      let messageType = 'file';
      if (file.type.startsWith('image/')) {
        messageType = 'image';
      } else if (file.type.startsWith('video/')) {
        messageType = 'video';
      } else if (file.type.startsWith('audio/')) {
        messageType = 'audio';
      }

      const socket = getSocket();
      socket.emit('message:send', {
        chatId,
        content: file.name,
        type: messageType,
        media: {
          url: uploadResponse.data.file.url,
          mimeType: uploadResponse.data.file.mimetype,
          size: uploadResponse.data.file.size
        },
        replyTo: replyToId
      });
    } catch (err) {
      setError('خطا در ارسال فایل');
    }
  }, [chatId]);

  const sendLocation = useCallback(async (location, replyToId) => {
    try {
      const socket = getSocket();
      socket.emit('message:send', {
        chatId,
        content: location.address || `${location.latitude}, ${location.longitude}`,
        type: 'location',
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address
        },
        replyTo: replyToId
      });
    } catch (err) {
      setError('خطا در ارسال موقعیت');
    }
  }, [chatId]);

  const handleTyping = useCallback((isTyping) => {
    const socket = getSocket();
    socket.emit('message:typing', {
      chatId,
      isTyping
    });
  }, [chatId]);

  return {
    sendMessage,
    sendVoice,
    sendFile,
    sendLocation,
    handleTyping,
    error
  };
};

