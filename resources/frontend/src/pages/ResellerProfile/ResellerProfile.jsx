import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import api from '../../api/client';
import ProfileForm from '../../components/ProfileForm';

export default function ResellerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    api.get('/profile')
      .then(setProfile)
      .catch((err) => showSnackbar(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const updated = await api.put('/profile', formData);
      setProfile(updated);
      showSnackbar('Profile saved successfully.');
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const result = await api.uploadFile('/profile/photo', formData);
      setProfile((prev) => ({ ...prev, profile_photo_url: result.profile_photo_url }));
      showSnackbar('Photo updated.');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  if (!profile) {
    return <Alert severity="error">Failed to load profile.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Typography variant="h5">Reseller Profile</Typography>
        {profile.reseller_slug && (
          <Chip label={profile.reseller_slug} size="small" variant="outlined" />
        )}
        {profile.reseller_status && (
          <Chip
            label={profile.reseller_status}
            size="small"
            color={profile.reseller_status === 'active' ? 'success' : 'error'}
            variant="outlined"
          />
        )}
      </Box>

      <ProfileForm
        profile={profile}
        onSave={handleSave}
        saving={saving}
        onPhotoUpload={handlePhotoUpload}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
