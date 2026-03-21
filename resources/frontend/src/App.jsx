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
import IconButton from "@mui/material/IconButton";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import BarChartIcon from "@mui/icons-material/BarChart";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import Fab from "@mui/material/Fab";
import CloseIcon from "@mui/icons-material/Close";
import ResellerDashboard from "./pages/ResellerDashboard/ResellerDashboard";
import BDDashboard from "./pages/BDDashboard/BDDashboard";
import ResellerProfile from "./pages/ResellerProfile/ResellerProfile";
import BDProfile from "./pages/BDProfile/BDProfile";

const config = window.eposAffiliate || {};

const SIDEBAR_WIDTH = 260;

function getNavItems(role) {
  if (role === "bd_agent") {
    return [
      { path: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
      { path: "/profile", label: "My Profile", icon: <PersonIcon /> },
    ];
  }
  return [
    { path: "/dashboard", label: "Overview", icon: <DashboardIcon /> },
    { path: "/performance", label: "BD Performance", icon: <BarChartIcon /> },
    { path: "/profile", label: "Profile", icon: <PersonIcon /> },
  ];
}

function SidebarContent({ onNavigate }) {
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

  const handleNav = (path) => {
    navigate(path);
    if (onNavigate) onNavigate();
  };

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
              onClick={() => handleNav(item.path)}
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

      {/* Bottom section */}
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

function RoleRouter({ role }) {
  if (role === "bd_agent") {
    return (
      <Routes>
        <Route path="/dashboard" element={<BDDashboard />} />
        <Route path="/profile" element={<BDProfile />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<ResellerDashboard />} />
      <Route path="/performance" element={<ResellerDashboard />} />
      <Route path="/profile" element={<ResellerProfile />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  const { userRole } = config;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

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
      <Box sx={{ minHeight: "calc(100vh - 64px - 49px)" }}>
        {/* Mobile floating menu button */}
        {isMobile && (
          <Fab
            size="medium"
            onClick={() => setMobileOpen(true)}
            sx={{
              position: "fixed",
              bottom: 20,
              left: 20,
              zIndex: 1099,
              backgroundColor: "#080726",
              color: "#fff",
              "&:hover": { backgroundColor: "#1a1a3e" },
            }}
          >
            <MenuIcon />
          </Fab>
        )}

        <Box sx={{ display: "flex", flex: 1 }}>
          {/* Desktop sidebar — permanent */}
          {!isMobile && (
            <Box sx={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}>
              <SidebarContent />
            </Box>
          )}

          {/* Mobile sidebar — slide-in drawer */}
          <Drawer
            anchor="left"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            PaperProps={{
              sx: {
                width: SIDEBAR_WIDTH,
                backgroundColor: "#080726",
                border: "none",
              },
            }}
          >
            {/* Close button inside drawer */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
              <IconButton
                onClick={() => setMobileOpen(false)}
                sx={{ color: alpha("#fff", 0.6) }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </Drawer>

          {/* Main content */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 2, md: 4 },
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
      </Box>
    </HashRouter>
  );
}
