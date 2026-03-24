import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import dayjs from 'dayjs';
import api from '../../api/client';

const cs = (window.eposAffiliate || {}).currencySymbol || 'RM';

export default function ResellerPerformance() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortTab, setSortTab] = useState(0);

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
    api.download('/dashboard/reseller/export', params, 'bd-performance.csv');
  };

  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  const bds = dashboard?.bds || [];

  const filteredBDs = bds.filter((bd) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      bd.name?.toLowerCase().includes(q) ||
      bd.tracking_code?.toLowerCase().includes(q)
    );
  });

  const sortedBDs = [...filteredBDs].sort((a, b) => {
    if (sortTab === 0) return (b.revenue || 0) - (a.revenue || 0);
    return (b.orders || 0) - (a.orders || 0);
  });

  const maxRevenue = Math.max(...bds.map((bd) => bd.revenue || 0), 1);

  const columns = [
    {
      field: 'rank',
      headerName: '#',
      width: 50,
      sortable: false,
      renderCell: (params) => {
        const idx = sortedBDs.findIndex((bd) => bd.id === params.row.id) + 1;
        return (
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            {idx}
          </Typography>
        );
      },
    },
    {
      field: 'name',
      headerName: 'BD AGENT',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 36, height: 36,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontSize: '0.8rem', fontWeight: 700,
            }}
          >
            {(params.value || '?').charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
            <Chip
              label={params.row.tracking_code}
              size="small"
              sx={{
                fontWeight: 600, fontSize: '0.65rem', fontFamily: 'monospace', height: 20,
                backgroundColor: alpha(theme.palette.primary.main, 0.06),
                color: theme.palette.primary.main,
              }}
            />
          </Box>
        </Box>
      ),
    },
    {
      field: 'orders',
      headerName: 'ORDERS',
      width: 100,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>
          {(params.value || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'revenue',
      headerName: `REVENUE (${cs})`,
      width: 160,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} color="secondary">
          {cs} {Number(params.value || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      field: 'sales_commission',
      headerName: `COMMISSION (${cs})`,
      width: 160,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>
          {cs} {Number(params.value || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      field: 'performance',
      headerName: 'PERFORMANCE',
      flex: 1,
      minWidth: 150,
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
                flex: 1, height: 6, borderRadius: 3,
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
                fontWeight: 600, fontSize: '0.7rem', height: 22,
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
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value ? dayjs(params.value).format('MMM DD, HH:mm') : '-'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="text"
          startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
          onClick={() => navigate(`/orders/${params.row.id}`)}
          sx={{ fontSize: '0.7rem', textTransform: 'none' }}
        >
          View Orders
        </Button>
      ),
    },
  ];

  const BDCard = ({ bd, rank }) => {
    const revenue = bd.revenue || 0;
    const pct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
    return (
      <Card
        sx={{
          mb: 1.5,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          cursor: 'pointer',
          '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.2) },
        }}
        onClick={() => navigate(`/orders/${bd.id}`)}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Top: Rank + Name + Chevron */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{
                width: 28, height: 28, borderRadius: '50%',
                backgroundColor: rank <= 3 ? alpha(theme.palette.secondary.main, 0.1) : alpha(theme.palette.primary.main, 0.06),
                color: rank <= 3 ? theme.palette.secondary.main : theme.palette.primary.main,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', flexShrink: 0,
              }}
            >
              {rank}
            </Typography>
            <Avatar
              sx={{
                width: 36, height: 36,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontSize: '0.8rem', fontWeight: 700,
              }}
            >
              {(bd.name || '?').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{bd.name}</Typography>
              <Chip
                label={bd.tracking_code}
                size="small"
                sx={{
                  fontFamily: 'monospace', fontSize: '0.6rem', height: 18, fontWeight: 600,
                  backgroundColor: alpha(theme.palette.primary.main, 0.06),
                  color: theme.palette.primary.main,
                }}
              />
            </Box>
            <ChevronRightIcon sx={{ color: 'text.secondary', flexShrink: 0 }} />
          </Box>

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 3, mb: 1.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                Orders
              </Typography>
              <Typography variant="body1" fontWeight={700}>{bd.orders || 0}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                Revenue
              </Typography>
              <Typography variant="body1" fontWeight={700} color="secondary">
                {cs} {Number(revenue).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                Commission
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {cs} {Number(bd.sales_commission || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Box>

          {/* Progress bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                flex: 1, height: 4, borderRadius: 2,
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                '& .MuiLinearProgress-bar': { borderRadius: 2, backgroundColor: theme.palette.secondary.main },
              }}
            />
            <Typography variant="caption" fontWeight={600} color="secondary" sx={{ fontSize: '0.7rem' }}>
              {pct.toFixed(1)}%
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          BD Performance
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.5 }}>
          Agent Rankings & Analytics
        </Typography>
      </Box>

      {/* Search + Date + Export */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by name or tracking code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flex: '1 1 200px', minWidth: 0 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', flex: '1 1 auto', minWidth: 0 }}>
          <CalendarMonthIcon sx={{ color: 'text.secondary', fontSize: 20, display: { xs: 'none', sm: 'block' } }} />
          <DatePicker
            label="From"
            value={dateFrom}
            onChange={setDateFrom}
            slotProps={{ textField: { size: 'small', sx: { flex: '1 1 120px', minWidth: 0 } } }}
          />
          <DatePicker
            label="To"
            value={dateTo}
            onChange={setDateTo}
            slotProps={{ textField: { size: 'small', sx: { flex: '1 1 120px', minWidth: 0 } } }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
          size="small"
          sx={{ whiteSpace: 'nowrap', flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
        >
          {isMobile ? 'Export' : 'Export CSV'}
        </Button>
      </Box>

      {/* Sort Tabs */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon sx={{ color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight={600}>
            {sortedBDs.length} Agent{sortedBDs.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Tabs
          value={sortTab}
          onChange={(_, v) => setSortTab(v)}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36, py: 0, px: 2,
              fontSize: '0.75rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            },
          }}
        >
          <Tab label="By Revenue" />
          <Tab label="By Volume" />
        </Tabs>
      </Box>

      {/* Table / Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : sortedBDs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No BD agents found.</Typography>
        </Paper>
      ) : isMobile ? (
        <Box>
          {sortedBDs.map((bd, idx) => (
            <BDCard key={bd.id || bd.tracking_code} bd={bd} rank={idx + 1} />
          ))}
        </Box>
      ) : (
        <Paper sx={{ overflow: 'hidden' }}>
          <DataGrid
            rows={sortedBDs}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            disableColumnMenu
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            getRowId={(row) => row.id || row.tracking_code}
            localeText={{ noRowsLabel: 'No BD agents found.' }}
            rowHeight={64}
            sx={{
              border: 'none',
              '& .MuiDataGrid-row': {
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.02) },
              },
              '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
            }}
          />
        </Paper>
      )}
    </Box>
  );
}
