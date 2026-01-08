import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Divider,
    Chip
} from '@mui/material';
import { Close, Visibility, ThumbUp, Comment, TrendingUp } from '@mui/icons-material';
import api from '@/services/api';
// Chart removed - using simple table display

const ChannelStatsDialog = ({ open, onClose, chatId }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && chatId) {
            fetchStats();
        }
    }, [open, chatId]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/channels/${chatId}/stats`);
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!stats) {
        return null;
    }

    const statCards = [
        { title: 'کل اعضا', value: stats.totalMembers, icon: <TrendingUp />, color: '#1976d2' },
        { title: 'کل پست‌ها', value: stats.totalPosts, icon: <TrendingUp />, color: '#2e7d32' },
        { title: 'کل بازدیدها', value: stats.totalViews, icon: <Visibility />, color: '#ed6c02' },
        { title: 'کل واکنش‌ها', value: stats.totalReactions, icon: <ThumbUp />, color: '#d32f2f' },
        { title: 'کل کامنت‌ها', value: stats.totalComments, icon: <Comment />, color: '#9c27b0' }
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">آمار کانال</Typography>
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <Typography>در حال بارگذاری...</Typography>
                    </Box>
                ) : (
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            {statCards.map((card, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Card>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ color: card.color, fontSize: 40 }}>
                                                    {card.icon}
                                                </Box>
                                                <Box>
                                                    <Typography variant="h4" fontWeight="bold">
                                                        {card.value.toLocaleString('fa-IR')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {card.title}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        {stats.viewsByDate && stats.viewsByDate.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>بازدیدها بر اساس تاریخ</Typography>
                                <List>
                                    {stats.viewsByDate.map((item, index) => (
                                        <ListItem key={index}>
                                            <ListItemText
                                                primary={item.date}
                                                secondary={`${item.count} بازدید`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        {stats.topPosts && stats.topPosts.length > 0 && (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2 }}>پست‌های پربازدید</Typography>
                                <List>
                                    {stats.topPosts.map((post, index) => (
                                        <Box key={post._id}>
                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar>{index + 1}</Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="body1" noWrap sx={{ flex: 1 }}>
                                                                {post.content?.substring(0, 50) || 'پست بدون متن'}
                                                            </Typography>
                                                            <Chip label={`${post.viewCount} بازدید`} size="small" />
                                                            <Chip label={`${post.likeCount} لایک`} size="small" color="primary" />
                                                            <Chip label={`${post.commentCount} کامنت`} size="small" color="secondary" />
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(post.createdAt).toLocaleDateString('fa-IR')}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                            {index < stats.topPosts.length - 1 && <Divider />}
                                        </Box>
                                    ))}
                                </List>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>بستن</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ChannelStatsDialog;

