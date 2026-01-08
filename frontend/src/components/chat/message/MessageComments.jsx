import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { Send, MoreVert, Edit, Delete } from '@mui/icons-material';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { faIR } from 'date-fns/locale';

const MessageComments = ({ message, chat, onUpdate }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);

  useEffect(() => {
    if (message?.comments) {
      setComments(message.comments);
    }
  }, [message]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await api.post(`/messages/${message._id}/comment`, { content: newComment });
      setNewComment('');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('خطا در افزودن کامنت');
    }
  };

  const handleEditComment = async () => {
    if (!editContent.trim()) return;

    try {
      await api.put(`/messages/${message._id}/comment/${selectedComment._id}`, {
        content: editContent
      });
      setEditingComment(null);
      setEditContent('');
      setSelectedComment(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('خطا در ویرایش کامنت');
    }
  };

  const handleDeleteComment = async () => {
    try {
      await api.delete(`/messages/${message._id}/comment/${selectedComment._id}`);
      setMenuAnchor(null);
      setSelectedComment(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('خطا در حذف کامنت');
    }
  };

  const canComment = chat?.type === 'channel'
    ? (chat?.channelSettings?.allowComments !== false &&
       (chat?.channelSettings?.onlyAdminsCanComment === false ||
        chat?.admins?.some(a => a._id === user?.id || a === user?.id)))
    : true;

  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2, borderTop: 1, borderColor: 'divider', pt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        کامنت‌ها ({comments.length})
      </Typography>

      {canComment && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            placeholder="نوشتن کامنت..."
            multiline
            maxRows={3}
          />
          <Button
            variant="contained"
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            startIcon={<Send />}
          >
            ارسال
          </Button>
        </Box>
      )}

      <List>
        {comments.map((comment) => {
          const commentUser = comment.user || {};
          const isOwn = commentUser._id === user?.id || commentUser === user?.id;
          const isAdmin = chat?.admins?.some(a => a._id === user?.id || a === user?.id);

          return (
            <ListItem key={comment._id} alignItems="flex-start">
              <ListItemAvatar>
                <Avatar src={commentUser.avatar}>
                  {commentUser.firstName?.[0] || commentUser.username?.[0] || 'U'}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">
                      {commentUser.firstName && commentUser.lastName
                        ? `${commentUser.firstName} ${commentUser.lastName}`
                        : commentUser.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: faIR
                      })}
                    </Typography>
                    {comment.isEdited && (
                      <Typography variant="caption" color="text.secondary">
                        (ویرایش شده)
                      </Typography>
                    )}
                  </Box>
                }
                secondary={
                  editingComment === comment._id ? (
                    <Box sx={{ mt: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        multiline
                        maxRows={3}
                      />
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button size="small" onClick={handleEditComment} variant="contained">
                          ذخیره
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setEditingComment(null);
                            setEditContent('');
                          }}
                        >
                          انصراف
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2">{comment.content}</Typography>
                  )
                }
              />
              {(isOwn || isAdmin) && editingComment !== comment._id && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    setMenuAnchor(e.currentTarget);
                    setSelectedComment(comment);
                  }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              )}
            </ListItem>
          );
        })}
      </List>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setSelectedComment(null);
        }}
      >
        {selectedComment?.user?._id === user?.id && (
          <MenuItem
            onClick={() => {
              setEditingComment(selectedComment._id);
              setEditContent(selectedComment.content);
              setMenuAnchor(null);
            }}
          >
            <Edit sx={{ mr: 1 }} />
            ویرایش
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteComment}>
          <Delete sx={{ mr: 1 }} />
          حذف
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MessageComments;


