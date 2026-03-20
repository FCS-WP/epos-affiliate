import { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import SaveIcon from '@mui/icons-material/Save';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

export default function ProfileForm({ profile, onSave, saving, onPhotoUpload }) {
  const [form, setForm] = useState({
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    address_line_1: profile.address_line_1 || '',
    address_line_2: profile.address_line_2 || '',
    city: profile.city || '',
    state: profile.state || '',
    postcode: profile.postcode || '',
    bank_name: profile.bank_name || '',
    bank_account_number: profile.bank_account_number || '',
    bank_account_holder: profile.bank_account_holder || '',
  });
  const fileInputRef = useRef(null);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onPhotoUpload(file);
  };

  const photoUrl = profile.profile_photo_url || profile.avatar_url;

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Avatar Section */}
      <Paper sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={photoUrl}
            sx={{ width: 80, height: 80, fontSize: 32 }}
          >
            {profile.name?.[0]?.toUpperCase()}
          </Avatar>
          <IconButton
            size="small"
            onClick={handlePhotoClick}
            sx={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              width: 28,
              height: 28,
            }}
          >
            <CameraAltIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
        </Box>
        <div>
          <Typography variant="h6">{profile.name}</Typography>
          <Typography variant="body2" color="text.secondary">{profile.email}</Typography>
        </div>
      </Paper>

      {/* Personal Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Personal Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Name" value={form.name} onChange={handleChange('name')} fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Email" type="email" value={form.email} onChange={handleChange('email')} fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Phone" value={form.phone} onChange={handleChange('phone')} fullWidth />
          </Grid>
        </Grid>
      </Paper>

      {/* Address */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Address
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Address Line 1" value={form.address_line_1} onChange={handleChange('address_line_1')} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Address Line 2" value={form.address_line_2} onChange={handleChange('address_line_2')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="City" value={form.city} onChange={handleChange('city')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="State" value={form.state} onChange={handleChange('state')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Postcode" value={form.postcode} onChange={handleChange('postcode')} fullWidth />
          </Grid>
        </Grid>
      </Paper>

      {/* Bank Details */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Bank Details (for Payout)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Bank Name" value={form.bank_name} onChange={handleChange('bank_name')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Account Number" value={form.bank_account_number} onChange={handleChange('bank_account_number')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Account Holder Name" value={form.bank_account_holder} onChange={handleChange('bank_account_holder')} fullWidth />
          </Grid>
        </Grid>
      </Paper>

      <Stack direction="row" justifyContent="flex-end">
        <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </Stack>
    </Box>
  );
}
