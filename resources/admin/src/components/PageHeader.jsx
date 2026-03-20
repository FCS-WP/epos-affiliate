import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function PageHeader({ title, subtitle, children }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Box>
        <Typography variant="h5" component="h2">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {children}
      </Box>
    </Box>
  );
}
