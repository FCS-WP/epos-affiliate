import { createTheme, alpha } from '@mui/material/styles';

// ── EPOS Velocity Brand Tokens ──
const brand = {
  primary:   '#102870',
  secondary: '#2EAF7D',
  tertiary:  '#080726',
  neutral:   '#717171',
  white:     '#FFFFFF',
  error:     '#D32F2F',
  warning:   '#ED6C02',
  info:      '#0288D1',
  bg:        '#F5F7FA',
  cardBg:    '#FFFFFF',
  border:    '#E2E8F0',
};

const theme = createTheme({
  palette: {
    primary:   { main: brand.primary,   contrastText: brand.white },
    secondary: { main: brand.secondary, contrastText: brand.white },
    error:     { main: brand.error },
    warning:   { main: brand.warning },
    info:      { main: brand.info },
    success:   { main: brand.secondary },
    text: {
      primary:   brand.tertiary,
      secondary: brand.neutral,
    },
    background: {
      default: brand.bg,
      paper:   brand.cardBg,
    },
    divider: brand.border,
  },

  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em', color: brand.tertiary },
    h5: { fontWeight: 700, letterSpacing: '-0.01em', color: brand.tertiary },
    h6: { fontWeight: 600, color: brand.tertiary },
    subtitle1: { fontWeight: 600, color: brand.tertiary },
    subtitle2: { fontWeight: 500, color: brand.neutral },
    body2:     { color: brand.neutral },
    button:    { fontWeight: 600 },
  },

  shape: { borderRadius: 12 },

  shadows: [
    'none',
    '0 1px 3px rgba(16,40,112,0.06)',
    '0 2px 8px rgba(16,40,112,0.08)',
    '0 4px 16px rgba(16,40,112,0.10)',
    '0 8px 24px rgba(16,40,112,0.12)',
    ...Array(20).fill('0 8px 24px rgba(16,40,112,0.12)'),
  ],

  components: {
    // ── Global baseline ──
    MuiCssBaseline: {
      styleOverrides: {
        '#epos-affiliate-dashboard': {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: brand.bg,
          minHeight: '100vh',
        },
      },
    },

    // ── Buttons ──
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 24,
          fontWeight: 600,
          padding: '8px 24px',
          fontSize: '0.875rem',
        },
        containedPrimary: {
          backgroundColor: brand.primary,
          '&:hover': { backgroundColor: '#0D1F5C' },
        },
        containedSecondary: {
          backgroundColor: brand.secondary,
          '&:hover': { backgroundColor: '#259A6B' },
        },
        outlinedPrimary: {
          borderColor: brand.primary,
          borderWidth: 2,
          color: brand.primary,
          '&:hover': {
            borderWidth: 2,
            backgroundColor: alpha(brand.primary, 0.04),
          },
        },
        outlinedSecondary: {
          borderColor: brand.secondary,
          borderWidth: 2,
          color: brand.secondary,
          '&:hover': {
            borderWidth: 2,
            backgroundColor: alpha(brand.secondary, 0.04),
          },
        },
        sizeSmall: {
          padding: '4px 16px',
          borderRadius: 20,
        },
        sizeLarge: {
          padding: '12px 32px',
          fontSize: '1rem',
          borderRadius: 28,
        },
      },
    },

    // ── Icon Buttons ──
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '50%',
          transition: 'background-color 0.2s',
        },
      },
      variants: [
        {
          props: { color: 'primary' },
          style: {
            backgroundColor: brand.primary,
            color: brand.white,
            '&:hover': { backgroundColor: '#0D1F5C' },
          },
        },
      ],
    },

    // ── Cards ──
    MuiCard: {
      defaultProps: { elevation: 1 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${brand.border}`,
          transition: 'box-shadow 0.2s ease',
          '&:hover': { boxShadow: '0 4px 16px rgba(16,40,112,0.10)' },
        },
      },
    },

    // ── Paper ──
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${brand.border}`,
        },
      },
    },

    // ── Chips ──
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 20,
          fontSize: '0.75rem',
        },
        filledPrimary: {
          backgroundColor: alpha(brand.primary, 0.1),
          color: brand.primary,
        },
        filledSecondary: {
          backgroundColor: alpha(brand.secondary, 0.1),
          color: '#1B8A5E',
        },
        filledSuccess: {
          backgroundColor: alpha(brand.secondary, 0.1),
          color: '#1B8A5E',
        },
        filledError: {
          backgroundColor: alpha(brand.error, 0.1),
          color: brand.error,
        },
        filledWarning: {
          backgroundColor: alpha(brand.warning, 0.1),
          color: '#B85C00',
        },
        filledInfo: {
          backgroundColor: alpha(brand.info, 0.1),
          color: brand.info,
        },
      },
    },

    // ── Tabs ──
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
          backgroundColor: brand.primary,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 48,
          color: brand.neutral,
          '&.Mui-selected': {
            color: brand.primary,
          },
        },
      },
    },

    // ── Text Fields ──
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '& fieldset': { borderColor: brand.border },
            '&:hover fieldset': { borderColor: brand.primary },
            '&.Mui-focused fieldset': { borderColor: brand.primary, borderWidth: 2 },
          },
        },
      },
    },

    // ── Select ──
    MuiSelect: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },

    // ── Dialog ──
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, border: 'none' },
      },
    },

    // ── DataGrid ──
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: 16,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: alpha(brand.primary, 0.04),
            borderRadius: '16px 16px 0 0',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700,
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: brand.primary,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: alpha(brand.primary, 0.02),
          },
          '& .MuiDataGrid-cell': {
            borderColor: brand.border,
          },
        },
      },
    },

    // ── Tooltips ──
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: brand.tertiary,
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
