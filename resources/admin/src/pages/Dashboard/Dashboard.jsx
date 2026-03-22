import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import PaymentsIcon from '@mui/icons-material/Payments';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import dayjs from 'dayjs';
import api from '../../api/client';
import StatusChip from '../../components/StatusChip';

const config = window.eposAffiliate || {};
const cs = config.currencySymbol || 'RM';

export default function Dashboard() {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/dashboard/admin')
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  const kpis = data?.kpis || {};
  const chart = data?.chart || [];
  const topResellers = data?.top_resellers || [];
  const recent = data?.recent || [];
  const maxResellerRevenue = Math.max(...topResellers.map((r) => r.revenue), 1);

  const handleExportPayout = () => {
    api.download('/export/commissions', { status: 'approved' }, 'payout-export.csv');
  };

  return (
    <Box>
      {/* ── KPI Cards ── */}
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={130} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
          {/* Total Revenue */}
          <Card>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                Total System Revenue
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                {cs} {Number(kpis.total_revenue || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 14, color: 'secondary.main' }} />
                <Typography variant="caption" color="secondary.main" fontWeight={600}>
                  {kpis.total_orders || 0} orders
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Active Network */}
          <Card>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                Active Network
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                {kpis.active_resellers || 0}
                <Typography component="span" sx={{ fontSize: '0.85rem', color: 'text.secondary', ml: 0.5 }}>Resellers</Typography>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <PeopleIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {kpis.active_bds || 0} BD Agents active
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Total Orders */}
          <Card>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                Total Orders
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                {(kpis.total_orders || 0).toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <ShoppingCartIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Attributed sales
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Pending Payouts */}
          <Card sx={{ backgroundColor: theme.palette.primary.main, color: '#fff' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', color: alpha('#fff', 0.7) }}>
                Pending Payouts
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 1, color: '#fff' }}>
                {cs} {Number(kpis.pending_payouts || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={handleExportPayout}
                sx={{
                  mt: 1,
                  color: '#fff',
                  borderColor: alpha('#fff', 0.3),
                  fontSize: '0.7rem',
                  '&:hover': { borderColor: '#fff', backgroundColor: alpha('#fff', 0.1) },
                }}
                endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
              >
                Process Batch
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ── Chart + Top Resellers ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2, mb: 3 }}>
        {/* Sales Chart */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Daily Sales Volume</Typography>
              <Typography variant="caption" color="text.secondary">30-day performance snapshot</Typography>
            </Box>
          </Box>
          {loading ? (
            <Skeleton variant="rounded" height={250} />
          ) : chart.length === 0 ? (
            <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No sales data yet</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chart} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.primary.main, 0.08)} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => dayjs(d).format('MMM DD')}
                  tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <RechartsTooltip
                  formatter={(value) => [`${cs} ${Number(value).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, 'Revenue']}
                  labelFormatter={(label) => dayjs(label).format('MMM DD, YYYY')}
                  contentStyle={{
                    borderRadius: 8,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill={alpha(theme.palette.primary.main, 0.7)}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* Top Resellers */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>Top Resellers</Typography>
            <Typography variant="caption" color="text.secondary">All time</Typography>
          </Box>
          {loading ? (
            <Box>{[1, 2, 3].map((i) => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
          ) : topResellers.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No reseller data yet</Typography>
          ) : (
            <Box>
              {topResellers.map((reseller, idx) => (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{reseller.name}</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary">
                      {cs} {Number(reseller.revenue).toLocaleString('en-MY', { minimumFractionDigits: 0 })}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(reseller.revenue / maxResellerRevenue) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: theme.palette.primary.main,
                      },
                    }}
                  />
                </Box>
              ))}
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                href={`${config.adminUrl}?page=epos-affiliate-resellers`}
                sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}
              >
                View All Performance Metrics
              </Button>
            </Box>
          )}
        </Paper>
      </Box>

      {/* ── Quick Actions ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
        <Card
          sx={{ cursor: 'pointer', '&:hover': { borderColor: theme.palette.primary.main } }}
          onClick={() => { window.location.href = `${config.adminUrl}?page=epos-affiliate-resellers`; }}
        >
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, textAlign: 'center' }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, backgroundColor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
              <PersonAddIcon sx={{ color: 'primary.main' }} />
            </Box>
            <Typography variant="body2" fontWeight={700}>Onboard New Reseller</Typography>
            <Typography variant="caption" color="text.secondary">Expand your affiliate network</Typography>
          </CardContent>
        </Card>

        <Card
          sx={{ cursor: 'pointer', '&:hover': { borderColor: theme.palette.primary.main } }}
          onClick={() => { window.location.href = `${config.adminUrl}?page=epos-affiliate-bds`; }}
        >
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, textAlign: 'center' }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, backgroundColor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
              <QrCode2Icon sx={{ color: 'primary.main' }} />
            </Box>
            <Typography variant="body2" fontWeight={700}>Manage BD Agents</Typography>
            <Typography variant="caption" color="text.secondary">QR codes & tracking codes</Typography>
          </CardContent>
        </Card>

        <Card
          sx={{ cursor: 'pointer', '&:hover': { borderColor: theme.palette.primary.main } }}
          onClick={handleExportPayout}
        >
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, textAlign: 'center' }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, backgroundColor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
              <FileDownloadIcon sx={{ color: 'primary.main' }} />
            </Box>
            <Typography variant="body2" fontWeight={700}>Export Payout CSV</Typography>
            <Typography variant="caption" color="text.secondary">Generate financial statements</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* ── Recent Transactions ── */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>Recent Transactions</Typography>
            <Typography variant="caption" color="text.secondary">Real-time attribution log</Typography>
          </Box>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            href={`${config.adminUrl}?page=epos-affiliate-commissions`}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            View Full Log
          </Button>
        </Box>

        {loading ? (
          <Box>{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={50} sx={{ mb: 0.5 }} />)}</Box>
        ) : recent.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            No transactions yet
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& th, & td': { px: 2, py: 1.5, textAlign: 'left', borderBottom: '1px solid', borderColor: 'divider' }, '& th': { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' } }}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>BD Name</th>
                  <th>Reseller</th>
                  <th>Value ({cs})</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((tx) => (
                  <tr key={tx.order_id}>
                    <td>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        #ORD-{tx.order_id}
                      </Typography>
                    </td>
                    <td>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, backgroundColor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                          {(tx.bd_name || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>{tx.bd_name}</Typography>
                      </Box>
                    </td>
                    <td>
                      <Typography variant="body2" color="text.secondary">{tx.reseller}</Typography>
                    </td>
                    <td>
                      <Typography variant="body2" fontWeight={600} color="secondary">
                        {cs} {Number(tx.value).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                      </Typography>
                    </td>
                    <td>
                      <StatusChip status={tx.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
