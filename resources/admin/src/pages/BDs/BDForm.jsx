import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import api from '../../api/client';

export default function BDForm({ bd, resellers, onSaved, onCancel }) {
  const [name, setName] = useState(bd?.name || '');
  const [email, setEmail] = useState('');
  const [resellerId, setResellerId] = useState(bd?.reseller_id || (resellers[0]?.id ?? ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [previewCode, setPreviewCode] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const isEdit = !!bd;

  // Fetch next tracking code when reseller changes
  useEffect(() => {
    if (isEdit || !resellerId) {
      setPreviewCode('');
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    api.get('/bds/next-code', { reseller_id: resellerId })
      .then((data) => { if (!cancelled) setPreviewCode(data.code || ''); })
      .catch(() => { if (!cancelled) setPreviewCode(''); })
      .finally(() => { if (!cancelled) setPreviewLoading(false); });

    return () => { cancelled = true; };
  }, [resellerId, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await api.put(`/bds/${bd.id}`, { name });
      } else {
        await api.post('/bds', { name, reseller_id: resellerId, email });
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
            helperText="A login account will be created and credentials sent via email"
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
              <MenuItem key={r.id} value={r.id}>
                {r.name} ({(r.slug || '').toUpperCase()})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {!isEdit && (previewCode || previewLoading) && (
          <TextField
            label="Tracking Code (auto-generated)"
            value={previewLoading ? 'Loading...' : previewCode}
            disabled
            fullWidth
            InputProps={{
              style: { fontWeight: 700, fontFamily: 'monospace', letterSpacing: 2 },
            }}
          />
        )}
        {isEdit && (
          <TextField
            label="Tracking Code"
            value={bd.tracking_code || ''}
            disabled
            fullWidth
            helperText="Tracking code cannot be changed"
          />
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
