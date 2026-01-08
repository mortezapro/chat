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
  IconButton,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Close, Add, Delete } from '@mui/icons-material';
import api from '@/services/api';

const PollDialog = ({ open, onClose, messageId, onSuccess }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [endsAt, setEndsAt] = useState('');

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      alert('لطفاً سوال را وارد کنید');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('حداقل ۲ گزینه لازم است');
      return;
    }

    try {
      await api.post(`/messages/${messageId}/poll`, {
        question,
        options: validOptions,
        isMultipleChoice,
        endsAt: endsAt || null
      });
      if (onSuccess) onSuccess();
      onClose();
      setQuestion('');
      setOptions(['', '']);
      setIsMultipleChoice(false);
      setEndsAt('');
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('خطا در ایجاد نظرسنجی');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">ایجاد نظرسنجی</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="سوال نظرسنجی"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="سوال خود را بنویسید..."
            sx={{
              '& .MuiInputBase-input': {
                direction: 'rtl',
                textAlign: 'right'
              }
            }}
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>گزینه‌ها</Typography>
            {options.map((option, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`گزینه ${index + 1}`}
                  sx={{ 
                    flex: 1,
                    '& .MuiInputBase-input': {
                      direction: 'rtl',
                      textAlign: 'right'
                    }
                  }}
                />
                {options.length > 2 && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveOption(index)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>
            ))}
            {options.length < 10 && (
              <Button
                startIcon={<Add />}
                onClick={handleAddOption}
                variant="outlined"
                size="small"
              >
                افزودن گزینه
              </Button>
            )}
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={isMultipleChoice}
                onChange={(e) => setIsMultipleChoice(e.target.checked)}
              />
            }
            label="انتخاب چندگانه"
          />

          <TextField
            label="پایان نظرسنجی (اختیاری)"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>انصراف</Button>
        <Button onClick={handleSubmit} variant="contained">
          ایجاد نظرسنجی
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PollDialog;


