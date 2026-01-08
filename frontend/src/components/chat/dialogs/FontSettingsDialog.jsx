import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Box
} from '@mui/material';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const FontSettingsDialog = ({ open, onClose, chatId }) => {
  const { user } = useAuthStore();
  const [fontFamily, setFontFamily] = useState('default');
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    if (chatId) {
      api.get(`/chats/${chatId}`)
        .then(response => {
          const chat = response.data.chat;
          const userSettings = chat.userSettings?.find(
            s => s.user.toString() === user?.id
          );
          if (userSettings) {
            setFontFamily(userSettings.fontFamily || 'default');
            setFontSize(userSettings.fontSize || 14);
          }
        })
        .catch(() => {
          if (user?.preferences) {
            setFontFamily(user.preferences.fontFamily || 'default');
            setFontSize(user.preferences.fontSize || 14);
          }
        });
    } else if (user?.preferences) {
      setFontFamily(user.preferences.fontFamily || 'default');
      setFontSize(user.preferences.fontSize || 14);
    }
  }, [open, chatId, user]);

  const handleSave = async () => {
    try {
      if (chatId) {
        await api.put(`/chats/${chatId}/settings`, {
          fontFamily,
          fontSize
        });
      } else {
        await api.put('/users/preferences', {
          fontFamily,
          fontSize
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving font settings:', error);
      alert('خطا در ذخیره تنظیمات');
    }
  };

  const fonts = [
    { value: 'default', label: 'پیش‌فرض' },
    { value: 'Vazir', label: 'وزیر' },
    { value: 'Shabnam', label: 'شبنم' },
    { value: 'Tanha', label: 'تنها' },
    { value: 'Gandom', label: 'گندم' },
    { value: 'Samim', label: 'صمیم' }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>تنظیمات فونت</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>فونت</InputLabel>
            <Select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              label="فونت"
            >
              {fonts.map((font) => (
                <MenuItem key={font.value} value={font.value}>
                  {font.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography gutterBottom>
              اندازه فونت: {fontSize}px
            </Typography>
            <Slider
              value={fontSize}
              onChange={(e, value) => setFontSize(value)}
              min={10}
              max={24}
              step={1}
              marks
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>انصراف</Button>
        <Button onClick={handleSave} variant="contained">
          ذخیره
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FontSettingsDialog;


