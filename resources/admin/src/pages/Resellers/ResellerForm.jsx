import { useState, useEffect, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from '../../api/client';

const cs = (window.eposAffiliate || {}).currencySymbol || 'RM';

export default function ResellerForm({ reseller, onSaved, onCancel }) {
  const [name, setName] = useState(reseller?.name || '');
  const [prefix, setPrefix] = useState('');
  const [email, setEmail] = useState(reseller?.email || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [previewCode, setPreviewCode] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceRef = useRef(null);

  // Product assignments (edit mode only)
  const [assignments, setAssignments] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addProductId, setAddProductId] = useState('');
  const [addRate, setAddRate] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  const isEdit = !!reseller;

  // Fetch the next code preview when prefix changes
  useEffect(() => {
    if (isEdit) return;

    const cleaned = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleaned) {
      setPreviewCode('');
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const data = await api.get('/resellers/next-code', { prefix: cleaned });
        setPreviewCode(data.code || '');
      } catch {
        setPreviewCode('');
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [prefix, isEdit]);

  // Fetch product assignments and available products (edit mode)
  const fetchAssignments = useCallback(async () => {
    if (!isEdit) return;
    setAssignLoading(true);
    try {
      const data = await api.get('/product-assignments', { reseller_id: reseller.id, bd_id: '' });
      setAssignments(data);
    } catch { /* ignore */ }
    finally { setAssignLoading(false); }
  }, [isEdit, reseller?.id]);

  useEffect(() => {
    if (!isEdit) return;
    fetchAssignments();
    api.get('/product-catalog').then(setProducts).catch(() => {});
  }, [isEdit, fetchAssignments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await api.put(`/resellers/${reseller.id}`, { name, email });
        onSaved();
      } else {
        const created = await api.post('/resellers', { name, prefix, email });
        onSaved(created);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = async () => {
    setAddSaving(true);
    setAddError('');
    try {
      // addProductId is catalog_id now.
      const catalogItem = products.find((p) => String(p.id) === String(addProductId));
      await api.post('/product-assignments', {
        reseller_id: reseller.id,
        catalog_id: addProductId,
        commission_rate: addRate !== '' ? parseFloat(addRate) : (catalogItem?.default_commission || 0),
      });
      setAddDialogOpen(false);
      setAddProductId('');
      setAddRate('');
      fetchAssignments();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddSaving(false);
    }
  };

  const handleRemoveProduct = async (id) => {
    try {
      await api.delete(`/product-assignments/${id}`);
      fetchAssignments();
    } catch { /* ignore */ }
  };

  const handleRowUpdate = async (id, data) => {
    try {
      await api.put(`/product-assignments/${id}`, data);
      fetchAssignments();
    } catch { /* ignore */ }
  };

  // Filter out already-assigned catalog items from the dropdown.
  const assignedCatalogIds = assignments.map((a) => Number(a.catalog_id));
  const availableProducts = products.filter((p) => !assignedCatalogIds.includes(p.id));

  const assignmentColumns = [
    {
      field: 'product_label',
      headerName: 'Label',
      width: 120,
    },
    {
      field: 'wc_product_name',
      headerName: 'Product',
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'commission_rate',
      headerName: `Commission (${cs})`,
      width: 150,
      editable: true,
      type: 'number',
      valueFormatter: (value) => `${cs} ${Number(value).toFixed(2)}`,
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Remove">
          <IconButton size="small" color="error" onClick={() => handleRemoveProduct(params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
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
          {!isEdit && (
            <>
              <TextField
                label="Code Prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                required
                fullWidth
                placeholder="e.g. EPOS, QASHIER"
                helperText="Uppercase letters and numbers only"
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
              {(previewCode || previewLoading) && (
                <TextField
                  label="Reseller Code (auto-generated)"
                  value={previewLoading ? 'Loading...' : previewCode}
                  disabled
                  fullWidth
                  InputProps={{
                    style: { fontWeight: 700, fontFamily: 'monospace', letterSpacing: 2 },
                  }}
                />
              )}
              <TextField
                label="Manager Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                helperText="A login account will be created and credentials sent via email"
              />
            </>
          )}
          {isEdit && (
            <>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
              />
              <TextField
                label="Reseller Code"
                value={reseller.slug?.toUpperCase() || ''}
                disabled
                fullWidth
                helperText="Reseller code cannot be changed"
              />
            </>
          )}
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </Stack>
      </Box>

      {/* Product Assignments — edit mode only */}
      {isEdit && (
        <>
          <Divider sx={{ my: 3 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Assigned Products
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => { setAddDialogOpen(true); setAddError(''); }}
              disabled={availableProducts.length === 0}
            >
              Add Product
            </Button>
          </Stack>

          {assignments.length === 0 && !assignLoading ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No products assigned. This reseller's BDs won't be able to generate QR codes.
            </Alert>
          ) : (
            <DataGrid
              rows={assignments}
              columns={assignmentColumns}
              loading={assignLoading}
              autoHeight
              disableColumnFilter
              disableColumnSorting
              disableColumnMenu
              disableRowSelectionOnClick
              hideFooter
              sx={{ bgcolor: 'background.paper', borderRadius: 2, mb: 1 }}
              getRowId={(row) => row.id}
              processRowUpdate={(newRow, oldRow) => {
                if (newRow.commission_rate !== oldRow.commission_rate) {
                  handleRowUpdate(newRow.id, { commission_rate: parseFloat(newRow.commission_rate) || 0 });
                }
                return newRow;
              }}
              localeText={{ noRowsLabel: 'No products assigned.' }}
            />
          )}

          <Typography variant="caption" color="text.secondary">
            All BDs under this reseller will inherit these products.
          </Typography>
        </>
      )}

      {/* Add Product Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Product</DialogTitle>
        <DialogContent>
          {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Product</InputLabel>
              <Select
                value={addProductId}
                label="Product"
                onChange={(e) => {
                  setAddProductId(e.target.value);
                  // Auto-fill commission from catalog default.
                  const item = products.find((p) => String(p.id) === String(e.target.value));
                  if (item) setAddRate(String(item.default_commission));
                }}
              >
                {availableProducts.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.label} — {p.wc_product_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Commission Amount"
              type="number"
              value={addRate}
              onChange={(e) => setAddRate(e.target.value)}
              fullWidth
              helperText="Leave blank to use catalog default. Override for this reseller if needed."
              InputProps={{
                startAdornment: <InputAdornment position="start">{cs}</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddProduct}
            disabled={addSaving || !addProductId}
          >
            {addSaving ? 'Adding...' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
