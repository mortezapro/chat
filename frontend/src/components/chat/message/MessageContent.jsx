import { Box, Typography } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AudioPlayer } from './AudioPlayer';
import MessageStatus from './MessageStatus';
import { getFileUrl } from '@/utils/chatHelpers';

export const MessageContent = ({ message, isOwn, chatType, chat }) => {
  const navigate = useNavigate();

  if (message.isDeleted) {
    return (
      <Typography
        variant="body2"
        sx={{
          whiteSpace: 'pre-wrap',
          direction: 'rtl',
          textAlign: 'right',
          fontStyle: 'italic',
          opacity: 0.6,
          fontSize: '0.875rem',
          color: '#757575'
        }}
      >
        این پیام حذف شده است
      </Typography>
    );
  }

  if (message.type === 'audio' && message.media?.url) {
    return <AudioPlayer audioUrl={getFileUrl(message.media.url)} isOwn={isOwn} />;
  }

  if (message.type === 'image' && message.media?.url) {
    return (
      <Box
        sx={{
          maxWidth: '100%',
          display: 'inline-block'
        }}
      >
        <Box
          component="img"
          src={getFileUrl(message.media.url)}
          alt={message.content}
          sx={{
            maxWidth: '100%',
            maxHeight: 300,
            width: 'auto',
            height: 'auto',
            borderRadius: 1,
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
    );
  }

  if (message.type === 'video' && message.media?.url) {
    return (
      <Box
        component="video"
        src={getFileUrl(message.media.url)}
        controls
        sx={{
          maxWidth: '100%',
          maxHeight: 300,
          width: 'auto',
          height: 'auto',
          borderRadius: 1,
          display: 'block'
        }}
      />
    );
  }

  if (message.type === 'file' && message.media?.url) {
    return (
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
    );
  }

  if (message.type === 'location' && message.media?.latitude) {
    return (
      <Box
        sx={{
          p: 2,
          bgcolor: isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          borderRadius: 2,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'
          }
        }}
        onClick={() => {
          const url = `https://www.google.com/maps?q=${message.media.latitude},${message.media.longitude}`;
          window.open(url, '_blank');
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <LocationOn sx={{ color: 'primary.main' }} />
          <Typography variant="subtitle2" fontWeight="bold">
            موقعیت
          </Typography>
        </Box>
        <Typography variant="body2">
          {message.media.address || message.content || `${message.media.latitude}, ${message.media.longitude}`}
        </Typography>
        <Box
          component="iframe"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${message.media.longitude - 0.01},${message.media.latitude - 0.01},${message.media.longitude + 0.01},${message.media.latitude + 0.01}&layer=mapnik&marker=${message.media.latitude},${message.media.longitude}`}
          sx={{
            width: '100%',
            height: 150,
            border: 'none',
            borderRadius: 1,
            mt: 1
          }}
        />
      </Box>
    );
  }

  return (
    <>
      <Typography
        variant="body2"
        sx={{
          whiteSpace: 'pre-wrap',
          direction: 'rtl',
          textAlign: 'right',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          color: '#212121'
        }}
        component="div"
      >
        {message.content?.split(/(@\w+|@all)/g).map((part, index) => {
          if (part.startsWith('@')) {
            const username = part.substring(1);
            const isMentioned = message.mentions?.some(m => {
              const mentionUser = m.user || m;
              return (mentionUser.username || mentionUser) === username;
            }) || (username === 'all' && message.isMentionAll);

            return (
              <Box
                key={index}
                component="span"
                sx={{
                  color: isMentioned ? 'primary.main' : 'inherit',
                  fontWeight: isMentioned ? 'bold' : 'normal',
                  bgcolor: isMentioned ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                  px: isMentioned ? 0.5 : 0,
                  borderRadius: isMentioned ? 1 : 0,
                  cursor: isMentioned ? 'pointer' : 'default'
                }}
                onClick={(e) => {
                  if (isMentioned && username !== 'all') {
                    e.stopPropagation();
                    const mentionUser = message.mentions?.find(m => {
                      const user = m.user || m;
                      return (user.username || user) === username;
                    });
                    if (mentionUser) {
                      navigate(`/profile/${(mentionUser.user || mentionUser)._id || (mentionUser.user || mentionUser)}`);
                    }
                  }
                }}
              >
                {part}
              </Box>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </Typography>
      {isOwn && (
        <MessageStatus
          readBy={message.readBy}
          sentBy={message.sender}
          chatType={chatType}
          participants={chat?.participants}
          messageId={message._id}
        />
      )}
    </>
  );
};

