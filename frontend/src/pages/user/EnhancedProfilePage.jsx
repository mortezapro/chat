import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, IconButton, CircularProgress, Alert, Paper, Tabs, Tab } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useProfile } from '@/hooks/user/useProfile';
import { ProfileHeader } from '@/components/user/profile/ProfileHeader';
import { ProfileInfoTab } from '@/components/user/profile/ProfileInfoTab';
import { ProfileMediaTab } from '@/components/user/profile/ProfileMediaTab';
import { ProfileSharedChatsTab } from '@/components/user/profile/ProfileSharedChatsTab';
import { ProfileActivityTab } from '@/components/user/profile/ProfileActivityTab';
import { ProfileSettingsTab } from '@/components/user/profile/ProfileSettingsTab';
import { ProfileSecurityTab } from '@/components/user/profile/ProfileSecurityTab';

const EnhancedProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [creatingChat, setCreatingChat] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const validUserId = userId && userId !== 'undefined' ? userId : (currentUser?.id || currentUser?._id);
  const { user, loading, error, sharedChats, sharedMedia, refetch } = useProfile(validUserId);

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
      console.error('Error creating chat:', err);
    } finally {
      setCreatingChat(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
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

  const isOwnProfile = user._id === currentUser?.id || user._id === currentUser?._id || user.id === currentUser?.id || user.id === currentUser?._id;

  return (
    <Box sx={{ height: '100%', overflow: 'auto', bgcolor: 'background.default' }}>
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
        <IconButton 
          onClick={() => navigate(-1)}
          sx={{ 
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
          پروفایل کاربر
        </Typography>
      </Box>

      <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <ProfileHeader
              user={user}
              isOwnProfile={isOwnProfile}
              onCreateChat={handleStartChat}
              creatingChat={creatingChat}
              onUpdate={refetch}
            />
          </CardContent>
        </Card>

        <Paper sx={{ mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="اطلاعات" />
            <Tab label="رسانه" />
            <Tab label="گروه‌های مشترک" />
            <Tab label="فعالیت" />
            <Tab label="تنظیمات" />
            <Tab label="امنیت" />
          </Tabs>
        </Paper>

        {tabValue === 0 && <ProfileInfoTab user={user} />}
        {tabValue === 1 && <ProfileMediaTab sharedMedia={sharedMedia} />}
        {tabValue === 2 && <ProfileSharedChatsTab sharedChats={sharedChats} onChatClick={(chatId) => navigate(`/chat/${chatId}`)} />}
        {tabValue === 3 && <ProfileActivityTab user={user} />}
        {tabValue === 4 && <ProfileSettingsTab user={user} />}
        {tabValue === 5 && <ProfileSecurityTab user={user} />}
      </Box>
    </Box>
  );
};

export default EnhancedProfilePage;
