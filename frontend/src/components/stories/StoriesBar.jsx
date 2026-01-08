import { useState, useEffect } from 'react';
import { Box, Avatar, Typography, IconButton, Tooltip, Snackbar, Alert } from '@mui/material';
import { Add } from '@mui/icons-material';
import StoryViewer from './StoryViewer';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { getFileUrl } from '@/utils/chatHelpers';

const StoriesBar = () => {
  const { user } = useAuthStore();
  const [stories, setStories] = useState([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [groupedStories, setGroupedStories] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await api.get('/stories');
      const allStories = response.data.stories || [];
      
      if (allStories.length === 0 && user) {
        const mockStories = [
          {
            _id: 'mock1',
            user: {
              _id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar
            },
            media: {
              url: 'https://via.placeholder.com/400x700/667eea/ffffff?text=Story+1',
              type: 'image'
            },
            text: 'اولین استوری من',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            views: [],
            reactions: []
          },
          {
            _id: 'mock2',
            user: {
              _id: 'mock-user-1',
              username: 'user1',
              firstName: 'علی',
              lastName: 'احمدی',
              avatar: null
            },
            media: {
              url: 'https://via.placeholder.com/400x700/764ba2/ffffff?text=Story+2',
              type: 'image'
            },
            text: 'استوری نمونه',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
            views: [],
            reactions: []
          }
        ];
        
        allStories.push(...mockStories);
      }
      
      // Group stories by user
      const grouped = {};
      allStories.forEach(story => {
        const userId = story.user._id || story.user;
        if (!grouped[userId]) {
          grouped[userId] = [];
        }
        grouped[userId].push(story);
      });
      
      setGroupedStories(grouped);
      setStories(allStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
      if (user) {
        const mockStories = [
          {
            _id: 'mock1',
            user: {
              _id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar
            },
            media: {
              url: 'https://via.placeholder.com/400x700/667eea/ffffff?text=Story+1',
              type: 'image'
            },
            text: 'اولین استوری من',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            views: [],
            reactions: []
          }
        ];
        
        const grouped = {};
        mockStories.forEach(story => {
          const userId = story.user._id || story.user;
          if (!grouped[userId]) {
            grouped[userId] = [];
          }
          grouped[userId].push(story);
        });
        
        setGroupedStories(grouped);
        setStories(mockStories);
      }
    }
  };

  const handleStoryClick = (userStories, index) => {
    setSelectedStoryIndex(index);
    setViewerOpen(true);
  };

  const handleCreateStory = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const response = await api.post('/stories', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (response.data && response.data.story) {
            setUploadSuccess(true);
            await fetchStories();
          }
        } catch (error) {
          console.error('Error creating story:', error);
          setUploadError(true);
        } finally {
          setUploading(false);
        }
      }
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };
    
    input.click();
    
    setTimeout(() => {
      if (document.body.contains(input)) {
        try {
          document.body.removeChild(input);
        } catch (error) {
          console.warn('Could not remove input element:', error);
        }
      }
    }, 1000);
  };

  const userStories = groupedStories[user?.id] || [];

  return (
    <Box
      sx={{
        p: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflowX: 'auto',
        position: 'sticky',
        top: 0,
        zIndex: 5,
        '&::-webkit-scrollbar': {
          display: 'none'
        }
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', px: 1 }}>
        <Tooltip title="ایجاد استوری">
          <Box
            sx={{
              position: 'relative',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={handleCreateStory}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                mb: 0.5,
                position: 'relative',
                transition: 'all 0.2s ease',
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
            >
              <Avatar
                src={getFileUrl(user?.avatar)}
                sx={{
                  width: 56,
                  height: 56,
                  border: '2px solid',
                  borderColor: 'background.paper'
                }}
              >
                {user?.firstName?.[0] || user?.username?.[0] || 'U'}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'primary.main',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid',
                  borderColor: 'background.paper',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                <Add sx={{ fontSize: 14, color: 'white' }} />
              </Box>
            </Box>
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.7rem',
                color: 'text.secondary',
                maxWidth: 64,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              استوری شما
            </Typography>
          </Box>
        </Tooltip>

        {userStories.length > 0 && (
          <Tooltip title="استوری‌های شما">
            <Box
              sx={{
                position: 'relative',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
              onClick={() => {
                const userStoriesForClick = stories.filter(s => {
                  const storyUserId = s.user?._id || s.user;
                  return String(storyUserId) === String(user?.id);
                });
                if (userStoriesForClick.length > 0) {
                  const firstStoryIndex = stories.findIndex(s => {
                    const storyUserId = s.user?._id || s.user;
                    return String(storyUserId) === String(user?.id);
                  });
                  handleStoryClick(userStoriesForClick, firstStoryIndex >= 0 ? firstStoryIndex : 0);
                }
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  p: '2px',
                  background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 0.5,
                  transition: 'all 0.2s ease',
                  '&:active': {
                    transform: 'scale(0.95)'
                  }
                }}
              >
                <Avatar
                  src={user?.avatar}
                  sx={{
                    width: 56,
                    height: 56,
                    border: '2px solid',
                    borderColor: 'background.paper'
                  }}
                >
                  {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                </Avatar>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  color: 'text.secondary',
                  maxWidth: 64,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 600
                }}
              >
                استوری شما
              </Typography>
            </Box>
          </Tooltip>
        )}

        {Object.entries(groupedStories).map(([userId, userStories]) => {
          if (String(userId) === String(user?.id)) return null;
          
          const storyUser = userStories[0]?.user;
          const hasUnviewed = userStories.some(
            story => !story.views?.some(v => (v.user?._id || v.user) === (user?.id || user?._id))
          );
          const userIdStr = String(userId);
          const userStoriesForClick = stories.filter(s => {
            const storyUserId = s.user?._id || s.user;
            return String(storyUserId) === userIdStr;
          });

          return (
            <Tooltip
              key={userId}
              title={storyUser?.firstName && storyUser?.lastName
                ? `${storyUser.firstName} ${storyUser.lastName}`
                : storyUser?.username || 'کاربر'}
            >
              <Box
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
                onClick={() => {
                  if (userStoriesForClick.length > 0) {
                    const firstStoryIndex = stories.findIndex(s => {
                      const storyUserId = s.user?._id || s.user;
                      return String(storyUserId) === userIdStr;
                    });
                    handleStoryClick(userStoriesForClick, firstStoryIndex >= 0 ? firstStoryIndex : 0);
                  }
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    p: hasUnviewed ? '2px' : '2px',
                    background: hasUnviewed 
                      ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                      : 'linear-gradient(45deg, #dbdbdb 0%, #dbdbdb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 0.5,
                    transition: 'all 0.2s ease',
                    '&:active': {
                      transform: 'scale(0.95)'
                    }
                  }}
                >
                  <Avatar
                    src={getFileUrl(storyUser?.avatar)}
                    sx={{
                      width: 56,
                      height: 56,
                      border: '2px solid',
                      borderColor: 'background.paper'
                    }}
                  >
                    {storyUser?.firstName?.[0] || storyUser?.username?.[0] || 'U'}
                  </Avatar>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    color: 'text.secondary',
                    maxWidth: 64,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: hasUnviewed ? 600 : 400
                  }}
                >
                  {storyUser?.firstName && storyUser?.lastName
                    ? `${storyUser.firstName} ${storyUser.lastName}`
                    : storyUser?.username || 'کاربر'}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {viewerOpen && (
        <StoryViewer
          open={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedStoryIndex(null);
          }}
          stories={stories}
          initialIndex={selectedStoryIndex || 0}
        />
      )}

      <Snackbar
        open={uploadSuccess}
        autoHideDuration={3000}
        onClose={() => setUploadSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setUploadSuccess(false)} severity="success" sx={{ width: '100%' }}>
          استوری با موفقیت آپلود شد
        </Alert>
      </Snackbar>

      <Snackbar
        open={uploadError}
        autoHideDuration={3000}
        onClose={() => setUploadError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setUploadError(false)} severity="error" sx={{ width: '100%' }}>
          خطا در آپلود استوری
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StoriesBar;

