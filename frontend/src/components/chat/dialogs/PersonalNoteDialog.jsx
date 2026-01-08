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
  IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import api from '@/services/api';

const PersonalNoteDialog = ({ open, onClose, message, onSuccess }) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (message?.personalNotes?.[0]) {
      setNote(message.personalNotes[0].note || '');
    } else {
      setNote('');
    }
  }, [message, open]);

  const handleSubmit = async () => {
    try {
      if (note.trim()) {
        await api.post(`/messages/${message._id}/note`, { note });
      } else {
        await api.delete(`/messages/${message._id}/note`);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('خطا در ذخیره یادداشت');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">یادداشت شخصی</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <TextField
            label="یادداشت"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder="یادداشت شخصی خود را بنویسید..."
            sx={{
              '& .MuiInputBase-input': {
                direction: 'rtl',
                textAlign: 'right'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            این یادداشت فقط برای شما قابل مشاهده است
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>انصراف</Button>
        <Button onClick={handleSubmit} variant="contained">
          ذخیره
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PersonalNoteDialog;


