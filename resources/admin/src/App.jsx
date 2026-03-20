import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useLocation, useNavigate } from 'react-router-dom';
import StorefrontIcon from '@mui/icons-material/Storefront';
import BadgeIcon from '@mui/icons-material/Badge';
import PaymentsIcon from '@mui/icons-material/Payments';
import SettingsIcon from '@mui/icons-material/Settings';
import ResellerList from './pages/Resellers/ResellerList';
import BDList from './pages/BDs/BDList';
import CommissionList from './pages/Commissions/CommissionList';
import Settings from './pages/Settings/Settings';

const NAV_ITEMS = [
  { path: '/resellers', label: 'Resellers', icon: <StorefrontIcon /> },
  { path: '/bds', label: 'BD Agents', icon: <BadgeIcon /> },
  { path: '/commissions', label: 'Commissions', icon: <PaymentsIcon /> },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
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
        variant="scrollable"
        scrollButtons="auto"
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
      <Box sx={{ p: 2, maxWidth: 1400, mx: 'auto' }}>
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
