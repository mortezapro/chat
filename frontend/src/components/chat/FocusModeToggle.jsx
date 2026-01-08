import { useState, useEffect } from 'react';
import { Tooltip, Switch, FormControlLabel } from '@mui/material';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const FocusModeToggle = ({ onToggle }) => {
  const { user } = useAuthStore();
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    if (user?.preferences?.focusMode !== undefined) {
      setFocusMode(user.preferences.focusMode);
    }
  }, [user]);

  const handleToggle = async (event) => {
    const newValue = event.target.checked;
    setFocusMode(newValue);
    
    try {
      await api.put('/users/preferences', { focusMode: newValue });
      if (onToggle) {
        onToggle(newValue);
      }
    } catch (error) {
      console.error('Error updating focus mode:', error);
      setFocusMode(!newValue);
    }
  };

  return (
    <Tooltip title="حالت تمرکز">
      <FormControlLabel
        control={
          <Switch
            checked={focusMode}
            onChange={handleToggle}
            size="small"
          />
        }
        label="حالت تمرکز"
        sx={{ m: 0 }}
      />
    </Tooltip>
  );
};

export default FocusModeToggle;


