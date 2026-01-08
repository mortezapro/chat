import { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import { ThumbUp, Share } from '@mui/icons-material';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import ForwardMessageDialog from '../dialogs/ForwardMessageDialog';

const MessageInteractions = ({ message, chat, onUpdate }) => {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(
    message?.likes?.some(l => (l.user?._id || l.user) === user?.id) || false
  );
  const [likeCount, setLikeCount] = useState(message?.likeCount || 0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [likesMenuAnchor, setLikesMenuAnchor] = useState(null);

  const handleLike = async () => {
    try {
      const response = await api.post(`/messages/${message._id}/like`);
      setLiked(!liked);
      setLikeCount(response.data.message.likeCount);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error liking message:', error);
    }
  };

  const handleShare = async (chatIds) => {
    try {
      chatIds.forEach(async (chatId) => {
        await api.post(`/messages/${message._id}/share`, { chatId });
      });
      setShareDialogOpen(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error sharing message:', error);
      alert('خطا در اشتراک‌گذاری');
    }
  };

  const canInteract = chat?.type === 'channel'
    ? (chat?.channelSettings?.allowReactions !== false)
    : true;

  if (!canInteract) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
      <Tooltip title="لایک">
        <IconButton
          size="small"
          onClick={handleLike}
          color={liked ? 'primary' : 'default'}
          sx={{ cursor: 'pointer' }}
        >
          <ThumbUp fontSize="small" />
        </IconButton>
      </Tooltip>
      {likeCount > 0 && (
        <Typography
          variant="caption"
          onClick={(e) => setLikesMenuAnchor(e.currentTarget)}
          sx={{ cursor: 'pointer', color: 'text.secondary' }}
        >
          {likeCount}
        </Typography>
      )}

      <Tooltip title="اشتراک‌گذاری">
        <IconButton
          size="small"
          onClick={() => setShareDialogOpen(true)}
          sx={{ cursor: 'pointer' }}
        >
          <Share fontSize="small" />
        </IconButton>
      </Tooltip>
      {message?.shareCount > 0 && (
        <Typography variant="caption" color="text.secondary">
          {message.shareCount}
        </Typography>
      )}

      <ForwardMessageDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        message={message}
        onForward={handleShare}
      />

      <Menu
        anchorEl={likesMenuAnchor}
        open={Boolean(likesMenuAnchor)}
        onClose={() => setLikesMenuAnchor(null)}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">افرادی که لایک کرده‌اند</Typography>
        </MenuItem>
        {message?.likes?.slice(0, 10).map((like) => {
          const likeUser = like.user || {};
          return (
            <ListItem key={likeUser._id || likeUser}>
              <ListItemAvatar>
                <Avatar src={likeUser.avatar} sx={{ width: 32, height: 32 }}>
                  {likeUser.firstName?.[0] || likeUser.username?.[0] || 'U'}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={likeUser.firstName && likeUser.lastName
                  ? `${likeUser.firstName} ${likeUser.lastName}`
                  : likeUser.username}
              />
            </ListItem>
          );
        })}
        {message?.likes?.length > 10 && (
          <MenuItem disabled>
            <Typography variant="caption">
              و {message.likes.length - 10} نفر دیگر
            </Typography>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default MessageInteractions;


