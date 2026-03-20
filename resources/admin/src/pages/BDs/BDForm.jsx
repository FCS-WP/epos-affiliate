import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import api from '../../api/client';

export default function BDForm({ bd, resellers, onSaved, onCancel }) {
  const [name, setName] = useState(bd?.name || '');
  const [email, setEmail] = useState('');
  const [resellerId, setResellerId] = useState(bd?.reseller_id || (resellers[0]?.id ?? ''));
  const [bdCode, setBdCode] = useState(bd?.bd_code || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = !!bd;
  const selectedReseller = resellers.find((r) => String(r.id) === String(resellerId));
  const trackingPreview = selectedReseller && bdCode
    ? `BD-${selectedReseller.slug?.toUpperCase()}-${bdCode}`
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, reseller_id: resellerId, bd_code: bdCode };
      if (!isEdit) payload.email = email;
      if (isEdit) {
        await api.put(`/bds/${bd.id}`, payload);
      } else {
        await api.post('/bds', payload);
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
          label="BD Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
        />
        {!isEdit && (
          <TextField
            label="BD Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            helperText="A WordPress user with bd_agent role will be created"
          />
        )}
        <FormControl fullWidth required>
          <InputLabel>Reseller</InputLabel>
          <Select
            value={resellerId}
            label="Reseller"
            onChange={(e) => setResellerId(e.target.value)}
            disabled={isEdit}
          >
            {resellers.map((r) => (
              <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="BD Code"
          value={bdCode}
          onChange={(e) => setBdCode(e.target.value.toUpperCase())}
          required
          fullWidth
          disabled={isEdit}
          placeholder="JS001"
          helperText="Uppercase letters and numbers only"
          inputProps={{ pattern: '[A-Z0-9]+' }}
        />
        {!isEdit && trackingPreview && (
          <Alert severity="info" icon={false}>
            <Typography variant="body2">
              Tracking code: <strong>{trackingPreview}</strong>
            </Typography>
          </Alert>
        )}
      </Stack>

      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Update' : 'Create BD'}
        </Button>
      </Stack>
    </Box>
  );
}
