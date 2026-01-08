import { Box, Typography, IconButton, Paper } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

const QuoteMessage = ({ quotedMessage, onCancel }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!quotedMessage) return null;

  const getSenderName = (sender) => {
    if (!sender) return 'کاربر';
    if (sender._id === user?.id || sender === user?.id) {
      return 'شما';
    }
    return sender.firstName && sender.lastName
      ? `${sender.firstName} ${sender.lastName}`
      : sender.username || 'کاربر';
  };

  return (
    <Paper
      sx={{
        p: 1.5,
        mb: 1,
        bgcolor: 'action.hover',
        borderRadius: 2,
        borderRight: '3px solid',
        borderColor: 'primary.main',
        position: 'relative'
      }}
    >
      {onCancel && (
        <IconButton
          size="small"
          onClick={onCancel}
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            width: 24,
            height: 24
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      )}
      <Typography 
        variant="caption" 
        color="primary.main" 
        fontWeight="bold" 
        sx={{ 
          display: 'block', 
          mb: 0.5,
          cursor: 'pointer',
          '&:hover': {
            textDecoration: 'underline'
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (quotedMessage.sender?._id || quotedMessage.sender?.id) {
            navigate(`/profile/${quotedMessage.sender._id || quotedMessage.sender.id}`);
          }
        }}
      >
        نقل قول از {getSenderName(quotedMessage.sender)}
      </Typography>
      <Typography
        variant="body2"
        component="div"
        sx={{
          fontSize: '0.875rem',
          lineHeight: 1.4,
          color: 'text.secondary',
          pr: onCancel ? 3 : 0
        }}
      >
        {quotedMessage.content?.substring(0, 100)}
        {quotedMessage.content?.length > 100 ? '...' : ''}
      </Typography>
      {quotedMessage.media?.url && (
        <Box sx={{ mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            📎 فایل ضمیمه
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default QuoteMessage;

