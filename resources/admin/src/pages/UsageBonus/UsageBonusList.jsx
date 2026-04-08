import { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import api from '../../api/client';
import StatusChip from '../../components/StatusChip';
import PageHeader from '../../components/PageHeader';

const cs = (window.eposAffiliate || {}).currencySymbol || 'RM';

export default function UsageBonusList() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [resellers, setResellers] = useState([]);
  const [bds, setBds] = useState([]);
  const [filterReseller, setFilterReseller] = useState('');
  const [filterBD, setFilterBD] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    api.get('/resellers').then(setResellers).catch(() => {});
    api.get('/bds').then(setBds).catch(() => {});
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterReseller) params.reseller_id = filterReseller;
      if (filterBD) params.bd_id = filterBD;
      if (filterPeriod) params.period_month = filterPeriod;
      if (filterStatus) params.status = filterStatus;
      const data = await api.get('/usage-bonus', params);
      setRecords(data);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filterReseller, filterBD, filterPeriod, filterStatus]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Generate period options (last 12 months).
  const periodOptions = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    periodOptions.push(val);
  }

  // Summary stats.
  const totalBonus = records.reduce((sum, r) => sum + Number(r.amount), 0);
  const pendingCount = records.filter((r) => r.status === 'pending').length;
  const paidCount = records.filter((r) => r.status === 'paid').length;

  const columns = [
    {
      field: 'order_id',
      headerName: 'Order / Serial',
      width: 170,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body2" fontWeight={600}>#{params.row.order_id}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
            {params.row.serial_number || '—'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'bd_name',
      headerName: 'BD / Reseller',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body2" fontWeight={600}>{params.row.bd_name}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.reseller_name}</Typography>
        </Box>
      ),
    },
    {
      field: 'amount',
      headerName: `Bonus (${cs})`,
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" fontWeight={700} color="primary.main">
            {cs} {Number(params.value).toFixed(2)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    { field: 'period_month', headerName: 'Period', width: 100 },
    { field: 'created_at', headerName: 'Created', width: 150 },
  ];

  return (
    <>
      <PageHeader title="Usage Bonus">
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Reseller</InputLabel>
          <Select value={filterReseller} label="Reseller" onChange={(e) => { setFilterReseller(e.target.value); setFilterBD(''); }}>
            <MenuItem value="">All</MenuItem>
            {resellers.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>BD</InputLabel>
          <Select value={filterBD} label="BD" onChange={(e) => setFilterBD(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {bds
              .filter((b) => !filterReseller || String(b.reseller_id) === String(filterReseller))
              .map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)
            }
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select value={filterPeriod} label="Period" onChange={(e) => setFilterPeriod(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {periodOptions.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="voided">Voided</MenuItem>
          </Select>
        </FormControl>
      </PageHeader>

      {/* Summary Cards */}
      {records.length > 0 && (
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip label={`${records.length} records`} variant="outlined" />
          <Chip label={`Total: ${cs} ${totalBonus.toFixed(2)}`} color="primary" />
          {pendingCount > 0 && <Chip label={`${pendingCount} pending`} color="warning" variant="outlined" />}
          {paidCount > 0 && <Chip label={`${paidCount} paid`} color="success" variant="outlined" />}
        </Stack>
      )}

      <DataGrid
        rows={records}
        columns={columns}
        loading={loading}
        autoHeight
        rowHeight={52}
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        sx={{ bgcolor: 'background.paper', borderRadius: 3 }}
        getRowId={(row) => row.id}
        localeText={{ noRowsLabel: 'No usage bonus records yet.' }}
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
