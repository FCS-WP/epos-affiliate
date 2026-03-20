import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

export default function KPICard({ label, value, prefix = '', icon }) {
  return (
    <Card sx={{ minWidth: 180, flex: '1 1 180px' }}>
      <CardContent sx={{ textAlign: 'center', py: 2.5, '&:last-child': { pb: 2.5 } }}>
        {icon && <div style={{ marginBottom: 4, color: '#1976d2' }}>{icon}</div>}
        <Typography variant="h5" component="div" fontWeight={700} color="primary">
          {prefix}{value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}
