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
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import StarIcon from "@mui/icons-material/Star";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HistoryIcon from "@mui/icons-material/History";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
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

  const handleCopyLink = () => {
    const qrUrl = `${window.location.origin}/my/qr/${dashboard?.qr_token || ""}`;
    navigator.clipboard.writeText(qrUrl);
    setSnackOpen(true);
  };

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

  /* ── KPI data ── */
  const kpiItems = [
    {
      label: "Total Orders",
      value: kpis.total_orders ?? 0,
      icon: <ShoppingCartIcon />,
      highlight: true,
      sub: "+12% this month",
    },
    {
      label: "Pending Commission",
      value: `${cs} ${Number(kpis.commission_pending ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}`,
      icon: <HourglassBottomIcon />,
      sub: "Awaiting verification",
    },
    {
      label: "Paid Commission",
      value: `${cs} ${Number(kpis.commission_paid ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}`,
      icon: <AttachMoneyIcon />,
      sub: "Lifetime earnings",
      color: "secondary",
    },
    {
      label: "Usage Bonus",
      value: `${cs} ${Number(kpis.usage_bonus_current ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}`,
      icon: <StarIcon />,
      sub: "Est. next payout",
      color: "secondary",
    },
  ];

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
      field: "commission",
      headerName: "COMMISSION",
      width: 180,

      headerAlign: "left",
      align: "left",
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="secondary">
          {cs}{" "}
          {Number(params.value).toLocaleString("en-MY", {
            minimumFractionDigits: 2,
          })}
        </Typography>
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
              Commission
            </Typography>
            <Typography variant="body1" fontWeight={700} color="secondary">
              {cs}{" "}
              {Number(order.commission).toLocaleString("en-MY", {
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

      {/* ── Tracking QR Card ── */}
      {dashboard?.tracking_code && (
        <Card
          sx={{
            mb: 3,
            border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.04)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          }}
        >
          <CardContent
            sx={{
              p: 2.5,
              "&:last-child": { pb: 2.5 },
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <QrCode2Icon sx={{ fontSize: 32, color: "primary.main" }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontSize: "0.65rem",
                }}
              >
                Tracking ID: {dashboard.tracking_code}
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="primary"
                sx={{ lineHeight: 1.3 }}
              >
                Tracking QR Code
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate("/qr")}
              sx={{ flexShrink: 0 }}
            >
              Scan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── KPI Cards — 2×2 grid on mobile ── */}
      {loading ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
            gap: 2,
            mb: 3,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={120}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
            gap: 2,
            mb: 3,
          }}
        >
          {kpiItems.map((kpi, idx) => (
            <Card
              key={idx}
              sx={{
                ...(kpi.highlight
                  ? {
                      backgroundColor: theme.palette.primary.main,
                      color: "#fff",
                      border: `2px solid ${theme.palette.primary.main}`,
                    }
                  : {
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                    }),
              }}
            >
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontSize: "0.6rem",
                      color: kpi.highlight
                        ? alpha("#fff", 0.7)
                        : "text.secondary",
                    }}
                  >
                    {kpi.label}
                  </Typography>
                  {!isMobile && (
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        backgroundColor: kpi.highlight
                          ? alpha("#fff", 0.15)
                          : alpha(theme.palette.primary.main, 0.08),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        "& svg": {
                          fontSize: 18,
                          color: kpi.highlight ? "#fff" : "primary.main",
                        },
                      }}
                    >
                      {kpi.icon}
                    </Box>
                  )}
                </Box>
                <Typography
                  variant={isMobile ? "h5" : "h4"}
                  sx={{
                    fontWeight: 700,
                    color: kpi.highlight
                      ? "#fff"
                      : kpi.color === "secondary"
                        ? "secondary.main"
                        : "text.primary",
                    lineHeight: 1.2,
                  }}
                >
                  {kpi.value}
                </Typography>
                {kpi.sub && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: kpi.highlight
                        ? alpha("#fff", 0.6)
                        : kpi.color === "secondary"
                          ? "secondary.main"
                          : "text.secondary",
                      fontSize: "0.65rem",
                    }}
                  >
                    {kpi.sub}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
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
