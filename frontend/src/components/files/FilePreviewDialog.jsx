import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Close, Download, ArrowBack, ArrowForward, Fullscreen } from '@mui/icons-material';

const FilePreviewDialog = ({ open, onClose, file, files = [], currentIndex = 0 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(currentIndex);

  useEffect(() => {
    if (open && file) {
      setLoading(true);
      setError(null);
    }
  }, [open, file]);

  const currentFile = files[index] || file;

  const handlePrevious = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const handleNext = () => {
    if (index < files.length - 1) {
      setIndex(index + 1);
    }
  };

  const handleDownload = () => {
    if (currentFile?.url) {
      window.open(currentFile.url, '_blank');
    }
  };

  const renderPreview = () => {
    if (!currentFile) return null;

    const mimeType = currentFile.mimeType?.toLowerCase() || '';
    const url = currentFile.url;

    if (mimeType.startsWith('image/')) {
      return (
        <Box
          component="img"
          src={url}
          alt={currentFile.name}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError('خطا در بارگذاری تصویر');
          }}
          sx={{
            maxWidth: '100%',
            maxHeight: '70vh',
            objectFit: 'contain'
          }}
        />
      );
    }

    if (mimeType.startsWith('video/')) {
      return (
        <Box
          component="video"
          src={url}
          controls
          onLoadedData={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError('خطا در بارگذاری ویدیو');
          }}
          sx={{
            maxWidth: '100%',
            maxHeight: '70vh'
          }}
        />
      );
    }

    if (mimeType.startsWith('audio/')) {
      return (
        <Box
          component="audio"
          src={url}
          controls
          onLoadedData={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError('خطا در بارگذاری فایل صوتی');
          }}
          sx={{
            width: '100%'
          }}
        />
      );
    }

    if (mimeType === 'application/pdf') {
      return (
        <Box
          component="iframe"
          src={url}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError('خطا در بارگذاری PDF');
          }}
          sx={{
            width: '100%',
            height: '70vh',
            border: 'none'
          }}
        />
      );
    }

    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6" color="text.secondary">
          پیش‌نمایش برای این نوع فایل در دسترس نیست
        </Typography>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleDownload}
          sx={{ mt: 2 }}
        >
          دانلود فایل
        </Button>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.default'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" noWrap sx={{ flex: 1, mr: 2 }}>
            {currentFile?.name || 'پیش‌نمایش فایل'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {files.length > 1 && (
              <>
                <IconButton
                  onClick={handlePrevious}
                  disabled={index === 0}
                  size="small"
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                  {index + 1} / {files.length}
                </Typography>
                <IconButton
                  onClick={handleNext}
                  disabled={index === files.length - 1}
                  size="small"
                >
                  <ArrowForward />
                </IconButton>
              </>
            )}
            <IconButton onClick={handleDownload} size="small">
              <Download />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ position: 'relative', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading && (
            <CircularProgress sx={{ position: 'absolute' }} />
          )}
          {error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            renderPreview()
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>بستن</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilePreviewDialog;







