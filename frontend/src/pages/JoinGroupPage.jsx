import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Avatar
} from '@mui/material';
import { Group, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const JoinGroupPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [chat, setChat] = useState(null);

  useEffect(() => {
    if (code && user) {
      joinGroup();
    } else if (!user) {
      navigate('/login');
    }
  }, [code, user]);

  const joinGroup = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/chats/join/${code}`);
      setChat(response.data.chat);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'خطا در پیوستن به گروه');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            خطا
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/')}>
            بازگشت به خانه
          </Button>
        </Paper>
      </Box>
    );
  }

  if (success && chat) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
          <Avatar
            src={chat.avatar}
            sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
          >
            <Group sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" gutterBottom>
            {chat.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            شما با موفقیت به گروه پیوستید
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate(`/chat/${chat._id}`)}
          >
            ورود به گروه
          </Button>
        </Paper>
      </Box>
    );
  }

  return null;
};

export default JoinGroupPage;








