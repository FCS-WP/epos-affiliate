import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import SelectProductPage from './pages/SelectProduct/SelectProductPage';

const container = document.getElementById('epos-select-product');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SelectProductPage />
      </ThemeProvider>
    </StrictMode>
  );
}
