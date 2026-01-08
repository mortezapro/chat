import { Card, CardContent, List, ListItem, ListItemText, ListItemAvatar, Avatar, Typography, Box } from '@mui/material';
import { Group } from '@mui/icons-material';

export const ProfileSharedChatsTab = ({ sharedChats, onChatClick }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Group color="primary" />
          <Typography variant="h6">گروه‌های مشترک ({sharedChats.length})</Typography>
        </Box>
        <List>
          {sharedChats.length > 0 ? (
            sharedChats.map((chat) => (
              <ListItem
                key={chat._id}
                button
                onClick={() => onChatClick(chat._id)}
                sx={{ borderRadius: 2, mb: 1, '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ListItemAvatar>
                  <Avatar src={chat.avatar}>{chat.name?.[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={chat.name}
                  secondary={`${chat.participants?.length || 0} عضو`}
                />
              </ListItem>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              گروه مشترکی یافت نشد
            </Typography>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

