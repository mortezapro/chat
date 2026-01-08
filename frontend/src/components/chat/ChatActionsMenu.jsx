import { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography
} from '@mui/material';
import {
  Archive,
  Unarchive,
  NotificationsOff,
  Notifications,
  Link as LinkIcon,
  ContentCopy,
  Delete as DeleteIcon
} from '@mui/icons-material';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const ChatActionsMenu = ({ anchorEl, open, onClose, chat, onUpdate }) => {
  const { user } = useAuthStore();
  const [inviteLinkDialog, setInviteLinkDialog] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [muteDuration] = useState(8);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const isAdmin = chat?.admins?.some(a => a._id === user?.id || a.toString() === user?.id);
  const isMuted = chat?.mutedBy?.some(
    m => (m.user._id === user?.id || m.user === user?.id) && 
         (!m.mutedUntil || new Date(m.mutedUntil) > new Date())
  );

  const handleArchive = async () => {
    try {
      if (chat.isArchived) {
        await api.post(`/chats/${chat._id}/unarchive`);
      } else {
        await api.post(`/chats/${chat._id}/archive`);
      }
      if (onUpdate) {
        onUpdate();
      }
      onClose();
    } catch (error) {
      console.error('Error archiving chat:', error);
      alert('خطا در آرشیو کردن چت');
    }
  };

  const handleMute = async () => {
    try {
      if (isMuted) {
        await api.post(`/chats/${chat._id}/unmute`);
      } else {
        await api.post(`/chats/${chat._id}/mute`, { duration: muteDuration });
      }
      if (onUpdate) {
        onUpdate();
      }
      onClose();
    } catch (error) {
      console.error('Error muting chat:', error);
      alert('خطا در بی‌صدا کردن چت');
    }
  };

  const handleGenerateInviteLink = async () => {
    try {
      const response = await api.post(`/chats/${chat._id}/invite-link`, {
        expiresIn: 24, // 24 hours
        maxUses: null
      });
      setInviteLink(response.data.inviteLink);
      setInviteLinkDialog(true);
      onClose();
    } catch (error) {
      console.error('Error generating invite link:', error);
      alert('خطا در ایجاد لینک دعوت');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('لینک کپی شد');
  };

  const handleDeleteChat = async () => {
    try {
      // This would typically archive or delete the chat
      await api.post(`/chats/${chat._id}/archive`);
      if (onUpdate) {
        onUpdate();
      }
      setDeleteDialog(false);
      onClose();
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('خطا در حذف چت');
    }
  };

  return (
    <>
      <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
        <MenuItem onClick={handleArchive}>
          <ListItemIcon>
            {chat?.isArchived ? <Unarchive /> : <Archive />}
          </ListItemIcon>
          <ListItemText>
            {chat?.isArchived ? 'خارج کردن از آرشیو' : 'آرشیو کردن'}
          </ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleMute}>
          <ListItemIcon>
            {isMuted ? <Notifications /> : <NotificationsOff />}
          </ListItemIcon>
          <ListItemText>
            {isMuted ? 'بی‌صدا کردن' : 'بی‌صدا کردن'}
          </ListItemText>
        </MenuItem>

        {chat?.type === 'group' && isAdmin && (
          <>
            <Divider />
            <MenuItem onClick={handleGenerateInviteLink}>
              <ListItemIcon>
                <LinkIcon />
              </ListItemIcon>
              <ListItemText>ایجاد لینک دعوت</ListItemText>
            </MenuItem>
          </>
        )}

        <Divider />
        <MenuItem onClick={() => setDeleteDialog(true)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon color="error" />
          </ListItemIcon>
          <ListItemText>حذف چت</ListItemText>
        </MenuItem>
      </Menu>

      {/* Invite Link Dialog */}
      <Dialog open={inviteLinkDialog} onClose={() => setInviteLinkDialog(false)}>
        <DialogTitle>لینک دعوت گروه</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            value={inviteLink}
            readOnly
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            این لینک برای 24 ساعت معتبر است
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteLinkDialog(false)}>بستن</Button>
          <Button onClick={handleCopyLink} variant="contained" startIcon={<ContentCopy />}>
            کپی لینک
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>حذف چت</DialogTitle>
        <DialogContent>
          <Typography>
            آیا مطمئن هستید که می‌خواهید این چت را حذف کنید؟
            <br />
            این عمل قابل بازگشت نیست.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>انصراف</Button>
          <Button onClick={handleDeleteChat} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatActionsMenu;



