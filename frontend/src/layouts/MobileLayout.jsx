import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuthStore } from '@/stores/authStore';
import { initializeSocket } from '@/services/socket';
import { useUIStore } from '@/stores/uiStore';
import MobileSidebar from '@/components/mobile/MobileSidebar';

const MobileLayout = () => {
  const { initialize, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    initialize();
    if (isAuthenticated) {
      initializeSocket();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleMenuClick = () => {
      setSidebarOpen(true);
    };
    window.addEventListener('openMobileSidebar', handleMenuClick);
    return () => {
      window.removeEventListener('openMobileSidebar', handleMenuClick);
    };
  }, []);

  const isHomePage = location.pathname === '/' || location.pathname === '/';

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Outlet />
      </Box>


      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </Box>
  );
};

export default MobileLayout;


