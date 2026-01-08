import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton
} from '@mui/material';
import { Block, PersonOff } from '@mui/icons-material';
import api from '@/services/api';

const BlockUserDialog = ({ open, onClose, userId, userName, onBlocked }) => {
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    setLoading(true);
    try {
      await api.post(`/users/${userId}/block`);
      if (onBlocked) {
        onBlocked();
      }
      onClose();
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('خطا در مسدود کردن کاربر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>مسدود کردن کاربر</DialogTitle>
      <DialogContent>
        <DialogContentText>
          آیا مطمئن هستید که می‌خواهید <strong>{userName}</strong> را مسدود کنید؟
          <br />
          <br />
          پس از مسدود کردن:
          <ul style={{ marginTop: 8, paddingRight: 20 }}>
            <li>شما دیگر پیامی از این کاربر دریافت نخواهید کرد</li>
            <li>این کاربر شما را در لیست مخاطبین نخواهد دید</li>
            <li>چت‌های قبلی باقی می‌مانند</li>
          </ul>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>انصراف</Button>
        <Button
          onClick={handleBlock}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={<Block />}
        >
          مسدود کردن
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const BlockedUsersList = ({ open, onClose }) => {
  const [blockedUsers, setBlockedUsers] = useState([]);

  const fetchBlockedUsers = async () => {
    try {
      const response = await api.get('/users/blocked/list');
      setBlockedUsers(response.data.blockedUsers || []);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await api.post(`/users/${userId}/unblock`);
      setBlockedUsers(prev => prev.filter(u => u._id !== userId));
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('خطا در خارج کردن از مسدودی');
    }
  };

  useEffect(() => {
    if (open) {
      fetchBlockedUsers();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>کاربران مسدود شده</DialogTitle>
      <DialogContent>
        {blockedUsers.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            هیچ کاربری مسدود نشده است
          </Typography>
        ) : (
          <List>
            {blockedUsers.map((user) => (
              <ListItem
                key={user._id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => handleUnblock(user._id)}
                    color="primary"
                  >
                    <PersonOff />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar src={user.avatar}>
                    {user.firstName?.[0] || user.username?.[0] || 'U'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.username
                  }
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>بستن</Button>
      </DialogActions>
    </Dialog>
  );
};

export { BlockUserDialog, BlockedUsersList };



