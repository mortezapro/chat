import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  TextField,
  Box,
  Typography
} from '@mui/material';
import { Close } from '@mui/icons-material';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const ForwardMessageDialog = ({ open, onClose, message, onForward }) => {
  const { user } = useAuthStore();
  const [chats, setChats] = useState([]);
  const [selectedChats, setSelectedChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchChats();
    }
  }, [open]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chats');
      // Filter out the current chat
      const filtered = (response.data.chats || []).filter(
        chat => chat._id !== message?.chat
      );
      setChats(filtered);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChat = (chatId) => {
    setSelectedChats(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = () => {
    if (selectedChats.length > 0 && onForward) {
      onForward(selectedChats);
    }
    setSelectedChats([]);
    onClose();
  };

  const getChatName = (chat) => {
    if (chat.name) return chat.name;
    if (chat.type === 'private' && chat.participants?.length > 0) {
      const otherParticipant = chat.participants.find(p => p._id !== user?.id);
      return otherParticipant?.firstName && otherParticipant?.lastName
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
        : otherParticipant?.username || 'کاربر';
    }
    return 'چت بدون نام';
  };

  const filteredChats = chats.filter(chat => {
    const name = getChatName(chat).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">ارسال به</Typography>
          <Button onClick={onClose} startIcon={<Close />} size="small">
            بستن
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <TextField
          fullWidth
          placeholder="جستجوی چت..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ 
            mb: 2,
            '& .MuiInputBase-input': {
              direction: 'rtl',
              textAlign: 'right'
            }
          }}
          size="small"
        />
        
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredChats.map((chat) => (
            <ListItem
              key={chat._id}
              button
              onClick={() => handleToggleChat(chat._id)}
            >
              <Checkbox
                checked={selectedChats.includes(chat._id)}
                onChange={() => handleToggleChat(chat._id)}
              />
              <ListItemAvatar>
                <Avatar src={chat.avatar}>
                  {getChatName(chat)?.[0] || 'C'}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={getChatName(chat)}
                secondary={chat.type === 'group' ? 'گروه' : 'چت خصوصی'}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>انصراف</Button>
        <Button
          variant="contained"
          onClick={handleForward}
          disabled={selectedChats.length === 0}
        >
          ارسال ({selectedChats.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ForwardMessageDialog;



