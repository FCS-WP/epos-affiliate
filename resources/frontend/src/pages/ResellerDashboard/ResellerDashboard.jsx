import { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha, useTheme } from '@mui/material/styles';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import dayjs from 'dayjs';
import api from '../../api/client';
import StatusChip from '../../components/StatusChip';

const config = window.eposAffiliate || {};

export default function ResellerDashboard() {
  const theme = useTheme();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortTab, setSortTab] = useState(0); // 0 = by revenue, 1 = by volume

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateFrom) params.date_from = dayjs(dateFrom).format('YYYY-MM-DD');
      if (dateTo) params.date_to = dayjs(dateTo).format('YYYY-MM-DD');
      const data = await api.get('/dashboard/reseller', params);
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleExport = () => {
    const params = {};
    if (dateFrom) params.date_from = dayjs(dateFrom).format('YYYY-MM-DD');
    if (dateTo) params.date_to = dayjs(dateTo).format('YYYY-MM-DD');
    api.download('/dashboard/reseller/export', params, 'reseller-report.csv');
  };

  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  const kpis = dashboard?.kpis || {};
  const bds = dashboard?.bds || [];

  // Filter by search
  const filteredBDs = bds.filter((bd) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      bd.name?.toLowerCase().includes(q) ||
      bd.tracking_code?.toLowerCase().includes(q)
    );
  });

  // Sort
  const sortedBDs = [...filteredBDs].sort((a, b) => {
    if (sortTab === 0) return (b.revenue || 0) - (a.revenue || 0);
    return (b.orders || 0) - (a.orders || 0);
  });

  // Max revenue for progress bars
  const maxRevenue = Math.max(...bds.map((bd) => bd.revenue || 0), 1);

  const userName = config.userName || 'Manager';

  const columns = [
    {
      field: 'name',
      headerName: 'BD AGENT NAME',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            {(params.value || '?').charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {params.value}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'tracking_code',
      headerName: 'TRACKING CODE',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.7rem',
            fontFamily: 'monospace',
            backgroundColor: alpha(theme.palette.primary.main, 0.06),
            color: theme.palette.primary.main,
          }}
        />
      ),
    },
    {
      field: 'orders',
      headerName: 'TOTAL ORDERS',
      flex: 0.7,
      minWidth: 100,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>
          {(params.value || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'revenue',
      headerName: 'REVENUE (RM)',
      flex: 1,
      minWidth: 140,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} color="secondary">
          {Number(params.value || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      field: 'performance',
      headerName: 'PERFORMANCE TREND',
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: (params) => {
        const revenue = params.row.revenue || 0;
        const pct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
        const isPositive = pct >= 50;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                backgroundColor: alpha(isPositive ? theme.palette.secondary.main : theme.palette.error.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor: isPositive ? theme.palette.secondary.main : theme.palette.error.main,
                },
              }}
            />
            <Chip
              label={`${pct.toFixed(1)}%`}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 22,
                backgroundColor: alpha(isPositive ? theme.palette.secondary.main : theme.palette.error.main, 0.1),
                color: isPositive ? theme.palette.secondary.main : theme.palette.error.main,
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'last_sale_date',
      headerName: 'LAST SALE',
      flex: 0.8,
      minWidth: 110,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value ? dayjs(params.value).format('MMM DD, HH:mm') : '-'}
        </Typography>
      ),
    },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* ── Page Header ── */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Manager Dashboard
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5 }}>
              Organization Overview
            </Typography>
          </Box>
          <Chip
            icon={<VerifiedUserIcon sx={{ fontSize: 16 }} />}
            label="Data restricted: showing your organization's data only"
            sx={{
              mt: 1,
              fontWeight: 500,
              fontSize: '0.75rem',
              backgroundColor: alpha(theme.palette.secondary.main, 0.08),
              color: theme.palette.secondary.main,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            }}
          />
        </Box>
      </Box>

      {/* ── KPI Cards ── */}
      {loading ? (
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={140} sx={{ borderRadius: 4, flex: '1 1 280px' }} />
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          {/* Total Org Sales */}
          <Card sx={{ flex: '1 1 280px', border: `2px solid ${theme.palette.primary.main}`, backgroundColor: theme.palette.primary.main }}>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: alpha('#fff', 0.7), fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                    Total Org Sales
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mt: 1 }}>
                    {(kpis.total_orders ?? 0).toLocaleString()}
                    <Typography component="span" sx={{ color: alpha('#fff', 0.7), ml: 0.5, fontSize: '0.9rem' }}>Orders</Typography>
                  </Typography>
                  <Typography variant="body2" sx={{ color: alpha('#fff', 0.8), mt: 0.5 }}>
                    RM {Number(kpis.total_revenue ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: alpha('#fff', 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCartIcon sx={{ color: '#fff' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Total Org Commission */}
          <Card sx={{ flex: '1 1 280px' }}>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', color: 'text.secondary' }}>
                    Total Org Commission
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'primary.main' }}>
                    RM {Number(kpis.total_sales_commission ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 14, color: 'secondary.main' }} />
                    <Typography variant="caption" color="secondary.main" fontWeight={600}>
                      from last month
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AttachMoneyIcon sx={{ color: 'primary.main' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Active BD Count */}
          <Card sx={{ flex: '1 1 280px' }}>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', color: 'text.secondary' }}>
                    Active BD Count
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'text.primary' }}>
                    {kpis.active_bd_count ?? 0}
                    <Typography component="span" sx={{ color: 'text.secondary', ml: 0.5, fontSize: '0.9rem' }}>Agents</Typography>
                  </Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: alpha(theme.palette.secondary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PeopleIcon sx={{ color: 'secondary.main' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ── Search + Date + Export ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Filter by BD Name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flex: '1 1 250px', maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <CalendarMonthIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <DatePicker
            label="From"
            value={dateFrom}
            onChange={setDateFrom}
            slotProps={{ textField: { size: 'small', sx: { width: 155 } } }}
          />
          <Typography variant="body2" color="text.secondary">-</Typography>
          <DatePicker
            label="To"
            value={dateTo}
            onChange={setDateTo}
            slotProps={{ textField: { size: 'small', sx: { width: 155 } } }}
          />
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Export to CSV
        </Button>
      </Box>

      {/* ── Agent Performance Table ── */}
      <Paper sx={{ overflow: 'hidden' }}>
        {/* Table Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6">Agent Performance Rankings</Typography>
          </Box>
          <Tabs
            value={sortTab}
            onChange={(_, v) => setSortTab(v)}
            sx={{
              minHeight: 36,
              '& .MuiTab-root': {
                minHeight: 36,
                py: 0,
                px: 2,
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              },
            }}
          >
            <Tab label="By Revenue" />
            <Tab label="By Volume" />
          </Tabs>
        </Box>

        {/* DataGrid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={sortedBDs}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            disableColumnMenu
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            getRowId={(row) => row.id || row.tracking_code}
            localeText={{ noRowsLabel: 'No BD agents found.' }}
            rowHeight={64}
            sx={{
              border: 'none',
              '& .MuiDataGrid-row': {
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.02) },
              },
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
              },
            }}
          />
        )}
      </Paper>
    </Box>
  );
}
