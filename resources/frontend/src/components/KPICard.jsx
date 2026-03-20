import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';

export default function KPICard({ label, value, prefix = '', suffix = '', icon, trend, color = 'primary' }) {
  const theme = useTheme();
  const paletteColor = theme.palette[color]?.main || theme.palette.primary.main;

  return (
    <Card
      sx={{
        flex: '1 1 200px',
        minWidth: 200,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              {label}
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: paletteColor, lineHeight: 1.2 }}
            >
              {prefix}{value}{suffix}
            </Typography>
            {trend !== undefined && (
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  display: 'inline-block',
                  px: 1,
                  py: 0.25,
                  borderRadius: 10,
                  fontWeight: 600,
                  backgroundColor: trend >= 0
                    ? alpha(theme.palette.success.main, 0.1)
                    : alpha(theme.palette.error.main, 0.1),
                  color: trend >= 0 ? theme.palette.success.main : theme.palette.error.main,
                }}
              >
                {trend >= 0 ? '+' : ''}{trend}%
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(paletteColor, 0.1),
                color: paletteColor,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
