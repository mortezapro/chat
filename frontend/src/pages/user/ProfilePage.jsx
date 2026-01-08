import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Grid
} from '@mui/material';
import { ArrowBack, Message, Person } from '@mui/icons-material';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${userId}`);
      setUser(response.data.user);
      setError('');
    } catch (err) {
      setError('خطا در بارگذاری پروفایل');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!user) return;
    
    setCreatingChat(true);
    try {
      const response = await api.post('/chats', {
        type: 'private',
        participants: [user._id]
      });
      navigate(`/chat/${response.data.chat._id}`);
    } catch (err) {
      setError('خطا در ایجاد چت');
    } finally {
      setCreatingChat(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !user) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!user) return null;

  const isOwnProfile = user._id === currentUser?.id;

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box
        sx={{
          p: 1.5,
          minHeight: 64,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'primary.main',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: 2
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ 
            cursor: 'pointer',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          بازگشت
        </Button>
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
          پروفایل کاربر
        </Typography>
      </Box>

      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={user.avatar}
                sx={{ width: 120, height: 120, mb: 2 }}
              >
                {user.firstName?.[0] || user.username?.[0] || 'U'}
              </Avatar>
              
              <Typography variant="h5" gutterBottom>
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                @{user.username}
              </Typography>

              {user.isOnline && (
                <Chip
                  label="آنلاین"
                  color="success"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}

              {!isOwnProfile && (
                <Button
                  variant="contained"
                  startIcon={<Message />}
                  onClick={handleStartChat}
                  disabled={creatingChat}
                  sx={{ mt: 2, cursor: 'pointer' }}
                >
                  {creatingChat ? <CircularProgress size={20} /> : 'شروع چت'}
                </Button>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  نام
                </Typography>
                <Typography variant="body1">
                  {user.firstName || 'تعریف نشده'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  نام خانوادگی
                </Typography>
                <Typography variant="body1">
                  {user.lastName || 'تعریف نشده'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  ایمیل
                </Typography>
                <Typography variant="body1">
                  {user.email}
                </Typography>
              </Grid>

              {user.bio && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    بیوگرافی
                  </Typography>
                  <Typography variant="body1">
                    {user.bio}
                  </Typography>
                </Grid>
              )}

              {user.phoneNumber && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    شماره تماس
                  </Typography>
                  <Typography variant="body1">
                    {user.phoneNumber}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ProfilePage;






