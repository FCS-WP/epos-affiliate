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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '../../api/client';
import StatusChip from '../../components/StatusChip';
import PageHeader from '../../components/PageHeader';
import ResellerForm from './ResellerForm';

export default function ResellerList() {
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '', reseller: null });
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleSaved = () => {
    setDialogOpen(false);
    showSnackbar(editing ? 'Reseller updated.' : 'Reseller created.');
    fetchResellers();
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'slug', headerName: 'Slug', flex: 1, minWidth: 120 },
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
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        sx={{ bgcolor: 'background.paper', borderRadius: 3 }}
        getRowId={(row) => row.id}
        localeText={{ noRowsLabel: 'No resellers yet.' }}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Reseller' : 'Add Reseller'}</DialogTitle>
        <DialogContent>
          <ResellerForm reseller={editing} onSaved={handleSaved} onCancel={() => setDialogOpen(false)} />
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
