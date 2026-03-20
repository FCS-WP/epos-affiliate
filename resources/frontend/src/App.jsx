import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
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
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs
        value={currentTab === -1 ? 0 : currentTab}
        onChange={(_, idx) => navigate(NAV_ITEMS[idx].path)}
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

export default function App() {
  const { userRole } = config;

  if (userRole === 'reseller_manager' || userRole === 'administrator') {
    return (
      <HashRouter>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Navigation />
          <RoleRouter dashboard={ResellerDashboard} profile={ResellerProfile} />
        </Box>
      </HashRouter>
    );
  }

  if (userRole === 'bd_agent') {
    return (
      <HashRouter>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
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
