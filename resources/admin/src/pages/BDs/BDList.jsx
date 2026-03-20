import { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import QrCodeIcon from '@mui/icons-material/QrCode';
import api from '../../api/client';
import StatusChip from '../../components/StatusChip';
import PageHeader from '../../components/PageHeader';
import BDForm from './BDForm';

export default function BDList() {
  const [bds, setBds] = useState([]);
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterReseller, setFilterReseller] = useState('');

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

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this BD and their coupon?')) return;
    try {
      await api.delete(`/bds/${id}`);
      showSnackbar('BD deactivated.');
      fetchData();
    } catch (err) {
      showSnackbar(err.message, 'error');
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
        <Tooltip title={`/my/qr/${params.value}`}>
          <QrCodeIcon fontSize="small" color="action" />
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
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEdit(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === 'active' && (
            <Tooltip title="Deactivate">
              <IconButton size="small" color="error" onClick={() => handleDeactivate(params.row.id)}>
                <BlockIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </>
      ),
    },
  ];

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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit BD' : 'Add BD'}</DialogTitle>
        <DialogContent>
          <BDForm bd={editing} resellers={resellers} onSaved={handleSaved} onCancel={() => setDialogOpen(false)} />
        </DialogContent>
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
