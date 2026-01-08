import { Card, CardContent, List, ListItem, ListItemText, Chip, Divider, Typography } from '@mui/material';

export const ProfileSettingsTab = ({ user }) => {
  if (!user) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>تنظیمات</Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="وضعیت آنلاین"
              secondary={user.isOnline ? 'فعال' : 'غیرفعال'}
            />
            <Chip label={user.isOnline ? 'آنلاین' : 'آفلاین'} color={user.isOnline ? 'success' : 'default'} size="small" />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="وضعیت حساب"
              secondary={user.verified ? 'تایید شده' : 'تایید نشده'}
            />
            {user.verified && <Chip label="تایید شده" color="primary" size="small" />}
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="نوع حساب"
              secondary={user.premium ? 'ویژه' : 'عادی'}
            />
            {user.premium && <Chip label="ویژه" color="warning" size="small" />}
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="زبان"
              secondary={user.preferences?.language || 'فارسی'}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="تم"
              secondary={user.preferences?.theme === 'dark' ? 'تاریک' : 'روشن'}
            />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
};

