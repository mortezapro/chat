import { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ListItemIcon,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Search, ArrowBack, PersonAdd, Menu as MenuIcon, Delete, MoreVert } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const MobileContactsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (userSearchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [userSearchQuery]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/contacts/list');
      setContacts(response.data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setSnackbar({ open: true, message: 'خطا در بارگذاری مخاطبین', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setSearching(true);
      const response = await api.get(`/users/search?q=${encodeURIComponent(userSearchQuery)}`);
      const allUsers = response.data.users || [];
      const contactUserIds = contacts.map(c => (c.user?._id || c.user)?.toString());
      const filtered = allUsers.filter(u => 
        u._id !== user?.id && 
        !contactUserIds.includes(u._id?.toString())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddContact = async (userId) => {
    try {
      await api.post(`/users/${userId}/contact`);
      setSnackbar({ open: true, message: 'به مخاطبین اضافه شد', severity: 'success' });
      setAddDialogOpen(false);
      setUserSearchQuery('');
      setSearchResults([]);
      fetchContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'خطا در اضافه کردن مخاطب', severity: 'error' });
    }
  };

  const handleRemoveContact = async (contactUserId) => {
    try {
      await api.delete(`/users/${contactUserId}/contact`);
      setSnackbar({ open: true, message: 'از مخاطبین حذف شد', severity: 'success' });
      setMenuAnchor(null);
      fetchContacts();
    } catch (error) {
      console.error('Error removing contact:', error);
      setSnackbar({ open: true, message: 'خطا در حذف مخاطب', severity: 'error' });
    }
  };

  const handleStartChat = async (contactUserId) => {
    try {
      const chatsResponse = await api.get('/chats');
      const existingChat = chatsResponse.data.chats.find(
        chat => chat.type === 'private' && 
        chat.participants.some(p => (p._id || p) === contactUserId)
      );

      if (existingChat) {
        navigate(`/chat/${existingChat._id}`);
      } else {
        const newChatResponse = await api.post('/chats', {
          type: 'private',
          participants: [contactUserId]
        });
        navigate(`/chat/${newChatResponse.data.chat._id}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => {
              const event = new CustomEvent('openMobileSidebar');
              window.dispatchEvent(event);
            }}
            sx={{ color: 'white', mr: 1 }}
          >
            <Menu />
          </IconButton>
          <IconButton onClick={() => navigate('/')} sx={{ color: 'white' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
            مخاطبین
          </Typography>
          <IconButton 
            sx={{ color: 'white' }}
            onClick={() => setAddDialogOpen(true)}
          >
            <PersonAdd />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          placeholder="جستجوی مخاطبین..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
          sx={{
            bgcolor: 'background.default',
            borderRadius: 3,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: 'none'
              }
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
          <List sx={{ p: 0 }}>
            {filteredContacts.map((contact) => {
              const contactUser = contact.user;
              if (!contactUser) return null;

              return (
                <ListItem
                  key={contactUser._id}
                  disablePadding
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <ListItemButton
                    onClick={() => handleStartChat(contactUser._id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setMenuAnchor(e.currentTarget);
                      setSelectedContact(contactUser._id);
                    }}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={contactUser.avatar}
                        sx={{ width: 50, height: 50 }}
                      >
                        {contactUser.firstName?.[0] || contactUser.username?.[0] || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight={500}>
                            {contactUser.firstName && contactUser.lastName
                              ? `${contactUser.firstName} ${contactUser.lastName}`
                              : contactUser.username}
                          </Typography>
                          {contactUser.isOnline && (
                            <Chip label="آنلاین" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                          )}
                        </Box>
                      }
                      secondary={contactUser.email}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAnchor(e.currentTarget);
                        setSelectedContact(contactUser._id);
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      <Dialog open={addDialogOpen} onClose={() => {
        setAddDialogOpen(false);
        setUserSearchQuery('');
        setSearchResults([]);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>افزودن مخاطب</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="جستجوی کاربر..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
          {searching && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!searching && userSearchQuery.length >= 2 && searchResults.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              کاربری یافت نشد
            </Typography>
          )}
          {!searching && searchResults.length > 0 && (
            <List sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
              {searchResults.map((searchUser) => (
                <ListItem key={searchUser._id} disablePadding>
                  <ListItemButton onClick={() => handleAddContact(searchUser._id)}>
                    <ListItemAvatar>
                      <Avatar src={searchUser.avatar}>
                        {searchUser.firstName?.[0] || searchUser.username?.[0] || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={searchUser.firstName && searchUser.lastName
                        ? `${searchUser.firstName} ${searchUser.lastName}`
                        : searchUser.username}
                      secondary={searchUser.email}
                    />
                    <ListItemIcon>
                      <PersonAdd />
                    </ListItemIcon>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddDialogOpen(false);
            setUserSearchQuery('');
            setSearchResults([]);
          }}>بستن</Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          if (selectedContact) {
            handleRemoveContact(selectedContact);
          }
        }}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          حذف از مخاطبین
        </MenuItem>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MobileContactsPage;




