import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import { alpha, useTheme } from '@mui/material/styles';

const config = window.eposAffiliateLogin || {};

export default function LoginPage() {
  const theme = useTheme();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${config.apiBase}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': config.nonce,
        },
        body: JSON.stringify({ login, password, remember: rememberMe }),
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      window.location.href = data.redirect || config.homeUrl;
    } catch (err) {
      setError('Network error. Please check your connection.');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
      }}
    >
      {/* Logo + Title */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        {config.logoUrl ? (
          <Box
            component="img"
            src={config.logoUrl}
            alt="EPOS"
            sx={{
              height: 48,
              mb: 1.5,
              mx: 'auto',
              display: 'block',
              filter: 'brightness(0) invert(1)',
            }}
          />
        ) : (
          <Typography
            variant="h4"
            sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}
          >
            EPOS
          </Typography>
        )}
        <Typography
          variant="body2"
          sx={{
            color: alpha('#fff', 0.6),
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontSize: '0.7rem',
          }}
        >
          Affiliate Portal
        </Typography>
      </Box>

      {/* Login Card */}
      <Card
        sx={{
          width: '100%',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 }, '&:last-child': { pb: { xs: 3, sm: 4 } } }}>
          {/* Header */}
          <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700 }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please enter your credentials to access the secure reseller dashboard
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {/* Username / Email */}
            <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
              Username or Email
            </Typography>
            <TextField
              placeholder="agent.name@epos.com"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              fullWidth
              required
              autoFocus
              autoComplete="username"
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': { borderRadius: '8px' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AlternateEmailIcon sx={{ color: alpha(theme.palette.primary.main, 0.3), fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Password */}
            <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
              Password
            </Typography>
            <TextField
              placeholder="••••••••••••"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              autoComplete="current-password"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': { borderRadius: '8px' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKeyOutlinedIcon sx={{ color: alpha(theme.palette.primary.main, 0.3), fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: alpha(theme.palette.primary.main, 0.4) }}
                    >
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Remember Me + Forgot Password */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                    sx={{ color: 'text.secondary', borderRadius: '4px' }}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Remember Me
                  </Typography>
                }
              />
              <Link
                href={`${config.homeUrl}/my/wp-login.php?action=lostpassword`}
                underline="hover"
                sx={{ fontSize: '0.8rem', fontWeight: 700, color: theme.palette.primary.main }}
              >
                Forgot Password?
              </Link>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              sx={{
                py: 1.5,
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '8px',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In to Portal'}
            </Button>
          </Box>

        </CardContent>
      </Card>

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            color: alpha('#fff', 0.35),
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.6rem',
            display: 'block',
            mb: 1,
          }}
        >
          &copy; {new Date().getFullYear()} EPOS Affiliates. All rights reserved.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          {['Privacy Policy', 'Terms of Service', 'Support'].map((label) => (
            <Link
              key={label}
              href="#"
              underline="hover"
              sx={{
                color: alpha('#fff', 0.35),
                fontSize: '0.6rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                '&:hover': { color: alpha('#fff', 0.6) },
              }}
            >
              {label}
            </Link>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
