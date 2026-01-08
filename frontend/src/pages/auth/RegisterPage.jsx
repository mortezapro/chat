import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert
} from '@mui/material';
import { useAuthStore } from '@/stores/authStore';

const RegisterPage = () => {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!formData.username || formData.username.length < 3) {
      setError('نام کاربری باید حداقل ۳ کاراکتر باشد');
      return false;
    }
    if (!formData.email) {
      setError('ایمیل الزامی است');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');

    const result = await register(formData);
    
    setLoading(false);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          ثبت‌نام
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="نام کاربری"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="username"
          />

          <TextField
            fullWidth
            label="ایمیل"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="نام"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="نام خانوادگی"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="رمز عبور"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
          </Button>

          <Box textAlign="center">
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary">
                قبلاً ثبت‌نام کرده‌اید؟ وارد شوید
              </Typography>
            </Link>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RegisterPage;






