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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import QrCodeIcon from '@mui/icons-material/QrCode';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import QRCode from 'react-qr-code';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import api from '../../api/client';
import StatusChip from '../../components/StatusChip';
import PageHeader from '../../components/PageHeader';
import BDForm from './BDForm';
import BDImportDialog from './BDImportDialog';

export default function BDList() {
  const [bds, setBds] = useState([]);
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterReseller, setFilterReseller] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '', bd: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [qrDialogBD, setQrDialogBD] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const siteUrl = (window.eposAffiliate || {}).siteUrl || window.location.origin;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterReseller ? { reseller_id: filterReseller } : {};
      const [bdData, resellerData] = await Promise.all([
        api.get('/bds', params),
        api.get('/resellers'),
      ]);
      setBds(bdData);
      setResellers(resellerData);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filterReseller]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => { setEditing(null); setDialogOpen(true); };
  const handleEdit = (bd) => { setEditing(bd); setDialogOpen(true); };

  const openConfirm = (action, bd) => {
    setConfirmDialog({ open: true, action, bd });
  };

  const closeConfirm = () => {
    setConfirmDialog({ open: false, action: '', bd: null });
  };

  const handleConfirm = async () => {
    const { action, bd } = confirmDialog;
    setActionLoading(true);
    try {
      if (action === 'deactivate') {
        await api.delete(`/bds/${bd.id}`);
        showSnackbar(`BD "${bd.name}" deactivated.`);
      } else {
        await api.put(`/bds/${bd.id}`, { status: 'active' });
        showSnackbar(`BD "${bd.name}" reactivated.`);
      }
      fetchData();
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setActionLoading(false);
      closeConfirm();
    }
  };

  const handleSaved = () => {
    setDialogOpen(false);
    showSnackbar(editing ? 'BD updated.' : 'BD created.');
    fetchData();
  };

  const resellerMap = Object.fromEntries(resellers.map((r) => [r.id, r.name]));

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
    { field: 'tracking_code', headerName: 'Tracking Code', width: 180 },
    {
      field: 'reseller_id',
      headerName: 'Reseller',
      width: 150,
      valueGetter: (value) => resellerMap[value] || value,
    },
    {
      field: 'qr_token',
      headerName: 'QR',
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="View QR Code">
          <IconButton size="small" onClick={() => setQrDialogBD(params.row)}>
            <QrCodeIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
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
      <PageHeader title="BD Agents">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Reseller</InputLabel>
          <Select
            value={filterReseller}
            label="Reseller"
            onChange={(e) => setFilterReseller(e.target.value)}
          >
            <MenuItem value="">All Resellers</MenuItem>
            {resellers.map((r) => (
              <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={() => setImportOpen(true)}>
          Import CSV
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Add BD
        </Button>
      </PageHeader>

      <DataGrid
        rows={bds}
        columns={columns}
        loading={loading}
        autoHeight
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        sx={{ bgcolor: 'background.paper', borderRadius: 3 }}
        getRowId={(row) => row.id}
        localeText={{ noRowsLabel: 'No BD agents yet.' }}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit BD' : 'Add BD'}</DialogTitle>
        <DialogContent>
          <BDForm bd={editing} resellers={resellers} onSaved={handleSaved} onCancel={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Deactivate / Reactivate Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={closeConfirm} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 0, pt: 3 }}>
          {isDeactivate
            ? <WarningAmberIcon sx={{ fontSize: 48, color: 'error.main' }} />
            : <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'success.main' }} />
          }
          <Typography variant="h6" sx={{ mt: 1 }}>
            {isDeactivate ? 'Deactivate BD' : 'Reactivate BD'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
          <DialogContentText>
            {isDeactivate
              ? `Are you sure you want to deactivate "${confirmDialog.bd?.name}" (${confirmDialog.bd?.tracking_code})? They will be logged out and lose access to their dashboard immediately. Their tracking coupon will also be disabled.`
              : `Are you sure you want to reactivate "${confirmDialog.bd?.name}" (${confirmDialog.bd?.tracking_code})? They will regain access to their dashboard.`
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

      {/* QR Code Dialog */}
      <Dialog open={!!qrDialogBD} onClose={() => setQrDialogBD(null)} maxWidth="xs" fullWidth>
        {qrDialogBD && (() => {
          const qrUrl = `${siteUrl}/my/qr/${qrDialogBD.qr_token}`;
          const handleDownload = () => {
            const svg = document.getElementById('admin-qr-svg');
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
              a.download = `qr-${qrDialogBD.tracking_code}.png`;
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
              navigator.share({ title: `QR - ${qrDialogBD.name}`, url: qrUrl });
            }
          };
          return (
            <>
              <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
                <Typography variant="h6" fontWeight={700}>{qrDialogBD.name}</Typography>
                <Chip
                  label={qrDialogBD.tracking_code}
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
                    <QRCode id="admin-qr-svg" value={qrUrl} size={200} level="H" />
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
                <Button onClick={() => setQrDialogBD(null)}>Close</Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* Import Dialog */}
      <BDImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        resellers={resellers}
        onImported={() => { fetchData(); showSnackbar('BD import completed.'); }}
      />

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
