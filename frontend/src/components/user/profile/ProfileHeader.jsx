import { Box, Typography, Avatar, Badge, Chip, Button } from '@mui/material';
import { Message, Phone, PhotoCamera } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import api from '@/services/api';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getFileUrl } from '@/utils/chatHelpers';

export const ProfileHeader = ({ user, isOwnProfile, onCreateChat, creatingChat, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarKey, setAvatarKey] = useState(0);
  const setAuthUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (user?.avatar) {
      console.log('[ProfileHeader] User avatar updated:', {
        avatar: user.avatar,
        fullUrl: getFileUrl(user.avatar)
      });
      setAvatarUrl(user.avatar);
      setAvatarKey(prev => prev + 1);
    }
  }, [user?.avatar]);

  if (!user) return null;

  const currentAvatar = avatarUrl || user.avatar;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('[ProfileHeader] No file selected');
      return;
    }

    console.log('[ProfileHeader] Starting avatar upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('[ProfileHeader] Uploading file to /upload');
      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('[ProfileHeader] Upload response:', uploadResponse.data);

      if (uploadResponse.data?.file?.url) {
        const newAvatarUrl = uploadResponse.data.file.url;
        console.log('[ProfileHeader] Updating profile with avatar URL:', newAvatarUrl);

        const response = await api.put('/users/profile', {
          avatar: newAvatarUrl
        });

        console.log('[ProfileHeader] Profile update response:', response.data);

        if (response.data?.user) {
          const updatedUser = response.data.user;
          console.log('[ProfileHeader] Updated user data:', {
            id: updatedUser._id || updatedUser.id,
            avatar: updatedUser.avatar,
            hasAvatar: !!updatedUser.avatar
          });

          setAvatarUrl(newAvatarUrl);
          setAvatarKey(prev => prev + 1);

          console.log('[ProfileHeader] Avatar URL set:', {
            newAvatarUrl,
            fullUrl: getFileUrl(newAvatarUrl),
            avatarKey: avatarKey + 1
          });

          if (isOwnProfile && setAuthUser) {
            console.log('[ProfileHeader] Updating auth store with new user data');
            setAuthUser(updatedUser);
          }

          if (onUpdate) {
            console.log('[ProfileHeader] Calling onUpdate callback');
            await onUpdate();
            console.log('[ProfileHeader] onUpdate callback completed');
          }
        } else {
          console.warn('[ProfileHeader] No user data in response:', response.data);
        }
      } else {
        console.error('[ProfileHeader] Invalid upload response:', uploadResponse.data);
        alert('خطا در دریافت URL فایل آپلود شده');
      }
    } catch (error) {
      console.error('[ProfileHeader] Error uploading avatar:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert('خطا در آپلود آواتار: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          user.isOnline ? (
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'success.main', border: '3px solid', borderColor: 'background.paper' }} />
          ) : null
        }
      >
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <Avatar
            src={currentAvatar ? `${getFileUrl(currentAvatar)}?v=${avatarKey}` : undefined}
            sx={{ width: 140, height: 140, mb: 2, boxShadow: 4 }}
            key={`avatar-${avatarKey}`}
            onError={(e) => {
              console.error('[ProfileHeader] Avatar image load error:', {
                src: currentAvatar,
                fullUrl: getFileUrl(currentAvatar),
                error: e
              });
            }}
            onLoad={() => {
              console.log('[ProfileHeader] Avatar image loaded successfully:', getFileUrl(currentAvatar));
            }}
          >
            {user.firstName?.[0] || user.username?.[0] || 'U'}
          </Avatar>
          {isOwnProfile && (
            <>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="profile-avatar-upload"
                type="file"
                onChange={handleAvatarChange}
                disabled={uploading}
              />
              <Button
                startIcon={<PhotoCamera />}
                size="small"
                variant="outlined"
                disabled={uploading}
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => {
                  const input = document.getElementById('profile-avatar-upload');
                  if (input) {
                    input.click();
                  }
                }}
              >
                {uploading ? 'در حال آپلود...' : 'تغییر'}
              </Button>
            </>
          )}
        </Box>
      </Badge>

      <Typography variant="h4" gutterBottom fontWeight="bold">
        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
      </Typography>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        @{user.username}
      </Typography>

      {user.bio && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center', maxWidth: 600 }}>
          {user.bio}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {user.isOnline && <Chip label="آنلاین" color="success" size="small" />}
        {user.verified && <Chip label="تایید شده" color="primary" size="small" />}
        {user.premium && <Chip label="کاربر ویژه" color="warning" size="small" />}
      </Box>

      {!isOwnProfile && (
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            startIcon={creatingChat ? <CircularProgress size={20} /> : <Message />}
            onClick={onCreateChat}
            disabled={creatingChat}
            size="large"
          >
            {creatingChat ? 'در حال ایجاد...' : 'شروع چت'}
          </Button>
          <Button variant="outlined" startIcon={<Phone />}>
            تماس صوتی
          </Button>
        </Box>
      )}
    </Box>
  );
};

