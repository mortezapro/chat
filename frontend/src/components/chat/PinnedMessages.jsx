import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Avatar,
  Tooltip,
  Collapse
} from '@mui/material';
import { PushPin, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';

const PinnedMessages = ({ pinnedMessages = [], onUpdate, chat }) => {
  const [expanded, setExpanded] = useState(true);
  const { user } = useAuthStore();

  const handleUnpin = async (messageId) => {
    try {
      await api.post(`/messages/${messageId}/pin`);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error unpinning message:', error);
    }
  };

  const handleMessageClick = (messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.backgroundColor = 'rgba(25, 118, 210, 0.1)';
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 2000);
    }
  };

  if (!pinnedMessages || pinnedMessages.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={2}
      sx={{
        m: 2,
        mb: 1,
        bgcolor: 'primary.light',
        color: 'primary.contrastText',
        borderRadius: 2
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PushPin fontSize="small" />
          <Typography variant="body2" fontWeight="bold">
            پیام‌های پین شده ({pinnedMessages.length})
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: 'inherit' }}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          {pinnedMessages.map((message) => (
            <Box
              key={message._id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                mb: 0.5,
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.15)'
                }
              }}
              onClick={() => handleMessageClick(message._id)}
            >
              <Avatar
                sx={{ width: 24, height: 24 }}
                src={message.sender?.avatar}
              >
                {message.sender?.firstName?.[0] || message.sender?.username?.[0] || 'U'}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {message.sender?.firstName && message.sender?.lastName
                    ? `${message.sender.firstName} ${message.sender.lastName}`
                    : message.sender?.username}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    opacity: 0.9
                  }}
                >
                  {message.content?.substring(0, 50)}
                  {message.content?.length > 50 ? '...' : ''}
                </Typography>
              </Box>
              {(chat?.admins?.some(a => (a._id || a) === user?.id) || message.sender?._id === user?.id) && (
                <Tooltip title="حذف پین">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnpin(message._id);
                    }}
                    sx={{ color: 'inherit' }}
                  >
                    <PushPin fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ))}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default PinnedMessages;

