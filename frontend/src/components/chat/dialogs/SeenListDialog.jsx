import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton
} from '@mui/material';
import { Close, Visibility, CheckCircle } from '@mui/icons-material';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const SeenListDialog = ({ open, onClose, message, chat }) => {
  const { user } = useAuthStore();
  const [seenList, setSeenList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    if (open && message && chat) {
      fetchSeenList();
      if (chat.participants) {
        setTotalParticipants(chat.participants.length);
      } else if (chat.subscribers) {
        setTotalParticipants(chat.subscribers.length);
      }
    }
  }, [open, message, chat]);

  const fetchSeenList = async () => {
    if (!message?._id) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/messages/${message._id}/seen`);
      setSeenList(response.data.seenList || []);
    } catch (error) {
      console.error('Error fetching seen list:', error);
      setSeenList(message.readBy || []);
    } finally {
      setLoading(false);
    }
  };

  const getSenderName = (sender) => {
    if (!sender) return 'کاربر';
    if (sender._id === user?.id || sender === user?.id) {
      return 'شما';
    }
    return sender.firstName && sender.lastName
      ? `${sender.firstName} ${sender.lastName}`
      : sender.username || 'کاربر';
  };

  const isOnline = (userData) => {
    return userData?.isOnline || false;
  };

  const getSeenTime = (readAt) => {
    if (!readAt) return 'نامشخص';
    const date = new Date(readAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'همین الان';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ساعت پیش`;
    
    return format(date, 'dd MMMM yyyy، ساعت HH:mm', { locale: faIR });
  };

  const sortedSeenList = [...seenList].sort((a, b) => {
    const dateA = new Date(a.readAt || a.seenAt || 0);
    const dateB = new Date(b.readAt || b.seenAt || 0);
    return dateB - dateA;
  });

  const unseenCount = totalParticipants - seenList.length;
  const isSender = message?.sender?._id === user?.id || message?.sender === user?.id;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility color="primary" />
            <Typography variant="h6">
              مشاهده‌کنندگان پیام
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {seenList.length} نفر از {totalParticipants} نفر این پیام را دیده‌اند
          </Typography>
          {unseenCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              {unseenCount} نفر هنوز ندیده‌اند
            </Typography>
          )}
        </Box>

        {isSender && seenList.length > 0 && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'primary.light', borderRadius: 2, opacity: 0.1 }}>
            <Typography variant="caption" color="primary.main" fontWeight="bold">
              💡 اطلاعات برای شما به عنوان فرستنده:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              می‌توانید زمان دقیق مشاهده هر فرد را ببینید
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">در حال بارگذاری...</Typography>
          </Box>
        ) : sortedSeenList.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">هنوز کسی این پیام را ندیده است</Typography>
          </Box>
        ) : (
          <List>
            {sortedSeenList.map((item, index) => {
              const userData = item.user || item;
              const readAt = item.readAt || item.seenAt;
              const isCurrentUser = (userData._id || userData) === user?.id;

              return (
                <Box key={userData._id || index}>
                  <ListItem
                    sx={{
                      bgcolor: isCurrentUser ? 'action.selected' : 'transparent',
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={userData.avatar}
                          sx={{
                            width: 48,
                            height: 48,
                            border: isOnline(userData) ? '2px solid' : 'none',
                            borderColor: isOnline(userData) ? 'success.main' : 'transparent'
                          }}
                        >
                          {userData.firstName?.[0] || userData.username?.[0] || 'U'}
                        </Avatar>
                        {isOnline(userData) && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              bgcolor: 'success.main',
                              border: '2px solid',
                              borderColor: 'background.paper'
                            }}
                          />
                        )}
                      </Box>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight={isCurrentUser ? 600 : 500}>
                            {getSenderName(userData)}
                            {isCurrentUser && (
                              <Chip label="شما" size="small" color="primary" sx={{ ml: 1, height: 20 }} />
                            )}
                          </Typography>
                          {isOnline(userData) && (
                            <Chip
                              label="آنلاین"
                              size="small"
                              color="success"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <CheckCircle sx={{ fontSize: '0.875rem', color: 'success.main' }} />
                            <Typography variant="caption" color="text.secondary">
                              مشاهده شده در: {getSeenTime(readAt)}
                            </Typography>
                          </Box>
                          {isSender && readAt && (
                            <Typography variant="caption" color="primary.main" sx={{ display: 'block' }}>
                              زمان دقیق: {format(new Date(readAt), 'dd MMMM yyyy، ساعت HH:mm:ss', { locale: faIR })}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < sortedSeenList.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              );
            })}
          </List>
        )}

        {unseenCount > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {unseenCount} نفر هنوز این پیام را مشاهده نکرده‌اند
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>بستن</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SeenListDialog;


