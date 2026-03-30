import { useState, useEffect, useCallback, useRef } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InventoryIcon from '@mui/icons-material/Inventory';
import dayjs from 'dayjs';
import api from '../../api/client';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';

const config = window.eposAffiliate || {};
const cs = config.currencySymbol || 'RM';

export default function SerialNumberList() {
  const theme = useTheme();
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchSerials = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await api.get('/serial-numbers', params);
      setSerials(data);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchSerials(); }, [fetchSerials]);

  const handleDelete = async (id, serialNumber) => {
    if (!window.confirm(`Remove serial number "${serialNumber}"?`)) return;
    try {
      await api.delete(`/serial-numbers/${id}`);
      setSnackbar({ open: true, message: 'Serial number removed.', severity: 'success' });
      fetchSerials();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  };

  const columns = [
    {
      field: 'order_id',
      headerName: 'ORDER ID',
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'serial_number',
      headerName: 'SERIAL NUMBER',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'bd_name',
      headerName: 'BD AGENT',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'reseller_name',
      headerName: 'RESELLER',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'status',
      headerName: 'STATUS',
      width: 120,
      renderCell: (params) => {
        const colors = {
          assigned: { bg: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main },
          activated: { bg: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main },
          returned: { bg: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main },
        };
        const c = colors[params.value] || colors.assigned;
        return (
          <Chip
            label={params.value}
            size="small"
            sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'capitalize', backgroundColor: c.bg, color: c.color }}
          />
        );
      },
    },
    {
      field: 'source',
      headerName: 'SOURCE',
      width: 90,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 500, fontSize: '0.65rem', textTransform: 'uppercase' }}
        />
      ),
    },
    {
      field: 'assigned_at',
      headerName: 'ASSIGNED',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
          {params.value ? dayjs(params.value).format('MMM DD, YYYY') : '-'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Remove">
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id, params.row.serial_number)}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Serial Numbers" subtitle="Manage device serial numbers for attributed orders">
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Assign Serial Number
        </Button>
      </PageHeader>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by SN or Order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: '1 1 250px', maxWidth: 350 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="assigned">Assigned</MenuItem>
            <MenuItem value="activated">Activated</MenuItem>
            <MenuItem value="returned">Returned</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Data Grid */}
      <DataGrid
        rows={serials}
        columns={columns}
        autoHeight
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        loading={loading}
        getRowId={(row) => row.id}
        localeText={{ noRowsLabel: 'No serial numbers assigned yet.' }}
        rowHeight={52}
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
        }}
      />

      {/* Assign Dialog */}
      <AssignDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          setDialogOpen(false);
          fetchSerials();
          setSnackbar({ open: true, message: 'Serial number assigned successfully.', severity: 'success' });
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

/* ── Assign Serial Number Dialog ── */
function AssignDialog({ open, onClose, onSuccess }) {
  const theme = useTheme();
  const [orderId, setOrderId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [orderInfo, setOrderInfo] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [snCheck, setSnCheck] = useState(null); // null | 'checking' | 'available' | 'exists'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setOrderId('');
      setSerialNumber('');
      setOrderInfo(null);
      setOrderError('');
      setSnCheck(null);
      setError('');
    }
  }, [open]);

  // Lookup order info
  const lookupOrder = async () => {
    if (!orderId) return;
    setOrderLoading(true);
    setOrderError('');
    setOrderInfo(null);
    try {
      const data = await api.get(`/serial-numbers/order/${orderId}`);
      if (data.order_status !== 'processing') {
        setOrderError(`Order status is "${data.order_status}". Only "processing" orders can have serial numbers assigned.`);
      } else if (data.remaining <= 0) {
        setOrderError(`All ${data.total_qty} unit(s) already have serial numbers assigned.`);
      } else {
        setOrderInfo(data);
      }
    } catch (err) {
      setOrderError(err.message || 'Order not found.');
    } finally {
      setOrderLoading(false);
    }
  };

  // Debounced SN uniqueness check
  useEffect(() => {
    if (!serialNumber || serialNumber.length < 2) {
      setSnCheck(null);
      return;
    }
    setSnCheck('checking');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.get(`/serial-numbers/check/${encodeURIComponent(serialNumber)}`);
        setSnCheck(data.exists ? 'exists' : 'available');
      } catch {
        setSnCheck(null);
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [serialNumber]);

  const canSubmit = orderInfo && serialNumber.trim() && snCheck === 'available' && !submitting && orderInfo.remaining > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/serial-numbers', {
        order_id: parseInt(orderId),
        serial_number: serialNumber.trim(),
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon color="primary" />
          Assign Serial Number
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Order Lookup */}
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>1. Look up Order</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            label="Order ID"
            value={orderId}
            onChange={(e) => { setOrderId(e.target.value); setOrderInfo(null); setOrderError(''); }}
            size="small"
            type="number"
            sx={{ flex: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && lookupOrder()}
          />
          <Button variant="outlined" onClick={lookupOrder} disabled={!orderId || orderLoading}>
            {orderLoading ? <CircularProgress size={20} /> : 'Look Up'}
          </Button>
        </Box>

        {orderError && <Alert severity="error" sx={{ mb: 2 }}>{orderError}</Alert>}

        {orderInfo && (
          <Paper
            variant="outlined"
            sx={{
              p: 2, mb: 3,
              backgroundColor: alpha(theme.palette.secondary.main, 0.04),
              borderColor: alpha(theme.palette.secondary.main, 0.2),
            }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Order</Typography>
                <Typography variant="body2" fontWeight={700}>#{orderInfo.order_id}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Status</Typography>
                <Typography variant="body2">
                  <Chip label={orderInfo.order_status} size="small" color="success" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Value</Typography>
                <Typography variant="body2" fontWeight={600}>{cs} {Number(orderInfo.order_total).toFixed(2)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Units</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {orderInfo.assigned_count} / {orderInfo.total_qty} assigned
                  {orderInfo.remaining > 0 && (
                    <Typography component="span" color="secondary.main" sx={{ ml: 0.5 }}>
                      ({orderInfo.remaining} remaining)
                    </Typography>
                  )}
                </Typography>
              </Box>
              {orderInfo.bd_name && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>BD Agent</Typography>
                  <Typography variant="body2">{orderInfo.bd_name}</Typography>
                </Box>
              )}
              {orderInfo.reseller_name && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Reseller</Typography>
                  <Typography variant="body2">{orderInfo.reseller_name}</Typography>
                </Box>
              )}
            </Box>

            {/* Already assigned SNs */}
            {orderInfo.serial_numbers?.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Already Assigned:</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {orderInfo.serial_numbers.map((sn) => (
                    <Chip key={sn.id} label={sn.serial_number} size="small" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }} />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        )}

        {/* Serial Number Input */}
        {orderInfo && orderInfo.remaining > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>2. Enter Serial Number</Typography>
            <TextField
              label="Serial Number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              size="small"
              fullWidth
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {snCheck === 'checking' && <CircularProgress size={18} />}
                    {snCheck === 'available' && <CheckCircleIcon sx={{ color: 'secondary.main' }} />}
                    {snCheck === 'exists' && <ErrorIcon color="error" />}
                  </InputAdornment>
                ),
              }}
              helperText={
                snCheck === 'available' ? 'Serial number is available.' :
                snCheck === 'exists' ? 'This serial number is already assigned to another order.' :
                'Enter a unique serial number for this device.'
              }
              error={snCheck === 'exists'}
              color={snCheck === 'available' ? 'success' : undefined}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? <CircularProgress size={20} /> : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
