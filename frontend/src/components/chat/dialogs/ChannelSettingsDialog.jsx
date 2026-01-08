import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar
} from '@mui/material';
import { Close, Delete, PersonAdd, PersonRemove, PhotoCamera } from '@mui/icons-material';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { getFileUrl } from '@/utils/chatHelpers';

const ChannelSettingsDialog = ({ open, onClose, chat, onUpdate }) => {
  const { user } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    isPublic: true,
    allowComments: true,
    allowReactions: true,
    onlyAdminsCanPost: false,
    onlyAdminsCanComment: false,
    maxPostsPerDay: null,
    restrictedWords: [],
    postScheduleEnabled: false,
    autoDeleteAfter: null
  });
  const [restrictedWord, setRestrictedWord] = useState('');
  const [members, setMembers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarKey, setAvatarKey] = useState(0);

  useEffect(() => {
    if (open && chat) {
      if (chat.channelSettings) {
        setSettings({
          ...settings,
          ...chat.channelSettings
        });
      }
      fetchMembers();
    }
  }, [open, chat]);

  useEffect(() => {
    if (chat?.avatar) {
      console.log('[ChannelSettingsDialog] Chat avatar updated:', {
        avatar: chat.avatar,
        fullUrl: getFileUrl(chat.avatar)
      });
      setAvatarUrl(chat.avatar);
      setAvatarKey(prev => prev + 1);
    }
  }, [chat?.avatar]);

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/channels/${chat._id}/members`);
      setMembers(response.data.members || []);
      setAdmins(response.data.admins || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleAddRestrictedWord = () => {
    if (restrictedWord.trim() && !settings.restrictedWords.includes(restrictedWord.trim())) {
      setSettings(prev => ({
        ...prev,
        restrictedWords: [...prev.restrictedWords, restrictedWord.trim()]
      }));
      setRestrictedWord('');
    }
  };

  const handleRemoveRestrictedWord = (word) => {
    setSettings(prev => ({
      ...prev,
      restrictedWords: prev.restrictedWords.filter(w => w !== word)
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/channels/${chat._id}/settings`, settings);
      if (onUpdate) {
        onUpdate();
      }
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('خطا در ذخیره تنظیمات');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    try {
      await api.post(`/channels/${chat._id}/unsubscribe`);
      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleAddModerator = async (userId) => {
    try {
      await api.post(`/channels/${chat._id}/moderators`, { userId });
      fetchMembers();
    } catch (error) {
      console.error('Error adding moderator:', error);
    }
  };

  const handleRemoveModerator = async (userId) => {
    try {
      await api.delete(`/channels/${chat._id}/moderators/${userId}`);
      fetchMembers();
    } catch (error) {
      console.error('Error removing moderator:', error);
    }
  };

  const isOwner = chat?.createdBy?._id === user?.id || chat?.createdBy === user?.id;
  const isAdmin = chat?.admins?.some(a => a._id === user?.id || a === user?.id) || isOwner;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">تنظیمات کانال</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label="تنظیمات عمومی" />
          <Tab label="اعضا" />
          <Tab label="دسترسی‌ها" />
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isAdmin && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={(avatarUrl || chat.avatar) ? `${getFileUrl(avatarUrl || chat.avatar)}?v=${avatarKey}` : undefined}
                  sx={{ width: 120, height: 120, mb: 1 }}
                  key={`channel-avatar-${avatarKey}`}
                  onError={(e) => {
                    console.error('[ChannelSettingsDialog] Avatar image load error:', {
                      src: avatarUrl || chat.avatar,
                      fullUrl: getFileUrl(avatarUrl || chat.avatar),
                      error: e
                    });
                  }}
                  onLoad={() => {
                    console.log('[ChannelSettingsDialog] Avatar image loaded successfully:', getFileUrl(avatarUrl || chat.avatar));
                  }}
                >
                  {chat.name?.[0] || 'C'}
                </Avatar>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="channel-avatar-upload"
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      console.log('[ChannelSettingsDialog] No file selected');
                      return;
                    }
                    
                    console.log('[ChannelSettingsDialog] Starting avatar upload:', {
                      fileName: file.name,
                      fileSize: file.size,
                      fileType: file.type
                    });
                    
                    setLoading(true);
                    try {
                      const formData = new FormData();
                      formData.append('file', file);
                      
                      console.log('[ChannelSettingsDialog] Uploading file to /upload');
                      const uploadResponse = await api.post('/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      
                      console.log('[ChannelSettingsDialog] Upload response:', uploadResponse.data);
                      
                      if (uploadResponse.data?.file?.url) {
                        const newAvatarUrl = uploadResponse.data.file.url;
                        console.log('[ChannelSettingsDialog] Updating chat with avatar URL:', newAvatarUrl);
                        
                        const response = await api.put(`/chats/${chat._id}`, {
                          avatar: newAvatarUrl
                        });
                        
                        console.log('[ChannelSettingsDialog] Chat update response:', response.data);
                        
                        if (response.data?.chat) {
                          const updatedChat = response.data.chat;
                          console.log('[ChannelSettingsDialog] Updated chat data:', {
                            id: updatedChat._id || updatedChat.id,
                            avatar: updatedChat.avatar,
                            hasAvatar: !!updatedChat.avatar
                          });
                          
                          setAvatarUrl(newAvatarUrl);
                          setAvatarKey(prev => prev + 1);
                          
                          console.log('[ChannelSettingsDialog] Avatar URL set:', {
                            newAvatarUrl,
                            fullUrl: getFileUrl(newAvatarUrl),
                            avatarKey: avatarKey + 1
                          });
                          
                          if (onUpdate) {
                            console.log('[ChannelSettingsDialog] Calling onUpdate callback');
                            onUpdate();
                            console.log('[ChannelSettingsDialog] onUpdate callback completed');
                          }
                        } else {
                          console.warn('[ChannelSettingsDialog] No chat data in response:', response.data);
                        }
                      } else {
                        console.error('[ChannelSettingsDialog] Invalid upload response:', uploadResponse.data);
                        alert('خطا در دریافت URL فایل آپلود شده');
                      }
                    } catch (error) {
                      console.error('[ChannelSettingsDialog] Error uploading avatar:', {
                        message: error.message,
                        response: error.response?.data,
                        status: error.response?.status
                      });
                      alert('خطا در آپلود آواتار: ' + (error.response?.data?.message || error.message));
                    } finally {
                      setLoading(false);
                      e.target.value = '';
                    }
                  }}
                />
                <label htmlFor="channel-avatar-upload">
                  <Button
                    component="span"
                    startIcon={<PhotoCamera />}
                    size="small"
                    variant="outlined"
                  >
                    تغییر آواتار
                  </Button>
                </label>
              </Box>
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={settings.isPublic}
                  onChange={(e) => handleSettingChange('isPublic', e.target.checked)}
                />
              }
              label="کانال عمومی"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.allowComments}
                  onChange={(e) => handleSettingChange('allowComments', e.target.checked)}
                />
              }
              label="اجازه کامنت"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.allowReactions}
                  onChange={(e) => handleSettingChange('allowReactions', e.target.checked)}
                />
              }
              label="اجازه واکنش"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.postScheduleEnabled}
                  onChange={(e) => handleSettingChange('postScheduleEnabled', e.target.checked)}
                />
              }
              label="فعال‌سازی برنامه‌ریزی پست"
            />

            <FormControl fullWidth>
              <InputLabel>حداکثر پست در روز</InputLabel>
              <Select
                value={settings.maxPostsPerDay || ''}
                onChange={(e) => handleSettingChange('maxPostsPerDay', e.target.value || null)}
                label="حداکثر پست در روز"
              >
                <MenuItem value="">نامحدود</MenuItem>
                <MenuItem value={5}>۵</MenuItem>
                <MenuItem value={10}>۱۰</MenuItem>
                <MenuItem value={20}>۲۰</MenuItem>
                <MenuItem value={50}>۵۰</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>کلمات محدود شده</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  value={restrictedWord}
                  onChange={(e) => setRestrictedWord(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRestrictedWord();
                    }
                  }}
                  placeholder="افزودن کلمه"
                  sx={{ 
                    flex: 1,
                    '& .MuiInputBase-input': {
                      direction: 'rtl',
                      textAlign: 'right'
                    }
                  }}
                />
                <Button onClick={handleAddRestrictedWord} variant="outlined" size="small">
                  افزودن
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {settings.restrictedWords.map((word, index) => (
                  <Chip
                    key={index}
                    label={word}
                    onDelete={() => handleRemoveRestrictedWord(word)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>اعضای کانال ({members.length})</Typography>
            <List>
              {members.map((member) => {
                const memberUser = member.user || member;
                const isModerator = member.role === 'moderator';
                const isMemberAdmin = admins.some(a => (a._id || a) === (memberUser._id || memberUser));
                const canManage = isOwner || (isAdmin && !isMemberAdmin);

                return (
                  <ListItem key={memberUser._id || memberUser}>
                    <ListItemText
                      primary={memberUser.firstName && memberUser.lastName
                        ? `${memberUser.firstName} ${memberUser.lastName}`
                        : memberUser.username}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          {isMemberAdmin && <Chip label="ادمین" size="small" color="primary" />}
                          {isModerator && <Chip label="مدیر" size="small" color="secondary" />}
                          {!isMemberAdmin && !isModerator && <Chip label="عضو" size="small" />}
                        </Box>
                      }
                    />
                    {canManage && (
                      <ListItemSecondaryAction>
                        {!isModerator && !isMemberAdmin && (
                          <IconButton
                            size="small"
                            onClick={() => handleAddModerator(memberUser._id || memberUser)}
                            title="افزودن به مدیران"
                          >
                            <PersonAdd />
                          </IconButton>
                        )}
                        {isModerator && !isMemberAdmin && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveModerator(memberUser._id || memberUser)}
                            title="حذف از مدیران"
                          >
                            <PersonRemove />
                          </IconButton>
                        )}
                        {!isMemberAdmin && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveMember(memberUser._id || memberUser)}
                            title="حذف عضو"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}

        {tabValue === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.onlyAdminsCanPost}
                  onChange={(e) => handleSettingChange('onlyAdminsCanPost', e.target.checked)}
                />
              }
              label="فقط ادمین‌ها می‌توانند پست بگذارند"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.onlyAdminsCanComment}
                  onChange={(e) => handleSettingChange('onlyAdminsCanComment', e.target.checked)}
                />
              }
              label="فقط ادمین‌ها می‌توانند کامنت بگذارند"
            />

            <FormControl fullWidth>
              <InputLabel>حذف خودکار پست‌ها بعد از (روز)</InputLabel>
              <Select
                value={settings.autoDeleteAfter || ''}
                onChange={(e) => handleSettingChange('autoDeleteAfter', e.target.value || null)}
                label="حذف خودکار پست‌ها بعد از (روز)"
              >
                <MenuItem value="">غیرفعال</MenuItem>
                <MenuItem value={7}>۷ روز</MenuItem>
                <MenuItem value={30}>۳۰ روز</MenuItem>
                <MenuItem value={90}>۹۰ روز</MenuItem>
                <MenuItem value={365}>یک سال</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>انصراف</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          ذخیره
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChannelSettingsDialog;


