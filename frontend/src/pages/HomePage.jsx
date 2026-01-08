import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, IconButton, Fab } from '@mui/material';
import { Add } from '@mui/icons-material';
import ChatList from '@/components/chat/list/ChatList';
import CreateChatDialog from '@/components/chat/dialogs/CreateChatDialog';
import ChannelDiscovery from '@/components/discovery/ChannelDiscovery';
import ChatSearch from '@/components/chat/list/ChatSearch';
import DesktopChatFilter from '@/components/chat/list/DesktopChatFilter';
import StoriesBar from '@/components/stories/StoriesBar';
import { ChatListSkeleton } from '@/components/common/LoadingSkeleton';
import api from '@/services/api';
import { getSocket } from '@/services/socket';
import { useUIStore } from '@/stores/uiStore';

const HomePage = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { chatSearchQuery, chatFilter, activityFilter, setActivityFilter } = useUIStore();

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activityFilter) {
        params.append('activityFilter', activityFilter);
      }
      const response = await api.get(`/chats?${params.toString()}`);
      setChats(response.data.chats || []);
      setError('');
    } catch (err) {
      setError('خطا در بارگذاری چت‌ها');
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, [activityFilter]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    
    const handleNewMessage = () => {
      fetchChats();
    };
    
    socket.on('message:new', handleNewMessage);
    socket.on('chat:new', handleNewMessage);
    socket.on('chat:updated', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('chat:new', handleNewMessage);
      socket.off('chat:updated', handleNewMessage);
    };
  }, [fetchChats]);


  const handleChatSelect = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  const handleChatCreated = (newChat) => {
    setChats((prev) => [newChat, ...prev]);
    navigate(`/chat/${newChat._id}`);
  };

  const filteredChats = useMemo(() => {
    let filtered = [...chats];

    // Filter by type
    if (chatFilter === 'private') {
      filtered = filtered.filter(chat => chat.type === 'private');
    } else if (chatFilter === 'groups') {
      filtered = filtered.filter(chat => chat.type === 'group');
    } else if (chatFilter === 'channels') {
      filtered = filtered.filter(chat => chat.type === 'channel');
    }

    // Filter by search query
    if (chatSearchQuery.trim()) {
      const query = chatSearchQuery.toLowerCase();
      filtered = filtered.filter(chat => {
        const chatName = chat.name || 
          (chat.type === 'private' && chat.participants?.length > 0
            ? chat.participants.find(p => p._id !== chat.participants[0]._id)?.firstName || 
              chat.participants.find(p => p._id !== chat.participants[0]._id)?.username || ''
            : '');
        return chatName.toLowerCase().includes(query) ||
               chat.participants?.some(p => 
                 (p.firstName || '').toLowerCase().includes(query) ||
                 (p.lastName || '').toLowerCase().includes(query) ||
                 (p.username || '').toLowerCase().includes(query)
               );
      });
    }

    return filtered;
  }, [chats, chatFilter, chatSearchQuery]);

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">چت‌ها</Typography>
        </Box>
        <ChatListSkeleton />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', bgcolor: 'background.default' }}>
      <Box 
        sx={{ 
          p: 1.5, 
          minHeight: 64,
          borderBottom: 1, 
          borderColor: 'divider', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: 2
        }}
      >
        <Box>
          <Typography 
            variant="h6" 
            fontWeight="bold"
            sx={{ color: 'white' }}
          >
            چت‌ها
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {filteredChats.length} گفتگو
          </Typography>
        </Box>
        <IconButton 
          onClick={() => setCreateDialogOpen(true)} 
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.3)'
            }
          }}
        >
          <Add />
        </IconButton>
      </Box>
      <StoriesBar />
      <ChatSearch />
      <DesktopChatFilter onFilterChange={(filter) => {
        fetchChats();
      }} />
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default' }}>
        {filteredChats.length === 0 && !loading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              gap: 2,
              p: 4
            }}
          >
            <Typography variant="h6" color="text.secondary" textAlign="center">
              چتی وجود ندارد
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              برای شروع یک گفتگو جدید، روی دکمه + کلیک کنید
            </Typography>
            <Fab
              color="primary"
              onClick={() => setCreateDialogOpen(true)}
              sx={{ cursor: 'pointer', mt: 2 }}
            >
              <Add />
            </Fab>
          </Box>
        ) : (
          <ChatList chats={filteredChats} onChatSelect={handleChatSelect} />
        )}
      </Box>
      <CreateChatDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onChatCreated={handleChatCreated}
      />
    </Box>
  );
};

export default HomePage;

