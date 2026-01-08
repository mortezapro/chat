import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, List, Typography } from '@mui/material';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useChats } from '@/hooks/chat/useChats';
import { useFilteredChats } from '@/hooks/chat/useFilteredChats';
import CreateChatDialog from '@/components/chat/dialogs/CreateChatDialog';
import StoriesBar from '@/components/stories/StoriesBar';
import MobileChatFilter from '@/components/chat/list/MobileChatFilter';
import { MobileHomeHeader } from '@/components/mobile/home/MobileHomeHeader';
import { MobileChatListItem } from '@/components/mobile/home/MobileChatListItem';

const MobileHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { chatSearchQuery, chatFilter, activityFilter } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showStories, setShowStories] = useState(true);

  const { chats, loading, refetch } = useChats(activityFilter);
  const filteredChats = useFilteredChats(chats, chatFilter, chatSearchQuery, searchQuery, user);

  useEffect(() => {
    const handleOpenCreateChat = () => setCreateDialogOpen(true);
    window.addEventListener('openCreateChat', handleOpenCreateChat);
    return () => {
      window.removeEventListener('openCreateChat', handleOpenCreateChat);
    };
  }, []);

  const handleCreateChat = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateGroup = () => {
    setCreateDialogOpen(true);
    setTimeout(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        const tabs = dialog.querySelectorAll('[role="tab"]');
        if (tabs.length >= 2) {
          tabs[1].click();
        }
      }
    }, 100);
  };

  const handleCreateChannel = () => {
    setCreateDialogOpen(true);
    setTimeout(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        const tabs = dialog.querySelectorAll('[role="tab"]');
        if (tabs.length >= 3) {
          tabs[2].click();
        }
      }
    }, 100);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <MobileHomeHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
      />

      {showStories && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <StoriesBar />
        </Box>
      )}

      <MobileChatFilter onFilterChange={refetch} />

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">در حال بارگذاری...</Typography>
          </Box>
        ) : filteredChats.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">چتی وجود ندارد</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredChats.map((chat) => (
              <MobileChatListItem
                key={chat._id}
                chat={chat}
                user={user}
                onClick={() => navigate(`/chat/${chat._id}`)}
              />
            ))}
          </List>
        )}
      </Box>

      <CreateChatDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onChatCreated={(newChat) => {
          navigate(`/chat/${newChat._id}`);
        }}
      />
    </Box>
  );
};

export default MobileHomePage;

