import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Avatar, CircularProgress, Alert, IconButton, AppBar, Toolbar } from '@mui/material';
import { Bookmark, Menu, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const SavedMessagesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSavedMessages();
  }, []);

  const fetchSavedMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/saved/all');
      setMessages(response.data.messages);
      setError('');
    } catch (err) {
      setError('خطا در بارگذاری پیام‌های ذخیره‌شده');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = (message) => {
    if (message.chat?._id) {
      navigate(`/chat/${message.chat._id}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box 
        sx={{ 
          p: 1.5, 
          minHeight: 64,
          borderBottom: 1, 
          borderColor: 'divider', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => {
              const event = new CustomEvent('openMobileSidebar');
              window.dispatchEvent(event);
            }}
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            <Menu />
          </IconButton>
          <IconButton 
            onClick={() => navigate('/')} 
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Bookmark sx={{ color: 'white' }} />
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
              پیام‌های ذخیره‌شده
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <Bookmark sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
            <Typography color="text.secondary">
              هیچ پیام ذخیره‌شده‌ای وجود ندارد
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {messages.map((message) => (
              <Paper
                key={message._id}
                elevation={1}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => handleMessageClick(message)}
              >
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Avatar src={message.sender?.avatar}>
                    {message.sender?.firstName?.[0] || message.sender?.username?.[0] || 'U'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {message.sender?.firstName && message.sender?.lastName
                          ? `${message.sender.firstName} ${message.sender.lastName}`
                          : message.sender?.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(message.createdAt), 'dd/MM/yyyy HH:mm')}
                      </Typography>
                    </Box>
                    {message.chat && (
                      <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
                        از: {message.chat.name || 'چت خصوصی'}
                      </Typography>
                    )}
                    <Typography variant="body1">
                      {message.content}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SavedMessagesPage;





