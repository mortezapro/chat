import { Card, CardContent, Grid, Box, Typography, Chip } from '@mui/material';
import { Email, Phone, LocationOn, Language, CalendarToday, Person, VerifiedUser } from '@mui/icons-material';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { useAuthStore } from '@/stores/authStore';

export const ProfileInfoTab = ({ user }) => {
  const { user: currentUser } = useAuthStore();
  if (!user) return null;

  const isOwnProfile = user._id === currentUser?.id;
  const showEmail = isOwnProfile || user.privacySettings?.showEmail !== false;
  const showPhone = isOwnProfile || user.privacySettings?.showPhone !== false;
  const showLastSeen = isOwnProfile || user.privacySettings?.showLastSeen !== false;

  return (
    <Card>
      <CardContent>
        <Grid container spacing={3}>
          {showEmail && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Email color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">ایمیل</Typography>
                  <Typography variant="body1">{user.email}</Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {showPhone && user.phoneNumber && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Phone color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">شماره تماس</Typography>
                  <Typography variant="body1">{user.phoneNumber}</Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {user.location && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <LocationOn color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">موقعیت</Typography>
                  <Typography variant="body1">{user.location}</Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {user.website && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Language color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">وبسایت</Typography>
                  <Typography variant="body1" component="a" href={user.website} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none', color: 'primary.main' }}>
                    {user.website}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Person color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">نام کاربری</Typography>
                <Typography variant="body1">@{user.username}</Typography>
              </Box>
            </Box>
          </Grid>

          {user.firstName || user.lastName ? (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Person color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">نام کامل</Typography>
                  <Typography variant="body1">
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.lastName}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ) : null}

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <CalendarToday color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">عضویت از</Typography>
                <Typography variant="body1">
                  {format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: faIR })}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {showLastSeen && user.lastSeen && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <CalendarToday color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">آخرین بازدید</Typography>
                  <Typography variant="body1">
                    {format(new Date(user.lastSeen), 'dd MMMM yyyy HH:mm', { locale: faIR })}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {user.bio && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                <Person color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">درباره</Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>{user.bio}</Typography>
                </Box>
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {user.verified && (
                <Chip icon={<VerifiedUser />} label="حساب تایید شده" color="primary" size="small" />
              )}
              {user.premium && (
                <Chip label="کاربر ویژه" color="warning" size="small" />
              )}
              {user.isOnline && (
                <Chip label="آنلاین" color="success" size="small" />
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

