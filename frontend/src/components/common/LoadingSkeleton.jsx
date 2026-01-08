import { Box, Skeleton } from '@mui/material';

export const ChatListSkeleton = () => {
  return (
    <Box>
      {[1, 2, 3, 4, 5].map((i) => (
        <Box key={i} sx={{ display: 'flex', gap: 2, p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Skeleton variant="circular" width={48} height={48} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export const MessageListSkeleton = () => {
  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start' }}>
          {i % 2 !== 0 && <Skeleton variant="circular" width={32} height={32} />}
          <Box sx={{ maxWidth: '70%' }}>
            <Skeleton variant="rectangular" width={200} height={60} sx={{ borderRadius: 2 }} />
            <Skeleton variant="text" width={80} height={16} sx={{ mt: 0.5 }} />
          </Box>
          {i % 2 === 0 && <Skeleton variant="circular" width={32} height={32} />}
        </Box>
      ))}
    </Box>
  );
};






