import { useState, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import api from '../../api/client';

const STEPS = ['Upload CSV', 'Review & Validate', 'Import'];

export default function BDImportDialog({ open, onClose, resellers, onImported }) {
  const [step, setStep] = useState(0);
  const [resellerId, setResellerId] = useState('');
  const [rawRows, setRawRows] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const reset = () => {
    setStep(0);
    setResellerId('');
    setRawRows([]);
    setValidationResults(null);
    setImporting(false);
    setImportResult(null);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());

      if (lines.length < 2) {
        setError('CSV must have a header row and at least one data row.');
        return;
      }

      // Parse header.
      const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
      const nameIdx = header.findIndex((h) => h === 'name' || h === 'bd name');
      const emailIdx = header.findIndex((h) => h === 'email' || h === 'bd email');

      if (nameIdx === -1 || emailIdx === -1) {
        setError('CSV must have "name" and "email" columns.');
        return;
      }

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const name = cols[nameIdx] || '';
        const email = cols[emailIdx] || '';
        if (name || email) {
          rows.push({ name, email });
        }
      }

      if (rows.length === 0) {
        setError('No data rows found in CSV.');
        return;
      }

      setRawRows(rows);
    };
    reader.readAsText(file);

    // Reset file input.
    e.target.value = '';
  };

  const handleValidate = async () => {
    if (!resellerId) {
      setError('Please select a reseller.');
      return;
    }

    setValidating(true);
    setError('');
    try {
      const payload = rawRows.map((r) => ({ ...r, reseller_id: parseInt(resellerId) }));
      const data = await api.post('/bds/import/validate', payload);
      setValidationResults(data);
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!validationResults) return;

    // Only import valid rows.
    const validRows = validationResults.results
      .filter((r) => r.valid)
      .map((r) => ({ name: r.name, email: r.email, reseller_id: r.reseller_id }));

    if (validRows.length === 0) {
      setError('No valid rows to import.');
      return;
    }

    setImporting(true);
    setError('');
    try {
      const data = await api.post('/bds/import', validRows);
      setImportResult(data);
      setStep(2);
      onImported();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csv = 'name,email\nJohn Smith,john@example.com\nJane Doe,jane@example.com\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bd-import-template.csv';
    a.click();
  };

  const renderUploadStep = () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          1. Select Reseller
        </Typography>
        <FormControl fullWidth required>
          <InputLabel>Reseller</InputLabel>
          <Select
            value={resellerId}
            label="Reseller"
            onChange={(e) => setResellerId(e.target.value)}
          >
            {resellers.filter((r) => r.status === 'active').map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name} ({(r.slug || '').toUpperCase()})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          2. Upload CSV File
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          CSV must have <strong>name</strong> and <strong>email</strong> columns.
        </Typography>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => fileRef.current?.click()}
          >
            Choose File
          </Button>
          <Button
            variant="text"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
          >
            Download Template
          </Button>
        </Stack>
        <input ref={fileRef} type="file" accept=".csv" hidden onChange={handleFileChange} />

        {rawRows.length > 0 && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {rawRows.length} row(s) loaded from CSV.
          </Alert>
        )}
      </Box>
    </Stack>
  );

  const renderValidateStep = () => {
    if (!validationResults) return null;
    const { results, valid_count, invalid_count } = validationResults;

    return (
      <Box>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label={`${valid_count} valid`} color="success" size="small" />
          {invalid_count > 0 && (
            <Chip label={`${invalid_count} invalid`} color="error" size="small" />
          )}
        </Stack>

        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width={40}>#</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Reseller</TableCell>
                <TableCell>Errors</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.row} sx={{ bgcolor: r.valid ? undefined : 'error.50' }}>
                  <TableCell>{r.row}</TableCell>
                  <TableCell>
                    {r.valid ? (
                      <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    ) : (
                      <ErrorIcon sx={{ fontSize: 18, color: 'error.main' }} />
                    )}
                  </TableCell>
                  <TableCell>{r.name || '—'}</TableCell>
                  <TableCell>{r.email || '—'}</TableCell>
                  <TableCell>{r.reseller_name || '—'}</TableCell>
                  <TableCell>
                    {r.errors.map((e, i) => (
                      <Typography key={i} variant="caption" color="error" display="block">
                        {e}
                      </Typography>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {invalid_count > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {invalid_count} row(s) will be skipped. Only {valid_count} valid row(s) will be imported.
          </Alert>
        )}
      </Box>
    );
  };

  const renderImportStep = () => {
    if (!importResult) return null;

    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          Import Complete
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {importResult.created} BD(s) created. {importResult.skipped > 0 ? `${importResult.skipped} skipped.` : ''}
        </Typography>
        {importResult.errors?.length > 0 && (
          <Alert severity="warning" sx={{ textAlign: 'left', mt: 1 }}>
            {importResult.errors.map((e, i) => (
              <Typography key={i} variant="caption" display="block">{e}</Typography>
            ))}
          </Alert>
        )}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import BD Agents</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 3, mt: 1 }}>
          {STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {step === 0 && renderUploadStep()}
        {step === 1 && renderValidateStep()}
        {step === 2 && renderImportStep()}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {step === 2 ? (
          <Button variant="contained" onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            {step === 0 && (
              <Button
                variant="contained"
                onClick={handleValidate}
                disabled={validating || rawRows.length === 0 || !resellerId}
              >
                {validating ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                {validating ? 'Validating...' : 'Validate'}
              </Button>
            )}
            {step === 1 && (
              <>
                <Button onClick={() => { setStep(0); setValidationResults(null); }}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleImport}
                  disabled={importing || validationResults?.valid_count === 0}
                >
                  {importing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                  {importing ? 'Importing...' : `Import ${validationResults?.valid_count || 0} BD(s)`}
                </Button>
              </>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
