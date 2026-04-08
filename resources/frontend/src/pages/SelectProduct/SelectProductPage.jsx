import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { alpha } from '@mui/material/styles';

const config = window.eposSelectProduct || {};

export default function SelectProductPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState(null);

  useEffect(() => {
    fetch(`${config.apiBase}/product-assignments/for-qr`, {
      credentials: 'same-origin',
      headers: { 'X-WP-Nonce': config.nonce },
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.products || json.products.length === 0) {
          setError('No products available. Please try scanning the QR code again.');
        } else {
          setData(json);
        }
      })
      .catch(() => setError('Something went wrong. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectProduct = (product) => {
    setSelecting(product.product_id);

    const params = new URLSearchParams({
      'add-to-cart': product.product_id,
      bd_tracking: product.bd_tracking,
      bd_user_id: product.bd_user_id,
      reseller_id: product.reseller_id,
      epos_product: product.product_id,
      utm_source: 'qr',
      utm_medium: 'bd_referral',
    });

    const redirectUrl = product.permalink
      ? `${product.permalink}?${params.toString()}`
      : `${config.homeUrl}/?${params.toString()}`;

    window.location.href = redirectUrl;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
        <CircularProgress sx={{ color: '#fff' }} />
        <Typography variant="body2" sx={{ color: alpha('#fff', 0.6) }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto' }}>
        <Alert severity="warning" sx={{ borderRadius: 3 }}>{error}</Alert>
      </Box>
    );
  }

  const products = data?.products || [];
  const cs = config.currencySymbol || 'RM';

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        {config.logoUrl ? (
          <Box
            component="img"
            src={config.logoUrl}
            alt="EPOS"
            sx={{ height: 36, mb: 1, mx: 'auto', display: 'block', filter: 'brightness(0) invert(1)' }}
          />
        ) : (
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mb: 0.5 }}>
            EPOS
          </Typography>
        )}
        <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
          Select a product
        </Typography>
      </Box>

      {/* Product List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {products.map((product) => {
          const isSelecting = selecting === product.product_id;
          const isDisabled = selecting && !isSelecting;

          return (
            <Card
              key={product.product_id}
              sx={{
                borderRadius: 3,
                opacity: isDisabled ? 0.4 : 1,
                transition: 'all 0.2s',
                ...(!selecting && {
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  },
                }),
              }}
            >
              <CardActionArea onClick={() => handleSelectProduct(product)} disabled={!!selecting}>
                <CardContent
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    '&:last-child': { pb: 2 },
                  }}
                >
                  {/* Product icon or image */}
                  {product.image ? (
                    <Avatar
                      src={product.image}
                      variant="rounded"
                      sx={{ width: 48, height: 48, flexShrink: 0 }}
                    />
                  ) : (
                    <Avatar
                      variant="rounded"
                      sx={{ width: 48, height: 48, flexShrink: 0, bgcolor: alpha('#102870', 0.08) }}
                    >
                      <ShoppingBagIcon sx={{ color: '#102870' }} />
                    </Avatar>
                  )}

                  {/* Product info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {product.product_label || product.product_name}
                    </Typography>
                    {product.product_label && product.product_label !== product.product_name && (
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {product.product_name}
                      </Typography>
                    )}
                  </Box>

                  {/* Price + arrow */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="primary">
                      {cs} {Number(product.price).toFixed(2)}
                    </Typography>
                    {isSelecting ? (
                      <CircularProgress size={18} />
                    ) : (
                      <ArrowForwardIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
