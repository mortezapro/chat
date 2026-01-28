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
  Stepper,
  Step,
  StepLabel,
  Alert,
  Grid
} from '@mui/material';
import api from '@/services/api';

const TwoFactorAuthDialog = ({ open, onClose, enabled, onToggle }) => {
  const [step, setStep] = useState(0);
  const [secret, setSecret] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && !enabled) {
      enable2FA();
    }
  }, [open, enabled]);

  const enable2FA = async () => {
    try {
      const response = await api.post('/auth/2fa/enable');
      setSecret(response.data.secret);
      setQrCode(response.data.qrCode);
      setStep(1);
    } catch (error) {
      setError('خطا در فعال‌سازی 2FA');
    }
  };

  const verify2FA = async () => {
    try {
      const response = await api.post('/auth/2fa/verify', { token });
      setBackupCodes(response.data.backupCodes);
      setStep(2);
      if (onToggle) {
        onToggle(true);
      }
    } catch (error) {
      setError('کد نامعتبر است');
    }
  };

  const disable2FA = async () => {
    try {
      await api.post('/auth/2fa/disable', { password });
      if (onToggle) {
        onToggle(false);
      }
      onClose();
    } catch (error) {
      setError('رمز عبور اشتباه است');
    }
  };

  const handleClose = () => {
    setStep(0);
    setToken('');
    setPassword('');
    setError('');
    setSecret(null);
    setQrCode(null);
    setBackupCodes([]);
    onClose();
  };

  if (enabled) {
    return (
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>غیرفعال کردن 2FA</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            برای غیرفعال کردن احراز هویت دو مرحله‌ای، رمز عبور خود را وارد کنید.
          </Alert>
          <TextField
            fullWidth
            type="password"
            label="رمز عبور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mt: 2 }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>انصراف</Button>
          <Button onClick={disable2FA} variant="contained" color="error">
            غیرفعال کردن
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>فعال‌سازی احراز هویت دو مرحله‌ای</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          <Step>
            <StepLabel>اسکن QR</StepLabel>
          </Step>
          <Step>
            <StepLabel>تایید</StepLabel>
          </Step>
          <Step>
            <StepLabel>کدهای پشتیبان</StepLabel>
          </Step>
        </Stepper>

        {step === 1 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              QR Code را با اپلیکیشن احراز هویت خود اسکن کنید:
            </Typography>
            {qrCode && (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Box
                  component="img"
                  src={qrCode}
                  alt="QR Code"
                  sx={{ maxWidth: '100%', height: 'auto' }}
                />
              </Box>
            )}
            <TextField
              fullWidth
              label="کد 6 رقمی"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              inputProps={{ maxLength: 6 }}
              sx={{ mb: 2 }}
            />
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              fullWidth
              variant="contained"
              onClick={verify2FA}
              disabled={token.length !== 6}
            >
              تایید
            </Button>
          </Box>
        )}

        {step === 2 && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              احراز هویت دو مرحله‌ای با موفقیت فعال شد!
            </Alert>
            <Typography variant="body2" sx={{ mb: 2 }}>
              کدهای پشتیبان زیر را در جای امنی نگه دارید:
            </Typography>
            <Grid container spacing={1}>
              {backupCodes.map((code, index) => (
                <Grid item xs={6} key={index}>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      textAlign: 'center',
                      fontFamily: 'monospace'
                    }}
                  >
                    {code}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          {step === 2 ? 'بستن' : 'انصراف'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TwoFactorAuthDialog;







