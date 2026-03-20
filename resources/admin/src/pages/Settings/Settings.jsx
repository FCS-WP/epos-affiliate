import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../api/client';
import PageHeader from '../../components/PageHeader';

export default function Settings() {
  const [settings, setSettings] = useState({ product_id: 2174, sales_commission_rate: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    api.get('/settings')
      .then((data) => setSettings(data))
      .catch((err) => setSnackbar({ open: true, message: err.message, severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      setSnackbar({ open: true, message: 'Settings saved.', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <>
      <PageHeader title="Settings" />

      <Paper sx={{ maxWidth: 600, p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <div>
              <Typography variant="subtitle2" gutterBottom>Product Configuration</Typography>
              <TextField
                label="BlueTap Product ID"
                type="number"
                value={settings.product_id}
                onChange={(e) => handleChange('product_id', parseInt(e.target.value, 10))}
                required
                fullWidth
                helperText="WooCommerce product ID for BlueTap (default: 2174)"
                inputProps={{ min: 1 }}
              />
            </div>

            <div>
              <Typography variant="subtitle2" gutterBottom>Commission</Typography>
              <TextField
                label="Sales Commission Rate"
                type="number"
                value={settings.sales_commission_rate}
                onChange={(e) => handleChange('sales_commission_rate', parseFloat(e.target.value))}
                required
                fullWidth
                helperText="Percentage of order total (net of tax/shipping) paid as sales commission"
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </div>

            <Stack direction="row" justifyContent="flex-end">
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

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
    </>
  );
}
