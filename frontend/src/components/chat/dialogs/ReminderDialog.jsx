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
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { AccessTime } from '@mui/icons-material';
import api from '@/services/api';

const ReminderDialog = ({ open, onClose, message, onSuccess }) => {
  const [remindAt, setRemindAt] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [preset, setPreset] = useState('');

  const handlePresetChange = (value) => {
    setPreset(value);
    const now = new Date();
    let remindDate;

    switch (value) {
      case 'tomorrow':
        remindDate = new Date(now);
        remindDate.setDate(now.getDate() + 1);
        remindDate.setHours(9, 0, 0, 0);
        break;
      case 'nextWeek':
        remindDate = new Date(now);
        remindDate.setDate(now.getDate() + 7);
        remindDate.setHours(9, 0, 0, 0);
        break;
      case 'nextMonth':
        remindDate = new Date(now);
        remindDate.setMonth(now.getMonth() + 1);
        remindDate.setHours(9, 0, 0, 0);
        break;
      case 'in1Hour':
        remindDate = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case 'in3Hours':
        remindDate = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        break;
      case 'in6Hours':
        remindDate = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        break;
      default:
        return;
    }

    setRemindAt(remindDate.toISOString().slice(0, 16));
  };

  const handleSubmit = async () => {
    if (!remindAt) {
      alert('لطفاً زمان یادآوری را انتخاب کنید');
      return;
    }

    try {
      await api.post(`/messages/${message._id}/reminder`, {
        remindAt: new Date(remindAt).toISOString(),
        message: reminderMessage
      });
      if (onSuccess) onSuccess();
      onClose();
      setRemindAt('');
      setReminderMessage('');
      setPreset('');
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('خطا در ایجاد یادآوری');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTime />
          <Typography variant="h6">یادآوری روی پیام</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>انتخاب سریع</InputLabel>
            <Select
              value={preset}
              onChange={(e) => handlePresetChange(e.target.value)}
              label="انتخاب سریع"
            >
              <MenuItem value="in1Hour">یک ساعت دیگر</MenuItem>
              <MenuItem value="in3Hours">سه ساعت دیگر</MenuItem>
              <MenuItem value="in6Hours">شش ساعت دیگر</MenuItem>
              <MenuItem value="tomorrow">فردا ساعت ۹ صبح</MenuItem>
              <MenuItem value="nextWeek">هفته بعد</MenuItem>
              <MenuItem value="nextMonth">ماه بعد</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="زمان یادآوری"
            type="datetime-local"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="یادداشت (اختیاری)"
            value={reminderMessage}
            onChange={(e) => setReminderMessage(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="یادداشت خود را بنویسید..."
            sx={{
              '& .MuiInputBase-input': {
                direction: 'rtl',
                textAlign: 'right'
              }
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>انصراف</Button>
        <Button onClick={handleSubmit} variant="contained">
          ایجاد یادآوری
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReminderDialog;


