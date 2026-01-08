import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Avatar,
  Typography,
  AppBar,
  Toolbar,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ArrowForward,
  MoreVert,
  Menu,
  Phone,
  Videocam,
  Info,
  Search,
  Block,
  Archive,
  NotificationsOff,
  Folder,
  Summarize,
  FontDownload,
  ColorLens,
  Settings,
  BarChart,
  Campaign,
  CenterFocusStrong,
  Delete,
  Close
} from '@mui/icons-material';
import MobileMessageList from '@/components/mobile/chat/MobileMessageList';
import MobileMessageInput from '@/components/mobile/chat/MobileMessageInput';
import TypingIndicator from '@/components/chat/message/TypingIndicator';
import GroupSettingsDialog from '@/components/chat/dialogs/GroupSettingsDialog';
import ChannelSettingsDialog from '@/components/chat/dialogs/ChannelSettingsDialog';
import ChannelStatsDialog from '@/components/chat/dialogs/ChannelStatsDialog';
import ChannelSubscribeButton from '@/components/chat/ChannelSubscribeButton';
import AdvancedSearchDialog from '@/components/chat/dialogs/AdvancedSearchDialog';
import MessageSummaryDialog from '@/components/chat/dialogs/MessageSummaryDialog';
import FontSettingsDialog from '@/components/chat/dialogs/FontSettingsDialog';
import FileGallery from '@/components/files/FileGallery';
import ThemeSettingsDialog from '@/components/theme/ThemeSettingsDialog';
import CallDialog from '@/components/chat/dialogs/CallDialog';
import PinnedMessages from '@/components/chat/PinnedMessages';
import FocusModeToggle from '@/components/chat/FocusModeToggle';
import PollDialog from '@/components/chat/dialogs/PollDialog';
import { useThemeSettings } from '@/components/theme/ThemeProvider';
import { MessageListSkeleton } from '@/components/common/LoadingSkeleton';
import { Skeleton } from '@mui/material';
import api from '@/services/api';
import { getSocket } from '@/services/socket';
import { useAuthStore } from '@/stores/authStore';
import { getFileUrl } from '@/utils/chatHelpers';
import { notificationService } from '@/services/notifications';
import { webrtcService } from '@/services/webrtc';

const MobileChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [channelSettingsOpen, setChannelSettingsOpen] = useState(false);
  const [channelStatsOpen, setChannelStatsOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [fontSettingsOpen, setFontSettingsOpen] = useState(false);
  const [fileGalleryOpen, setFileGalleryOpen] = useState(false);
  const [themeSettingsOpen, setThemeSettingsOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [callData, setCallData] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [quotedMessage, setQuotedMessage] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const typingTimeoutRef = useRef(null);
  const { chatBackground } = useThemeSettings();

  useEffect(() => {
    if (!chatId) return;

    fetchChat();
    fetchMessages(1);
    fetchPinnedMessages();

    const socket = getSocket();
    if (!socket) return;

    socket.emit('join:chat', { chatId });

    const handleNewMessage = (message) => {
      if (message?.chat === chatId || message?.chat?._id === chatId) {
        setMessages((prev) => [...prev, message]);
        if (message?.sender && (message.sender._id || message.sender.id) !== (user?.id || user?._id)) {
          if (message._id) {
            const socket = getSocket();
            socket.emit('message:read', {
              messageId: message._id,
              chatId
            });
          }
          if (document.hidden) {
            const chatTitle = chat?.name || (chat?.type === 'private' && chat?.participants?.length > 0
              ? (() => {
                const otherParticipant = chat.participants.find((p) => (p._id || p)?.toString() !== (user?.id || user?._id)?.toString());
                return otherParticipant?.firstName && otherParticipant?.lastName
                  ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
                  : otherParticipant?.username || 'کاربر';
              })()
              : 'چت');
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

    const handleTyping = (data) => {
      if (data?.chatId === chatId && (data.userId || data.user?._id) !== (user?.id || user?._id)) {
        setTypingUsers((prev) => {
          const exists = prev.find((u) => (u.userId || u.user?._id) === (data.userId || data.user?._id));
          if (data.isTyping && !exists) {
            return [...prev, { userId: data.userId || data.user?._id, isTyping: true }];
          } else if (!data.isTyping) {
            return prev.filter((u) => (u.userId || u.user?._id) !== (data.userId || data.user?._id));
          }
          return prev;
        });

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => (u.userId || u.user?._id) !== (data.userId || data.user?._id)));
        }, 3000);
      }
    };

    const handleIncomingCall = (data) => {
      setIncomingCall(data);
      setCallDialogOpen(true);
    };

    const handleCallEnded = () => {
      setCallDialogOpen(false);
      setCallData(null);
      setIncomingCall(null);
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:typing', handleTyping);
    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:group-incoming', handleIncomingCall);
    socket.on('call:ended', handleCallEnded);

    webrtcService.initialize(socket, user?.id);
    webrtcService.onIncomingCall = handleIncomingCall;

    return () => {
      socket.emit('leave:chat', { chatId });
      socket.off('message:new', handleNewMessage);
      socket.off('message:typing', handleTyping);
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:group-incoming', handleIncomingCall);
      socket.off('call:ended', handleCallEnded);
      webrtcService.onIncomingCall = null;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId, user?.id, navigate]);

  const fetchChat = async () => {
    try {
      const response = await api.get(`/chats/${chatId}`);
      if (response.data?.chat) {
        setChat(response.data.chat);
      }
    } catch (err) {
      console.error('Error fetching chat:', err);
      setChat(null);
    }
  };

  const fetchMessages = async (pageNum = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      const response = await api.get(`/messages/${chatId}?page=${pageNum}&limit=50`);
      if (response.data?.messages) {
        if (append) {
          setMessages((prev) => [...response.data.messages, ...prev]);
        } else {
          setMessages(response.data.messages);
        }
        setHasMore(response.data.messages.length === 50);
      } else {
        if (!append) {
          setMessages([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (!append) {
        setMessages([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchPinnedMessages = async () => {
    try {
      const response = await api.get(`/chats/${chatId}/pinned-messages`);
      if (response.data?.messages) {
        setPinnedMessages(response.data.messages);
      }
    } catch (err) {
      // Route might not exist, ignore error
      console.error('Error fetching pinned messages:', err);
    }
  };

  const loadMoreMessages = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(nextPage, true);
    }
  };

  const setupSocket = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join:chat', { chatId });

    const handleNewMessage = (message) => {
      if (message?.chat === chatId || message?.chat?._id === chatId) {
        setMessages((prev) => [...prev, message]);
        if (message?.sender && (message.sender._id || message.sender.id) !== (user?.id || user?._id)) {
          if (message._id) {
            markMessageAsRead(message._id);
          }
          if (document.hidden) {
            notificationService.showMessageNotification(
              message,
              getChatTitle(),
              () => {
                window.focus();
                navigate(`/chat/${chatId}`);
              }
            );
          }
        }
      }
    };

    const handleTyping = (data) => {
      if (data?.chatId === chatId && (data.userId || data.user?._id) !== (user?.id || user?._id)) {
        setTypingUsers((prev) => {
          const userId = data.userId || data.user?._id;
          const exists = prev.find((u) => (u.userId || u.user?._id) === userId);
          if (data.isTyping && !exists) {
            return [...prev, { userId, isTyping: true }];
          } else if (!data.isTyping) {
            return prev.filter((u) => (u.userId || u.user?._id) !== userId);
          }
          return prev;
        });

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          const userId = data.userId || data.user?._id;
          setTypingUsers((prev) => prev.filter((u) => (u.userId || u.user?._id) !== userId));
        }, 3000);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:typing', handleTyping);
    socket.on('message:mentioned', (data) => {
      if (data.chatId === chatId) {
        notificationService.showMentionNotification(
          data,
          getChatTitle(),
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
    });
    socket.on('message:updated', (updatedMessage) => {
      if (updatedMessage?.chat === chatId || updatedMessage?.chat?._id === chatId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === updatedMessage._id ? updatedMessage : msg
          )
        );
      }
    });
    socket.on('message:deleted', (deletedMessageId) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === deletedMessageId ? { ...msg, isDeleted: true, content: 'این پیام حذف شده است' } : msg
        )
      );
    });
    socket.on('message:pinned', () => {
      fetchPinnedMessages();
    });
    socket.on('message:seen', (data) => {
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
    });
    socket.on('user:online', (data) => {
      if (chat?.participants?.some((p) => (p._id || p) === data.userId)) {
        setChat((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            (p._id || p) === data.userId ? { ...p, isOnline: true } : p
          )
        }));
      }
    });
    socket.on('user:offline', (data) => {
      if (chat?.participants?.some((p) => (p._id || p) === data.userId)) {
        setChat((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            (p._id || p) === data.userId ? { ...p, isOnline: false } : p
          )
        }));
      }
    });

    return () => {
      if (socket) {
        socket.off('message:new', handleNewMessage);
        socket.off('message:typing', handleTyping);
        socket.off('message:mentioned');
        socket.off('message:updated');
        socket.off('message:deleted');
        socket.off('message:pinned');
        socket.off('message:seen');
        socket.off('user:online');
        socket.off('user:offline');
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  };

  const handleSendMessage = async (content, replyToId) => {
    try {
      if (!content || !content.trim()) return;
      const socket = getSocket();
      if (socket) {
        socket.emit('message:send', {
          chatId,
          content: content.trim(),
          type: 'text',
          replyTo: replyToId
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleSendVoice = async (audioBlob, replyToId) => {
    try {
      if (!audioBlob) return;
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice.webm');
      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (uploadResponse.data?.file) {
        const socket = getSocket();
        if (socket) {
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
        }
      }
    } catch (err) {
      console.error('Error sending voice:', err);
    }
  };

  const handleSendFile = async (file, replyToId) => {
    try {
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (uploadResponse.data?.file) {
        let messageType = 'file';
        if (file.type?.startsWith('image/')) messageType = 'image';
        else if (file.type?.startsWith('video/')) messageType = 'video';
        else if (file.type?.startsWith('audio/')) messageType = 'audio';

        const socket = getSocket();
        if (socket) {
          socket.emit('message:send', {
            chatId,
            content: file.name || 'فایل',
            type: messageType,
            media: {
              url: uploadResponse.data.file.url,
              mimeType: uploadResponse.data.file.mimetype,
              size: uploadResponse.data.file.size
            },
            replyTo: replyToId
          });
        }
      }
    } catch (err) {
      console.error('Error sending file:', err);
    }
  };

  const handleSendLocation = async (location, replyToId) => {
    try {
      if (!location || !location.latitude || !location.longitude) return;
      const socket = getSocket();
      if (socket) {
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
      }
    } catch (err) {
      console.error('Error sending location:', err);
    }
  };

  const handleTyping = (isTyping) => {
    const socket = getSocket();
    if (socket && chatId) {
      socket.emit('message:typing', { chatId, isTyping });
    }
  };

  const markMessageAsRead = (messageId) => {
    if (!messageId || !chatId) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('message:read', { messageId, chatId });
    }
  };

  const getChatTitle = () => {
    if (!chat) return 'چت';
    if (chat.name) return chat.name;
    if (chat.type === 'private' && chat.participants?.length > 0) {
      const otherParticipant = chat.participants.find((p) =>
        (p._id || p)?.toString() !== (user?.id || user?._id)?.toString()
      );
      if (otherParticipant) {
        return otherParticipant.firstName && otherParticipant.lastName
          ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
          : otherParticipant.username || 'کاربر';
      }
    }
    return 'چت';
  };

  const getChatAvatar = useCallback(() => {
    if (!chat) return null;
    if (chat.avatar) return chat.avatar;
    if (chat.type === 'private' && chat.participants?.length > 0) {
      const otherParticipant = chat.participants.find((p) =>
        (p._id || p)?.toString() !== (user?.id || user?._id)?.toString()
      );
      return otherParticipant?.avatar || null;
    }
    return null;
  }, [chat, user]);

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
          <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
            <IconButton edge="start" onClick={() => navigate('/')} sx={{ color: 'white', ml: 1 }}>
              <ArrowForward />
            </IconButton>
            <Skeleton variant="circular" width={40} height={40} sx={{ ml: 2 }} />
            <Skeleton variant="text" width={100} sx={{ ml: 2, flex: 1 }} />
          </Toolbar>
        </AppBar>
        <MessageListSkeleton />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Mobile App Bar */}
      <AppBar
        position="sticky"
        sx={{
          bgcolor: 'primary.main',
          boxShadow: 2,
          zIndex: 10
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important', px: { xs: 1, sm: 2 } }}>
          {selectedMessages.length > 0 ? (
            <>
              <IconButton
                onClick={() => {
                  setSelectedMessages([]);
                }}
                sx={{ color: 'white', ml: 1 }}
              >
                <Close />
              </IconButton>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" noWrap sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {selectedMessages.length} پیام انتخاب شده
                </Typography>
              </Box>
              <IconButton
                onClick={async () => {
                  try {
                    for (const message of selectedMessages) {
                      await api.delete(`/messages/${message._id}`);
                    }
                    setSelectedMessages([]);
                    fetchMessages(1);
                  } catch (error) {
                    console.error('Error deleting messages:', error);
                  }
                }}
                sx={{ color: 'white' }}
              >
                <Delete />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton
                edge="start"
                onClick={() => {
                  const event = new CustomEvent('openMobileSidebar');
                  window.dispatchEvent(event);
                }}
                sx={{ color: 'white', ml: 1 }}
              >
                <Menu />
              </IconButton>
              <IconButton
                onClick={() => navigate('/')}
                sx={{ color: 'white' }}
              >
                <ArrowForward />
              </IconButton>

              <Avatar
                src={getFileUrl(getChatAvatar())}
                sx={{
                  width: 40,
                  height: 40,
                  border: '2px solid rgba(255,255,255,0.3)',
                  mr: 1.5
                }}
              >
                {getChatTitle()?.[0] || 'C'}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" noWrap sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {getChatTitle()}
                </Typography>
                {chat?.type === 'private' && chat?.participants?.length > 0 && (
                  <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    {chat.participants.find((p) =>
                      (p._id || p)?.toString() !== (user?.id || user?._id)?.toString()
                    )?.isOnline ? 'آنلاین' : 'آفلاین'}
                  </Typography>
                )}
                {chat?.type === 'group' && (
                  <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    {chat.participants?.length} عضو
                  </Typography>
                )}
                {chat?.type === 'channel' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                      {chat.subscribers?.length || chat.participants?.length || 0} عضو
                    </Typography>
                    <ChannelSubscribeButton chat={chat} onUpdate={fetchChat} />
                  </Box>
                )}
                {typingUsers.length > 0 && (
                  <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    در حال تایپ...
                  </Typography>
                )}
              </Box>

              {chat?.type === 'private' && (
                <>
                  <IconButton
                    sx={{ color: 'white' }}
                    onClick={() => {
                      const callData = {
                        type: 'audio',
                        chatId: chat._id,
                        participants: chat.participants.map(p => p._id || p)
                      };
                      setCallData(callData);
                      setCallDialogOpen(true);
                      webrtcService.startCall(callData);
                    }}
                  >
                    <Phone />
                  </IconButton>
                  <IconButton
                    sx={{ color: 'white' }}
                    onClick={() => {
                      const callData = {
                        type: 'video',
                        chatId: chat._id,
                        participants: chat.participants.map(p => p._id || p)
                      };
                      setCallData(callData);
                      setCallDialogOpen(true);
                      webrtcService.startCall(callData);
                    }}
                  >
                    <Videocam />
                  </IconButton>
                </>
              )}

              <IconButton
                onClick={() => setAdvancedSearchOpen(true)}
                sx={{ color: 'white' }}
              >
                <Search />
              </IconButton>

              <IconButton onClick={() => setMenuOpen(true)} sx={{ color: 'white' }}>
                <MoreVert />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <PinnedMessages
          chatId={chatId}
          pinnedMessages={pinnedMessages}
          onUpdate={() => {
            fetchPinnedMessages();
            fetchMessages();
          }}
          chat={chat}
        />
      )}

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundImage: chatBackground
            ? `url(${chatBackground})`
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          '&::before': chatBackground ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 0
          } : {}
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <MobileMessageList
            messages={messages}
            onReply={(message) => setReplyTo(message)}
            onQuote={(message) => setQuotedMessage(message)}
            chatType={chat?.type}
            chat={chat}
            onLoadMore={loadMoreMessages}
            hasMore={hasMore}
            selectedMessages={selectedMessages}
            onSelectionChange={setSelectedMessages}
          />
        </Box>
      </Box>

      {/* Typing Indicator */}
      <TypingIndicator typingUsers={typingUsers} chat={chat} />

      {/* Message Input */}
      <Box sx={{ position: 'relative', zIndex: 1, bgcolor: 'background.paper' }}>
        <MobileMessageInput
          onSend={handleSendMessage}
          onTyping={handleTyping}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          quotedMessage={quotedMessage}
          onCancelQuote={() => setQuotedMessage(null)}
          onSendVoice={handleSendVoice}
          onSendFile={handleSendFile}
          onSendLocation={handleSendLocation}
          chat={chat}
        />
      </Box>

      {/* Options Menu */}
      <SwipeableDrawer
        anchor="bottom"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpen={() => setMenuOpen(true)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16
          }
        }}
      >
        <Box sx={{ p: 2, minHeight: 300 }}>
          <Box sx={{ width: 40, height: 4, bgcolor: 'divider', borderRadius: 2, mx: 'auto', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {getChatTitle()}
          </Typography>

          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => {
                setAdvancedSearchOpen(true);
                setMenuOpen(false);
              }}>
                <ListItemIcon>
                  <Search />
                </ListItemIcon>
                <ListItemText primary="جستجوی پیشرفته در چت" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => {
                setFileGalleryOpen(true);
                setMenuOpen(false);
              }}>
                <ListItemIcon>
                  <Folder />
                </ListItemIcon>
                <ListItemText primary="فایل‌های ارسالی" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => {
                setSummaryDialogOpen(true);
                setMenuOpen(false);
              }}>
                <ListItemIcon>
                  <Summarize />
                </ListItemIcon>
                <ListItemText primary="خلاصه گفتگو" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => {
                setFontSettingsOpen(true);
                setMenuOpen(false);
              }}>
                <ListItemIcon>
                  <FontDownload />
                </ListItemIcon>
                <ListItemText primary="تنظیمات فونت" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => {
                setThemeSettingsOpen(true);
                setMenuOpen(false);
              }}>
                <ListItemIcon>
                  <ColorLens />
                </ListItemIcon>
                <ListItemText primary="تنظیمات تم" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <CenterFocusStrong />
                </ListItemIcon>
                <ListItemText primary="حالت تمرکز" />
                <FocusModeToggle onToggle={() => { }} />
              </ListItemButton>
            </ListItem>

            {chat?.type === 'group' && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => {
                  setGroupSettingsOpen(true);
                  setMenuOpen(false);
                }}>
                  <ListItemIcon>
                    <Info />
                  </ListItemIcon>
                  <ListItemText primary="اطلاعات گروه" />
                </ListItemButton>
              </ListItem>
            )}

            {chat?.type === 'channel' && (
              <>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => {
                    setChannelSettingsOpen(true);
                    setMenuOpen(false);
                  }}>
                    <ListItemIcon>
                      <Settings />
                    </ListItemIcon>
                    <ListItemText primary="تنظیمات کانال" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => {
                    setChannelStatsOpen(true);
                    setMenuOpen(false);
                  }}>
                    <ListItemIcon>
                      <BarChart />
                    </ListItemIcon>
                    <ListItemText primary="آمار کانال" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => {
                    setPollDialogOpen(true);
                    setMenuOpen(false);
                  }}>
                    <ListItemIcon>
                      <Campaign />
                    </ListItemIcon>
                    <ListItemText primary="ایجاد نظرسنجی" />
                  </ListItemButton>
                </ListItem>
              </>
            )}

            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <NotificationsOff />
                </ListItemIcon>
                <ListItemText primary="بی‌صدا کردن" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <Archive />
                </ListItemIcon>
                <ListItemText primary="آرشیو" />
              </ListItemButton>
            </ListItem>

            {chat?.type === 'private' && (
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemIcon>
                    <Block />
                  </ListItemIcon>
                  <ListItemText primary="مسدود کردن" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </SwipeableDrawer>

      {chat?.type === 'group' && (
        <GroupSettingsDialog
          open={groupSettingsOpen}
          onClose={() => setGroupSettingsOpen(false)}
          chat={chat}
          onUpdate={fetchChat}
        />
      )}

      {chat?.type === 'channel' && (
        <>
          <ChannelSettingsDialog
            open={channelSettingsOpen}
            onClose={() => setChannelSettingsOpen(false)}
            chat={chat}
            onUpdate={fetchChat}
          />
          <ChannelStatsDialog
            open={channelStatsOpen}
            onClose={() => setChannelStatsOpen(false)}
            chat={chat}
          />
          <PollDialog
            open={pollDialogOpen}
            onClose={() => {
              setPollDialogOpen(false);
            }}
            messageId={messages[messages.length - 1]?._id}
            onSuccess={() => {
              fetchMessages();
            }}
          />
        </>
      )}


      <AdvancedSearchDialog
        open={advancedSearchOpen}
        onClose={() => setAdvancedSearchOpen(false)}
        chatId={chatId}
        onMessageSelect={(message) => {
          const element = document.getElementById(`message-${message._id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.backgroundColor = 'rgba(25, 118, 210, 0.1)';
            setTimeout(() => {
              element.style.backgroundColor = '';
            }, 2000);
          }
        }}
      />

      <MessageSummaryDialog
        open={summaryDialogOpen}
        onClose={() => {
          setSummaryDialogOpen(false);
          setSelectedMessages([]);
        }}
        selectedMessages={selectedMessages}
        chatId={chatId}
        onSuccess={() => {
          fetchChat();
          fetchMessages();
        }}
      />

      <FontSettingsDialog
        open={fontSettingsOpen}
        onClose={() => setFontSettingsOpen(false)}
      />

      <FileGallery
        open={fileGalleryOpen}
        onClose={() => setFileGalleryOpen(false)}
        chatId={chatId}
      />

      <ThemeSettingsDialog
        open={themeSettingsOpen}
        onClose={() => setThemeSettingsOpen(false)}
      />

      <CallDialog
        open={callDialogOpen}
        onClose={() => {
          setCallDialogOpen(false);
          if (callData) {
            webrtcService.endCall();
          }
        }}
        callData={callData || incomingCall}
        isIncoming={!!incomingCall}
        onAccept={() => {
          setCallData(incomingCall);
          setIncomingCall(null);
        }}
        onReject={() => {
          setIncomingCall(null);
          setCallDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default MobileChatPage;

