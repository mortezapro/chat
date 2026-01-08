import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { Search, TrendingUp, People, Campaign } from '@mui/icons-material';
import api from '@/services/api';
import { useNavigate } from 'react-router-dom';

const ChannelDiscovery = () => {
  const [channels, setChannels] = useState([]);
  const [trendingChannels, setTrendingChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingChannels();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchChannels();
    } else {
      setChannels([]);
    }
  }, [searchQuery]);

  const fetchTrendingChannels = async () => {
    setLoading(true);
    try {
      const response = await api.get('/channels/trending');
      setTrendingChannels(response.data.channels || []);
    } catch (error) {
      console.error('Error fetching trending channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchChannels = async () => {
    setLoading(true);
    try {
      const response = await api.get('/channels/search', {
        params: { q: searchQuery }
      });
      setChannels(response.data.channels || []);
    } catch (error) {
      console.error('Error searching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (channelId) => {
    try {
      await api.post(`/channels/${channelId}/subscribe`);
      navigate(`/chat/${channelId}`);
    } catch (error) {
      console.error('Error subscribing to channel:', error);
      alert('خطا در عضویت در کانال');
    }
  };

  const displayChannels = tabValue === 0 ? trendingChannels : channels;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        کشف کانال‌ها
      </Typography>

      <TextField
        fullWidth
        placeholder="جستجوی کانال..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          )
        }}
        sx={{ mb: 3 }}
      />

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab icon={<TrendingUp />} label="محبوب‌ترین‌ها" />
        <Tab icon={<Search />} label="نتایج جستجو" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : displayChannels.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography color="text.secondary">
            {tabValue === 0 ? 'کانالی یافت نشد' : 'نتیجه‌ای یافت نشد'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {displayChannels.map((channel) => (
            <Grid item xs={12} sm={6} md={4} key={channel._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-4px)'
                  },
                  transition: 'all 0.2s'
                }}
                onClick={() => navigate(`/chat/${channel._id}`)}
              >
                {channel.avatar ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={channel.avatar}
                    alt={channel.name}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Campaign sx={{ fontSize: 60, color: 'white' }} />
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {channel.name}
                  </Typography>
                  {channel.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {channel.description.substring(0, 100)}
                      {channel.description.length > 100 ? '...' : ''}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<People />}
                      label={`${channel.subscribers?.length || 0} عضو`}
                      size="small"
                    />
                    {channel.channelSettings?.isPublic ? (
                      <Chip label="عمومی" color="success" size="small" />
                    ) : (
                      <Chip label="خصوصی" color="default" size="small" />
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribe(channel._id);
                    }}
                  >
                    عضویت
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ChannelDiscovery;



