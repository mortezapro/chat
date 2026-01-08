import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Dialog,
  IconButton,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  TextField,
  Button,
  Paper,
  Popper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Close, 
  ArrowBack, 
  ArrowForward, 
  Favorite, 
  FavoriteBorder,
  Chat,
  Send,
  ThumbUp,
  EmojiEmotions,
  Mood,
  SentimentSatisfied,
  TagFaces
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { getFileUrl } from '@/utils/chatHelpers';
import { useAuthStore } from '@/stores/authStore';

const StoryViewer = ({ open, onClose, stories, initialIndex = 0 }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [reactionMenuAnchor, setReactionMenuAnchor] = useState(null);
  const [currentStoryData, setCurrentStoryData] = useState(null);
  const intervalRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const replyInputRef = useRef(null);

  const currentStory = currentStoryData || (stories && stories.length > 0 ? stories[currentIndex] : null);

  useEffect(() => {
    if (open && stories && stories.length > 0) {
      const story = stories[currentIndex];
      if (story?._id) {
        fetchStoryData(story);
        setProgress(0);
        startProgress();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [open, currentIndex]);

  useEffect(() => {
    if (stories && stories.length > 0 && currentIndex < stories.length) {
      setCurrentStoryData(stories[currentIndex]);
    }
  }, [stories, currentIndex]);

  const fetchStoryData = async (story) => {
    if (story?._id) {
      try {
        await api.post(`/stories/${story._id}/view`);
      } catch (error) {
        console.error('Error marking story as viewed:', error);
      }
    }
  };

  const startProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (!isPaused) {
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + 2; // 5 seconds total (100 / 2 = 50 steps, 50 * 0.1s = 5s)
        });
      }, 100);
    }
  };

  const handleNext = () => {
    if (stories && currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handlePause = () => {
    setIsPaused(prev => !prev);
    if (isPaused) {
      startProgress();
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };

  const handleReaction = async (emoji) => {
    if (!currentStory?._id) return;
    try {
      const response = await api.post(`/stories/${currentStory._id}/reaction`, { emoji });
      if (response.data?.story) {
        setCurrentStoryData(response.data.story);
      }
      setReactionMenuAnchor(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !currentStory?.user) return;
    
    try {
      const userId = currentStory.user._id || currentStory.user;
      const response = await api.post('/chats', {
        type: 'private',
        participants: [userId]
      });
      
      if (response.data?.chat) {
        await api.post(`/messages`, {
          chatId: response.data.chat._id,
          content: `📸 ریپلای به استوری: ${replyText}`,
          type: 'text'
        });
        navigate(`/chat/${response.data.chat._id}`);
        onClose();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const handleStartChat = async () => {
    if (!currentStory?.user) return;
    
    try {
      const userId = currentStory.user._id || currentStory.user;
      const response = await api.post('/chats', {
        type: 'private',
        participants: [userId]
      });
      
      if (response.data?.chat) {
        navigate(`/chat/${response.data.chat._id}`);
        onClose();
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const reactions = [
    { emoji: '❤️', icon: <Favorite />, label: 'لایک' },
    { emoji: '👍', icon: <ThumbUp />, label: 'خوب' },
    { emoji: '😊', icon: <SentimentSatisfied />, label: 'خوشحال' },
    { emoji: '😍', icon: <EmojiEmotions />, label: 'عاشق' },
    { emoji: '😂', icon: <Mood />, label: 'خنده' },
    { emoji: '😮', icon: <TagFaces />, label: 'تعجب' }
  ];

  const hasReacted = currentStory?.reactions?.some(r => 
    (r.user?._id || r.user)?.toString() === (currentUser?.id || currentUser?._id)?.toString()
  );

  if (!currentStory) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: 'black',
          color: 'white'
        }
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseDown={handlePause}
        onMouseUp={handlePause}
        onTouchStart={handlePause}
        onTouchEnd={handlePause}
      >
        {/* Progress bars */}
        {stories && stories.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, p: 1.5, zIndex: 2 }}>
            {stories.map((story, index) => (
              <Box key={story?._id || index} sx={{ flex: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={index === currentIndex ? progress : index < currentIndex ? 100 : 0}
                  sx={{
                    height: 3,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.25)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: index === currentIndex ? 'white' : 'rgba(255,255,255,0.6)',
                      transition: 'transform 0.1s linear'
                    }
                  }}
                />
              </Box>
            ))}
          </Box>
        )}

        {/* Header */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            p: 2.5,
            pt: 3.5,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            zIndex: 2
          }}
        >
          <Avatar 
            src={getFileUrl(currentStory?.user?.avatar)} 
            sx={{ 
              width: 44, 
              height: 44,
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            {currentStory?.user?.firstName?.[0] || currentStory?.user?.username?.[0] || 'U'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="subtitle1" 
              fontWeight="bold"
              sx={{ 
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                fontSize: '0.95rem'
              }}
            >
              {currentStory?.user?.firstName && currentStory?.user?.lastName
                ? `${currentStory.user.firstName} ${currentStory.user.lastName}`
                : currentStory?.user?.username || 'کاربر'}
            </Typography>
            {currentStory?.createdAt && (
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.9,
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  fontSize: '0.75rem'
                }}
              >
                {formatDistanceToNow(new Date(currentStory.createdAt), {
                  addSuffix: true,
                  locale: faIR
                })}
              </Typography>
            )}
          </Box>
          <IconButton 
            onClick={onClose} 
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.3)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Story content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            bgcolor: '#000',
            p: { xs: 0, sm: 2 }
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              maxWidth: { xs: '100%', sm: '405px' },
              maxHeight: { xs: '100%', sm: '720px' },
              aspectRatio: '9/16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#000',
              mx: 'auto'
            }}
          >
            {currentStory?.media?.type === 'image' ? (
              <Box
                component="img"
                src={getFileUrl(currentStory.media.url)}
                alt={currentStory?.text || 'Story'}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
                onError={(e) => {
                  console.error('[StoryViewer] Error loading image:', {
                    url: currentStory.media.url,
                    fullUrl: getFileUrl(currentStory.media.url)
                  });
                  e.target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('[StoryViewer] Image loaded successfully:', getFileUrl(currentStory.media.url));
                }}
              />
            ) : currentStory?.media?.type === 'video' ? (
              <Box
                component="video"
                src={getFileUrl(currentStory.media.url)}
                autoPlay
                loop={false}
                muted
                playsInline
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
                onError={(e) => {
                  console.error('[StoryViewer] Error loading video:', {
                    url: currentStory.media.url,
                    fullUrl: getFileUrl(currentStory.media.url)
                  });
                  e.target.style.display = 'none';
                }}
                onLoadedData={() => {
                  console.log('[StoryViewer] Video loaded successfully:', getFileUrl(currentStory.media.url));
                }}
              />
            ) : null}

            {currentStory?.text && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: showReplyInput ? 180 : 120,
                  left: 0,
                  right: 0,
                  p: 2.5,
                  textAlign: 'center',
                  transition: 'bottom 0.3s ease',
                  zIndex: 2
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)',
                    fontWeight: 'bold',
                    color: 'white',
                    lineHeight: 1.4,
                    wordBreak: 'break-word'
                  }}
                >
                  {currentStory.text}
                </Typography>
              </Box>
            )}

            {/* Navigation - Invisible clickable areas */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '50%',
                cursor: currentIndex > 0 ? 'pointer' : 'default',
                zIndex: 3
              }}
              onClick={handlePrevious}
            />
            <Box
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '50%',
                cursor: 'pointer',
                zIndex: 3
              }}
              onClick={handleNext}
            />
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            zIndex: 1
          }}
        >
          {showReplyInput ? (
            <Paper
              sx={{
                p: 1.5,
                bgcolor: 'rgba(255,255,255,0.95)',
                borderRadius: 2,
                display: 'flex',
                gap: 1,
                alignItems: 'center'
              }}
            >
              <Avatar 
                src={getFileUrl(currentStory?.user?.avatar)} 
                sx={{ width: 32, height: 32 }}
              >
                {currentStory?.user?.firstName?.[0] || currentStory?.user?.username?.[0] || 'U'}
              </Avatar>
              <TextField
                inputRef={replyInputRef}
                fullWidth
                size="small"
                placeholder="پیام خود را بنویسید..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    direction: 'rtl',
                    textAlign: 'right'
                  }
                }}
                autoFocus
              />
              <IconButton
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                color="primary"
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': { bgcolor: 'rgba(0,0,0,0.12)' }
                }}
              >
                <Send />
              </IconButton>
              <IconButton
                onClick={() => {
                  setShowReplyInput(false);
                  setReplyText('');
                }}
                size="small"
              >
                <Close />
              </IconButton>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.15)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                }}
                onClick={(e) => setReactionMenuAnchor(e.currentTarget)}
              >
                {hasReacted ? (
                  <Favorite sx={{ color: '#ff3040' }} />
                ) : (
                  <FavoriteBorder />
                )}
              </IconButton>
              
              <IconButton
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.15)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                }}
                onClick={() => {
                  setShowReplyInput(true);
                  setTimeout(() => replyInputRef.current?.focus(), 100);
                }}
              >
                <Chat />
              </IconButton>

              <IconButton
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.15)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                }}
                onClick={handleStartChat}
              >
                <Send />
              </IconButton>

              <Box sx={{ flex: 1 }} />

              <Chip
                icon={<Favorite sx={{ color: '#ff3040', fontSize: 16 }} />}
                label={currentStory?.reactions?.length || 0}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '& .MuiChip-icon': { color: '#ff3040' }
                }}
              />
              <Chip
                label={`${currentStory?.views?.length || 0} بازدید`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </Box>
          )}

          <Popper
            open={Boolean(reactionMenuAnchor)}
            anchorEl={reactionMenuAnchor}
            placement="top"
            sx={{ zIndex: 1300 }}
          >
            <ClickAwayListener onClickAway={() => setReactionMenuAnchor(null)}>
              <Paper
                sx={{
                  p: 1,
                  bgcolor: 'rgba(0,0,0,0.9)',
                  borderRadius: 2,
                  display: 'flex',
                  gap: 0.5
                }}
              >
                {reactions.map((reaction) => (
                  <IconButton
                    key={reaction.emoji}
                    onClick={() => handleReaction(reaction.emoji)}
                    sx={{
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                    title={reaction.label}
                  >
                    <Typography sx={{ fontSize: 24 }}>{reaction.emoji}</Typography>
                  </IconButton>
                ))}
              </Paper>
            </ClickAwayListener>
          </Popper>
        </Box>
      </Box>
    </Dialog>
  );
};

export default StoryViewer;



