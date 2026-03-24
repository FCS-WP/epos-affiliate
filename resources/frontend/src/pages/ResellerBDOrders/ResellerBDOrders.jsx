import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import dayjs from 'dayjs';
import api from '../../api/client';
import StatusChip from '../../components/StatusChip';

const cs = (window.eposAffiliate || {}).currencySymbol || 'RM';

export default function ResellerBDOrders() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { bdId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateFrom) params.date_from = dayjs(dateFrom).format('YYYY-MM-DD');
      if (dateTo) params.date_to = dayjs(dateTo).format('YYYY-MM-DD');
      const result = await api.get(`/dashboard/reseller/bd/${bdId}/orders`, params);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bdId, dateFrom, dateTo]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  const bd = data?.bd || {};
  const allOrders = data?.orders || [];

  const orders = allOrders.filter((order) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(order.order_id).includes(q) ||
      order.payout_status?.toLowerCase().includes(q) ||
      String(order.value).includes(q)
    );
  });

  const columns = [
    {
      field: 'order_id',
      headerName: 'ORDER ID',
      flex: 1,

      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'date',
      headerName: 'DATE',
      width: 150,
      valueFormatter: (value) => value ? dayjs(value).format('MMM DD, YYYY') : '-',
    },
    {
      field: 'value',
      headerName: `VALUE (${cs})`,
      width: 150,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          {cs} {Number(params.value).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      field: 'commission',
      headerName: 'COMMISSION',
      width: 180,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="secondary">
          {cs} {Number(params.value).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      field: 'payout_status',
      headerName: 'STATUS',
      width: 120,
      minWidth: 110,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
  ];

  const OrderCard = ({ order }) => (
    <Card
      sx={{
        mb: 1.5,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" fontWeight={700} color="primary">
            #{order.order_id}
          </Typography>
          <StatusChip status={order.payout_status} />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          {order.date ? dayjs(order.date).format('MMM DD, YYYY') : '-'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              Value
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {cs} {Number(order.value).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              Commission
            </Typography>
            <Typography variant="body1" fontWeight={700} color="secondary">
              {cs} {Number(order.commission).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 0.5 }}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar
          sx={{
            width: 44,
            height: 44,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            fontSize: '1rem',
            fontWeight: 700,
          }}
        >
          {(bd.name || '?').charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h5">
            {bd.name || 'BD'} — Orders
          </Typography>
          {bd.tracking_code && (
            <Chip
              label={bd.tracking_code}
              size="small"
              sx={{
                mt: 0.5,
                fontWeight: 600,
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                backgroundColor: alpha(theme.palette.primary.main, 0.06),
                color: theme.palette.primary.main,
              }}
            />
          )}
        </Box>
      </Box>

      {/* Search */}
      <TextField
        placeholder="Search by order ID, status, or amount..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Filter + Export */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {isMobile ? 'Filter' : 'Filter By Date'}
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          size="small"
          startIcon={<FileDownloadIcon />}
          onClick={() => {
            api.download(`/dashboard/reseller/bd/${bdId}/orders/export`, {
              ...(dateFrom && { date_from: dayjs(dateFrom).format('YYYY-MM-DD') }),
              ...(dateTo && { date_to: dayjs(dateTo).format('YYYY-MM-DD') }),
            }, `orders-${bd.tracking_code || bdId}.csv`);
          }}
        >
          {isMobile ? 'Export' : 'Export CSV'}
        </Button>
      </Box>

      {showFilters && (
        <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
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
          <Button variant="text" size="small" onClick={() => { setDateFrom(null); setDateTo(null); }}>
            Clear
          </Button>
        </Paper>
      )}

      {/* Orders */}
      {loading ? (
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No orders found for this BD.</Typography>
        </Paper>
      ) : isMobile ? (
        <Box>
          {orders.map((order) => (
            <OrderCard key={order.order_id} order={order} />
          ))}
        </Box>
      ) : (
        <Paper sx={{ overflow: 'hidden' }}>
          <DataGrid
            rows={orders}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            disableColumnMenu
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            getRowId={(row) => row.order_id}
            rowHeight={56}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
              },
            }}
          />
        </Paper>
      )}
    </Box>
  );
}
