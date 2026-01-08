import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  Divider
} from '@mui/material';
import { MoreVert, Reply, Forward, Bookmark, BookmarkBorder, PushPin, Edit, Delete, Person, FormatQuote } from '@mui/icons-material';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';
import InfiniteScroll from 'react-infinite-scroll-component';
import DateSeparator from '@/components/chat/message/DateSeparator';
import MessageReactions from '@/components/chat/message/MessageReactions';
import MessageStatus from '@/components/chat/message/MessageStatus';
import QuoteMessage from '@/components/chat/message/QuoteMessage';
import ForwardMessageDialog from '@/components/chat/dialogs/ForwardMessageDialog';
import { getFileUrl } from '@/utils/chatHelpers';
import api from '@/services/api';
import { getSocket } from '@/services/socket';

const MobileMessageList = ({ 
  messages, 
  onReply, 
  onQuote,
  chatType, 
  chat,
  onLoadMore,
  hasMore = false,
  selectedMessages = [],
  onSelectionChange
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    if (selectedMessages.length > 0) {
      setSelectionMode(true);
    } else {
      setSelectionMode(false);
    }
  }, [selectedMessages.length]);

  useEffect(() => {
    if (messagesEndRef.current && containerRef.current && !selectionMode) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, selectionMode]);

  const handleMessageSelect = (message) => {
    if (!selectionMode) return;
    if (onSelectionChange) {
      const isSelected = selectedMessages.some(m => m._id === message._id);
      if (isSelected) {
        onSelectionChange(selectedMessages.filter(m => m._id !== message._id));
      } else {
        onSelectionChange([...selectedMessages, message]);
      }
    }
  };

  const handleLongPress = (message, event) => {
    event.preventDefault();
    setSelectionMode(true);
    if (onSelectionChange) {
      onSelectionChange([message]);
    }
  };

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return `دیروز ${format(messageDate, 'HH:mm')}`;
    } else {
      return format(messageDate, 'dd/MM HH:mm');
    }
  };

  const getSenderName = (sender) => {
    if (!sender) return 'کاربر';
    if ((sender._id || sender.id) === (user?.id || user?._id)) return 'شما';
    return sender.firstName && sender.lastName
      ? `${sender.firstName} ${sender.lastName}`
      : sender.username || 'کاربر';
  };

  return (
    <Box
      ref={containerRef}
      id="mobile-message-list"
      sx={{
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        p: 1.5,
        bgcolor: 'background.default',
        '&::-webkit-scrollbar': {
          display: 'none'
        }
      }}
    >
      <InfiniteScroll
        dataLength={messages.length}
        next={onLoadMore || (() => {})}
        hasMore={hasMore}
        loader={
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              در حال بارگذاری...
            </Typography>
          </Box>
        }
        inverse={false}
        scrollableTarget="mobile-message-list"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {messages.map((message, index) => {
          if (!message || !message.sender) return null;
          
          const isOwn = (message.sender._id || message.sender.id) === (user?.id || user?._id);
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showAvatar = !prevMessage || 
            (prevMessage.sender?._id || prevMessage.sender?.id) !== (message.sender._id || message.sender.id);
          const prevDate = prevMessage?.createdAt ? new Date(prevMessage.createdAt).toDateString() : null;
          const currentDate = message.createdAt ? new Date(message.createdAt).toDateString() : null;
          const showDateSeparator = prevDate !== currentDate;

          return (
            <Box key={message._id}>
              {showDateSeparator && (
                <DateSeparator date={message.createdAt} />
              )}
              
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  mb: 1,
                  gap: 1,
                  alignItems: 'flex-end'
                }}
              >
                {!isOwn && (
                  <Avatar
                    component="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${message.sender._id || message.sender.id}`);
                    }}
                    sx={{
                      width: showAvatar ? 40 : 0,
                      height: showAvatar ? 40 : 0,
                      opacity: showAvatar ? 1 : 0,
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        boxShadow: 3,
                        borderColor: 'primary.main'
                      }
                    }}
                    src={message.sender.avatar}
                  >
                    {message.sender.firstName?.[0] || message.sender.username?.[0] || 'U'}
                  </Avatar>
                )}

                <Box
                  sx={{
                    maxWidth: '75%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1
                  }}
                >
                  {selectionMode && (
                    <Checkbox
                      checked={selectedMessages.some(m => m._id === message._id)}
                      onChange={() => handleMessageSelect(message)}
                      sx={{ mt: 1 }}
                    />
                  )}
                  <Box
                    sx={{ flex: 1 }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setMenuAnchor(e.currentTarget);
                      setSelectedMessage(message);
                    }}
                    onTouchStart={(e) => {
                      const touchStartTime = Date.now();
                      const touchTimer = setTimeout(() => {
                        handleLongPress(message, e);
                      }, 500);
                      const handleTouchEnd = () => {
                        clearTimeout(touchTimer);
                        document.removeEventListener('touchend', handleTouchEnd);
                      };
                      document.addEventListener('touchend', handleTouchEnd);
                    }}
                    onClick={() => {
                      if (selectionMode) {
                        handleMessageSelect(message);
                      }
                    }}
                  >
                  {!isOwn && showAvatar && (
                    <Box
                      component="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${message.sender._id || message.sender.id}`);
                      }}
                      sx={{
                        mb: 1,
                        px: 1.5,
                        py: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'translateX(-2px)'
                        }
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.primary"
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.8125rem'
                        }}
                      >
                        {getSenderName(message.sender)}
                      </Typography>
                      {message.sender.isOnline && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
                            ml: 0.5
                          }}
                        />
                      )}
                    </Box>
                  )}

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      maxWidth: '90%',
                      minWidth: '120px',
                      bgcolor: '#ffffff',
                      color: '#212121',
                      borderRadius: 2,
                      wordBreak: 'break-word',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      '&:active': {
                        bgcolor: '#f5f5f5'
                      }
                    }}
                  >
                    {message.quotedMessage && (
                      <Box sx={{ mb: 1 }}>
                        <QuoteMessage quotedMessage={message.quotedMessage} />
                      </Box>
                    )}
                    {message.replyTo && message.replyTo.sender && (
                      <Box
                        sx={{
                          borderRight: '3px solid',
                          borderColor: 'primary.main',
                          pr: 1,
                          mb: 1,
                          opacity: 0.8,
                          borderRadius: 1,
                          bgcolor: 'rgba(0,0,0,0.03)'
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            fontWeight: 'bold', 
                            mb: 0.5,
                            fontSize: '0.75rem',
                            color: '#424242'
                          }}
                        >
                          {getSenderName(message.replyTo.sender)}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.75rem',
                            color: '#757575'
                          }}
                        >
                          {message.replyTo.content?.substring(0, 40) || 'پیام'}...
                        </Typography>
                      </Box>
                    )}

                    {message.isDeleted ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontStyle: 'italic', 
                          opacity: 0.6,
                          fontSize: '0.875rem',
                          color: '#757575'
                        }}
                      >
                        این پیام حذف شده است
                      </Typography>
                    ) : (
                      <>
                        {message.type === 'audio' && message.media?.url ? (
                          <Box sx={{ minWidth: 200 }}>
                            <Typography variant="body2">🎵 پیام صوتی</Typography>
                          </Box>
                        ) : message.type === 'image' && message.media?.url ? (
                          <Box
                            sx={{
                              maxWidth: '100%',
                              display: 'inline-block'
                            }}
                          >
                            <Box
                              component="img"
                              src={getFileUrl(message.media.url)}
                              alt={message.content || 'تصویر'}
                              sx={{
                                maxWidth: '100%',
                                maxHeight: 250,
                                width: 'auto',
                                height: 'auto',
                                borderRadius: 2,
                                cursor: 'pointer',
                                objectFit: 'contain',
                                display: 'block'
                              }}
                              onClick={() => window.open(getFileUrl(message.media.url), '_blank')}
                              onError={(e) => {
                                console.error('Error loading image:', message.media.url, 'Full URL:', getFileUrl(message.media.url));
                                e.target.style.display = 'none';
                              }}
                            />
                          </Box>
                        ) : message.type === 'video' && message.media?.url ? (
                          <Box
                            component="video"
                            src={getFileUrl(message.media.url)}
                            controls
                            sx={{
                              maxWidth: '100%',
                              maxHeight: 250,
                              width: 'auto',
                              height: 'auto',
                              borderRadius: 2,
                              display: 'block'
                            }}
                          />
                        ) : message.type === 'file' && message.media?.url ? (
                          <Box
                            sx={{
                              p: 1.5,
                              bgcolor: 'action.hover',
                              borderRadius: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(getFileUrl(message.media.url), '_blank')}
                          >
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              📎 {message.content || 'فایل'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {message.media.size ? `${(message.media.size / 1024).toFixed(1)} KB` : ''}
                            </Typography>
                          </Box>
                        ) : message.type === 'location' && message.media?.latitude ? (
                          <Box>
                            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                              📍 موقعیت
                            </Typography>
                            <Typography variant="body2">
                              {message.media.address || message.content || `${message.media.latitude}, ${message.media.longitude}`}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              whiteSpace: 'pre-wrap', 
                              lineHeight: 1.5,
                              fontSize: '0.875rem',
                              color: '#212121'
                            }}
                          >
                            {message.content || 'پیام'}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                          {message.createdAt && (
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.7, color: '#757575' }}>
                              {formatMessageTime(message.createdAt)}
                            </Typography>
                          )}
                          {isOwn && message.sender && (
                            <MessageStatus 
                              readBy={message.readBy || []} 
                              sentBy={message.sender}
                              chatType={chatType}
                              participants={chat?.participants}
                            />
                          )}
                        </Box>

                        {message.reactions && message.reactions.length > 0 && (
                          <MessageReactions message={message} onUpdate={() => {}} />
                        )}
                      </>
                    )}
                  </Paper>
                  </Box>
                </Box>

                {isOwn && (
                  <Avatar
                    sx={{
                      width: showAvatar ? 32 : 0,
                      height: showAvatar ? 32 : 0,
                      opacity: showAvatar ? 1 : 0,
                      transition: 'all 0.2s'
                    }}
                    src={user?.avatar}
                  >
                    {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                  </Avatar>
                )}
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </InfiniteScroll>


      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          if (selectedMessage && onReply) {
            onReply(selectedMessage);
          }
          setMenuAnchor(null);
        }}>
          <Reply sx={{ mr: 1 }} />
          پاسخ
        </MenuItem>
        {onQuote && (
          <MenuItem onClick={() => {
            if (selectedMessage && onQuote) {
              onQuote(selectedMessage);
            }
            setMenuAnchor(null);
          }}>
            <FormatQuote sx={{ mr: 1 }} />
            نقل قول
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => {
          setForwardDialogOpen(true);
          setMenuAnchor(null);
        }}>
          <Forward sx={{ mr: 1 }} />
          ارسال مجدد
        </MenuItem>
        {chatType === 'group' && chat && (chat.admins?.some(a => (a._id || a) === (user?.id || user?._id)) || selectedMessage?.sender?._id === (user?.id || user?._id)) && (
          <MenuItem onClick={async () => {
            if (selectedMessage) {
              try {
                await api.post(`/messages/${selectedMessage._id}/pin`);
              } catch (error) {
                console.error('Error pinning message:', error);
              }
            }
            setMenuAnchor(null);
          }}>
            <PushPin sx={{ mr: 1 }} />
            {selectedMessage?.isPinned ? 'حذف پین' : 'پین کردن'}
          </MenuItem>
        )}
        <MenuItem onClick={async () => {
          if (selectedMessage) {
            try {
              const response = await api.get('/messages/saved/all');
              const savedMessages = response.data.messages || [];
              const isSaved = savedMessages.some(m => m._id === selectedMessage._id);
              if (isSaved) {
                await api.delete(`/messages/${selectedMessage._id}/save`);
              } else {
                await api.post(`/messages/${selectedMessage._id}/save`);
              }
            } catch (error) {
              console.error('Error saving message:', error);
            }
          }
          setMenuAnchor(null);
        }}>
          <BookmarkBorder sx={{ mr: 1 }} />
          ذخیره پیام
        </MenuItem>
        {selectedMessage?.sender?._id === (user?.id || user?._id) && !selectedMessage?.isDeleted && (
          <>
            <MenuItem onClick={async () => {
              if (selectedMessage) {
                const newContent = prompt('پیام جدید را وارد کنید:', selectedMessage.content);
                if (newContent && newContent !== selectedMessage.content) {
                  try {
                    await api.put(`/messages/${selectedMessage._id}`, { content: newContent });
                  } catch (error) {
                    console.error('Error editing message:', error);
                  }
                }
              }
              setMenuAnchor(null);
            }}>
              <Edit sx={{ mr: 1 }} />
              ویرایش
            </MenuItem>
            <MenuItem onClick={async () => {
              if (selectedMessage) {
                const deleteForEveryone = window.confirm(
                  'آیا می‌خواهید این پیام برای همه حذف شود؟'
                );
                try {
                  await api.delete(`/messages/${selectedMessage._id}`, {
                    data: { deleteForEveryone }
                  });
                } catch (error) {
                  console.error('Error deleting message:', error);
                }
              }
              setMenuAnchor(null);
            }}>
              <Delete sx={{ mr: 1 }} />
              حذف
            </MenuItem>
          </>
        )}
        {selectedMessage?.sender?._id !== (user?.id || user?._id) && (
          <MenuItem onClick={() => {
            if (selectedMessage?.sender?._id) {
              navigate(`/profile/${selectedMessage.sender._id}`);
            }
            setMenuAnchor(null);
          }}>
            <Person sx={{ mr: 1 }} />
            مشاهده پروفایل
          </MenuItem>
        )}
      </Menu>

      <ForwardMessageDialog
        open={forwardDialogOpen}
        onClose={() => setForwardDialogOpen(false)}
        message={selectedMessage}
        onForward={async (chatIds) => {
          if (selectedMessage) {
            try {
              const socket = getSocket();
              chatIds.forEach(chatId => {
                socket.emit('message:send', {
                  chatId,
                  content: selectedMessage.content,
                  type: selectedMessage.type,
                  media: selectedMessage.media,
                  forwardedFrom: selectedMessage._id
                });
              });
            } catch (error) {
              console.error('Error forwarding message:', error);
            }
          }
        }}
      />
    </Box>
  );
};

export default MobileMessageList;

