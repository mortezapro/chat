import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from '@/components/layout/Sidebar';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { initializeSocket } from '@/services/socket';

const MainLayout = () => {
  const { initialize, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initialize();
    if (isAuthenticated) {
      initializeSocket();
    }
  }, [isAuthenticated]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100vh', 
        overflow: 'hidden',
        bgcolor: 'background.default',
        backgroundImage: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
      }}
    >
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: 0
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;



