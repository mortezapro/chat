import { ListItem, ListItemButton, ListItemAvatar, ListItemText, Avatar, Typography, Box, Chip, Badge } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { getChatName, getChatAvatar, getOtherParticipant } from '@/utils/chatHelpers';

export const MobileChatListItem = ({ chat, user, onClick }) => {
  if (!chat?._id) return null;

  const otherParticipant = getOtherParticipant(chat, user);
  const isOnline = chat.type === 'private' && otherParticipant?.isOnline;

  return (
    <ListItem
      disablePadding
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: chat.unreadCount > 0 ? 'action.hover' : 'background.paper',
        transition: 'background-color 0.2s'
      }}
    >
      <ListItemButton
        onClick={onClick}
        sx={{
          py: 1.5,
          px: 2,
          '&:active': {
            bgcolor: 'action.selected'
          }
        }}
      >
        <ListItemAvatar sx={{ ml: 1 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              isOnline ? (
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    border: '2px solid',
                    borderColor: 'background.paper'
                  }}
                />
              ) : null
            }
          >
            <Avatar
              src={getChatAvatar(chat, user)}
              sx={{
                width: 56,
                height: 56,
                border: chat.unreadCount > 0 ? '2px solid' : 'none',
                borderColor: chat.unreadCount > 0 ? 'primary.main' : 'transparent'
              }}
            >
              {getChatName(chat, user)?.[0] || 'C'}
            </Avatar>
          </Badge>
        </ListItemAvatar>

        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, textAlign: 'right' }}>
              <Typography
                variant="subtitle1"
                fontWeight={chat.unreadCount > 0 ? 700 : 500}
                noWrap
                sx={{ flex: 1, fontSize: '1rem', textAlign: 'right' }}
              >
                {getChatName(chat, user)}
              </Typography>
              {chat.lastMessageAt && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {formatDistanceToNow(new Date(chat.lastMessageAt), {
                    addSuffix: true,
                    locale: faIR
                  })}
                </Typography>
              )}
            </Box>
          }
          secondary={
            <Box sx={{ textAlign: 'right' }}>
              {chat.lastMessage && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  sx={{
                    fontWeight: chat.unreadCount > 0 ? 600 : 400,
                    color: chat.unreadCount > 0 ? 'text.primary' : 'text.secondary',
                    textAlign: 'right'
                  }}
                >
                  {chat.lastMessage.content || 'پیام رسانه‌ای'}
                </Typography>
              )}
              {chat.unreadCount > 0 && (
                <Chip
                  label={chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  size="small"
                  color="primary"
                  sx={{
                    mt: 0.5,
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}
                />
              )}
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

