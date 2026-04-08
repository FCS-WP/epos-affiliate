import { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import QRCode from 'react-qr-code';
import api from '../../api/client';
import StatusChip from '../../components/StatusChip';
import PageHeader from '../../components/PageHeader';
import ResellerForm from './ResellerForm';

const siteUrl = (window.eposAffiliate || {}).siteUrl || window.location.origin;

export default function ResellerList() {
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '', reseller: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [qrDialogReseller, setQrDialogReseller] = useState(null);

  const fetchResellers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/resellers');
      setResellers(data);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResellers(); }, [fetchResellers]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => { setEditing(null); setDialogOpen(true); };
  const handleEdit = (reseller) => { setEditing(reseller); setDialogOpen(true); };

  const openConfirm = (action, reseller) => {
    setConfirmDialog({ open: true, action, reseller });
  };

  const closeConfirm = () => {
    setConfirmDialog({ open: false, action: '', reseller: null });
  };

  const handleConfirm = async () => {
    const { action, reseller } = confirmDialog;
    setActionLoading(true);
    try {
      if (action === 'deactivate') {
        await api.delete(`/resellers/${reseller.id}`);
        showSnackbar(`Reseller "${reseller.name}" deactivated.`);
      } else {
        await api.put(`/resellers/${reseller.id}`, { status: 'active' });
        showSnackbar(`Reseller "${reseller.name}" reactivated.`);
      }
      fetchResellers();
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setActionLoading(false);
      closeConfirm();
    }
  };

  const handleSaved = (createdReseller) => {
    if (createdReseller && !editing) {
      // After create: re-open in edit mode so admin can assign products.
      setEditing(createdReseller);
      showSnackbar('Reseller created. Now assign products below.');
      fetchResellers();
    } else {
      setDialogOpen(false);
      showSnackbar('Reseller updated.');
      fetchResellers();
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ py: 0.5, display:"flex", flexDirection:"column"}}>
          <Typography variant="body2" fontWeight={600}>{params.row.name}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.email}</Typography>
        </Box>
      ),
    },
    {
      field: 'slug',
      headerName: 'Reseller Code',
      width: 140,
      valueFormatter: (value) => value ? value.toUpperCase() : '',
    },
    {
      field: 'product_labels',
      headerName: 'Products',
      flex: 1,
      minWidth: 140,
      sortable: false,
      renderCell: (params) => {
        const labels = params.value || [];
        return labels.length > 0 ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center" sx={{ height: '100%' }}>
            {labels.map((label, i) => (
              <Chip key={i} label={label} size="small" variant="outlined" />
            ))}
          </Stack>
        ) : (
          <Tooltip title="No products assigned. Click Edit to assign products.">
            <Chip label="None" size="small" color="warning" variant="outlined" icon={<WarningAmberIcon />} />
          </Tooltip>
        );
      },
    },
    {
      field: 'qr_token',
      headerName: 'QR',
      width: 80,
      sortable: false,
      renderCell: (params) => (params.value && params.row.product_count > 0) ? (
        <Tooltip title="View QR Code">
          <IconButton size="small" onClick={() => setQrDialogReseller(params.row)}>
            <QrCodeIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ) : (
        <Typography variant="caption" color="text.disabled">—</Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    { field: 'created_at', headerName: 'Created', width: 160 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEdit(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === 'active' ? (
            <Tooltip title="Deactivate">
              <IconButton size="small" color="error" onClick={() => openConfirm('deactivate', params.row)}>
                <BlockIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Reactivate">
              <IconButton size="small" color="success" onClick={() => openConfirm('reactivate', params.row)}>
                <CheckCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </>
      ),
    },
  ];

  const isDeactivate = confirmDialog.action === 'deactivate';

  return (
    <>
      <PageHeader title="Resellers">
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Add Reseller
        </Button>
      </PageHeader>

      <DataGrid
        rows={resellers}
        columns={columns}
        loading={loading}
        autoHeight
        rowHeight={52}
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        sx={{ bgcolor: 'background.paper', borderRadius: 3 }}
        getRowId={(row) => row.id}
        localeText={{ noRowsLabel: 'No resellers yet.' }}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth={editing ? 'md' : 'sm'} fullWidth>
        <DialogTitle>{editing ? 'Edit Reseller' : 'Add Reseller'}</DialogTitle>
        <DialogContent>
          <ResellerForm reseller={editing} onSaved={handleSaved} onCancel={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrDialogReseller} onClose={() => setQrDialogReseller(null)} maxWidth="xs" fullWidth>
        {qrDialogReseller && (() => {
          const qrUrl = `${siteUrl}/my/qr/${qrDialogReseller.qr_token}`;
          const handleDownload = () => {
            const svg = document.getElementById('reseller-qr-svg');
            if (!svg) return;
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 600;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, 600, 600);
              ctx.drawImage(img, 0, 0, 600, 600);
              const a = document.createElement('a');
              a.download = `qr-${qrDialogReseller.slug}.png`;
              a.href = canvas.toDataURL('image/png');
              a.click();
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
          };
          const handleCopy = () => {
            navigator.clipboard.writeText(qrUrl);
            showSnackbar('QR link copied!');
          };
          const handleShare = () => {
            if (navigator.share) {
              navigator.share({ title: `QR - ${qrDialogReseller.name}`, url: qrUrl });
            }
          };
          return (
            <>
              <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
                <Typography variant="h6" fontWeight={700}>{qrDialogReseller.name}</Typography>
                <Chip
                  label={qrDialogReseller.tracking_code}
                  size="small"
                  sx={{ mt: 0.5, fontWeight: 600, fontSize: '0.75rem', fontFamily: 'monospace' }}
                />
              </DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '2px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      backgroundColor: '#fff',
                    }}
                  >
                    <QRCode id="reseller-qr-svg" value={qrUrl} size={200} level="H" />
                  </Paper>
                </Box>
                <Typography
                  variant="caption"
                  display="block"
                  textAlign="center"
                  sx={{ wordBreak: 'break-all', color: 'text.secondary', mb: 2 }}
                >
                  {qrUrl}
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Button variant="outlined" size="small" startIcon={<ContentCopyIcon />} onClick={handleCopy}>
                    Copy Link
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleDownload}>
                    Download
                  </Button>
                  {typeof navigator.share === 'function' && (
                    <Button variant="outlined" size="small" startIcon={<ShareIcon />} onClick={handleShare}>
                      Share
                    </Button>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button onClick={() => setQrDialogReseller(null)}>Close</Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* Deactivate / Reactivate Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={closeConfirm} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 0, pt: 3 }}>
          {isDeactivate
            ? <WarningAmberIcon sx={{ fontSize: 48, color: 'error.main' }} />
            : <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'success.main' }} />
          }
          <Typography variant="h6" sx={{ mt: 1 }}>
            {isDeactivate ? 'Deactivate Reseller' : 'Reactivate Reseller'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
          <DialogContentText>
            {isDeactivate
              ? `Are you sure you want to deactivate "${confirmDialog.reseller?.name}"? They will be logged out and lose access to their dashboard immediately.`
              : `Are you sure you want to reactivate "${confirmDialog.reseller?.name}"? They will regain access to their dashboard.`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={closeConfirm} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={isDeactivate ? 'error' : 'success'}
            onClick={handleConfirm}
            disabled={actionLoading}
          >
            {actionLoading ? 'Processing...' : (isDeactivate ? 'Deactivate' : 'Reactivate')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
