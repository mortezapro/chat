import { Card, CardContent, Grid, Box, Typography } from '@mui/material';
import { PhotoLibrary } from '@mui/icons-material';

export const ProfileMediaTab = ({ sharedMedia }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PhotoLibrary color="primary" />
          <Typography variant="h6">رسانه‌های اشتراکی</Typography>
        </Box>
        <Grid container spacing={2}>
          {sharedMedia.length > 0 ? (
            sharedMedia.map((media, index) => (
              <Grid item xs={4} sm={3} key={index}>
                <Box
                  component="img"
                  src={media.url}
                  alt="media"
                  sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 2, cursor: 'pointer' }}
                />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                هنوز رسانه‌ای اشتراک گذاشته نشده
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

