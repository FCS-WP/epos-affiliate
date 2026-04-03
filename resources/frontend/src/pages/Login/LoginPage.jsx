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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockResetIcon from '@mui/icons-material/LockReset';
import { alpha, useTheme } from '@mui/material/styles';

const config = window.eposAffiliateLogin || {};

// View states: 'login' | 'forgot' | 'reset' | 'done'
export default function LoginPage() {
  const theme = useTheme();
  const [view, setView] = useState('login');

  // Login state
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forgot password state
  const [forgotLogin, setForgotLogin] = useState('');

  // Reset password state
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check for account_disabled query param
  const urlParams = new URLSearchParams(window.location.search);
  const accountDisabled = urlParams.get('account_disabled') === '1';

  const apiFetch = async (endpoint, body) => {
    const response = await fetch(`${config.apiBase}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': config.nonce,
      },
      body: JSON.stringify(body),
      credentials: 'same-origin',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Something went wrong.');
    return data;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/login', { login, password, remember: rememberMe });
      window.location.href = data.redirect || config.homeUrl;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiFetch('/auth/forgot-password', { login: forgotLogin });
      setSuccess('');
      setView('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch('/auth/reset-password', {
        login: forgotLogin,
        code: resetCode,
        password: newPassword,
      });
      setSuccess(data.message);
      setView('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    setView('login');
    setError('');
    setSuccess('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const goToForgot = () => {
    setView('forgot');
    setError('');
    setSuccess('');
    setForgotLogin(login || '');
  };

  const renderLogin = () => (
    <>
      <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700 }}>
        Welcome Back
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please enter your credentials to access the secure reseller dashboard
      </Typography>

      {accountDisabled && !error && (
        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: '8px' }}>
          Your account has been disabled. Please contact your administrator.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: '8px' }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={handleLogin}>
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
          sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AlternateEmailIcon sx={{ color: alpha(theme.palette.primary.main, 0.3), fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

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
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <VpnKeyOutlinedIcon sx={{ color: alpha(theme.palette.primary.main, 0.3), fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: alpha(theme.palette.primary.main, 0.4) }}>
                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} size="small" sx={{ color: 'text.secondary', borderRadius: '4px' }} />
            }
            label={<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Remember Me</Typography>}
          />
          <Link
            component="button"
            type="button"
            onClick={goToForgot}
            underline="hover"
            sx={{ fontSize: '0.8rem', fontWeight: 700, color: theme.palette.primary.main }}
          >
            Forgot Password?
          </Link>
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={loading}
          endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
          sx={{ py: 1.5, fontSize: '0.95rem', fontWeight: 700, borderRadius: '8px' }}
        >
          {loading ? 'Signing in...' : 'Sign In to Portal'}
        </Button>
      </Box>
    </>
  );

  const renderForgotPassword = () => (
    <>
      <Box sx={{ mb: 2 }}>
        <Link
          component="button"
          onClick={goToLogin}
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem', color: 'text.secondary' }}
        >
          <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to Login
        </Link>
      </Box>

      <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700 }}>
        Forgot Password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter your username or email address and we'll send you a reset code.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleForgotPassword}>
        <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
          Username or Email
        </Typography>
        <TextField
          placeholder="agent.name@epos.com"
          value={forgotLogin}
          onChange={(e) => setForgotLogin(e.target.value)}
          fullWidth
          required
          autoFocus
          autoComplete="username"
          sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AlternateEmailIcon sx={{ color: alpha(theme.palette.primary.main, 0.3), fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={loading}
          endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockResetIcon />}
          sx={{ py: 1.5, fontSize: '0.95rem', fontWeight: 700, borderRadius: '8px' }}
        >
          {loading ? 'Sending...' : 'Send Reset Code'}
        </Button>
      </Box>
    </>
  );

  const renderResetPassword = () => (
    <>
      <Box sx={{ mb: 2 }}>
        <Link
          component="button"
          onClick={goToLogin}
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem', color: 'text.secondary' }}
        >
          <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to Login
        </Link>
      </Box>

      <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700 }}>
        Reset Password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the 6-digit code sent to your email and choose a new password.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleResetPassword}>
        <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
          Reset Code
        </Typography>
        <TextField
          placeholder="000000"
          value={resetCode}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
            setResetCode(val);
          }}
          fullWidth
          required
          autoFocus
          autoComplete="one-time-code"
          inputProps={{ maxLength: 6, style: { letterSpacing: '8px', fontSize: '1.3rem', fontWeight: 700, textAlign: 'center', fontFamily: 'monospace' } }}
          sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        />

        <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
          New Password
        </Typography>
        <TextField
          placeholder="••••••••••••"
          type={showNewPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          fullWidth
          required
          autoComplete="new-password"
          helperText="Minimum 8 characters"
          sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <VpnKeyOutlinedIcon sx={{ color: alpha(theme.palette.primary.main, 0.3), fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small" sx={{ color: alpha(theme.palette.primary.main, 0.4) }}>
                  {showNewPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
          Confirm Password
        </Typography>
        <TextField
          placeholder="••••••••••••"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          required
          autoComplete="new-password"
          sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <VpnKeyOutlinedIcon sx={{ color: alpha(theme.palette.primary.main, 0.3), fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small" sx={{ color: alpha(theme.palette.primary.main, 0.4) }}>
                  {showConfirmPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={loading || resetCode.length !== 6}
          endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockResetIcon />}
          sx={{ py: 1.5, fontSize: '0.95rem', fontWeight: 700, borderRadius: '8px' }}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link
            component="button"
            type="button"
            onClick={() => { setView('forgot'); setError(''); }}
            underline="hover"
            sx={{ fontSize: '0.8rem', color: 'text.secondary' }}
          >
            Didn't receive the code? Send again
          </Link>
        </Box>
      </Box>
    </>
  );

  const renderDone = () => (
    <>
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <LockResetIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Password Reset
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {success || 'Your password has been reset successfully.'}
        </Typography>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={goToLogin}
          endIcon={<LoginIcon />}
          sx={{ py: 1.5, fontSize: '0.95rem', fontWeight: 700, borderRadius: '8px' }}
        >
          Back to Login
        </Button>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Logo + Title */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        {config.logoUrl ? (
          <Box
            component="img"
            src={config.logoUrl}
            alt="EPOS"
            sx={{ height: 48, mb: 1.5, mx: 'auto', display: 'block', filter: 'brightness(0) invert(1)' }}
          />
        ) : (
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
            EPOS
          </Typography>
        )}
        <Typography
          variant="body2"
          sx={{ color: alpha('#fff', 0.6), letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.7rem' }}
        >
          Affiliate Portal
        </Typography>
      </Box>

      {/* Card */}
      <Card sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 }, '&:last-child': { pb: { xs: 3, sm: 4 } } }}>
          {view === 'login' && renderLogin()}
          {view === 'forgot' && renderForgotPassword()}
          {view === 'reset' && renderResetPassword()}
          {view === 'done' && renderDone()}
        </CardContent>
      </Card>

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: alpha('#fff', 0.35), textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.6rem', display: 'block', mb: 1 }}>
          &copy; {new Date().getFullYear()} EPOS Affiliates. All rights reserved.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          {['Privacy Policy', 'Terms of Service', 'Support'].map((label) => (
            <Link
              key={label}
              href="#"
              underline="hover"
              sx={{ color: alpha('#fff', 0.35), fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', '&:hover': { color: alpha('#fff', 0.6) } }}
            >
              {label}
            </Link>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
