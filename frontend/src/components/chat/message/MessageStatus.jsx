import { Box, Tooltip } from '@mui/material';
import { Check, DoneAll, Done, Visibility } from '@mui/icons-material';

const MessageStatus = ({ readBy, sentBy, chatType, participants, onClick, messageId }) => {
  if (!sentBy) {
    return null;
  }

  const readCount = readBy?.length || 0;
  const totalParticipants = chatType === 'private' ? 2 : (participants?.length || 0);
  const isRead = readCount > 0;
  const isFullyRead = chatType === 'private' 
    ? readCount >= 1 
    : readCount >= totalParticipants - 1;

  const getTooltipText = () => {
    if (!isRead) return 'ارسال شده';
    if (chatType === 'private') {
      return isFullyRead ? 'خوانده شده' : 'ارسال شده';
    }
    if (onClick && readCount > 0) {
      return `کلیک کنید: ${readCount} نفر خوانده‌اند`;
    }
    return `${readCount} نفر خوانده‌اند`;
  };

  const canClick = onClick && chatType !== 'private' && readCount > 0;

  return (
    <Tooltip title={getTooltipText()} arrow>
      <Box
        onClick={canClick ? (e) => {
          e.stopPropagation();
          onClick();
        } : undefined}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          ml: 0.5,
          opacity: 0.7,
          cursor: canClick ? 'pointer' : 'default',
          '&:hover': canClick ? {
            opacity: 1
          } : {}
        }}
      >
        {isFullyRead ? (
          <DoneAll sx={{ fontSize: '0.875rem', color: 'primary.main' }} />
        ) : isRead ? (
          <Done sx={{ fontSize: '0.875rem', color: 'primary.main' }} />
        ) : (
          <Check sx={{ fontSize: '0.875rem' }} />
        )}
        {canClick && (
          <Visibility sx={{ fontSize: '0.7rem', color: 'primary.main', ml: 0.25 }} />
        )}
      </Box>
    </Tooltip>
  );
};

export default MessageStatus;



