import { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FilterListIcon from '@mui/icons-material/FilterList';
import QrCodeIcon from '@mui/icons-material/QrCode';
import dayjs from 'dayjs';
import api from '../../api/client';
import KPICard from '../../components/KPICard';
import StatusChip from '../../components/StatusChip';

export default function BDDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateFrom) params.date_from = dayjs(dateFrom).format('YYYY-MM-DD');
      if (dateTo) params.date_to = dayjs(dateTo).format('YYYY-MM-DD');
      const data = await api.get('/dashboard/bd', params);
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleClearFilters = () => {
    setDateFrom(null);
    setDateTo(null);
  };

  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  const kpis = dashboard?.kpis || {};
  const orders = dashboard?.orders || [];

  const columns = [
    { field: 'order_id', headerName: 'Order #', width: 100 },
    { field: 'date', headerName: 'Date', width: 130 },
    {
      field: 'value',
      headerName: 'Value (RM)',
      width: 130,
      type: 'number',
      valueFormatter: (value) => Number(value).toFixed(2),
    },
    {
      field: 'commission',
      headerName: 'Commission (RM)',
      width: 150,
      type: 'number',
      valueFormatter: (value) => Number(value).toFixed(2),
    },
    {
      field: 'payout_status',
      headerName: 'Payout Status',
      width: 140,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
  ];

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        My Dashboard
      </Typography>

      {dashboard?.tracking_code && (
        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeIcon color="primary" />
          <Typography variant="body1">
            Your tracking code: <Chip label={dashboard.tracking_code} color="primary" variant="outlined" />
          </Typography>
        </Paper>
      )}

      {/* KPI Cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <KPICard label="Total Orders" value={kpis.total_orders ?? 0} />
        <KPICard label="Commission (Paid)" value={Number(kpis.commission_paid ?? 0).toFixed(2)} prefix="RM " />
        <KPICard label="Commission (Pending)" value={Number(kpis.commission_pending ?? 0).toFixed(2)} prefix="RM " />
        <KPICard label="Usage Bonus (This Month)" value={Number(kpis.usage_bonus_current ?? 0).toFixed(2)} prefix="RM " />
        <KPICard label="Usage Bonus (Last Paid)" value={Number(kpis.usage_bonus_last_paid ?? 0).toFixed(2)} prefix="RM " />
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <FilterListIcon color="action" />
          <DatePicker
            label="From"
            value={dateFrom}
            onChange={setDateFrom}
            slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
          />
          <DatePicker
            label="To"
            value={dateTo}
            onChange={setDateTo}
            slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
          />
          <Button variant="outlined" size="small" onClick={handleClearFilters}>Clear</Button>
        </Stack>
      </Paper>

      {/* Order History */}
      <Typography variant="h6" sx={{ mb: 1.5 }}>Order History</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataGrid
          rows={orders}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ bgcolor: 'background.paper', borderRadius: 3 }}
          getRowId={(row) => row.order_id}
          localeText={{ noRowsLabel: 'No orders yet.' }}
        />
      )}
    </Box>
  );
}
