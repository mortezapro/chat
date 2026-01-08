import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/services/api';
import { getSocket } from '@/services/socket';

export const useChatMessages = (chatId, chatType, user) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  const fetchMessages = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      const response = await api.get(`/messages/${chatId}?page=${pageNum}&limit=50`);
      const newMessages = response.data.messages;

      if (append) {
        setMessages((prev) => [...newMessages, ...prev]);
      } else {
        setMessages(newMessages);
      }

      setHasMore(newMessages.length === 50);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    if (chatId) {
      fetchMessages(1);
    }
  }, [chatId, fetchMessages]);

  useEffect(() => {
    if (!chatId) return;

    const socket = getSocket();
    if (!socket) return;

    const handleTyping = (data) => {
      if (data.chatId === chatId && data.userId !== user?.id) {
        setTypingUsers((prev) => {
          const exists = prev.find((u) => u.userId === data.userId);
          if (data.isTyping && !exists) {
            return [...prev, { userId: data.userId, isTyping: true }];
          } else if (!data.isTyping) {
            return prev.filter((u) => u.userId !== data.userId);
          }
          return prev;
        });

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
        }, 3000);
      }
    };

    const handleUserOnline = (data) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.sender?._id === data.userId) {
            return { ...msg, sender: { ...msg.sender, isOnline: true } };
          }
          return msg;
        })
      );
    };

    const handleUserOffline = (data) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.sender?._id === data.userId) {
            return { ...msg, sender: { ...msg.sender, isOnline: false } };
          }
          return msg;
        })
      );
    };

    const handleMessageSeen = (data) => {
      if (data.messageId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg._id === data.messageId) {
              const updatedReadBy = msg.readBy || [];
              const existingRead = updatedReadBy.find(
                (r) => (r.user?._id || r.user) === data.userId
              );
              if (!existingRead) {
                updatedReadBy.push({
                  user: { _id: data.userId },
                  readAt: data.readAt
                });
              }
              return { ...msg, readBy: updatedReadBy };
            }
            return msg;
          })
        );
      }
    };

    socket.on('message:typing', handleTyping);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('message:seen', handleMessageSeen);

    return () => {
      socket.off('message:typing', handleTyping);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('message:seen', handleMessageSeen);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId, user?.id]);

  useEffect(() => {
    if ((chatType === 'group' || chatType === 'channel') && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.sender?._id !== user?.id) {
        const isAlreadySeen = lastMessage.readBy?.some(
          (r) => (r.user?._id || r.user) === user?.id
        );
        if (!isAlreadySeen) {
          api.post(`/messages/${lastMessage._id}/seen`).catch(() => { });
        }
      }
    }
  }, [messages, chatType, user?.id]);

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(nextPage, true);
    }
  }, [hasMore, loading, page, fetchMessages]);

  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateMessage = useCallback((updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      )
    );
  }, []);

  const deleteMessage = useCallback((deletedMessageId) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === deletedMessageId ? { ...msg, isDeleted: true, content: 'این پیام حذف شده است' } : msg
      )
    );
  }, []);

  return {
    messages,
    loading,
    hasMore,
    typingUsers,
    loadMoreMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    refetch: () => fetchMessages(1)
  };
};

