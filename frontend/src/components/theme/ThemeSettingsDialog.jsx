import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  IconButton,
  Grid,
  Paper
} from '@mui/material';
import { Close, ColorLens, Wallpaper, Brightness4, Brightness7 } from '@mui/icons-material';
import { useThemeSettings } from './ThemeProvider';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const ThemeSettingsDialog = ({ open, onClose }) => {
  const { themeMode, primaryColor, chatBackground, updateTheme } = useThemeSettings();
  const { user } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState(themeMode);
  const [selectedColor, setSelectedColor] = useState(primaryColor);
  const [selectedBackground, setSelectedBackground] = useState(chatBackground);
  const [customColor, setCustomColor] = useState(primaryColor);

  const predefinedColors = [
    '#1976d2', '#2e7d32', '#ed6c02', '#d32f2f',
    '#9c27b0', '#0288d1', '#00796b', '#f57c00',
    '#c2185b', '#5d4037', '#455a64', '#7b1fa2'
  ];

  const predefinedBackgrounds = [
    null,
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
  ];

  const handleSave = async () => {
    await updateTheme({
      theme: selectedTheme,
      primaryColor: selectedColor,
      chatBackground: selectedBackground
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">تنظیمات تم و ظاهر</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab icon={<Brightness7 />} label="تم" />
          <Tab icon={<ColorLens />} label="رنگ" />
          <Tab icon={<Wallpaper />} label="پس‌زمینه" />
        </Tabs>

        {tabValue === 0 && (
          <FormControl component="fieldset">
            <FormLabel component="legend">انتخاب تم</FormLabel>
            <RadioGroup
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
            >
              <FormControlLabel
                value="light"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Brightness7 />
                    <Typography>روشن</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="dark"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Brightness4 />
                    <Typography>تاریک</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="auto"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Brightness7 />
                    <Brightness4 />
                    <Typography>خودکار (بر اساس سیستم)</Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>رنگ اصلی</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {predefinedColors.map((color) => (
                <Grid item xs={3} sm={2} key={color}>
                  <Paper
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: color,
                      cursor: 'pointer',
                      border: selectedColor === color ? '3px solid' : 'none',
                      borderColor: selectedColor === color ? 'primary.main' : 'transparent',
                      '&:hover': {
                        opacity: 0.8
                      }
                    }}
                    onClick={() => setSelectedColor(color)}
                  />
                </Grid>
              ))}
            </Grid>
            <TextField
              label="رنگ سفارشی"
              type="color"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                setSelectedColor(e.target.value);
              }}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>پس‌زمینه چت</Typography>
            <Grid container spacing={2}>
              {predefinedBackgrounds.map((bg, index) => (
                <Grid item xs={6} sm={4} key={index}>
                  <Paper
                    sx={{
                      aspectRatio: '16/9',
                      cursor: 'pointer',
                      border: selectedBackground === bg ? '3px solid' : '1px solid',
                      borderColor: selectedBackground === bg ? 'primary.main' : 'divider',
                      bgcolor: bg || 'background.paper',
                      background: bg || 'background.paper',
                      '&:hover': {
                        opacity: 0.8
                      }
                    }}
                    onClick={() => setSelectedBackground(bg)}
                  >
                    {!bg && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography variant="caption">پیش‌فرض</Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>انصراف</Button>
        <Button onClick={handleSave} variant="contained">
          ذخیره
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ThemeSettingsDialog;

