import { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/client';
import PageHeader from '../../components/PageHeader';

const cs = (window.eposAffiliate || {}).currencySymbol || 'RM';

export default function ProductCatalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wcProducts, setWcProducts] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formLabel, setFormLabel] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formCommission, setFormCommission] = useState('');
  const [formUsageBonus, setFormUsageBonus] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/product-catalog');
      setItems(data);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    api.get('/product-catalog/wc-products').then(setWcProducts).catch(() => {});
  }, [fetchItems]);

  const openCreate = () => {
    setEditing(null);
    setFormLabel('');
    setFormProductId('');
    setFormCommission('');
    setFormUsageBonus('');
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setFormLabel(item.label);
    setFormProductId(item.wc_product_id);
    setFormCommission(item.default_commission);
    setFormUsageBonus(item.usage_bonus);
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setFormSaving(true);
    setFormError('');
    try {
      if (editing) {
        await api.put(`/product-catalog/${editing.id}`, {
          label: formLabel,
          wc_product_id: formProductId,
          default_commission: parseFloat(formCommission) || 0,
          usage_bonus: parseFloat(formUsageBonus) || 0,
        });
        showSnackbar('Product updated.');
      } else {
        await api.post('/product-catalog', {
          label: formLabel,
          wc_product_id: formProductId,
          default_commission: parseFloat(formCommission) || 0,
          usage_bonus: parseFloat(formUsageBonus) || 0,
        });
        showSnackbar('Product added to catalog.');
      }
      setDialogOpen(false);
      fetchItems();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/product-catalog/${id}`);
      showSnackbar('Product removed.');
      fetchItems();
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  const columns = [
    { field: 'label', headerName: 'Label', width: 140, },
    { field: 'wc_product_name', headerName: 'Product', flex: 1, minWidth: 200, },
    {
      field: 'default_commission',
      headerName: `Sales Commission`,
      width: 150,
      valueFormatter: (value) => `${cs} ${Number(value).toFixed(2)}`,
    },
    {
      field: 'usage_bonus',
      headerName: `Usage Bonus`,
      width: 130,
      valueFormatter: (value) => `${cs} ${Number(value).toFixed(2)}`,
    },
    {
      field: 'wc_product_price',
      headerName: `Price`,
      width: 100,
      valueFormatter: (value) => `${cs} ${Number(value).toFixed(2)}`,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Product Catalog">
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Product
        </Button>
      </PageHeader>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Define the products available in the affiliate program. When assigning products to resellers, you pick from this catalog.
      </Typography>

      <DataGrid
        rows={items}
        columns={columns}
        loading={loading}
        autoHeight
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        sx={{ bgcolor: 'background.paper', borderRadius: 3 }}
        getRowId={(row) => row.id}
        localeText={{ noRowsLabel: 'No products in catalog. Click "Add Product" to get started.' }}
      />

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Product' : 'Add Product to Catalog'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Product Label"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              required
              fullWidth
              placeholder="e.g. A01, Series 1"
              helperText="Short code used across the affiliate system. Must be unique."
            />
            <FormControl fullWidth required>
              <InputLabel>Product</InputLabel>
              <Select
                value={formProductId}
                label="Product"
                onChange={(e) => setFormProductId(e.target.value)}
              >
                {wcProducts.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name} ({cs} {Number(p.price).toFixed(2)})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Sales Commission"
              type="number"
              value={formCommission}
              onChange={(e) => setFormCommission(e.target.value)}
              required
              fullWidth
              helperText="Fixed amount per order. Can be overridden per reseller."
              InputProps={{
                startAdornment: <InputAdornment position="start">{cs}</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Usage Bonus"
              type="number"
              value={formUsageBonus}
              onChange={(e) => setFormUsageBonus(e.target.value)}
              fullWidth
              helperText="Fixed bonus per device when usage is confirmed. Set 0 if not applicable."
              InputProps={{
                startAdornment: <InputAdornment position="start">{cs}</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={formSaving || !formLabel || !formProductId}
          >
            {formSaving ? 'Saving...' : editing ? 'Update' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>

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
