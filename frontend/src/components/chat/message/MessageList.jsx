import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Menu, MenuItem, Typography, Divider } from '@mui/material';
import { Reply, Person, AccessTime, PushPin, BookmarkBorder, Forward, Notifications, Note } from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';
import InfiniteScroll from 'react-infinite-scroll-component';
import { MessageItem } from './MessageItem';
import ForwardMessageDialog from '../dialogs/ForwardMessageDialog';
import ReminderDialog from '../dialogs/ReminderDialog';
import PersonalNoteDialog from '../dialogs/PersonalNoteDialog';
import SeenListDialog from '../dialogs/SeenListDialog';
import api from '@/services/api';
import { getSocket } from '@/services/socket';

const formatFullDateTime = (date) => {
  const messageDate = new Date(date);
  const time = format(messageDate, 'HH:mm');
  const day = messageDate.getDate();
  const month = messageDate.toLocaleDateString('fa-IR', { month: 'long' });
  const year = messageDate.getFullYear();
  const dayName = messageDate.toLocaleDateString('fa-IR', { weekday: 'long' });
  return `${dayName}، ${day} ${month} ${year} ساعت ${time}`;
};

const MessageList = ({ messages, onLoadMore, hasMore = false, onReply, chatType, onUpdate, chat, onQuote }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [seenListDialogOpen, setSeenListDialogOpen] = useState(false);
  const [selectedMessageForSeen, setSelectedMessageForSeen] = useState(null);

  useEffect(() => {
    if (messagesEndRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (chatType === 'group' || chatType === 'channel') {
      const socket = getSocket();
      if (socket) {
        socket.on('message:seen', () => {
          if (onUpdate) {
            onUpdate();
          }
        });

        return () => {
          socket.off('message:seen');
        };
      }
    }
  }, [chatType, onUpdate]);

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

  const handleMessageMenuOpen = (event, message) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMessageMenuClose = () => {
    setMenuAnchor(null);
    setSelectedMessage(null);
  };

  const handleReply = (type = 'reply') => {
    if (selectedMessage) {
      if (type === 'quote' && onQuote) {
        onQuote(selectedMessage);
      } else if (onReply) {
        onReply(selectedMessage, type);
      }
    }
    handleMessageMenuClose();
  };

  const handleViewProfile = () => {
    if (selectedMessage?.sender?._id) {
      navigate(`/profile/${selectedMessage.sender._id}`);
    }
    handleMessageMenuClose();
  };

  const handleSeenClick = (message) => {
    setSelectedMessageForSeen(message);
    setSeenListDialogOpen(true);
  };

  return (
    <Box
      ref={containerRef}
      id="message-list"
      sx={{
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        p: 2
      }}
    >
      <InfiniteScroll
        dataLength={messages.length}
        next={onLoadMore || (() => { })}
        hasMore={hasMore}
        loader={
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              در حال بارگذاری...
            </Typography>
          </Box>
        }
        inverse={false}
        scrollableTarget="message-list"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

          return (
            <MessageItem
              key={message._id}
              message={message}
              prevMessage={prevMessage}
              nextMessage={nextMessage}
              chatType={chatType}
              chat={chat}
              onReply={onReply}
              onQuote={onQuote}
              onUpdate={onUpdate}
              user={user}
              onMenuOpen={handleMessageMenuOpen}
              onSeenClick={handleSeenClick}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </InfiniteScroll>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMessageMenuClose}
      >
        <MenuItem onClick={() => {
          setReminderDialogOpen(true);
          handleMessageMenuClose();
        }}>
          <Notifications sx={{ mr: 1 }} />
          یادآوری
        </MenuItem>
        <MenuItem onClick={() => {
          setNoteDialogOpen(true);
          handleMessageMenuClose();
        }}>
          <Note sx={{ mr: 1 }} />
          یادداشت شخصی
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleReply('reply')}>
          <Reply sx={{ mr: 1 }} />
          پاسخ
        </MenuItem>
        <MenuItem onClick={() => handleReply('quote')}>
          نقل قول
        </MenuItem>
        {!selectedMessage?.isDeleted && (
          <MenuItem onClick={() => {
            setForwardDialogOpen(true);
            handleMessageMenuClose();
          }}>
            <Forward sx={{ mr: 1 }} />
            ارسال مجدد
          </MenuItem>
        )}
        {chatType === 'group' && chat && (chat.admins?.some(a => a._id === user?.id || a.toString() === user?.id) || selectedMessage?.sender?._id === user?.id) && (
          <MenuItem onClick={async () => {
            if (selectedMessage) {
              try {
                await api.post(`/messages/${selectedMessage._id}/pin`);
                if (onUpdate) {
                  onUpdate();
                }
              } catch (error) {
                console.error('Error pinning message:', error);
                alert('خطا در پین کردن پیام');
              }
            }
            handleMessageMenuClose();
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
              if (onUpdate) {
                onUpdate();
              }
            } catch (error) {
              console.error('Error saving message:', error);
              alert('خطا در ذخیره پیام');
            }
          }
          handleMessageMenuClose();
        }}>
          <BookmarkBorder sx={{ mr: 1 }} />
          ذخیره پیام
        </MenuItem>
        {selectedMessage?.sender?._id === user?.id && !selectedMessage?.isDeleted && (
          <>
            <MenuItem onClick={async () => {
              if (selectedMessage) {
                const newContent = prompt('پیام جدید را وارد کنید:', selectedMessage.content);
                if (newContent && newContent !== selectedMessage.content) {
                  try {
                    await api.put(`/messages/${selectedMessage._id}`, { content: newContent });
                    if (onUpdate) {
                      onUpdate();
                    }
                  } catch (error) {
                    console.error('Error editing message:', error);
                    alert('خطا در ویرایش پیام');
                  }
                }
              }
              handleMessageMenuClose();
            }}>
              ویرایش
            </MenuItem>
            <MenuItem onClick={async () => {
              if (selectedMessage) {
                const deleteForEveryone = window.confirm(
                  'آیا می‌خواهید این پیام برای همه حذف شود؟\n\nOK = حذف برای همه\nCancel = حذف فقط برای شما'
                );
                try {
                  await api.delete(`/messages/${selectedMessage._id}`, {
                    data: { deleteForEveryone }
                  });
                  if (onUpdate) {
                    onUpdate();
                  }
                } catch (error) {
                  console.error('Error deleting message:', error);
                  alert('خطا در حذف پیام');
                }
              }
              handleMessageMenuClose();
            }}>
              حذف
            </MenuItem>
          </>
        )}
        {selectedMessage?.sender?._id !== user?.id && (
          <MenuItem onClick={handleViewProfile}>
            <Person sx={{ mr: 1 }} />
            مشاهده پروفایل
          </MenuItem>
        )}
        {!selectedMessage?.isDeleted && (
          <MenuItem onClick={() => {
            if (selectedMessage) {
              navigator.clipboard.writeText(selectedMessage.content);
            }
            handleMessageMenuClose();
          }}>
            کپی متن
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          if (selectedMessage) {
            alert(formatFullDateTime(selectedMessage.createdAt));
          }
          handleMessageMenuClose();
        }}>
          <AccessTime sx={{ mr: 1 }} />
          اطلاعات کامل زمان
        </MenuItem>
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
              alert('خطا در ارسال مجدد پیام');
            }
          }
        }}
      />

      <ReminderDialog
        open={reminderDialogOpen}
        onClose={() => setReminderDialogOpen(false)}
        message={selectedMessage}
        onSuccess={() => {
          if (onUpdate) onUpdate();
        }}
      />

      <PersonalNoteDialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        message={selectedMessage}
        onSuccess={() => {
          if (onUpdate) onUpdate();
        }}
      />

      <SeenListDialog
        open={seenListDialogOpen}
        onClose={() => {
          setSeenListDialogOpen(false);
          setSelectedMessageForSeen(null);
        }}
        message={selectedMessageForSeen}
        chat={chat}
      />
    </Box>
  );
};

export default MessageList;
