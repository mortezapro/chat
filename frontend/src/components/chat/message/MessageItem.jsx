import React from 'react';
import { Box, Avatar, Tooltip, Typography } from '@mui/material';
import { format, isToday, isYesterday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { MessageBubble } from './MessageBubble';
import DateSeparator from './DateSeparator';

const formatMessageTime = (date) => {
  const messageDate = new Date(date);
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  } else if (isYesterday(messageDate)) {
    return `دیروز ${format(messageDate, 'HH:mm')}`;
  } else {
    return format(messageDate, 'dd/MM/yyyy HH:mm');
  }
};

const formatFullDateTime = (date) => {
  const messageDate = new Date(date);
  const time = format(messageDate, 'HH:mm');
  const day = messageDate.getDate();
  const month = messageDate.toLocaleDateString('fa-IR', { month: 'long' });
  const year = messageDate.getFullYear();
  const dayName = messageDate.toLocaleDateString('fa-IR', { weekday: 'long' });
  return `${dayName}، ${day} ${month} ${year} ساعت ${time}`;
};

export const getSenderName = (sender, currentUser) => {
  if (!sender) return 'کاربر';
  if (sender._id === currentUser?.id) {
    return 'شما';
  }
  return sender.firstName && sender.lastName
    ? `${sender.firstName} ${sender.lastName}`
    : sender.username || 'کاربر';
};

export const MessageItem = ({ message, prevMessage, nextMessage, chatType, chat, onReply, onQuote, onUpdate, user, onMenuOpen, onSeenClick }) => {
  const navigate = useNavigate();
  const isOwn = message.sender._id === user?.id;
  const showAvatar = !prevMessage || prevMessage.sender._id !== message.sender._id;
  const timeDiff = nextMessage
    ? new Date(message.createdAt).getTime() - new Date(nextMessage.createdAt).getTime()
    : Infinity;
  const showTime = !nextMessage || timeDiff > 300000;

  const prevDate = prevMessage ? new Date(prevMessage.createdAt).toDateString() : null;
  const currentDate = new Date(message.createdAt).toDateString();
  const showDateSeparator = prevDate !== currentDate;

  return (
    <React.Fragment>
      {showDateSeparator && <DateSeparator date={message.createdAt} />}
      <Box
        id={`message-${message._id}`}
        className="message-item"
        sx={{
          display: 'flex',
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          gap: 1,
          mb: showTime ? 2 : 0.5,
          alignItems: 'flex-end'
        }}
      >
        {!isOwn && (
          <Avatar
            component="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${message.sender._id}`);
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
            maxWidth: '85%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isOwn ? 'flex-end' : 'flex-start'
          }}
        >
          {!isOwn && showAvatar && message.sender && (
            <Box
              component="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${message.sender._id}`);
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
                {getSenderName(message.sender, user)}
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

          <MessageBubble
            message={message}
            isOwn={isOwn}
            chatType={chatType}
            chat={chat}
            onReply={onReply}
            onQuote={onQuote}
            onUpdate={onUpdate}
            user={user}
            onMenuOpen={onMenuOpen}
            onSeenClick={onSeenClick}
          />

          {showTime && (
            <Tooltip title={formatFullDateTime(message.createdAt)} arrow>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 1, cursor: 'help' }}>
                {formatMessageTime(message.createdAt)}
              </Typography>
            </Tooltip>
          )}
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
    </React.Fragment>
  );
};

