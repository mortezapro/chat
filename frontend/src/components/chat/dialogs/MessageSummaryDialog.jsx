import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton
} from '@mui/material';
import { Close, PushPin } from '@mui/icons-material';
import api from '@/services/api';

const MessageSummaryDialog = ({ open, onClose, selectedMessages = [], chatId, onSuccess }) => {
  const [summary, setSummary] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const handleSubmit = async () => {
    if (!summary.trim()) {
      alert('لطفاً خلاصه را وارد کنید');
      return;
    }

    try {
      const response = await api.post(`/chats/${chatId}/summary`, {
        content: summary,
        messageIds: (selectedMessages || []).map(m => m._id)
      });

      if (isPinned && response.data.summary._id) {
        await api.post(`/chats/${chatId}/summary/${response.data.summary._id}/pin`);
      }

      if (onSuccess) onSuccess();
      onClose();
      setSummary('');
      setIsPinned(false);
    } catch (error) {
      console.error('Error creating summary:', error);
      alert('خطا در ایجاد خلاصه');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">ایجاد خلاصه گفتگو</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {selectedMessages?.length || 0} پیام انتخاب شده
            </Typography>
            {selectedMessages && selectedMessages.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {selectedMessages.slice(0, 5).map((msg) => (
                  <Chip
                    key={msg._id}
                    label={msg.content?.substring(0, 30) || 'پیام'}
                    size="small"
                    variant="outlined"
                  />
                ))}
                {selectedMessages.length > 5 && (
                  <Chip
                    label={`+${selectedMessages.length - 5} بیشتر`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            )}
          </Box>

          <TextField
            label="خلاصه گفتگو"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            fullWidth
            multiline
            rows={6}
            placeholder="خلاصه گفتگو را بنویسید..."
            sx={{
              '& .MuiInputBase-input': {
                direction: 'rtl',
                textAlign: 'right'
              }
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant={isPinned ? 'contained' : 'outlined'}
              startIcon={<PushPin />}
              onClick={() => setIsPinned(!isPinned)}
              size="small"
            >
              پین کردن
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>انصراف</Button>
        <Button onClick={handleSubmit} variant="contained">
          ایجاد خلاصه
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageSummaryDialog;

