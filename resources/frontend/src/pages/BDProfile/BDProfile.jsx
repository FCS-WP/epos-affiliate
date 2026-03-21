import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import QrCodeIcon from '@mui/icons-material/QrCode';
import api from '../../api/client';
import ProfileForm from '../../components/ProfileForm';

export default function BDProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const qrRef = useRef(null);

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profile.qr_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showSnackbar('Failed to copy link.', 'error');
    }
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 0, 0, 400, 400);
      const link = document.createElement('a');
      link.download = `qr-${profile.tracking_code}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  if (!profile) {
    return <Alert severity="error">Failed to load profile.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Typography variant="h5">BD Profile</Typography>
        {profile.tracking_code && (
          <Chip label={profile.tracking_code} color="primary" size="small" variant="outlined" />
        )}
        {profile.bd_status && (
          <Chip
            label={profile.bd_status}
            size="small"
            color={profile.bd_status === 'active' ? 'success' : 'error'}
            variant="outlined"
          />
        )}
      </Box>

      {/* QR Code Section */}
      {profile.qr_url && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
            {/* QR Code */}
            <Box
              ref={qrRef}
              sx={{
                p: 2,
                bgcolor: 'white',
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <QRCode value={profile.qr_url} size={200} />
              <Typography variant="caption" sx={{ mt: 1 }} color="text.secondary">
                {profile.tracking_code}
              </Typography>
            </Box>

            {/* QR Info & Actions */}
            <Box sx={{ flex: 1, width: '100%' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <QrCodeIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Your QR Code
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Share this QR code with customers. When scanned, it takes them directly to checkout with your tracking code applied.
              </Typography>

              <TextField
                label="Share Link"
                value={profile.qr_url}
                fullWidth
                size="small"
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                        <IconButton size="small" onClick={handleCopyLink}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadQR}
              >
                Download QR as PNG
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Profile Form */}
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
