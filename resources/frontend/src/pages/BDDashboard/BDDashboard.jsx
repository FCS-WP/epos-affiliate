import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Snackbar from "@mui/material/Snackbar";
import Skeleton from "@mui/material/Skeleton";
import CircularProgress from "@mui/material/CircularProgress";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import HistoryIcon from "@mui/icons-material/History";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import dayjs from "dayjs";
import api from "../../api/client";
import StatusChip from "../../components/StatusChip";

const config = window.eposAffiliate || {};
const cs = config.currencySymbol || "RM";

export default function BDDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackOpen, setSnackOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/dashboard/bd", {});
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleExportCSV = () => {
    api.download("/dashboard/bd/export", {}, "my-orders.csv");
  };

  if (error)
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );

  const kpis = dashboard?.kpis || {};
  const orders = dashboard?.orders || [];
  const recentOrders = orders.slice(0, isMobile ? 5 : 10);
  const userName = config.userName || "Agent";

  /* ── Desktop DataGrid columns ── */
  const columns = [
    {
      field: "order_id",
      headerName: "ORDER ID",
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          #{params.value}
        </Typography>
      ),
    },
    {
      field: "date",
      headerName: "DATE",
      width: 150,
      valueFormatter: (value) =>
        value ? dayjs(value).format("MMM DD, YYYY") : "-",
    },
    {
      field: "value",
      headerName: `VALUE (${cs})`,
      width: 150,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          {cs}{" "}
          {Number(params.value).toLocaleString("en-MY", {
            minimumFractionDigits: 2,
          })}
        </Typography>
      ),
    },
    {
      field: "num_units",
      headerName: "NUMBER OF UNITS",
      width: 100,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>
          {(params.value || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: "usage_target_met",
      headerName: "USAGE TARGET",
      width: 130,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Chip
          label={params.value ? "Yes" : "No"}
          size="small"
          color={params.value ? "success" : "default"}
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: "0.7rem" }}
        />
      ),
    },
    {
      field: "payout_status",
      headerName: "PAYOUT STATUS",
      minWidth: 110,
      width: 150,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
  ];

  /* ── Mobile Order Card ── */
  const OrderCard = ({ order }) => (
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
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="body2" fontWeight={700} color="primary">
            #{order.order_id}
          </Typography>
          <StatusChip status={order.payout_status} />
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 1.5 }}
        >
          {order.date ? dayjs(order.date).format("MMM DD, YYYY") : "-"}
        </Typography>
        <Box sx={{ display: "flex", gap: 3 }}>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                textTransform: "uppercase",
                fontSize: "0.65rem",
                letterSpacing: "0.05em",
              }}
            >
              Value
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {cs}{" "}
              {Number(order.value).toLocaleString("en-MY", {
                minimumFractionDigits: 2,
              })}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", overflow: "hidden" }}>
      {/* ── Greeting ── */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          sx={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
        >
          Affiliate Dashboard
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.5 }}>
          Hello, {userName}
        </Typography>
      </Box>

      {/* ── QR Card + Total Orders in one row ── */}
      {loading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
          <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
          {/* QR Card — only show if products are assigned */}
          {dashboard?.tracking_code && dashboard?.has_products && (
            <Card
              sx={{
                border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.04)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              }}
            >
              <CardContent
                sx={{ p: 2.5, "&:last-child": { pb: 2.5 }, display: "flex", alignItems: "center", gap: 2 }}
              >
                <Box
                  sx={{
                    width: 48, height: 48, borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <QrCode2Icon sx={{ fontSize: 28, color: "primary.main" }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.6rem" }}>
                    Tracking ID: {dashboard.tracking_code}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ lineHeight: 1.3 }}>
                    Tracking QR Code
                  </Typography>
                </Box>
                <Button variant="contained" size="small" onClick={() => navigate("/qr")} sx={{ flexShrink: 0 }}>
                  Scan
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Total Orders */}
          <Card sx={{ backgroundColor: theme.palette.primary.main, color: "#fff", border: `2px solid ${theme.palette.primary.main}` }}>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 }, display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: alpha("#fff", 0.15), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShoppingCartIcon sx={{ color: "#fff" }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: alpha("#fff", 0.7), fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.6rem" }}>
                  Total Orders
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                  {kpis.total_orders ?? 0}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#fff", 0.6), fontSize: "0.65rem" }}>
                  Attributed sales
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ── Recent Order History ── */}
      <Box sx={{ mb: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HistoryIcon color="primary" sx={{ fontSize: 22 }} />
            <Typography variant="h6">Recent Order History</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {!isMobile && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportCSV}
              >
                Export CSV
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : recentOrders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            No orders yet. Start sharing your QR code!
          </Typography>
        </Paper>
      ) : isMobile ? (
        /* Mobile: Card list */
        <Box>
          {recentOrders.map((order) => (
            <OrderCard key={order.order_id} order={order} />
          ))}
          {orders.length > 5 && (
            <Button
              fullWidth
              variant="text"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate("/orders")}
              sx={{ mt: 1 }}
            >
              View all {orders.length} orders
            </Button>
          )}
        </Box>
      ) : (
        /* Desktop: DataGrid */
        <Paper sx={{ overflow: "hidden" }}>
          <DataGrid
            rows={recentOrders}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            disableColumnMenu
            pageSizeOptions={[10]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            getRowId={(row) => row.order_id}
            localeText={{ noRowsLabel: "No orders yet." }}
            sx={{
              border: "none",
              "& .MuiDataGrid-row": {
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                },
              },
              "& .MuiDataGrid-cell": { display: "flex", alignItems: "center" },
            }}
          />
          {orders.length > 10 && (
            <Box
              sx={{
                p: 2,
                textAlign: "center",
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Button
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate("/orders")}
              >
                View all orders
              </Button>
            </Box>
          )}
        </Paper>
      )}

      <Snackbar
        open={snackOpen}
        autoHideDuration={2000}
        onClose={() => setSnackOpen(false)}
        message="QR link copied!"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
