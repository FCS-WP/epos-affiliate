import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import api from '../../api/client';

export default function ResellerForm({ reseller, onSaved, onCancel }) {
  const [name, setName] = useState(reseller?.name || '');
  const [slug, setSlug] = useState(reseller?.slug || '');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = !!reseller;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, slug };
      if (!isEdit) payload.email = email;
      if (isEdit) {
        await api.put(`/resellers/${reseller.id}`, payload);
      } else {
        await api.post('/resellers', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack spacing={2.5}>
        <TextField
          label="Reseller Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          fullWidth
          helperText="Lowercase letters, numbers, and hyphens only"
          inputProps={{ pattern: '[a-z0-9\\-]+' }}
        />
        {!isEdit && (
          <TextField
            label="Manager Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            helperText="A WordPress user with reseller_manager role will be created"
          />
        )}
      </Stack>

      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
        </Button>
      </Stack>
    </Box>
  );
}
