import { Card, CardContent, List, ListItem, ListItemText, Chip, Divider, Typography } from '@mui/material';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';

export const ProfileSecurityTab = ({ user }) => {
  if (!user) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>امنیت</Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="احراز هویت دو مرحله‌ای"
              secondary={user.twoFactorAuth?.enabled ? 'فعال' : 'غیرفعال'}
            />
            <Chip
              label={user.twoFactorAuth?.enabled ? 'فعال' : 'غیرفعال'}
              color={user.twoFactorAuth?.enabled ? 'success' : 'default'}
              size="small"
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="آخرین ورود"
              secondary={user.lastLogin ? format(new Date(user.lastLogin), 'dd MMMM yyyy HH:mm', { locale: faIR }) : 'نامشخص'}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="آدرس IP آخرین ورود"
              secondary={user.lastLoginIP || 'نامشخص'}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="دستگاه آخرین ورود"
              secondary={user.lastLoginDevice || 'نامشخص'}
            />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
};

