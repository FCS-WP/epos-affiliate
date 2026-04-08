import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import InventoryIcon from '@mui/icons-material/Inventory';
import { alpha, useTheme } from '@mui/material/styles';
import api from '../../api/client';

export default function BDQRCode() {
  const theme = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const qrRef = useRef(null);

  useEffect(() => {
    api.get('/profile')
      .then(setProfile)
      .catch((err) => setSnackbar({ open: true, message: err.message, severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const products = profile?.products || [];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profile.qr_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setSnackbar({ open: true, message: 'Failed to copy', severity: 'error' });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EPOS Product',
          text: 'Get your EPOS device here!',
          url: profile.qr_url,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 0, 0, 400, 400);
      const link = document.createElement('a');
      link.download = `qr-${profile.tracking_code}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!profile?.qr_url || products.length === 0) {
    return <Alert severity="warning" sx={{ m: 2 }}>No QR code available. Contact your admin to assign products.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Your QR Code
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Share this with customers to track your sales
      </Typography>

      {/* QR Code */}
      <Paper
        ref={qrRef}
        sx={{
          p: 4,
          mb: 3,
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <QRCode value={profile.qr_url} size={220} />
        <Typography
          variant="subtitle1"
          fontWeight={700}
          color="primary"
          sx={{ mt: 2, fontFamily: 'monospace', letterSpacing: '0.05em' }}
        >
          {profile.tracking_code}
        </Typography>
      </Paper>

      {/* Share Link */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: alpha(theme.palette.primary.main, 0.03),
        }}
      >
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'text.secondary',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
          }}
        >
          {profile.qr_url}
        </Typography>
        <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
          <IconButton size="small" onClick={handleCopyLink} color={copied ? 'success' : 'default'}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, mb: 3 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<DownloadIcon />}
          onClick={handleDownloadQR}
        >
          Download QR
        </Button>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<ShareIcon />}
          onClick={handleShare}
        >
          Share Link
        </Button>
      </Box>

      {/* Assigned Products */}
      {products.length > 0 && (
        <Paper sx={{ p: 2, textAlign: 'left' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <InventoryIcon fontSize="small" color="action" />
            <Typography variant="subtitle2" fontWeight={600}>
              Assigned Products
            </Typography>
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {products.map((p) => (
              <Chip
                key={p.product_id}
                label={p.product_label || p.product_name}
                variant="outlined"
                size="small"
              />
            ))}
          </Stack>
          {products.length > 1 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
              When a customer scans your QR code, they will be asked to choose a product.
            </Typography>
          )}
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
