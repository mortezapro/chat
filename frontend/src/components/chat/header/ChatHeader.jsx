import { Box, Typography, IconButton, Avatar, Chip, Menu, MenuItem } from '@mui/material';
import { ArrowBack, MoreVert, Info, Settings, Search, FontDownload, BarChart, Campaign, ColorLens, Folder, Summarize, CenterFocusStrong, Block } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getChatTitle, getChatAvatar, getFileUrl } from '@/utils/chatHelpers';
import ChannelSubscribeButton from '../ChannelSubscribeButton';

export const ChatHeader = ({ 
    chat, 
    user, 
    menuAnchor, 
    onMenuClick, 
    onMenuClose, 
    onAdvancedSearchClick,
    onSummaryClick,
    onFocusModeClick,
    onBlockClick,
    onGroupSettingsClick,
    onChannelSettingsClick,
    onChannelStatsClick,
    onFontSettingsClick,
    onThemeSettingsClick,
    onFileGalleryClick,
    onPollClick,
    onInfoClick
}) => {
    const navigate = useNavigate();

    if (!chat) return null;

    const handleProfileClick = () => {
        if (chat.type === 'private') {
            const otherParticipant = chat.participants.find((p) => p._id !== user?.id);
            if (otherParticipant?._id) {
                navigate(`/profile/${otherParticipant._id}`);
            }
        }
    };

    return (
        <Box
            sx={{
                p: 1.5,
                minHeight: 64,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: 'primary.main',
                color: 'white',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                boxShadow: 2
            }}
        >
            <IconButton onClick={() => navigate('/')} sx={{ cursor: 'pointer', color: 'white', mr: 1 }}>
                <ArrowBack />
            </IconButton>
            <Avatar
                component={chat.type === 'private' ? 'button' : 'div'}
                onClick={chat.type === 'private' ? handleProfileClick : undefined}
                src={getFileUrl(getChatAvatar(chat, user))}
                sx={{
                    width: 48,
                    height: 48,
                    border: '2px solid',
                    borderColor: 'rgba(255,255,255,0.3)',
                    cursor: chat.type === 'private' ? 'pointer' : 'default'
                }}
            >
                {getChatTitle(chat, user)?.[0] || 'C'}
            </Avatar>
            <Box
                component={chat.type === 'private' ? 'button' : 'div'}
                onClick={chat.type === 'private' ? handleProfileClick : undefined}
                sx={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    background: 'none',
                    cursor: chat.type === 'private' ? 'pointer' : 'default',
                    textAlign: 'right',
                    '&:hover': chat.type === 'private' ? {
                        opacity: 0.8
                    } : {}
                }}
            >
                <Typography variant="h6" noWrap fontWeight="bold" sx={{ color: 'white' }}>
                    {getChatTitle(chat, user)}
                </Typography>
                {chat.type === 'private' && chat.participants?.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                            label={chat.participants.find((p) => p._id !== user?.id)?.isOnline ? 'آنلاین' : 'آفلاین'}
                            color={chat.participants.find((p) => p._id !== user?.id)?.isOnline ? 'success' : 'default'}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                        />
                    </Box>
                )}
                {chat.type === 'group' && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {chat.participants?.length} عضو
                    </Typography>
                )}
                {chat.type === 'channel' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            {chat.subscribers?.length || chat.participants?.length || 0} عضو
                        </Typography>
                        <ChannelSubscribeButton chat={chat} onUpdate={() => { }} />
                    </Box>
                )}
            </Box>
            <IconButton onClick={onAdvancedSearchClick} sx={{ cursor: 'pointer', color: 'white' }}>
                <Search />
            </IconButton>
            <IconButton onClick={onMenuClick} sx={{ cursor: 'pointer', color: 'white' }}>
                <MoreVert />
            </IconButton>
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={onMenuClose}
            >
                <MenuItem onClick={() => {
                    onAdvancedSearchClick();
                    onMenuClose();
                }}>
                    <Search sx={{ mr: 1 }} />
                    جستجوی پیشرفته در چت
                </MenuItem>
                <MenuItem onClick={() => {
                    if (onSummaryClick) onSummaryClick();
                    onMenuClose();
                }}>
                    <Summarize sx={{ mr: 1 }} />
                    خلاصه گفتگو
                </MenuItem>
                <MenuItem onClick={() => {
                    if (onFocusModeClick) onFocusModeClick();
                    onMenuClose();
                }}>
                    <CenterFocusStrong sx={{ mr: 1 }} />
                    حالت تمرکز
                </MenuItem>
                <MenuItem onClick={() => {
                    if (onInfoClick) onInfoClick();
                    onMenuClose();
                }}>
                    <Info sx={{ mr: 1 }} />
                    اطلاعات {chat.type === 'group' ? 'گروه' : 'چت'}
                </MenuItem>
                {chat.type === 'group' && (
                    <MenuItem onClick={() => {
                        if (onGroupSettingsClick) onGroupSettingsClick();
                        onMenuClose();
                    }}>
                        <Settings sx={{ mr: 1 }} />
                        تنظیمات گروه
                    </MenuItem>
                )}
                {chat.type === 'channel' && (
                    <>
                        <MenuItem onClick={() => {
                            if (onChannelSettingsClick) onChannelSettingsClick();
                            onMenuClose();
                        }}>
                            <Settings sx={{ mr: 1 }} />
                            تنظیمات کانال
                        </MenuItem>
                        <MenuItem onClick={() => {
                            if (onChannelStatsClick) onChannelStatsClick();
                            onMenuClose();
                        }}>
                            <BarChart sx={{ mr: 1 }} />
                            آمار کانال
                        </MenuItem>
                    </>
                )}
                <MenuItem onClick={() => {
                    if (onFontSettingsClick) onFontSettingsClick();
                    onMenuClose();
                }}>
                    <FontDownload sx={{ mr: 1 }} />
                    تنظیمات فونت
                </MenuItem>
                <MenuItem onClick={() => {
                    if (onThemeSettingsClick) onThemeSettingsClick();
                    onMenuClose();
                }}>
                    <ColorLens sx={{ mr: 1 }} />
                    تنظیمات تم
                </MenuItem>
                <MenuItem onClick={() => {
                    if (onFileGalleryClick) onFileGalleryClick();
                    onMenuClose();
                }}>
                    <Folder sx={{ mr: 1 }} />
                    گالری فایل‌ها
                </MenuItem>
                {chat.type === 'channel' && (
                    <MenuItem onClick={() => {
                        if (onPollClick) onPollClick();
                        onMenuClose();
                    }}>
                        <Campaign sx={{ mr: 1 }} />
                        ایجاد نظرسنجی
                    </MenuItem>
                )}
                {chat.type === 'private' && (
                    <MenuItem onClick={() => {
                        if (onBlockClick) onBlockClick();
                        onMenuClose();
                    }}>
                        <Block sx={{ mr: 1 }} />
                        مسدود کردن
                    </MenuItem>
                )}
            </Menu>
        </Box>
    );
};

