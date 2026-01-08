import { Box, Typography, Divider } from '@mui/material';
import { isToday, isYesterday, isSameYear } from 'date-fns';

const DateSeparator = ({ date }) => {
  const messageDate = new Date(date);
  
  let dateText = '';
  if (isToday(messageDate)) {
    dateText = 'امروز';
  } else if (isYesterday(messageDate)) {
    dateText = 'دیروز';
  } else if (isSameYear(messageDate, new Date())) {
    const day = messageDate.getDate();
    const months = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'می', 'ژوئن', 'جولای', 'آگوست', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];
    const month = months[messageDate.getMonth()];
    dateText = `${day} ${month}`;
  } else {
    const day = messageDate.getDate();
    const months = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'می', 'ژوئن', 'جولای', 'آگوست', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];
    const month = months[messageDate.getMonth()];
    const year = messageDate.getFullYear();
    dateText = `${day} ${month} ${year}`;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        my: 3,
        px: 2
      }}
    >
      <Divider sx={{ flex: 1, opacity: 0.5 }} />
      <Typography
        variant="caption"
        sx={{
          px: 2,
          py: 0.75,
          bgcolor: 'background.paper',
          borderRadius: 3,
          color: 'text.secondary',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider',
          fontSize: '0.75rem',
          letterSpacing: '0.5px'
        }}
      >
        {dateText}
      </Typography>
      <Divider sx={{ flex: 1, opacity: 0.5 }} />
    </Box>
  );
};

export default DateSeparator;

