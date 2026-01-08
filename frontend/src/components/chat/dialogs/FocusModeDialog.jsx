import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import FocusModeToggle from '../FocusModeToggle';

const FocusModeDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>تنظیمات حالت تمرکز</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            با فعال‌سازی حالت تمرکز، پیام‌های غیرضروری فیلتر می‌شوند و فقط پیام‌های مهم نمایش داده می‌شوند.
          </Typography>
          <FocusModeToggle onToggle={() => {}} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>بستن</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FocusModeDialog;

