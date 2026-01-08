import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tabs,
  Tab,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  CircularProgress,
  Typography,
  Chip,
  IconButton
} from '@mui/material';
import { Person, Group, Close, Campaign } from '@mui/icons-material';
import api from '@/services/api';

const CreateChatDialog = ({ open, onClose, onChatCreated }) => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (open) {
      setTabValue(0);
      setSearchQuery('');
      setSelectedUsers([]);
      setGroupName('');
      setGroupDescription('');
    }
  }, [open]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setUsers([]);
        return;
      }

      setSearching(true);
      try {
        const response = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
        setUsers(response.data.users || []);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleUserToggle = (user) => {
    setSelectedUsers((prev) => {
      if (tabValue === 0) {
        return [user];
      }
      const exists = prev.find((u) => u._id === user._id);
      if (exists) {
        return prev.filter((u) => u._id !== user._id);
      }
      return [...prev, user];
    });
  };

  const handleCreateChat = async () => {
    if (tabValue === 0 && selectedUsers.length !== 1) {
      return;
    }
    if (tabValue === 1 && selectedUsers.length === 0) {
      return;
    }
    if (tabValue === 1 && !groupName.trim()) {
      return;
    }

    setLoading(true);
    try {
      const chatType = tabValue === 0 ? 'private' : tabValue === 1 ? 'group' : 'channel';
      const response = await api.post('/chats', {
        type: chatType,
        participants: tabValue === 2 ? [] : selectedUsers.map((u) => u._id),
        name: (tabValue === 1 || tabValue === 2) ? groupName : undefined,
        description: (tabValue === 1 || tabValue === 2) ? groupDescription : undefined
      });

      if (onChatCreated) {
        onChatCreated(response.data.chat);
      }
      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {tabValue === 0 ? 'شروع چت خصوصی' : tabValue === 1 ? 'ایجاد گروه جدید' : 'ایجاد کانال جدید'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab icon={<Person />} label="چت خصوصی" />
          <Tab icon={<Group />} label="گروه" />
          <Tab icon={<Campaign />} label="کانال" />
        </Tabs>

        {(tabValue === 1 || tabValue === 2) && (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="نام گروه"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              margin="normal"
              required
              sx={{
                '& .MuiInputBase-input': {
                  direction: 'rtl',
                  textAlign: 'right'
                }
              }}
            />
            <TextField
              fullWidth
              label="توضیحات (اختیاری)"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              margin="normal"
              multiline
              rows={2}
              sx={{
                '& .MuiInputBase-input': {
                  direction: 'rtl',
                  textAlign: 'right'
                }
              }}
            />
          </Box>
        )}

        {tabValue !== 2 && (
          <TextField
            fullWidth
            label="جستجوی کاربر"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            margin="normal"
            placeholder="نام کاربری یا نام..."
            sx={{
              '& .MuiInputBase-input': {
                direction: 'rtl',
                textAlign: 'right'
              }
            }}
          />
        )}

        {selectedUsers.length > 0 && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              انتخاب شده ({selectedUsers.length}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {selectedUsers.map((user) => (
                <Chip
                  key={user._id}
                  label={user.firstName || user.username}
                  onDelete={() => handleUserToggle(user)}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ maxHeight: 400, overflow: 'auto', mt: 2 }}>
          {searching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : users.length === 0 && searchQuery.length >= 2 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              کاربری یافت نشد
            </Typography>
          ) : (
            <List>
              {users.map((user) => (
                <ListItem key={user._id} disablePadding>
                  <ListItemButton onClick={() => handleUserToggle(user)}>
                    <Checkbox
                      checked={selectedUsers.some((u) => u._id === user._id)}
                      edge="start"
                    />
                    <ListItemAvatar>
                      <Avatar src={user.avatar}>
                        {user.firstName?.[0] || user.username?.[0] || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                      secondary={user.username}
                    />
                    {user.isOnline && (
                      <Chip label="آنلاین" color="success" size="small" sx={{ ml: 1 }} />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>انصراف</Button>
        <Button
          onClick={handleCreateChat}
          variant="contained"
          disabled={
            loading ||
            (tabValue === 0 && selectedUsers.length !== 1) ||
            ((tabValue === 1 || tabValue === 2) && !groupName.trim())
          }
        >
          {loading ? <CircularProgress size={20} /> : tabValue === 0 ? 'شروع چت' : tabValue === 1 ? 'ایجاد گروه' : 'ایجاد کانال'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateChatDialog;

