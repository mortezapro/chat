import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  CircularProgress,
  Divider
} from '@mui/material';
import { LocationOn, MyLocation } from '@mui/icons-material';

const LocationPicker = ({ open, onClose, onLocationSelect }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });

  useEffect(() => {
    if (open && navigator.geolocation) {
      getCurrentLocation();
    }
  }, [open]);

  const getCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        
        // Try to get address from coordinates
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data.display_name) {
            setAddress(data.display_name);
          }
        } catch (error) {
          console.error('Error fetching address:', error);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLoading(false);
      }
    );
  };

  const handleManualSubmit = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('مختصات نامعتبر است');
      return;
    }

    setLocation({ latitude: lat, longitude: lng });
  };

  const handleSend = () => {
    if (location && onLocationSelect) {
      onLocationSelect({
        latitude: location.latitude,
        longitude: location.longitude,
        address: address || `${location.latitude}, ${location.longitude}`
      });
      onClose();
      setLocation(null);
      setAddress('');
      setManualCoords({ lat: '', lng: '' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>اشتراک‌گذاری موقعیت</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<MyLocation />}
            onClick={getCurrentLocation}
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={20} /> : 'استفاده از موقعیت فعلی'}
          </Button>

          {location && (
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                موقعیت انتخاب شده:
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {address || `${location.latitude}, ${location.longitude}`}
              </Typography>
              <Box
                component="iframe"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
                sx={{
                  width: '100%',
                  height: 200,
                  border: 'none',
                  borderRadius: 1,
                  mt: 1
                }}
              />
            </Box>
          )}

          <Divider>یا</Divider>

          <Typography variant="subtitle2">وارد کردن دستی مختصات</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="عرض جغرافیایی"
              type="number"
              value={manualCoords.lat}
              onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label="طول جغرافیایی"
              type="number"
              value={manualCoords.lng}
              onChange={(e) => setManualCoords(prev => ({ ...prev, lng: e.target.value }))}
              fullWidth
              size="small"
            />
          </Box>
          <Button
            variant="outlined"
            onClick={handleManualSubmit}
            disabled={!manualCoords.lat || !manualCoords.lng}
          >
            اعمال مختصات
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>انصراف</Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={!location}
          startIcon={<LocationOn />}
        >
          ارسال موقعیت
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationPicker;

