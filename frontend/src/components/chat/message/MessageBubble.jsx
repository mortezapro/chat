import { Box, Paper, IconButton, Typography } from '@mui/material';
import { PushPin, MoreVert } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import QuoteMessage from './QuoteMessage';
import { MessageContent } from './MessageContent';
import MessageReactions from './MessageReactions';
import MessageInteractions from './MessageInteractions';
import MessageComments from './MessageComments';
import { getSenderName } from './MessageItem';

export const MessageBubble = ({ message, isOwn, chatType, chat, onUpdate, user, onMenuOpen }) => {
  const navigate = useNavigate();

  const handleReplyClick = (e) => {
    e.stopPropagation();
    const replyElement = document.getElementById(`message-${message.replyTo._id}`);
    if (replyElement) {
      replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      replyElement.style.backgroundColor = 'rgba(25, 118, 210, 0.1)';
      setTimeout(() => {
        replyElement.style.backgroundColor = '';
      }, 2000);
    }
  };

  const handleChannelView = async () => {
    if (chatType === 'channel' && message._id) {
      try {
        await api.post(`/messages/${message._id}/view`);
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    }
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      {message.isPinned && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mb: 0.5,
            px: 1
          }}
        >
          <PushPin sx={{ fontSize: '0.875rem', color: 'primary.main' }} />
          <Typography variant="caption" color="primary.main">
            پین شده
          </Typography>
        </Box>
      )}
      <Paper
        elevation={0}
        onContextMenu={(e) => {
          e.preventDefault();
          if (onMenuOpen) onMenuOpen(e, message);
        }}
        onClick={handleChannelView}
        className="message-bubble"
        sx={{
          p: 2,
          maxWidth: '85%',
          minWidth: '150px',
          bgcolor: '#ffffff',
          color: '#212121',
          borderRadius: 2,
          wordBreak: 'break-word',
          cursor: 'pointer',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s ease',
          position: 'relative',
          '&:hover': {
            bgcolor: '#f5f5f5',
            '& .message-actions': {
              opacity: 1
            }
          },
        }}
      >
        {message.quotedMessage && (
          <Box sx={{ mb: 1 }}>
            <QuoteMessage quotedMessage={message.quotedMessage} />
          </Box>
        )}
        {message.replyTo && (
          <Box
            onClick={handleReplyClick}
            sx={{
              borderRight: '3px solid',
              borderColor: 'primary.main',
              pr: 1.5,
              mb: 1,
              opacity: 0.8,
              cursor: 'pointer',
              borderRadius: 1,
              bgcolor: 'rgba(0,0,0,0.03)',
              '&:hover': {
                opacity: 1,
                bgcolor: 'rgba(0,0,0,0.05)'
              }
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 'bold',
                mb: 0.5,
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: '#424242',
                '&:hover': {
                  textDecoration: 'underline',
                  color: 'primary.main'
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (message.replyTo?.sender?._id) {
                  navigate(`/profile/${message.replyTo.sender._id}`);
                }
              }}
            >
              در پاسخ به {getSenderName(message.replyTo.sender, user)}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.75rem',
                lineHeight: 1.4,
                color: '#757575'
              }}
            >
              {message.replyTo.content?.substring(0, 50)}
              {message.replyTo.content?.length > 50 ? '...' : ''}
            </Typography>
          </Box>
        )}
        <Box>
          <MessageContent
            message={message}
            isOwn={isOwn}
            chatType={chatType}
            chat={chat}
            user={user}
          />
        </Box>
        {!message.isDeleted && (
          <>
            {message.linkPreview && (
              <Box
                sx={{
                  mt: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => window.open(message.linkPreview.url, '_blank')}
              >
                {message.linkPreview.image && (
                  <Box
                    component="img"
                    src={message.linkPreview.image}
                    alt={message.linkPreview.title}
                    sx={{
                      width: '100%',
                      maxHeight: 200,
                      objectFit: 'cover'
                    }}
                  />
                )}
                <Box sx={{ p: 1.5 }}>
                  {message.linkPreview.siteName && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      {message.linkPreview.siteName}
                    </Typography>
                  )}
                  {message.linkPreview.title && (
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
                      {message.linkPreview.title}
                    </Typography>
                  )}
                  {message.linkPreview.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                      {message.linkPreview.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            {message.reactions && message.reactions.length > 0 && (
              <MessageReactions message={message} onUpdate={onUpdate} />
            )}
            {chatType === 'channel' && (
              <>
                <MessageInteractions message={message} chat={chat} onUpdate={onUpdate} />
                <MessageComments message={message} chat={chat} onUpdate={onUpdate} />
              </>
            )}
          </>
        )}
      </Paper>
      <Box
        className="message-actions"
        sx={{
          position: 'absolute',
          top: -8,
          [isOwn ? 'left' : 'right']: -8,
          opacity: 0,
          transition: 'all 0.2s ease',
          bgcolor: 'background.paper',
          borderRadius: '50%',
          boxShadow: 3,
          '&:hover': {
            boxShadow: 4
          }
        }}
      >
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            if (onMenuOpen) onMenuOpen(e, message);
          }}
          sx={{ cursor: 'pointer' }}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

