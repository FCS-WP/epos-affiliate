import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import StorefrontIcon from '@mui/icons-material/Storefront';
import BadgeIcon from '@mui/icons-material/Badge';
import PaymentsIcon from '@mui/icons-material/Payments';
import SettingsIcon from '@mui/icons-material/Settings';
import ResellerList from './pages/Resellers/ResellerList';
import BDList from './pages/BDs/BDList';
import CommissionList from './pages/Commissions/CommissionList';
import Settings from './pages/Settings/Settings';

const NAV_ITEMS = [
  { path: '/resellers',   label: 'Resellers',   icon: <StorefrontIcon /> },
  { path: '/bds',         label: 'BD Agents',    icon: <BadgeIcon /> },
  { path: '/commissions', label: 'Commissions',  icon: <PaymentsIcon /> },
  { path: '/settings',    label: 'Settings',     icon: <SettingsIcon /> },
];

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = NAV_ITEMS.findIndex((item) => location.pathname.startsWith(item.path));

  return (
    <Box
      sx={{
        mb: 3,
        backgroundColor: 'background.paper',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        px: 1,
      }}
    >
      <Tabs
        value={currentTab === -1 ? 0 : currentTab}
        onChange={(_, idx) => navigate(NAV_ITEMS[idx].path)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTab-root': {
            minHeight: 56,
            mx: 0.5,
            borderRadius: 2,
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
            },
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
        }}
      >
        {NAV_ITEMS.map((item) => (
          <Tab key={item.path} icon={item.icon} label={item.label} iconPosition="start" />
        ))}
      </Tabs>
    </Box>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.875rem',
            }}
          >
            EA
          </Box>
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              EPOS Affiliate
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Reseller & Commission Management
            </Typography>
          </Box>
        </Box>

        <Navigation />

        <Routes>
          <Route path="/resellers" element={<ResellerList />} />
          <Route path="/bds" element={<BDList />} />
          <Route path="/commissions" element={<CommissionList />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/resellers" replace />} />
        </Routes>
      </Box>
    </HashRouter>
  );
}
