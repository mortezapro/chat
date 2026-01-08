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
  CardMedia,
  CardContent,
  IconButton,
  Tabs,
  Tab,
  TextField,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Close,
  Image,
  VideoFile,
  AudioFile,
  Description,
  InsertDriveFile,
  Download,
  Search,
  FilterList,
  ViewModule,
  ViewList
} from '@mui/icons-material';
import api from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

const FileGallery = ({ open, onClose, chatId }) => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'همه' },
    { value: 'image', label: 'تصاویر' },
    { value: 'video', label: 'ویدیوها' },
    { value: 'audio', label: 'صوتی' },
    { value: 'document', label: 'اسناد' },
    { value: 'other', label: 'سایر' }
  ];

  useEffect(() => {
    if (open && chatId) {
      fetchFiles();
    }
  }, [open, chatId]);

  useEffect(() => {
    filterFiles();
  }, [files, searchQuery, selectedCategory, tabValue]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/chats/${chatId}/files`);
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = [...files];

    if (searchQuery) {
      filtered = filtered.filter(file =>
        file.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.message?.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(file => {
        const type = getFileType(file);
        return type === selectedCategory;
      });
    }

    if (tabValue === 1) {
      filtered = filtered.filter(file => file.type === 'image');
    } else if (tabValue === 2) {
      filtered = filtered.filter(file => file.type === 'video');
    } else if (tabValue === 3) {
      filtered = filtered.filter(file => file.type === 'audio');
    } else if (tabValue === 4) {
      filtered = filtered.filter(file => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].some(ext => 
        file.name?.toLowerCase().endsWith(ext)
      ));
    }

    setFilteredFiles(filtered);
  };

  const getFileType = (file) => {
    const name = file.name?.toLowerCase() || '';
    const mimeType = file.mimeType?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/') || name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      return 'image';
    }
    if (mimeType.startsWith('video/') || name.match(/\.(mp4|avi|mov|wmv|flv|webm)$/)) {
      return 'video';
    }
    if (mimeType.startsWith('audio/') || name.match(/\.(mp3|wav|ogg|m4a|webm)$/)) {
      return 'audio';
    }
    if (name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/)) {
      return 'document';
    }
    return 'other';
  };

  const getFileIcon = (file) => {
    const type = getFileType(file);
    switch (type) {
      case 'image':
        return <Image />;
      case 'video':
        return <VideoFile />;
      case 'audio':
        return <AudioFile />;
      case 'document':
        return <Description />;
      default:
        return <InsertDriveFile />;
    }
  };

  const handleDownload = (file) => {
    window.open(file.url, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">گالری فایل‌ها</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} size="small">
              {viewMode === 'grid' ? <ViewList /> : <ViewModule />}
            </IconButton>
            <IconButton onClick={(e) => setFilterAnchor(e.currentTarget)} size="small">
              <FilterList />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="جستجو در فایل‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ mb: 2 }}
          />
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab label="همه" />
            <Tab label="تصاویر" />
            <Tab label="ویدیو" />
            <Tab label="صوتی" />
            <Tab label="اسناد" />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography>در حال بارگذاری...</Typography>
          </Box>
        ) : filteredFiles.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography color="text.secondary">فایلی یافت نشد</Typography>
          </Box>
        ) : viewMode === 'grid' ? (
          <Grid container spacing={2}>
            {filteredFiles.map((file) => (
              <Grid item xs={6} sm={4} md={3} key={file._id || file.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 4
                    },
                    transition: 'all 0.2s'
                  }}
                  onClick={() => window.open(file.url, '_blank')}
                >
                  {getFileType(file) === 'image' ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={file.url}
                      alt={file.name}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'action.hover'
                      }}
                    >
                      {getFileIcon(file)}
                    </Box>
                  )}
                  <CardContent>
                    <Typography variant="body2" noWrap>
                      {file.name || 'فایل بدون نام'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box>
            {filteredFiles.map((file) => (
              <Card
                key={file._id || file.id}
                sx={{
                  mb: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => window.open(file.url, '_blank')}
              >
                <Box sx={{ display: 'flex', p: 2, alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: 'primary.main' }}>
                    {getFileIcon(file)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">{file.name || 'فایل بدون نام'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)} •                       {file.message?.createdAt && 
                        formatDistanceToNow(new Date(file.message.createdAt), { addSuffix: true, locale: faIR })
                      }
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file);
                    }}
                    size="small"
                  >
                    <Download />
                  </IconButton>
                </Box>
              </Card>
            ))}
          </Box>
        )}

        <Menu
          anchorEl={filterAnchor}
          open={!!filterAnchor}
          onClose={() => setFilterAnchor(null)}
        >
          {categories.map((cat) => (
            <MenuItem
              key={cat.value}
              onClick={() => {
                setSelectedCategory(cat.value);
                setFilterAnchor(null);
              }}
              selected={selectedCategory === cat.value}
            >
              {cat.label}
            </MenuItem>
          ))}
        </Menu>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>بستن</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileGallery;

