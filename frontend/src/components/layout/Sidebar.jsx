import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, IconButton, Typography, Divider, Tooltip, Switch, Badge, Chip, LinearProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logout, Home, Person, DarkMode, LightMode, Bookmark, Contacts, Settings, Notifications, Security, Palette, Language, Help, Info } from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, sidebarOpen } = useUIStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={sidebarOpen}
      sx={{
        width: sidebarOpen ? 320 : 0,
        flexShrink: 0,
        transition: 'width 0.3s',
        '& .MuiDrawer-docked .MuiDrawer-paper': {
          right: 0,
          left: 'auto'
        },
        '& .MuiDrawer-paper': {
          width: 320,
          boxSizing: 'border-box',
          borderLeft: 1,
          borderRight: 0,
          borderColor: 'divider',
          transition: 'width 0.3s',
          direction: 'rtl',
          right: 0,
          left: 'auto',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box 
        sx={{ 
          p: 1.5, 
          minHeight: 64,
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'primary.main',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 2,
          display: 'flex',
          alignItems: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
            zIndex: 0
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.08)',
            zIndex: 0
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative', zIndex: 1 }}>
          <Avatar 
            src={user?.avatar}
            sx={{ 
              width: 40, 
              height: 40,
              cursor: 'pointer',
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }
            }}
            onClick={() => navigate(`/profile/${user?.id}`)}
          >
            {user?.firstName?.[0] || user?.username?.[0] || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight="600" noWrap sx={{ mb: 0.25, color: 'white' }}>
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.username || 'کاربر'}
            </Typography>
            <Typography variant="caption" noWrap sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
              {user?.email || 'ایمیل ثبت نشده'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        <List sx={{ px: 1 }}>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => navigate('/')} 
              selected={isActive('/') && location.pathname === '/'}
              sx={{ 
                borderRadius: 2,
                mb: 0.5,
                py: 1.5,
                px: 2,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(25, 118, 210, 0.25)'
                    : 'rgba(25, 118, 210, 0.12)',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(25, 118, 210, 0.3)'
                      : 'rgba(25, 118, 210, 0.16)'
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: '60%',
                    bgcolor: 'primary.main',
                    borderRadius: '0 2px 2px 0'
                  }
                },
                '&:hover': {
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                  transform: 'translateX(-2px)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Home />
              </ListItemIcon>
              <ListItemText 
                primary="خانه" 
                primaryTypographyProps={{ 
                  variant: 'body2',
                  fontWeight: isActive('/') ? 600 : 400,
                  sx: { textAlign: 'right' }
                }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => navigate(`/profile/${user?.id}`)} 
              selected={isActive(`/profile/${user?.id}`)}
              sx={{ 
                borderRadius: 2,
                mb: 0.5,
                py: 1.5,
                px: 2,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(25, 118, 210, 0.25)'
                    : 'rgba(25, 118, 210, 0.12)',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(25, 118, 210, 0.3)'
                      : 'rgba(25, 118, 210, 0.16)'
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: '60%',
                    bgcolor: 'primary.main',
                    borderRadius: '0 2px 2px 0'
                  }
                },
                '&:hover': {
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                  transform: 'translateX(-2px)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Person />
              </ListItemIcon>
              <ListItemText 
                primary="پروفایل" 
                primaryTypographyProps={{ 
                  variant: 'body2',
                  fontWeight: isActive(`/profile/${user?.id}`) ? 600 : 400,
                  sx: { textAlign: 'right' }
                }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => navigate('/saved')} 
              selected={isActive('/saved')}
              sx={{ 
                borderRadius: 2,
                mb: 0.5,
                py: 1.5,
                px: 2,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(25, 118, 210, 0.25)'
                    : 'rgba(25, 118, 210, 0.12)',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(25, 118, 210, 0.3)'
                      : 'rgba(25, 118, 210, 0.16)'
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: '60%',
                    bgcolor: 'primary.main',
                    borderRadius: '0 2px 2px 0'
                  }
                },
                '&:hover': {
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                  transform: 'translateX(-2px)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Bookmark />
              </ListItemIcon>
              <ListItemText 
                primary="ذخیره‌شده" 
                primaryTypographyProps={{ 
                  variant: 'body2',
                  fontWeight: isActive('/saved') ? 600 : 400,
                  sx: { textAlign: 'right' }
                }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => navigate('/contacts')} 
              selected={isActive('/contacts')}
              sx={{ 
                borderRadius: 2,
                mb: 0.5,
                py: 1.5,
                px: 2,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(25, 118, 210, 0.25)'
                    : 'rgba(25, 118, 210, 0.12)',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(25, 118, 210, 0.3)'
                      : 'rgba(25, 118, 210, 0.16)'
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: '60%',
                    bgcolor: 'primary.main',
                    borderRadius: '0 2px 2px 0'
                  }
                },
                '&:hover': {
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                  transform: 'translateX(-2px)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Contacts />
              </ListItemIcon>
              <ListItemText 
                primary="مخاطبین" 
                primaryTypographyProps={{ 
                  variant: 'body2',
                  fontWeight: isActive('/contacts') ? 600 : 400,
                  sx: { textAlign: 'right' }
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      
      <Box sx={{ 
        mt: 'auto', 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider', 
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, transparent 0%, rgba(25, 118, 210, 0.05) 100%)'
          : 'linear-gradient(180deg, transparent 0%, rgba(25, 118, 210, 0.03) 100%)'
      }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: 1.5, 
            px: 1.5,
            py: 1.25,
            borderRadius: 2,
            bgcolor: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.03)'
              : 'rgba(0, 0, 0, 0.02)',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {theme === 'dark' ? (
              <DarkMode sx={{ fontSize: 20, color: 'primary.main' }} />
            ) : (
              <LightMode sx={{ fontSize: 20, color: 'primary.main' }} />
            )}
            <Typography variant="body2" fontWeight="500">
              حالت تاریک
            </Typography>
          </Box>
          <Switch
            checked={theme === 'dark'}
            onChange={toggleTheme}
            size="small"
            color="primary"
          />
        </Box>
        <ListItemButton 
          onClick={handleLogout} 
          sx={{ 
            borderRadius: 2,
            py: 1.5,
            px: 2,
            color: 'error.main',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(211, 47, 47, 0.15)'
                : 'rgba(211, 47, 47, 0.08)',
              transform: 'translateX(-2px)'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
            <Logout />
          </ListItemIcon>
          <ListItemText 
            primary="خروج" 
            primaryTypographyProps={{ 
              variant: 'body2',
              fontWeight: 500,
              sx: { textAlign: 'right' }
            }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
};

export default Sidebar;

