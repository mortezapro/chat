import { SwipeableDrawer, Box, Typography, List, ListItemButton, ListItemText } from '@mui/material';

export const MobileHomeOptionsDrawer = ({ open, onClose, onCreateChat, onCreateGroup, onCreateChannel, onNavigateToSaved }) => {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
    >
      <Box sx={{ p: 2, minHeight: 200 }}>
        <Typography variant="h6" gutterBottom>
          گزینه‌ها
        </Typography>
        <List>
          <ListItemButton onClick={onCreateChat}>
            <ListItemText primary="چت جدید" />
          </ListItemButton>
          <ListItemButton onClick={onCreateGroup}>
            <ListItemText primary="گروه جدید" />
          </ListItemButton>
          <ListItemButton onClick={onCreateChannel}>
            <ListItemText primary="کانال جدید" />
          </ListItemButton>
          <ListItemButton onClick={onNavigateToSaved}>
            <ListItemText primary="پیام‌های ذخیره‌شده" />
          </ListItemButton>
        </List>
      </Box>
    </SwipeableDrawer>
  );
};

