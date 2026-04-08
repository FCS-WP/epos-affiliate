import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dashboard from './pages/Dashboard/Dashboard';
import ResellerList from './pages/Resellers/ResellerList';
import BDList from './pages/BDs/BDList';
import CommissionList from './pages/Commissions/CommissionList';
import SerialNumberList from './pages/SerialNumbers/SerialNumberList';
import ProductCatalog from './pages/Products/ProductCatalog';

const config = window.eposAffiliate || {};

const PAGES = {
  dashboard: Dashboard,
  resellers: ResellerList,
  bds: BDList,
  commissions: CommissionList,
  'serial-numbers': SerialNumberList,
  products: ProductCatalog,
};

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  resellers: 'Reseller Management',
  bds: 'BD Agent Management',
  commissions: 'Commission Management',
  'serial-numbers': 'Serial Number Management',
  products: 'Product Catalog',
};

export default function App() {
  const currentPage = config.currentPage || 'resellers';
  const PageComponent = PAGES[currentPage] || Dashboard;
  const pageTitle = PAGE_TITLES[currentPage] || 'Dashboard';

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
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
            {pageTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            EPOS Affiliate Management
          </Typography>
        </Box>
      </Box>

      <PageComponent />
    </Box>
  );
}
