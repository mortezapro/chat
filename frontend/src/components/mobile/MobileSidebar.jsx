import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Drawer,
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Typography,
    Divider,
    IconButton,
    SwipeableDrawer
} from '@mui/material';
import {
    Chat,
    Contacts,
    Person,
    Bookmark,
    Close,
    Logout,
    Add,
    Group,
    Campaign
} from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

const MobileSidebar = ({ open, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        onClose();
    };

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/' || location.pathname.startsWith('/chat/');
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const handleNavigation = (path) => {
        navigate(path);
        onClose();
    };

    const handleCreateChat = () => {
        const event = new CustomEvent('openCreateChat');
        window.dispatchEvent(event);
        onClose();
    };

    const handleCreateGroup = () => {
        const event = new CustomEvent('openCreateChat');
        window.dispatchEvent(event);
        setTimeout(() => {
            const dialog = document.querySelector('[role="dialog"]');
            if (dialog) {
                const tabs = dialog.querySelectorAll('[role="tab"]');
                if (tabs.length >= 2) {
                    tabs[1].click();
                }
            }
        }, 100);
        onClose();
    };

    const handleCreateChannel = () => {
        const event = new CustomEvent('openCreateChat');
        window.dispatchEvent(event);
        setTimeout(() => {
            const dialog = document.querySelector('[role="dialog"]');
            if (dialog) {
                const tabs = dialog.querySelectorAll('[role="tab"]');
                if (tabs.length >= 3) {
                    tabs[2].click();
                }
            }
        }, 100);
        onClose();
    };

    const menuItems = [
        { icon: <Chat />, label: 'چت‌ها', path: '/' },
        { icon: <Contacts />, label: 'مخاطبین', path: '/contacts' },
        { icon: <Person />, label: 'پروفایل', path: `/profile/${user?.id}` },
        { icon: <Bookmark />, label: 'ذخیره‌ها', path: '/saved' }
    ];

    const actionItems = [
        { icon: <Add />, label: 'چت جدید', onClick: handleCreateChat },
        { icon: <Group />, label: 'گروه جدید', onClick: handleCreateGroup },
        { icon: <Campaign />, label: 'کانال جدید', onClick: handleCreateChannel },
        { icon: <Bookmark />, label: 'پیام‌های ذخیره‌شده', onClick: () => handleNavigation('/saved') }
    ];

    const drawerContent = (
        <Box
            sx={{
                width: 280,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                direction: 'rtl'
            }}
        >
            <Box
                sx={{
                    p: 1.5,
                    minHeight: 64,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 2,
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
                <Box
                    sx={{
                        position: 'absolute',
                        top: -30,
                        right: -30,
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.15)',
                        zIndex: 0
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -40,
                        left: -40,
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        zIndex: 0
                    }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative', zIndex: 1, flex: 1 }}>
                    <Avatar
                        src={user?.avatar}
                        sx={{
                            width: 40,
                            height: 40,
                            border: '2px solid rgba(255,255,255,0.3)',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }
                        }}
                        onClick={() => {
                            handleNavigation(`/profile/${user?.id}`);
                        }}
                    >
                        {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight="600" noWrap sx={{ color: 'white', mb: 0.25 }}>
                            {user?.firstName && user?.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user?.username || 'کاربر'}
                        </Typography>
                        <Typography variant="caption" noWrap sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
                            {user?.email || 'ایمیل ثبت نشده'}
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        sx={{
                            color: 'white',
                            bgcolor: 'rgba(255,255,255,0.2)',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.3)'
                            }
                        }}
                        onClick={onClose}
                    >
                        <Close />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
                <List sx={{ px: 1 }}>
                    {menuItems.map((item) => (
                        <ListItem key={item.path} disablePadding>
                            <ListItemButton
                                onClick={() => handleNavigation(item.path)}
                                selected={isActive(item.path)}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.5,
                                    py: 1.5,
                                    px: 2,
                                    transition: 'all 0.2s ease',
                                    '&.Mui-selected': {
                                        background: 'linear-gradient(135deg, rgba(25, 118, 210, 1) 0%, rgba(25, 118, 210, 0.9) 100%)',
                                        color: 'white',
                                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.4)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.95) 0%, rgba(25, 118, 210, 0.85) 100%)',
                                            transform: 'translateX(-2px)'
                                        },
                                        '& .MuiListItemIcon-root': {
                                            color: 'white'
                                        }
                                    },
                                    '&:hover': {
                                        bgcolor: (theme) => theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.08)'
                                            : 'rgba(0, 0, 0, 0.04)',
                                        transform: 'translateX(-2px)'
                                    }
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 40,
                                        color: isActive(item.path) ? 'white' : 'inherit'
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        variant: 'body1',
                                        fontWeight: isActive(item.path) ? 600 : 400,
                                        textAlign: 'right'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                <Divider sx={{ my: 1 }} />

                <List sx={{ px: 1 }}>
                    {actionItems.map((item, index) => (
                        <ListItem key={index} disablePadding>
                            <ListItemButton
                                onClick={item.onClick}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.5,
                                    py: 1.5,
                                    px: 2,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bgcolor: (theme) => theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.08)'
                                            : 'rgba(0, 0, 0, 0.04)',
                                        transform: 'translateX(-2px)'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        variant: 'body1',
                                        fontWeight: 400,
                                        textAlign: 'right'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>

            <Divider />

            <Box sx={{ p: 1.5 }}>
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
                    <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                        <Logout />
                    </ListItemIcon>
                    <ListItemText
                        primary="خروج"
                        primaryTypographyProps={{ variant: 'body1', fontWeight: 500, textAlign: 'right' }}
                    />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <SwipeableDrawer
            anchor="right"
            open={open}
            onClose={onClose}
            onOpen={() => { }}
            ModalProps={{
                keepMounted: true
            }}
            SlideProps={{
                direction: 'left'
            }}
            sx={{
                '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                    direction: 'rtl',
                    right: 0,
                    left: 'auto'
                }
            }}
        >
            {drawerContent}
        </SwipeableDrawer>
    );
};

export default MobileSidebar;

