import { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import dayjs from 'dayjs';
import api from '../../api/client';
import KPICard from '../../components/KPICard';

export default function ResellerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [filterBD, setFilterBD] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateFrom) params.date_from = dayjs(dateFrom).format('YYYY-MM-DD');
      if (dateTo) params.date_to = dayjs(dateTo).format('YYYY-MM-DD');
      if (filterBD) params.bd_id = filterBD;
      const data = await api.get('/dashboard/reseller', params);
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, filterBD]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleExport = () => {
    const params = {};
    if (dateFrom) params.date_from = dayjs(dateFrom).format('YYYY-MM-DD');
    if (dateTo) params.date_to = dayjs(dateTo).format('YYYY-MM-DD');
    if (filterBD) params.bd_id = filterBD;
    api.download('/dashboard/reseller/export', params, 'reseller-report.csv');
  };

  const handleClearFilters = () => {
    setDateFrom(null);
    setDateTo(null);
    setFilterBD('');
  };

  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  const kpis = dashboard?.kpis || {};
  const bds = dashboard?.bds || [];
  const bdList = dashboard?.bd_list || [];

  const columns = [
    { field: 'name', headerName: 'BD Name', flex: 1, minWidth: 140 },
    { field: 'tracking_code', headerName: 'Tracking Code', width: 170 },
    { field: 'orders', headerName: 'Orders', width: 90, type: 'number' },
    {
      field: 'revenue',
      headerName: 'Revenue (RM)',
      width: 140,
      type: 'number',
      valueFormatter: (value) => Number(value).toFixed(2),
    },
    {
      field: 'sales_commission',
      headerName: 'Sales Commission (RM)',
      width: 180,
      type: 'number',
      valueFormatter: (value) => Number(value).toFixed(2),
    },
    {
      field: 'usage_bonus',
      headerName: 'Usage Bonus (RM)',
      width: 160,
      type: 'number',
      valueFormatter: (value) => Number(value).toFixed(2),
    },
    {
      field: 'last_sale_date',
      headerName: 'Last Sale',
      width: 130,
      valueFormatter: (value) => value || '-',
    },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Reseller Dashboard
      </Typography>

      {/* KPI Cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <KPICard label="Total Sales" value={kpis.total_orders ?? 0} icon={<ShoppingCartIcon />} />
        <KPICard label="Total Revenue" value={Number(kpis.total_revenue ?? 0).toFixed(2)} prefix="RM " icon={<AttachMoneyIcon />} />
        <KPICard label="Sales Commission" value={Number(kpis.total_sales_commission ?? 0).toFixed(2)} prefix="RM " />
        <KPICard label="Usage Bonus (Last Month)" value={Number(kpis.total_usage_bonus ?? 0).toFixed(2)} prefix="RM " />
        <KPICard label="Active BDs" value={kpis.active_bd_count ?? 0} icon={<PeopleIcon />} />
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>BD Agent</InputLabel>
            <Select value={filterBD} label="BD Agent" onChange={(e) => setFilterBD(e.target.value)}>
              <MenuItem value="">All BDs</MenuItem>
              {bdList.map((bd) => (
                <MenuItem key={bd.id} value={bd.id}>{bd.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" size="small" onClick={handleClearFilters}>Clear</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExport}>
            Export CSV
          </Button>
        </Stack>
      </Paper>

      {/* BD Performance Table */}
      <Typography variant="h6" sx={{ mb: 1.5 }}>BD Performance</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataGrid
          rows={bds}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ bgcolor: 'background.paper', borderRadius: 3 }}
          getRowId={(row) => row.id || row.tracking_code}
          localeText={{ noRowsLabel: 'No BD performance data.' }}
        />
      )}
    </Box>
  );
}
