import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InboxIcon from '@mui/icons-material/InboxOutlined';

export default function EmptyState({ icon, title = 'No data found', description }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        color: 'text.secondary',
      }}
    >
      <Box sx={{ mb: 2, opacity: 0.4 }}>
        {icon || <InboxIcon sx={{ fontSize: 64 }} />}
      </Box>
      <Typography variant="h6" sx={{ mb: 0.5, color: 'text.secondary', fontWeight: 500 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2">{description}</Typography>
      )}
    </Box>
  );
}
