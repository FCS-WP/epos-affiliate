import { useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import BarChartIcon from "@mui/icons-material/BarChart";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import LogoutIcon from "@mui/icons-material/Logout";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import ResellerDashboard from "./pages/ResellerDashboard/ResellerDashboard";
import BDDashboard from "./pages/BDDashboard/BDDashboard";
import BDOrders from "./pages/BDOrders/BDOrders";
import BDQRCode from "./pages/BDQRCode/BDQRCode";
import ResellerProfile from "./pages/ResellerProfile/ResellerProfile";
import ResellerPerformance from "./pages/ResellerPerformance/ResellerPerformance";
import ResellerBDOrders from "./pages/ResellerBDOrders/ResellerBDOrders";
import ResellerBDs from "./pages/ResellerBDs/ResellerBDs";
import BDProfile from "./pages/BDProfile/BDProfile";

const config = window.eposAffiliate || {};

const SIDEBAR_WIDTH = 260;
const BOTTOM_NAV_HEIGHT = 64;

/* ── Navigation config per role ── */
function getBDNav() {
  return [
    { path: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { path: "/orders", label: "Orders", icon: <ReceiptLongIcon /> },
    { path: "/qr", label: "QR Code", icon: <QrCode2Icon /> },
    { path: "/profile", label: "Profile", icon: <PersonIcon /> },
  ];
}

function getResellerNav() {
  return [
    { path: "/dashboard", label: "Overview", icon: <DashboardIcon /> },
    { path: "/performance", label: "BD Performance", icon: <BarChartIcon /> },
    { path: "/bds", label: "Manage BDs", icon: <GroupAddIcon /> },
    { path: "/profile", label: "Profile", icon: <PersonIcon /> },
  ];
}

function getNavItems(role) {
  return role === "bd_agent" ? getBDNav() : getResellerNav();
}

/* ── Desktop Sidebar ── */
function SidebarContent() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const role = config.userRole;
  const navItems = getNavItems(role);

  const roleName = role === "bd_agent" ? "Sales Agent" : "Reseller Manager";
  const userName = config.userName || "User";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: "100%",
        backgroundColor: "#080726",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        py: 2,
      }}
    >
      {/* User profile section */}
      <Box sx={{ px: 2.5, pb: 2, pt: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: theme.palette.secondary.main,
              fontSize: "0.85rem",
              fontWeight: 700,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ overflow: "hidden" }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: "#fff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {userName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: alpha("#fff", 0.5),
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "0.65rem",
              }}
            >
              {roleName}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: alpha("#fff", 0.08), mx: 2 }} />

      {/* Navigation items */}
      <List sx={{ flex: 1, px: 1.5, py: 1.5 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                px: 2,
                py: 1.2,
                color: isActive ? "#fff" : alpha("#fff", 0.6),
                backgroundColor: isActive
                  ? alpha(theme.palette.secondary.main, 0.15)
                  : "transparent",
                "&:hover": {
                  backgroundColor: isActive
                    ? alpha(theme.palette.secondary.main, 0.2)
                    : alpha("#fff", 0.05),
                  color: "#fff",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive
                    ? theme.palette.secondary.main
                    : alpha("#fff", 0.4),
                  minWidth: 36,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: "0.85rem",
                      fontWeight: isActive ? 700 : 500,
                    },
                  },
                }}
              />
              {isActive && (
                <Box
                  sx={{
                    width: 4,
                    height: 24,
                    borderRadius: 2,
                    backgroundColor: theme.palette.secondary.main,
                    position: "absolute",
                    left: 0,
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      {/* Logout */}
      <Box sx={{ px: 1.5, pb: 1 }}>
        <Divider sx={{ borderColor: alpha("#fff", 0.08), mb: 1.5, mx: 0.5 }} />
        <ListItemButton
          component="a"
          href={config.logoutUrl || "#"}
          sx={{
            borderRadius: 2,
            px: 2,
            py: 1,
            color: alpha("#fff", 0.5),
            "&:hover": {
              backgroundColor: alpha("#fff", 0.05),
              color: alpha("#fff", 0.8),
            },
          }}
        >
          <ListItemIcon sx={{ color: alpha("#fff", 0.35), minWidth: 36 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            slotProps={{
              primary: { sx: { fontSize: "0.8rem", fontWeight: 500 } },
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
}

/* ── Mobile Bottom Navigation ── */
function MobileBottomNav() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const role = config.userRole;
  const navItems = getNavItems(role);

  const currentIndex = navItems.findIndex((item) => location.pathname === item.path);

  return (
    <BottomNavigation
      value={currentIndex >= 0 ? currentIndex : 0}
      onChange={(_, newValue) => navigate(navItems[newValue].path)}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        height: BOTTOM_NAV_HEIGHT,
        borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        backgroundColor: "#fff",
        boxShadow: `0 -2px 10px ${alpha("#000", 0.05)}`,
        "& .MuiBottomNavigationAction-root": {
          minWidth: 0,
          py: 1,
          color: alpha(theme.palette.primary.main, 0.4),
          "&.Mui-selected": {
            color: theme.palette.primary.main,
          },
        },
        "& .MuiBottomNavigationAction-label": {
          fontSize: "0.65rem",
          fontWeight: 600,
          mt: 0.3,
          "&.Mui-selected": {
            fontSize: "0.65rem",
          },
        },
      }}
      showLabels
    >
      {navItems.map((item) => (
        <BottomNavigationAction
          key={item.path}
          label={item.label}
          icon={item.icon}
        />
      ))}
    </BottomNavigation>
  );
}

/* ── Route definitions ── */
function RoleRouter({ role }) {
  if (role === "bd_agent") {
    return (
      <Routes>
        <Route path="/dashboard" element={<BDDashboard />} />
        <Route path="/orders" element={<BDOrders />} />
        <Route path="/qr" element={<BDQRCode />} />
        <Route path="/profile" element={<BDProfile />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<ResellerDashboard />} />
      <Route path="/performance" element={<ResellerPerformance />} />
      <Route path="/bds" element={<ResellerBDs />} />
      <Route path="/orders/:bdId" element={<ResellerBDOrders />} />
      <Route path="/profile" element={<ResellerProfile />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

/* ── Main App ── */
export default function App() {
  const { userRole } = config;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (
    !userRole ||
    !["administrator", "reseller_manager", "bd_agent"].includes(userRole)
  ) {
    return (
      <Typography color="error" sx={{ p: 3 }}>
        You do not have permission to view this dashboard.
      </Typography>
    );
  }

  return (
    <HashRouter>
      <Box sx={{ minHeight: "100vh" }}>
        <Box sx={{ display: "flex", flex: 1 }}>
          {/* Desktop sidebar — permanent */}
          {!isMobile && (
            <Box sx={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}>
              <SidebarContent />
            </Box>
          )}

          {/* Main content */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 2, md: 4 },
              pb: isMobile ? `${BOTTOM_NAV_HEIGHT + 16}px` : 4,
              backgroundColor: "#F5F6FA",
              minWidth: 0,
              overflowX: "hidden",
              overflowY: "auto",
              minHeight: "100vh",
            }}
          >
            <RoleRouter role={userRole} />
          </Box>
        </Box>

        {/* Mobile bottom navigation */}
        {isMobile && <MobileBottomNav />}
      </Box>
    </HashRouter>
  );
}
