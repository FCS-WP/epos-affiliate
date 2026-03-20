import { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import StarIcon from '@mui/icons-material/Star';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import HistoryIcon from '@mui/icons-material/History';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import api from '../../api/client';
import KPICard from '../../components/KPICard';
import StatusChip from '../../components/StatusChip';

const config = window.eposAffiliate || {};

export default function BDDashboard() {
  const theme = useTheme();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

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

  const handleCopyLink = () => {
    const qrUrl = `${window.location.origin}/my/qr/${dashboard?.qr_token || ''}`;
    navigator.clipboard.writeText(qrUrl);
    setSnackOpen(true);
  };

  const handleExportCSV = () => {
    api.download('/dashboard/bd/export', {
      ...(dateFrom && { date_from: dayjs(dateFrom).format('YYYY-MM-DD') }),
      ...(dateTo && { date_to: dayjs(dateTo).format('YYYY-MM-DD') }),
    }, 'my-orders.csv');
  };

  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  const kpis = dashboard?.kpis || {};
  const orders = dashboard?.orders || [];
  const userName = config.userName || 'Agent';

  const columns = [
    {
      field: 'order_id',
      headerName: 'ORDER ID',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          #ORD-{params.value}
        </Typography>
      ),
    },
    {
      field: 'date',
      headerName: 'DATE',
      flex: 1,
      minWidth: 130,
      valueFormatter: (value) => value ? dayjs(value).format('MMM DD, YYYY') : '-',
    },
    {
      field: 'value',
      headerName: 'VALUE (RM)',
      flex: 1,
      minWidth: 120,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          {Number(params.value).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      field: 'commission',
      headerName: 'COMMISSION',
      flex: 1,
      minWidth: 120,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="secondary">
          {Number(params.value).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      field: 'payout_status',
      headerName: 'PAYOUT STATUS',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
      field: 'actions',
      headerName: '',
      width: 50,
      sortable: false,
      renderCell: () => <ChevronRightIcon sx={{ color: 'text.secondary' }} />,
    },
  ];

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* ── Greeting + QR Card ── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 4,
          flexWrap: 'wrap',
          gap: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Hello, {userName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back to your sales command center. Track your progress in real-time.
          </Typography>
        </Box>

        {/* QR / Tracking Code Card */}
        {dashboard?.tracking_code && (
          <Card
            sx={{
              minWidth: 260,
              border: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
            }}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <QrCode2Icon sx={{ fontSize: 36, color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Your Tracking ID
                </Typography>
                <Typography variant="h6" color="primary" sx={{ lineHeight: 1.3 }}>
                  {dashboard.tracking_code}
                </Typography>
                <Chip
                  icon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                  label="Copy Link"
                  size="small"
                  onClick={handleCopyLink}
                  sx={{
                    mt: 0.5,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main,
                    '&:hover': { backgroundColor: alpha(theme.palette.secondary.main, 0.2) },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* ── KPI Cards ── */}
      {loading ? (
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" width={240} height={120} sx={{ borderRadius: 4, flex: '1 1 200px' }} />
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <KPICard
            label="Total Orders"
            value={kpis.total_orders ?? 0}
            icon={<ShoppingCartIcon />}
            color="primary"
          />
          <KPICard
            label="Sales Commission (Paid)"
            value={Number(kpis.commission_paid ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            prefix="RM "
            icon={<AttachMoneyIcon />}
            color="primary"
          />
          <KPICard
            label="Sales Commission (Pending)"
            value={Number(kpis.commission_pending ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            prefix="RM "
            icon={<HourglassBottomIcon />}
            color="warning"
          />
          <KPICard
            label="Usage Bonus (Est.)"
            value={Number(kpis.usage_bonus_current ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            prefix="RM "
            icon={<StarIcon />}
            color="secondary"
          />
        </Box>
      )}

      {/* ── Order History ── */}
      <Paper sx={{ p: 0, overflow: 'hidden' }}>
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
            <HistoryIcon color="primary" />
            <Typography variant="h6">Recent Order History</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filter By Date
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* Collapsible Filters */}
        {showFilters && (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              px: 3,
              py: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
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
            <Button
              variant="text"
              size="small"
              onClick={() => { setDateFrom(null); setDateTo(null); }}
            >
              Clear
            </Button>
          </Box>
        )}

        {/* DataGrid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={orders}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            disableColumnMenu
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            getRowId={(row) => row.order_id}
            localeText={{ noRowsLabel: 'No orders yet. Start sharing your QR code!' }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
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

      {/* Copy Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={2000}
        onClose={() => setSnackOpen(false)}
        message="QR link copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
