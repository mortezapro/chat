import { Box, Typography, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

const ReplyMessage = ({ replyTo, onCancel }) => {
  if (!replyTo) return null;

  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: 'grey.100',
        borderRight: '3px solid',
        borderColor: 'primary.main',
        borderRadius: 1,
        mb: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 1
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 0.5 }}>
          در پاسخ به {replyTo.sender?.firstName || replyTo.sender?.username || 'کاربر'}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {replyTo.content?.substring(0, 100)}
          {replyTo.content?.length > 100 ? '...' : ''}
        </Typography>
      </Box>
      <IconButton
        size="small"
        onClick={onCancel}
        sx={{ cursor: 'pointer', flexShrink: 0 }}
      >
        <Close fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default ReplyMessage;





