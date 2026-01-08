import { useState } from 'react';
import { Box, Chip, IconButton, Tooltip, Popover, Typography } from '@mui/material';
import { AddReaction } from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';

const REACTIONS = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '🙏', '🔥', 
  '👏', '🎉', '😍', '🤔', '😴', '🤮', '💯', '✨',
  '🎯', '💪', '🤝', '🙌', '😎', '🤯', '🥳', '😱'
];

const MessageReactions = ({ message, onUpdate }) => {
  const { user } = useAuthStore();
  const [pickerAnchor, setPickerAnchor] = useState(null);

  const handleReaction = async (emoji) => {
    try {
      await api.post(`/messages/${message._id}/reaction`, { emoji });
      if (onUpdate) {
        onUpdate();
      }
      setPickerAnchor(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleOpenPicker = (event) => {
    setPickerAnchor(event.currentTarget);
  };

  const handleClosePicker = () => {
    setPickerAnchor(null);
  };

  // Group reactions by emoji
  const groupedReactions = {};
  if (message.reactions) {
    message.reactions.forEach(reaction => {
      if (!groupedReactions[reaction.emoji]) {
        groupedReactions[reaction.emoji] = [];
      }
      groupedReactions[reaction.emoji].push(reaction);
    });
  }

  if (!message.reactions || message.reactions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
      {Object.keys(groupedReactions).length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {Object.entries(groupedReactions).map(([emoji, reactions]) => {
            const isUserReaction = reactions.some(r => r.user?._id === user?.id);
            const reactionUsers = reactions.map(r => r.user?.firstName || r.user?.username || 'کاربر').slice(0, 3);
            
            return (
              <Tooltip 
                key={emoji}
                title={
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      {reactions.length} نفر: {reactionUsers.join(', ')}
                      {reactions.length > 3 && ` و ${reactions.length - 3} نفر دیگر`}
                    </Typography>
                  </Box>
                }
                arrow
              >
                <Chip
                  label={`${emoji} ${reactions.length}`}
                  size="small"
                  onClick={() => handleReaction(emoji)}
                  color={isUserReaction ? 'primary' : 'default'}
                  variant={isUserReaction ? 'filled' : 'outlined'}
                  sx={{
                    height: 28,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isUserReaction ? 'primary.dark' : 'action.hover'
                    }
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      )}
      <Tooltip title="افزودن واکنش">
        <IconButton
          size="small"
          onClick={handleOpenPicker}
          sx={{ width: 24, height: 24 }}
        >
          <AddReaction fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(pickerAnchor)}
        anchorEl={pickerAnchor}
        onClose={handleClosePicker}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Box
          sx={{
            p: 1,
            display: 'flex',
            gap: 0.5
          }}
        >
          {REACTIONS.map((emoji) => (
            <IconButton
              key={emoji}
              size="small"
              onClick={() => handleReaction(emoji)}
              sx={{ fontSize: '1.5rem', width: 36, height: 36 }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Popover>
    </Box>
  );
};

export default MessageReactions;

