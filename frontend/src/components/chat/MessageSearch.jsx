import { useState } from 'react';
import { Box, TextField, IconButton, Dialog, List, ListItem, ListItemText, Typography, Chip } from '@mui/material';
import { Search, Close } from '@mui/icons-material';
import { format } from 'date-fns';
import api from '@/services/api';

const MessageSearch = ({ chatId, onMessageSelect }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim() || !chatId) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/messages/${chatId}?page=1&limit=100`);
      const allMessages = response.data.messages || [];
      
      const filtered = allMessages.filter(msg =>
        msg.content?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !msg.isDeleted
      );
      
      setResults(filtered);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error searching messages:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      handleMessageClick(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleMessageClick = (message) => {
    if (onMessageSelect) {
      onMessageSelect(message);
    }
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <>
      <IconButton onClick={() => setOpen(true)} size="small">
        <Search />
      </IconButton>
      
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setQuery('');
          setResults([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="جستجوی پیام..."
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              autoFocus
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <IconButton onClick={() => setOpen(false)}>
              <Close />
            </IconButton>
          </Box>

          {loading && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              در حال جستجو...
            </Typography>
          )}

          {!loading && query && results.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              نتیجه‌ای یافت نشد
            </Typography>
          )}

          {!loading && results.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                {results.length} نتیجه یافت شد
              </Typography>
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {results.map((message, index) => (
                  <ListItem
                    key={message._id}
                    button
                    onClick={() => handleMessageClick(message)}
                    selected={index === selectedIndex}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {message.content}
                          </Typography>
                          <Chip
                            label={format(new Date(message.createdAt), 'HH:mm')}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {message.sender?.firstName && message.sender?.lastName
                            ? `${message.sender.firstName} ${message.sender.lastName}`
                            : message.sender?.username}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </Dialog>
    </>
  );
};

export default MessageSearch;



