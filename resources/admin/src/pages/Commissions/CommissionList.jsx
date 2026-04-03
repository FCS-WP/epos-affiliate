import { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaidIcon from '@mui/icons-material/Paid';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '../../api/client';
import StatusChip from '../../components/StatusChip';
import PageHeader from '../../components/PageHeader';

const cs = (window.eposAffiliate || {}).currencySymbol || 'RM';

export default function CommissionList() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selected, setSelected] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '', ids: [], row: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      const data = await api.get('/commissions', params);
      setCommissions(data);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  useEffect(() => { fetchCommissions(); }, [fetchCommissions]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const openConfirm = (action, ids, row = null) => {
    setConfirmDialog({ open: true, action, ids, row });
  };

  const closeConfirm = () => {
    setConfirmDialog({ open: false, action: '', ids: [], row: null });
  };

  const handleConfirm = async () => {
    const { action, ids } = confirmDialog;
    setActionLoading(true);
    try {
      if (ids.length === 1) {
        await api.put(`/commissions/${ids[0]}`, { status: action });
        showSnackbar(`Commission #${ids[0]} marked as ${action}.`);
      } else {
        await api.post('/commissions/bulk', { ids, status: action });
        showSnackbar(`${ids.length} commission(s) marked as ${action}.`);
        setSelected([]);
      }
      fetchCommissions();
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setActionLoading(false);
      closeConfirm();
    }
  };

  const dialogConfig = {
    approved: {
      title: 'Approve Commission',
      color: 'primary',
      icon: <CheckCircleIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      getText: (ids, row) => ids.length === 1
        ? `Are you sure you want to approve commission #${ids[0]}${row ? ` (${cs}${Number(row.amount).toFixed(2)} for ${row.bd_name})` : ''}?`
        : `Are you sure you want to approve ${ids.length} selected commission(s)?`,
      confirmLabel: 'Approve',
    },
    paid: {
      title: 'Mark as Paid',
      color: 'success',
      icon: <PaidIcon sx={{ fontSize: 48, color: 'success.main' }} />,
      getText: (ids, row) => ids.length === 1
        ? `Are you sure you want to mark commission #${ids[0]}${row ? ` (${cs}${Number(row.amount).toFixed(2)} for ${row.bd_name})` : ''} as paid?`
        : `Are you sure you want to mark ${ids.length} selected commission(s) as paid?`,
      confirmLabel: 'Mark Paid',
    },
    voided: {
      title: 'Void Commission',
      color: 'error',
      icon: <WarningAmberIcon sx={{ fontSize: 48, color: 'error.main' }} />,
      getText: (ids, row) => ids.length === 1
        ? `Are you sure you want to void commission #${ids[0]}${row ? ` (${cs}${Number(row.amount).toFixed(2)} for ${row.bd_name})` : ''}? This action cannot be undone.`
        : `Are you sure you want to void ${ids.length} selected commission(s)? This action cannot be undone.`,
      confirmLabel: 'Void',
    },
  };

  const handleExport = () => {
    const params = {};
    if (filterStatus) params.status = filterStatus;
    if (filterType) params.type = filterType;
    api.download('/export/commissions', params, 'commissions.csv');
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'bd_name', headerName: 'BD', flex: 1, minWidth: 130 },
    { field: 'reseller_name', headerName: 'Reseller', flex: 1, minWidth: 130 },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      valueFormatter: (value) => value === 'sales' ? 'Sales' : 'Usage Bonus',
    },
    { field: 'reference_id', headerName: 'Order #', width: 100 },
    {
      field: 'amount',
      headerName: `Amount (${cs})`,
      width: 130,
      valueFormatter: (value) => Number(value).toFixed(2),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    { field: 'period_month', headerName: 'Period', width: 100 },
    { field: 'created_at', headerName: 'Created', width: 160 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const { status, id } = params.row;
        return (
          <>
            {status === 'pending' && (
              <Tooltip title="Approve">
                <IconButton size="small" color="primary" onClick={() => openConfirm('approved', [id], params.row)}>
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {status === 'approved' && (
              <Tooltip title="Mark Paid">
                <IconButton size="small" color="success" onClick={() => openConfirm('paid', [id], params.row)}>
                  <PaidIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {(status === 'pending' || status === 'approved') && (
              <Tooltip title="Void">
                <IconButton size="small" color="error" onClick={() => openConfirm('voided', [id], params.row)}>
                  <DoNotDisturbIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader title="Commissions">
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="voided">Voided</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="sales">Sales</MenuItem>
            <MenuItem value="usage_bonus">Usage Bonus</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExport}>
          Export CSV
        </Button>
      </PageHeader>

      {selected.length > 0 && (
        <Paper sx={{ p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            <strong>{selected.length}</strong> selected
          </Typography>
          <Button size="small" variant="outlined" onClick={() => openConfirm('approved', selected)}>Approve</Button>
          <Button size="small" variant="outlined" color="success" onClick={() => openConfirm('paid', selected)}>Mark Paid</Button>
          <Button size="small" variant="outlined" color="error" onClick={() => openConfirm('voided', selected)}>Void</Button>
        </Paper>
      )}

      <DataGrid
        rows={commissions}
        columns={columns}
        loading={loading}
        autoHeight
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(ids) => setSelected(ids)}
        rowSelectionModel={selected}
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        sx={{ bgcolor: 'background.paper', borderRadius: 3 }}
        getRowId={(row) => row.id}
        localeText={{ noRowsLabel: 'No commissions yet.' }}
      />

      {/* Confirmation Dialog */}
      {confirmDialog.action && dialogConfig[confirmDialog.action] && (
        <Dialog
          open={confirmDialog.open}
          onClose={closeConfirm}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ textAlign: 'center', pb: 0, pt: 3 }}>
            {dialogConfig[confirmDialog.action].icon}
            <Typography variant="h6" sx={{ mt: 1 }}>
              {dialogConfig[confirmDialog.action].title}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
            <DialogContentText>
              {dialogConfig[confirmDialog.action].getText(confirmDialog.ids, confirmDialog.row)}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1 }}>
            <Button
              variant="outlined"
              onClick={closeConfirm}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color={dialogConfig[confirmDialog.action].color}
              onClick={handleConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : dialogConfig[confirmDialog.action].confirmLabel}
            </Button>
          </DialogActions>
        </Dialog>
      )}

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
