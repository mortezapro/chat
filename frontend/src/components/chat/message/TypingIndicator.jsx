import { Box, Typography, Avatar } from '@mui/material';
import api from '@/services/api';
import { useEffect, useState } from 'react';

const TypingIndicator = ({ typingUsers }) => {
  const [userDetails, setUserDetails] = useState({});

  useEffect(() => {
    const fetchUserDetails = async () => {
      const details = {};
      for (const typingUser of typingUsers) {
        if (!userDetails[typingUser.userId]) {
          try {
            const response = await api.get(`/users/${typingUser.userId}`);
            details[typingUser.userId] = response.data.user;
          } catch (error) {
            console.error('Error fetching user details:', error);
          }
        }
      }
      setUserDetails(prev => ({ ...prev, ...details }));
    };

    if (typingUsers.length > 0) {
      fetchUserDetails();
    }
  }, [typingUsers]);

  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      const typingUser = userDetails[typingUsers[0].userId];
      if (typingUser) {
        const name = typingUser.firstName && typingUser.lastName
          ? `${typingUser.firstName} ${typingUser.lastName}`
          : typingUser.username;
        return `${name} در حال تایپ است...`;
      }
      return 'در حال تایپ...';
    } else if (typingUsers.length === 2) {
      return 'دو نفر در حال تایپ هستند...';
    } else {
      return `${typingUsers.length} نفر در حال تایپ هستند...`;
    }
  };

  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      {typingUsers.length <= 2 && typingUsers.map((typingUser) => {
        const userDetail = userDetails[typingUser.userId];
        if (!userDetail) return null;
        
        return (
          <Avatar
            key={typingUser.userId}
            src={userDetail.avatar}
            sx={{ width: 24, height: 24 }}
          >
            {userDetail.firstName?.[0] || userDetail.username?.[0] || 'U'}
          </Avatar>
        );
      })}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {getTypingText()}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              animation: 'typing 1.4s infinite',
              animationDelay: '0s'
            }}
          />
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              animation: 'typing 1.4s infinite',
              animationDelay: '0.2s'
            }}
          />
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              animation: 'typing 1.4s infinite',
              animationDelay: '0.4s'
            }}
          />
        </Box>
      </Box>
      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
};

export default TypingIndicator;



