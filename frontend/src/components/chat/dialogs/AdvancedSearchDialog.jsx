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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip
} from '@mui/material';
import { Search } from '@mui/icons-material';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const AdvancedSearchDialog = ({ open, onClose, chatId, onMessageSelect }) => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [senderId] = useState('');
  const [tags, setTags] = useState([]);
  const [onlyMyMessages, setOnlyMyMessages] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (chatId) params.append('chatId', chatId);
      if (query) params.append('query', query);
      if (type) params.append('type', type);
      if (senderId) params.append('senderId', senderId);
      if (tags.length > 0) {
        tags.forEach(tag => params.append('tags', tag));
      }
      if (onlyMyMessages) params.append('onlyMyMessages', 'true');
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await api.get(`/chats/search/advanced?${params.toString()}`);
      setResults(response.data.messages || []);
    } catch (error) {
      console.error('Error searching:', error);
      alert('خطا در جستجو');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Search />
          <Typography variant="h6">جستجوی پیشرفته</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="جستجوی متن"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            fullWidth
            placeholder="جستجو در محتوای پیام‌ها..."
            sx={{
              '& .MuiInputBase-input': {
                direction: 'rtl',
                textAlign: 'right'
              }
            }}
          />

          <FormControl fullWidth>
            <InputLabel>نوع پیام</InputLabel>
            <Select value={type} onChange={(e) => setType(e.target.value)} label="نوع پیام">
              <MenuItem value="">همه</MenuItem>
              <MenuItem value="text">متن</MenuItem>
              <MenuItem value="image">تصویر</MenuItem>
              <MenuItem value="video">ویدیو</MenuItem>
              <MenuItem value="audio">صوتی</MenuItem>
              <MenuItem value="file">فایل</MenuItem>
              <MenuItem value="location">موقعیت</MenuItem>
              <MenuItem value="link">لینک</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={onlyMyMessages}
                onChange={(e) => setOnlyMyMessages(e.target.checked)}
              />
            }
            label="فقط پیام‌های من"
          />

          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>تگ‌ها</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="افزودن تگ"
                sx={{ 
                  flex: 1,
                  '& .MuiInputBase-input': {
                    direction: 'rtl',
                    textAlign: 'right'
                  }
                }}
              />
              <Button onClick={handleAddTag} variant="outlined" size="small">
                افزودن
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => setTags(tags.filter((_, i) => i !== index))}
                  size="small"
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="از تاریخ"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="تا تاریخ"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Box>

          {results.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                نتایج ({results.length})
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {results.map((msg) => (
                  <Box
                    key={msg._id}
                    sx={{
                      p: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => {
                      if (onMessageSelect) onMessageSelect(msg);
                      onClose();
                    }}
                  >
                    <Typography variant="body2" noWrap>
                      {msg.content || `${msg.type} پیام`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(msg.createdAt).toLocaleDateString('fa-IR')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>بستن</Button>
        <Button onClick={handleSearch} variant="contained" disabled={loading}>
          جستجو
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedSearchDialog;


