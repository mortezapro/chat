import { Card, CardContent, Grid, Paper, Typography } from '@mui/material';

export const ProfileActivityTab = ({ user }) => {
  if (!user) return null;

  const activities = [
    { label: 'پیام ارسال شده', value: user.messageCount || 0, color: 'primary' },
    { label: 'گروه عضو', value: user.groupCount || 0, color: 'secondary' },
    { label: 'دوستان', value: user.friendCount || 0, color: 'success' },
    { label: 'کانال عضو', value: user.channelCount || 0, color: 'info' },
    { label: 'واکنش داده شده', value: user.reactionCount || 0, color: 'warning' },
    { label: 'فایل ارسال شده', value: user.fileCount || 0, color: 'error' }
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>فعالیت‌ها</Typography>
        <Grid container spacing={3}>
          {activities.map((activity, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: `${activity.color}.light`, color: `${activity.color}.contrastText` }}>
                <Typography variant="h4" fontWeight="bold">
                  {activity.value}
                </Typography>
                <Typography variant="body2">{activity.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

