import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  TextField,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { PersonAdd, Delete, Chat } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const ContactsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addContactDialog, setAddContactDialog] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await api.get('/users/contacts/list');
      setContacts(response.data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      const existingContactIds = contacts.map(c => c.user?._id || c.user);
      const filtered = response.data.users.filter(
        u => !existingContactIds.includes(u._id) && u._id !== user?.id
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleAddContact = async (userId) => {
    try {
      setLoading(true);
      await api.post(`/users/${userId}/contact`);
      await fetchContacts();
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding contact:', error);
      alert('خطا در افزودن مخاطب');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveContact = async (userId) => {
    try {
      await api.delete(`/users/${userId}/contact`);
      await fetchContacts();
    } catch (error) {
      console.error('Error removing contact:', error);
      alert('خطا در حذف مخاطب');
    }
  };

  const handleStartChat = async (contactUserId) => {
    try {
      // Check if chat already exists
      const chatsResponse = await api.get('/chats');
      const existingChat = chatsResponse.data.chats.find(
        chat => chat.type === 'private' && 
        chat.participants.some(p => (p._id || p) === contactUserId)
      );

      if (existingChat) {
        navigate(`/chat/${existingChat._id}`);
      } else {
        // Create new chat
        const newChatResponse = await api.post('/chats', {
          type: 'private',
          participants: [contactUserId]
        });
        navigate(`/chat/${newChatResponse.data.chat._id}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('خطا در شروع چت');
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const contactUser = contact.user;
    if (!contactUser) return false;
    
    const name = (contactUser.firstName && contactUser.lastName
      ? `${contactUser.firstName} ${contactUser.lastName}`
      : contactUser.username || '').toLowerCase();
    
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box 
        sx={{ 
          p: 1.5, 
          minHeight: 64,
          borderBottom: 1, 
          borderColor: 'divider', 
          bgcolor: 'primary.main', 
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: 2
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
            مخاطبین
          </Typography>
          <IconButton
            onClick={() => setAddContactDialog(true)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            <PersonAdd />
          </IconButton>
        </Box>
        <TextField
          fullWidth
          placeholder="جستجوی مخاطبین..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          size="small"
          sx={{
            bgcolor: 'rgba(255,255,255,0.15)',
            borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.3)'
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.5)'
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(255,255,255,0.7)'
              }
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'rgba(255,255,255,0.7)',
              opacity: 1
            }
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {filteredContacts.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searchQuery ? 'نتیجه‌ای یافت نشد' : 'هیچ مخاطبی وجود ندارد'}
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredContacts.map((contact) => {
              const contactUser = contact.user;
              if (!contactUser) return null;

              return (
                <ListItem
                  key={contactUser._id}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        edge="end"
                        onClick={() => handleStartChat(contactUser._id)}
                        color="primary"
                      >
                        <Chat />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveContact(contactUser._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={contactUser.avatar}>
                      {contactUser.firstName?.[0] || contactUser.username?.[0] || 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>
                          {contactUser.firstName && contactUser.lastName
                            ? `${contactUser.firstName} ${contactUser.lastName}`
                            : contactUser.username}
                        </Typography>
                        {contactUser.isOnline && (
                          <Chip label="آنلاین" size="small" color="success" />
                        )}
                      </Box>
                    }
                    secondary={contactUser.email}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      {/* Add Contact Dialog */}
      <Dialog open={addContactDialog} onClose={() => setAddContactDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>افزودن مخاطب</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="جستجوی کاربر"
            placeholder="نام کاربری، ایمیل یا نام..."
            onChange={(e) => handleSearch(e.target.value)}
            sx={{ mb: 2 }}
          />
          {searchResults.length > 0 && (
            <List>
              {searchResults.map((user) => (
                <ListItem
                  key={user._id}
                  button
                  onClick={() => handleAddContact(user._id)}
                  disabled={loading}
                >
                  <ListItemAvatar>
                    <Avatar src={user.avatar}>
                      {user.firstName?.[0] || user.username?.[0] || 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.username
                    }
                    secondary={user.email}
                  />
                  <PersonAdd />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddContactDialog(false)}>بستن</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactsPage;



