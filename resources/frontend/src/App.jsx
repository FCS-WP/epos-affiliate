import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import ResellerDashboard from './pages/ResellerDashboard/ResellerDashboard';
import BDDashboard from './pages/BDDashboard/BDDashboard';
import ResellerProfile from './pages/ResellerProfile/ResellerProfile';
import BDProfile from './pages/BDProfile/BDProfile';

const config = window.eposAffiliate || {};

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/profile', label: 'Profile', icon: <PersonIcon /> },
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
        sx={{
          '& .MuiTab-root': {
            minHeight: 52,
            mx: 0.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: (t) => alpha(t.palette.primary.main, 0.04),
            },
            '&.Mui-selected': { color: 'primary.main' },
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

function RoleRouter({ dashboard: Dashboard, profile: Profile }) {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function AppHeader() {
  const roleName = config.userRole === 'bd_agent' ? 'Sales Agent' : 'Reseller';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
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
        EP
      </Box>
      <Box>
        <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
          EPOS Affiliate
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {roleName} Portal
        </Typography>
      </Box>
    </Box>
  );
}

export default function App() {
  const { userRole } = config;

  if (userRole === 'reseller_manager' || userRole === 'administrator') {
    return (
      <HashRouter>
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
          <AppHeader />
          <Navigation />
          <RoleRouter dashboard={ResellerDashboard} profile={ResellerProfile} />
        </Box>
      </HashRouter>
    );
  }

  if (userRole === 'bd_agent') {
    return (
      <HashRouter>
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
          <AppHeader />
          <Navigation />
          <RoleRouter dashboard={BDDashboard} profile={BDProfile} />
        </Box>
      </HashRouter>
    );
  }

  return (
    <Typography color="error" sx={{ p: 3 }}>
      You do not have permission to view this dashboard.
    </Typography>
  );
}
