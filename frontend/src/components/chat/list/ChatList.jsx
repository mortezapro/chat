import { List, ListItem, ListItemButton, ListItemAvatar, Avatar, ListItemText, Typography, Box, Chip, Badge } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { useAuthStore } from '@/stores/authStore';
import { getChatName, getChatAvatar, getOtherParticipant, getFileUrl } from '@/utils/chatHelpers';

const ChatList = ({ chats, onChatSelect }) => {
  const { user } = useAuthStore();

  return (
    <List>
      {chats.map((chat, index) => {
        if (!chat) return null;
        const chatId = chat._id || chat.id;
        if (!chatId) return null;

        return (
          <ListItem
            key={chatId}
            disablePadding
            sx={{
              animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
            }}
          >
            <ListItemButton
              onClick={() => onChatSelect(chatId)}
              sx={{
                cursor: 'pointer',
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'action.hover'
                },
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
                      chat.type === 'private' && getOtherParticipant(chat, user)?.isOnline ? (
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
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
                    src={getFileUrl(getChatAvatar(chat, user))}
                    sx={{
                      width: 48,
                      height: 48,
                      border: '2px solid',
                      borderColor: chat.unreadCount > 0 ? 'primary.main' : 'transparent',
                      transition: 'all 0.2s ease',
                      boxShadow: chat.unreadCount > 0 ? 2 : 0
                    }}
                  >
                    {getChatName(chat, user)?.[0] || 'C'}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, textAlign: 'right' }}>
                    <Typography
                      component="span"
                      variant="body1"
                      noWrap
                      sx={{
                        flex: 1,
                        fontWeight: chat.unreadCount > 0 ? 600 : 400,
                        textAlign: 'right'
                      }}
                    >
                      {getChatName(chat, user)}
                    </Typography>
                    {chat.unreadCount > 0 && (
                      <Chip
                        label={chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        size="small"
                        color="primary"
                        sx={{
                          minWidth: 24,
                          height: 24,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          animation: 'pulse 2s infinite',
                          boxShadow: 2
                        }}
                      />
                    )}
                    {chat.type === 'group' && chat.unreadCount === 0 && (
                      <Chip label="گروه" size="small" color="primary" />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, textAlign: 'right' }}>
                    {chat.lastMessage && (
                      <Box component="span" sx={{ flex: 1, textAlign: 'right', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {chat.lastMessage.sender && chat.lastMessage.sender._id !== user?.id && (
                          <Typography component="span" variant="caption" sx={{ fontWeight: 600, mr: 0.5 }}>
                            {chat.lastMessage.sender.firstName && chat.lastMessage.sender.lastName
                              ? `${chat.lastMessage.sender.firstName} ${chat.lastMessage.sender.lastName}`
                              : chat.lastMessage.sender.username || 'کاربر'}:
                          </Typography>
                        )}
                        <Typography component="span" variant="body2" color="text.secondary" noWrap sx={{ textAlign: 'right' }}>
                          {chat.lastMessage.content || 'پیام رسانه‌ای'}
                        </Typography>
                      </Box>
                    )}
                    {chat.lastMessageAt && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {formatDistanceToNow(new Date(chat.lastMessageAt), {
                          addSuffix: true,
                          locale: faIR
                        })}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
};

export default ChatList;

