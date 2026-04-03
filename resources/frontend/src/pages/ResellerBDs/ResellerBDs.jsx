import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import useMediaQuery from "@mui/material/useMediaQuery";
import { DataGrid } from "@mui/x-data-grid";
import { alpha, useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SearchIcon from "@mui/icons-material/Search";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import ShareIcon from "@mui/icons-material/Share";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import QRCode from "react-qr-code";
import api from "../../api/client";
import StatusChip from "../../components/StatusChip";

const config = window.eposAffiliate || {};

export default function ResellerBDs() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [bds, setBDs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBD, setEditingBD] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [qrDialogBD, setQrDialogBD] = useState(null);
  const [deactivateBD, setDeactivateBD] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [reactivateBD, setReactivateBD] = useState(null);
  const [reactivating, setReactivating] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formBDCode, setFormBDCode] = useState("");

  const fetchBDs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/my/bds");
      setBDs(data);
    } catch (err) {
      showSnackbar(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBDs();
  }, [fetchBDs]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const openCreateDialog = () => {
    setEditingBD(null);
    setFormName("");
    setFormEmail("");
    setFormBDCode("");
    setDialogOpen(true);
  };

  const openEditDialog = (bd) => {
    setEditingBD(bd);
    setFormName(bd.name);
    setFormEmail("");
    setFormBDCode("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingBD) {
        await api.put(`/my/bds/${editingBD.id}`, { name: formName });
        showSnackbar("BD updated successfully.");
      } else {
        await api.post("/my/bds", {
          name: formName,
          email: formEmail,
          bd_code: formBDCode,
        });
        showSnackbar(
          "BD created successfully. Login credentials sent via email.",
        );
      }
      setDialogOpen(false);
      fetchBDs();
    } catch (err) {
      showSnackbar(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateBD) return;
    setDeactivating(true);
    try {
      await api.delete(`/my/bds/${deactivateBD.id}`);
      showSnackbar(`${deactivateBD.name} has been deactivated.`);
      setDeactivateBD(null);
      fetchBDs();
    } catch (err) {
      showSnackbar(err.message, "error");
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivateConfirm = async () => {
    if (!reactivateBD) return;
    setReactivating(true);
    try {
      await api.put(`/my/bds/${reactivateBD.id}`, { name: reactivateBD.name, status: 'active' });
      showSnackbar(`${reactivateBD.name} has been reactivated.`);
      setReactivateBD(null);
      fetchBDs();
    } catch (err) {
      showSnackbar(err.message, "error");
    } finally {
      setReactivating(false);
    }
  };

  const handleCopyQR = (bd) => {
    const url = `${config.homeUrl || window.location.origin}/my/qr/${bd.qr_token}`;
    navigator.clipboard.writeText(url);
    showSnackbar("QR link copied!");
  };

  const filteredBDs = bds.filter((bd) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      bd.name?.toLowerCase().includes(q) ||
      bd.tracking_code?.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      field: "name",
      headerName: "BD AGENT",
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontSize: "0.8rem",
              fontWeight: 700,
            }}
          >
            {(params.value || "?").charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
            <Chip
              label={params.row.tracking_code}
              size="small"
              sx={{
                fontWeight: 600, fontSize: '0.65rem', fontFamily: 'monospace', height: 20,
                backgroundColor: alpha(theme.palette.primary.main, 0.06),
                color: theme.palette.primary.main,
              }}
            />
          </Box>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "STATUS",
      width: 110,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
      field: "qr_token",
      headerName: "QR LINK",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="View QR Code">
          <IconButton size="small" onClick={() => setQrDialogBD(params.row)}>
            <QrCode2Icon sx={{ fontSize: 20, color: "primary.main" }} />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: "created_at",
      headerName: "CREATED",
      width: 130,
      valueFormatter: (value) =>
        value ? new Date(value).toLocaleDateString() : "-",
    },
    {
      field: "actions",
      headerName: "ACTIONS",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEditDialog(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === "active" ? (
            <Tooltip title="Deactivate">
              <IconButton
                size="small"
                color="error"
                onClick={() => setDeactivateBD(params.row)}
              >
                <BlockIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Reactivate">
              <IconButton
                size="small"
                color="success"
                onClick={() => setReactivateBD(params.row)}
              >
                <CheckCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  // Mobile BD card
  const BDCard = ({ bd }) => (
    <Card
      sx={{
        mb: 1.5,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              {(bd.name || "?").charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {bd.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.65rem",
                  color: alpha(theme.palette.primary.main, 0.6),
                }}
              >
                {bd.tracking_code}
              </Typography>
            </Box>
          </Box>
          <StatusChip status={bd.status} />
        </Box>
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={() => handleCopyQR(bd)}
          >
            QR Link
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => openEditDialog(bd)}
          >
            Edit
          </Button>
          {bd.status === "active" ? (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<BlockIcon />}
              onClick={() => setDeactivateBD(bd)}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={() => setReactivateBD(bd)}
            >
              Reactivate
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", overflow: "hidden" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
          >
            BD Management
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.5 }}>
            Your BD Agents
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          Add BD Agent
        </Button>
      </Box>

      {/* Search */}
      <TextField
        placeholder="Search by name or tracking code..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      {/* BD List */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : filteredBDs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {searchQuery
              ? "No BD agents match your search."
              : "No BD agents yet. Add your first BD agent to start tracking sales."}
          </Typography>
          {!searchQuery && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
            >
              Add BD Agent
            </Button>
          )}
        </Paper>
      ) : isMobile ? (
        <Box>
          {filteredBDs.map((bd) => (
            <BDCard key={bd.id} bd={bd} />
          ))}
        </Box>
      ) : (
        <Paper sx={{ overflow: "hidden" }}>
          <DataGrid
            rows={filteredBDs}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            disableColumnMenu
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            getRowId={(row) => row.id}
            rowHeight={64}
            sx={{
              border: "none",
              "& .MuiDataGrid-cell": { display: "flex", alignItems: "center" },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
              },
            }}
          />
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingBD ? "Edit BD Agent" : "Add New BD Agent"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <TextField
              label="BD Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              fullWidth
              required
              autoFocus
            />
            {!editingBD && (
              <>
                <TextField
                  label="BD Email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  fullWidth
                  required
                  helperText="Login credentials will be sent to this email"
                />
                <TextField
                  label="BD Code"
                  value={formBDCode}
                  onChange={(e) =>
                    setFormBDCode(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                    )
                  }
                  fullWidth
                  required
                  helperText={
                    formBDCode
                      ? `Tracking code: BD-${(config.resellerSlug || "XXX").toUpperCase()}-${formBDCode}`
                      : "Short unique code (e.g., JS001)"
                  }
                  inputProps={{ maxLength: 10 }}
                />
              </>
            )}
            {editingBD && (
              <Box
                sx={{
                  p: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.03),
                  borderRadius: 2,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Tracking Code
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ fontFamily: "monospace" }}
                >
                  {editingBD.tracking_code}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              saving || !formName || (!editingBD && (!formEmail || !formBDCode))
            }
            startIcon={saving ? <CircularProgress size={18} /> : null}
          >
            {saving ? "Saving..." : editingBD ? "Update" : "Create BD"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reactivate Confirmation Dialog */}
      <Dialog
        open={!!reactivateBD}
        onClose={() => !reactivating && setReactivateBD(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Reactivate BD Agent
        </DialogTitle>
        <DialogContent>
          {reactivateBD && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Are you sure you want to reactivate <strong>{reactivateBD.name}</strong>?
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                  borderColor: alpha(theme.palette.secondary.main, 0.2),
                }}
              >
                <Typography variant="body2" color="secondary.main" fontWeight={500}>
                  This will:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5, mt: 0.5 }}>
                  <Typography component="li" variant="body2" color="text.secondary">
                    Restore their dashboard access
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    Re-enable their QR tracking code
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    Resume attributing new orders to this BD
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReactivateBD(null)} disabled={reactivating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleReactivateConfirm}
            disabled={reactivating}
            startIcon={reactivating ? <CircularProgress size={18} color="inherit" /> : <CheckCircleOutlineIcon />}
          >
            {reactivating ? "Reactivating..." : "Reactivate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog
        open={!!qrDialogBD}
        onClose={() => setQrDialogBD(null)}
        maxWidth="xs"
        fullWidth
      >
        {qrDialogBD && (() => {
          const qrUrl = `${config.homeUrl || window.location.origin}/my/qr/${qrDialogBD.qr_token}`;
          const handleDownload = () => {
            const svg = document.getElementById("qr-dialog-svg");
            if (!svg) return;
            const canvas = document.createElement("canvas");
            canvas.width = 600;
            canvas.height = 600;
            const ctx = canvas.getContext("2d");
            const data = new XMLSerializer().serializeToString(svg);
            const img = new Image();
            img.onload = () => {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, 600, 600);
              ctx.drawImage(img, 0, 0, 600, 600);
              const a = document.createElement("a");
              a.download = `qr-${qrDialogBD.tracking_code}.png`;
              a.href = canvas.toDataURL("image/png");
              a.click();
            };
            img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
          };
          return (
            <>
              <DialogTitle sx={{ textAlign: "center", pb: 0 }}>
                <Typography variant="h6" fontWeight={700}>{qrDialogBD.name}</Typography>
                <Chip
                  label={qrDialogBD.tracking_code}
                  size="small"
                  sx={{
                    mt: 0.5, fontWeight: 600, fontSize: "0.7rem", fontFamily: "monospace",
                    backgroundColor: alpha(theme.palette.primary.main, 0.06),
                    color: theme.palette.primary.main,
                  }}
                />
              </DialogTitle>
              <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", pt: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3, borderRadius: 3,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    backgroundColor: "#fff",
                  }}
                >
                  <QRCode id="qr-dialog-svg" value={qrUrl} size={200} level="H" />
                </Paper>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 2, wordBreak: "break-all", textAlign: "center", maxWidth: 280 }}
                >
                  {qrUrl}
                </Typography>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "center", gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => {
                    navigator.clipboard.writeText(qrUrl);
                    showSnackbar("QR link copied!");
                  }}
                >
                  Copy Link
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Download
                </Button>
                {navigator.share && (
                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    onClick={() => navigator.share({ title: `QR - ${qrDialogBD.name}`, url: qrUrl })}
                  >
                    Share
                  </Button>
                )}
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog
        open={!!deactivateBD}
        onClose={() => !deactivating && setDeactivateBD(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Deactivate BD Agent
        </DialogTitle>
        <DialogContent>
          {deactivateBD && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Are you sure you want to deactivate <strong>{deactivateBD.name}</strong>?
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2, mb: 2,
                  backgroundColor: alpha(theme.palette.error.main, 0.04),
                  borderColor: alpha(theme.palette.error.main, 0.2),
                }}
              >
                <Typography variant="body2" color="error.main" fontWeight={500}>
                  This will:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5, mt: 0.5 }}>
                  <Typography component="li" variant="body2" color="text.secondary">
                    Revoke their dashboard access
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    Disable their QR tracking code
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    Stop attributing new orders to this BD
                  </Typography>
                </Box>
              </Paper>
              <Typography variant="caption" color="text.secondary">
                Existing orders and commissions will not be affected.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeactivateBD(null)} disabled={deactivating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeactivateConfirm}
            disabled={deactivating}
            startIcon={deactivating ? <CircularProgress size={18} color="inherit" /> : <BlockIcon />}
          >
            {deactivating ? "Deactivating..." : "Deactivate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
