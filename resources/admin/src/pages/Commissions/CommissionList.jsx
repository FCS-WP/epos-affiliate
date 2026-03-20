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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaidIcon from '@mui/icons-material/Paid';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import api from '../../api/client';
import StatusChip from '../../components/StatusChip';
import PageHeader from '../../components/PageHeader';

export default function CommissionList() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selected, setSelected] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

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

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/commissions/${id}`, { status: newStatus });
      showSnackbar(`Commission marked as ${newStatus}.`);
      fetchCommissions();
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  const handleBulkUpdate = async (newStatus) => {
    if (!selected.length) return;
    if (!confirm(`Mark ${selected.length} commission(s) as ${newStatus}?`)) return;
    try {
      await api.post('/commissions/bulk', { ids: selected, status: newStatus });
      showSnackbar(`${selected.length} commission(s) updated.`);
      setSelected([]);
      fetchCommissions();
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
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
      headerName: 'Amount (RM)',
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
                <IconButton size="small" color="primary" onClick={() => handleStatusUpdate(id, 'approved')}>
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {status === 'approved' && (
              <Tooltip title="Mark Paid">
                <IconButton size="small" color="success" onClick={() => handleStatusUpdate(id, 'paid')}>
                  <PaidIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {(status === 'pending' || status === 'approved') && (
              <Tooltip title="Void">
                <IconButton size="small" color="error" onClick={() => handleStatusUpdate(id, 'voided')}>
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
          <Button size="small" variant="outlined" onClick={() => handleBulkUpdate('approved')}>Approve</Button>
          <Button size="small" variant="outlined" color="success" onClick={() => handleBulkUpdate('paid')}>Mark Paid</Button>
          <Button size="small" variant="outlined" color="error" onClick={() => handleBulkUpdate('voided')}>Void</Button>
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
