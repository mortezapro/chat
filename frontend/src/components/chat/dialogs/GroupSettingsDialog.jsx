import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    Avatar,
    IconButton,
    Chip,
    Box,
    Typography,
    Divider,
    Menu,
    MenuItem,
    CircularProgress,
    Switch,
    FormControlLabel,
    Slider
} from '@mui/material';
import { Close, PersonAdd, MoreVert, Edit, Delete, Person, Security, Timer, AdminPanelSettings, RemoveModerator, PhotoCamera } from '@mui/icons-material';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { getFileUrl } from '@/utils/chatHelpers';

const GroupSettingsDialog = ({ open, onClose, chat, onUpdate }) => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selfDestructEnabled, setSelfDestructEnabled] = useState(false);
    const [selfDestructDelay, setSelfDestructDelay] = useState(30);
    const [onlyAdminsCanSend, setOnlyAdminsCanSend] = useState(false);
    const [onlyAdminsCanPin, setOnlyAdminsCanPin] = useState(false);
    const [onlyAdminsCanDelete, setOnlyAdminsCanDelete] = useState(false);
    const [slowMode, setSlowMode] = useState(false);
    const [slowModeDelay, setSlowModeDelay] = useState(10);
    const [muteNonAdmins, setMuteNonAdmins] = useState(false);
    const [approveNewMembers, setApproveNewMembers] = useState(false);
    const [maxMembers, setMaxMembers] = useState(200);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [avatarKey, setAvatarKey] = useState(0);

    useEffect(() => {
        if (chat) {
            setGroupName(chat.name || '');
            setGroupDescription(chat.description || '');
            setSelfDestructEnabled(chat.settings?.selfDestructEnabled || false);
            setSelfDestructDelay(chat.settings?.selfDestructDelay || 30);
            setOnlyAdminsCanSend(chat.settings?.securitySettings?.onlyAdminsCanSend || false);
            setOnlyAdminsCanPin(chat.settings?.securitySettings?.onlyAdminsCanPin || false);
            setOnlyAdminsCanDelete(chat.settings?.securitySettings?.onlyAdminsCanDelete || false);
            setSlowMode(chat.settings?.slowMode || false);
            setSlowModeDelay(chat.settings?.slowModeDelay || 10);
            setMuteNonAdmins(chat.settings?.muteNonAdmins || false);
            setApproveNewMembers(chat.settings?.approveNewMembers || false);
            setMaxMembers(chat.settings?.maxMembers || 200);
        }
    }, [chat]);

    useEffect(() => {
        if (chat?.avatar) {
            console.log('[GroupSettingsDialog] Chat avatar updated:', {
                avatar: chat.avatar,
                fullUrl: getFileUrl(chat.avatar)
            });
            setAvatarUrl(chat.avatar);
            setAvatarKey(prev => prev + 1);
        }
    }, [chat?.avatar]);

    const isAdmin = chat?.admins?.some((admin) => admin && (admin._id === user?.id || admin.toString() === user?.id?.toString() || (admin._id || admin)?.toString() === (user?.id || user?._id)?.toString()));

    const handleSearchUsers = async () => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
            const existingParticipantIds = chat?.participants?.map((p) => p._id) || [];
            const filtered = response.data.users.filter(
                (u) => !existingParticipantIds.includes(u._id)
            );
            setSearchResults(filtered);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(handleSearchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, chat]);

    const handleAddMember = async (userId) => {
        if (!chat) return;

        setLoading(true);
        try {
            await api.post(`/chats/${chat._id}/members`, { userId });
            if (onUpdate) {
                onUpdate();
            }
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Error adding member:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!chat) return;

        setLoading(true);
        try {
            await api.delete(`/chats/${chat._id}/members/${userId}`);
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Error removing member:', error);
        } finally {
            setLoading(false);
            setMenuAnchor(null);
        }
    };

    const handleMakeAdmin = async (userId) => {
        if (!chat) return;

        setLoading(true);
        try {
            await api.post(`/chats/${chat._id}/admins`, { userId });
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Error making admin:', error);
            alert('خطا در ادمین کردن کاربر');
        } finally {
            setLoading(false);
            setMenuAnchor(null);
        }
    };

    const handleRemoveAdmin = async (userId) => {
        if (!chat) return;

        setLoading(true);
        try {
            await api.delete(`/chats/${chat._id}/admins/${userId}`);
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Error removing admin:', error);
            alert('خطا در حذف ادمین');
        } finally {
            setLoading(false);
            setMenuAnchor(null);
        }
    };

    const handleUpdateGroup = async () => {
        if (!chat || !isAdmin) return;

        setLoading(true);
        try {
            await api.put(`/chats/${chat._id}`, {
                name: groupName,
                description: groupDescription,
                selfDestructEnabled,
                selfDestructDelay,
                securitySettings: {
                    onlyAdminsCanSend,
                    onlyAdminsCanPin,
                    onlyAdminsCanDelete
                }
            });
            if (onUpdate) {
                onUpdate();
            }
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating group:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!chat || !isAdmin) return;

        setLoading(true);
        try {
            await api.put(`/chats/${chat._id}`, {
                selfDestructEnabled,
                selfDestructDelay,
                securitySettings: {
                    onlyAdminsCanSend,
                    onlyAdminsCanPin,
                    onlyAdminsCanDelete
                }
            });
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Error updating settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMenuOpen = (event, participant) => {
        setMenuAnchor(event.currentTarget);
        setSelectedUser(participant);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedUser(null);
    };

    if (!chat) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">تنظیمات گروه</Typography>
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                            <Avatar 
                                src={(avatarUrl || chat.avatar) ? `${getFileUrl(avatarUrl || chat.avatar)}?v=${avatarKey}` : undefined} 
                                sx={{ 
                                    width: 120, 
                                    height: 120, 
                                    boxShadow: 4,
                                    border: '3px solid',
                                    borderColor: 'divider'
                                }}
                                key={`group-avatar-${avatarKey}`}
                                onError={(e) => {
                                    console.error('[GroupSettingsDialog] Avatar image load error:', {
                                        src: avatarUrl || chat.avatar,
                                        fullUrl: getFileUrl(avatarUrl || chat.avatar),
                                        error: e
                                    });
                                }}
                                onLoad={() => {
                                    console.log('[GroupSettingsDialog] Avatar image loaded successfully:', getFileUrl(avatarUrl || chat.avatar));
                                }}
                            >
                                {chat.name?.[0] || 'G'}
                            </Avatar>
                            {isAdmin && (
                                <>
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="group-avatar-upload"
                                        type="file"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) {
                                                console.log('[GroupSettingsDialog] No file selected');
                                                return;
                                            }
                                            
                                            console.log('[GroupSettingsDialog] Starting avatar upload:', {
                                                fileName: file.name,
                                                fileSize: file.size,
                                                fileType: file.type
                                            });
                                            
                                            setLoading(true);
                                            try {
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                
                                                console.log('[GroupSettingsDialog] Uploading file to /upload');
                                                const uploadResponse = await api.post('/upload', formData, {
                                                    headers: { 'Content-Type': 'multipart/form-data' }
                                                });
                                                
                                                console.log('[GroupSettingsDialog] Upload response:', uploadResponse.data);
                                                
                                                if (uploadResponse.data?.file?.url) {
                                                    const newAvatarUrl = uploadResponse.data.file.url;
                                                    console.log('[GroupSettingsDialog] Updating chat with avatar URL:', newAvatarUrl);
                                                    
                                                    const response = await api.put(`/chats/${chat._id}`, {
                                                        avatar: newAvatarUrl
                                                    });
                                                    
                                                    console.log('[GroupSettingsDialog] Chat update response:', response.data);
                                                    
                                                    if (response.data?.chat) {
                                                        const updatedChat = response.data.chat;
                                                        console.log('[GroupSettingsDialog] Updated chat data:', {
                                                            id: updatedChat._id || updatedChat.id,
                                                            avatar: updatedChat.avatar,
                                                            hasAvatar: !!updatedChat.avatar
                                                        });
                                                        
                                                        setAvatarUrl(newAvatarUrl);
                                                        setAvatarKey(prev => prev + 1);
                                                        
                                                        console.log('[GroupSettingsDialog] Avatar URL set:', {
                                                            newAvatarUrl,
                                                            fullUrl: getFileUrl(newAvatarUrl),
                                                            avatarKey: avatarKey + 1
                                                        });
                                                        
                                                        if (onUpdate) {
                                                            console.log('[GroupSettingsDialog] Calling onUpdate callback');
                                                            onUpdate();
                                                            console.log('[GroupSettingsDialog] onUpdate callback completed');
                                                        }
                                                    } else {
                                                        console.warn('[GroupSettingsDialog] No chat data in response:', response.data);
                                                    }
                                                } else {
                                                    console.error('[GroupSettingsDialog] Invalid upload response:', uploadResponse.data);
                                                    alert('خطا در دریافت URL فایل آپلود شده');
                                                }
                                            } catch (error) {
                                                console.error('[GroupSettingsDialog] Error uploading avatar:', {
                                                    message: error.message,
                                                    response: error.response?.data,
                                                    status: error.response?.status
                                                });
                                                alert('خطا در آپلود آواتار: ' + (error.response?.data?.message || error.message));
                                            } finally {
                                                setLoading(false);
                                                e.target.value = '';
                                            }
                                        }}
                                        disabled={loading}
                                    />
                                    <Button
                                        startIcon={<PhotoCamera />}
                                        size="small"
                                        variant="outlined"
                                        disabled={loading}
                                        sx={{ 
                                            position: 'absolute', 
                                            bottom: 8, 
                                            right: 8,
                                            bgcolor: 'background.paper',
                                            '&:hover': {
                                                bgcolor: 'action.hover'
                                            }
                                        }}
                                        onClick={() => {
                                            const input = document.getElementById('group-avatar-upload');
                                            if (input) {
                                                input.click();
                                            }
                                        }}
                                    >
                                        {loading ? 'در حال آپلود...' : 'تغییر'}
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Box>
                    {isEditing && isAdmin ? (
                        <>
                            <TextField
                                fullWidth
                                label="نام گروه"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                margin="normal"
                                sx={{
                                  '& .MuiInputBase-input': {
                                    direction: 'rtl',
                                    textAlign: 'right'
                                  }
                                }}
                            />
                            <TextField
                                fullWidth
                                label="توضیحات"
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                margin="normal"
                                multiline
                                rows={2}
                                sx={{
                                  '& .MuiInputBase-input': {
                                    direction: 'rtl',
                                    textAlign: 'right'
                                  }
                                }}
                            />
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleUpdateGroup}
                                    disabled={loading || !groupName.trim()}
                                >
                                    ذخیره
                                </Button>
                                <Button onClick={() => setIsEditing(false)}>انصراف</Button>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Typography variant="h6" gutterBottom>
                                {chat.name}
                            </Typography>
                            {chat.description && (
                                <Typography variant="body2" color="text.secondary">
                                    {chat.description}
                                </Typography>
                            )}
                            {isAdmin && (
                                <Button
                                    startIcon={<Edit />}
                                    onClick={() => setIsEditing(true)}
                                    sx={{ mt: 1 }}
                                >
                                    ویرایش
                                </Button>
                            )}
                        </>
                    )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                    اعضا ({chat.participants?.length || 0})
                </Typography>

                <List>
                    {chat.participants?.map((participant) => {
                        if (!participant) return null;
                        
                        const participantId = participant._id || participant.id || participant;
                        const isParticipantAdmin = chat.admins?.some((a) => a && (a._id === participantId || a.toString() === participantId?.toString() || (a._id || a)?.toString() === participantId?.toString()));

                        return (
                            <ListItem key={participantId}>
                                <ListItemAvatar>
                                    <Avatar src={participant.avatar}>
                                        {participant.firstName?.[0] || participant.username?.[0] || 'U'}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography>
                                                {participant.firstName && participant.lastName
                                                    ? `${participant.firstName} ${participant.lastName}`
                                                    : participant.username}
                                            </Typography>
                                            {isParticipantAdmin && (
                                                <Chip label="مدیر" size="small" color="primary" />
                                            )}
                                            {participant.isOnline && (
                                                <Chip label="آنلاین" size="small" color="success" />
                                            )}
                                        </Box>
                                    }
                                    secondary={participant.email}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={(e) => handleMenuOpen(e, participant)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <MoreVert />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        );
                    })}
                </List>

                {isAdmin && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom>
                            افزودن عضو
                        </Typography>
                        <TextField
                            fullWidth
                            label="جستجوی کاربر"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            margin="normal"
                            size="small"
                            sx={{
                              '& .MuiInputBase-input': {
                                direction: 'rtl',
                                textAlign: 'right'
                              }
                            }}
                        />
                        {searchResults.length > 0 && (
                            <List>
                                {searchResults.map((user) => (
                                    <ListItem
                                        key={user._id}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleAddMember(user._id)}
                                                disabled={loading}
                                            >
                                                <PersonAdd />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar src={user.avatar}>
                                                {user.firstName?.[0] || user.username?.[0] || 'U'}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                user.firstName && user.lastName
                                                    ? `${user.firstName} ${user.lastName}`
                                                    : user.username
                                            }
                                            secondary={user.username}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </>
                )}

                {isAdmin && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Security />
                            <Typography variant="subtitle2">تنظیمات امنیتی</Typography>
                        </Box>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={onlyAdminsCanSend}
                                    onChange={(e) => setOnlyAdminsCanSend(e.target.checked)}
                                />
                            }
                            label="فقط مدیران می‌توانند پیام ارسال کنند"
                            sx={{ mb: 1 }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={onlyAdminsCanPin}
                                    onChange={(e) => setOnlyAdminsCanPin(e.target.checked)}
                                />
                            }
                            label="فقط مدیران می‌توانند پیام پین کنند"
                            sx={{ mb: 1 }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={onlyAdminsCanDelete}
                                    onChange={(e) => setOnlyAdminsCanDelete(e.target.checked)}
                                />
                            }
                            label="فقط مدیران می‌توانند پیام حذف کنند"
                            sx={{ mb: 1 }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={muteNonAdmins}
                                    onChange={(e) => setMuteNonAdmins(e.target.checked)}
                                />
                            }
                            label="سکوت کردن اعضای غیر ادمین"
                            sx={{ mb: 1 }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={approveNewMembers}
                                    onChange={(e) => setApproveNewMembers(e.target.checked)}
                                />
                            }
                            label="تایید دستی اعضای جدید"
                            sx={{ mb: 2 }}
                        />

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" gutterBottom>
                                حداکثر تعداد اعضا: {maxMembers}
                            </Typography>
                            <Slider
                                value={maxMembers}
                                onChange={(e, newValue) => setMaxMembers(newValue)}
                                min={10}
                                max={1000}
                                step={10}
                                marks={[
                                    { value: 50, label: '50' },
                                    { value: 200, label: '200' },
                                    { value: 500, label: '500' },
                                    { value: 1000, label: '1000' }
                                ]}
                            />
                        </Box>

                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Timer />
                            <Typography variant="subtitle2">حالت آهسته (Slow Mode)</Typography>
                        </Box>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={slowMode}
                                    onChange={(e) => setSlowMode(e.target.checked)}
                                />
                            }
                            label="فعال‌سازی حالت آهسته"
                            sx={{ mb: 2 }}
                        />

                        {slowMode && (
                            <Box sx={{ px: 2, mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    تاخیر بین پیام‌ها (ثانیه): {slowModeDelay}
                                </Typography>
                                <Slider
                                    value={slowModeDelay}
                                    onChange={(e, newValue) => setSlowModeDelay(newValue)}
                                    min={5}
                                    max={300}
                                    step={5}
                                    marks={[
                                        { value: 10, label: '10' },
                                        { value: 30, label: '30' },
                                        { value: 60, label: '60' },
                                        { value: 120, label: '120' }
                                    ]}
                                />
                            </Box>
                        )}

                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Timer />
                            <Typography variant="subtitle2">پیام‌های خودحذف‌شونده</Typography>
                        </Box>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={selfDestructEnabled}
                                    onChange={(e) => setSelfDestructEnabled(e.target.checked)}
                                />
                            }
                            label="فعال‌سازی پیام‌های خودحذف‌شونده"
                            sx={{ mb: 2 }}
                        />

                        {selfDestructEnabled && (
                            <Box sx={{ px: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    زمان حذف خودکار (ثانیه): {selfDestructDelay}
                                </Typography>
                                <Slider
                                    value={selfDestructDelay}
                                    onChange={(e, newValue) => setSelfDestructDelay(newValue)}
                                    min={10}
                                    max={300}
                                    step={10}
                                    marks={[
                                        { value: 10, label: '10' },
                                        { value: 30, label: '30' },
                                        { value: 60, label: '60' },
                                        { value: 120, label: '120' },
                                        { value: 300, label: '300' }
                                    ]}
                                />
                            </Box>
                        )}

                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                onClick={handleSaveSettings}
                                disabled={loading}
                                fullWidth
                            >
                                ذخیره تنظیمات
                            </Button>
                        </Box>
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>بستن</Button>
            </DialogActions>

            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem
                    onClick={() => {
                        if (selectedUser) {
                            const userId = selectedUser._id || selectedUser.id;
                            if (userId) {
                                navigate(`/profile/${userId}`);
                            }
                        }
                        handleMenuClose();
                    }}
                >
                    <Person sx={{ mr: 1 }} />
                    مشاهده پروفایل
                </MenuItem>
                {isAdmin && selectedUser && (selectedUser._id || selectedUser.id)?.toString() !== (user?.id || user?._id)?.toString() && (
                    <>
                        {chat.admins?.some(a => a && (a._id === (selectedUser?._id || selectedUser?.id) || a.toString() === (selectedUser?._id || selectedUser?.id)?.toString() || (a._id || a)?.toString() === (selectedUser?._id || selectedUser?.id)?.toString())) ? (
                            <MenuItem
                                onClick={() => {
                                    if (selectedUser) {
                                        const userId = selectedUser._id || selectedUser.id;
                                        if (userId) {
                                            handleRemoveAdmin(userId);
                                        }
                                    }
                                }}
                                sx={{ color: 'warning.main' }}
                            >
                                <RemoveModerator sx={{ mr: 1 }} />
                                حذف از ادمین‌ها
                            </MenuItem>
                        ) : (
                            <MenuItem
                                onClick={() => {
                                    if (selectedUser) {
                                        const userId = selectedUser._id || selectedUser.id;
                                        if (userId) {
                                            handleMakeAdmin(userId);
                                        }
                                    }
                                }}
                                sx={{ color: 'primary.main' }}
                            >
                                <AdminPanelSettings sx={{ mr: 1 }} />
                                ادمین کردن
                            </MenuItem>
                        )}
                        <MenuItem
                            onClick={() => {
                                if (selectedUser) {
                                    const userId = selectedUser._id || selectedUser.id;
                                    if (userId) {
                                        handleRemoveMember(userId);
                                    }
                                }
                            }}
                            sx={{ color: 'error.main' }}
                        >
                            <Delete sx={{ mr: 1 }} />
                            حذف از گروه
                        </MenuItem>
                    </>
                )}
            </Menu>
        </Dialog>
    );
};

export default GroupSettingsDialog;

