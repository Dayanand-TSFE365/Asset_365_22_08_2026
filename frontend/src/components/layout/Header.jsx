// src\components\layout\Header.jsx — MUI version (all functionality preserved)
import { useState, useRef, useEffect } from "react";
import { hasPermission } from "../../utils/permissions";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { API } from "../../config/api";
import NotificationBell from "./NotificationBell";

import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  InputBase,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Typography,
  Chip,
  Tooltip,
  Button,
  ListItemIcon,
  ListItemText,
  Paper,
  alpha,
} from "@mui/material";

import {
  AddOutlined as PlusIcon,
  KeyboardArrowDownOutlined as ChevronDownIcon,
  SearchOutlined as SearchIcon,
  SettingsOutlined as SettingsIcon,
  FeedbackOutlined as FeedbackIcon,
  WifiTetheringOutlined as WebSocketIcon,
  LogoutOutlined as LogOutIcon,
  AssignmentOutlined as ClipboardListIcon,
  ShoppingCartOutlined as CartIcon,
} from "@mui/icons-material";

import {
  Boxes,
  Key,
  Package,
  Archive,
  Cpu,
  Briefcase,
  Users,
} from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [createAnchor, setCreateAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const [searchVal, setSearchVal] = useState("");

  const openCreate = Boolean(createAnchor);
  const openUser = Boolean(userAnchor);

  const quickLinks = [
  { icon: Boxes, path: "/assets/computer-assets", label: "Assets", permission: "view_assets" },
  { icon: Key, path: "/client-licenses", label: "Client-Licenses", permission: "view_clientlicenses" },
  { icon: Briefcase, path: "/jobs", label: "Jobs", permission: "view_jobs" },
  // { icon: Package, path: "/accessories", label: "Accessories", permission: "view_accessories" },
  // { icon: Archive, path: "/consumables", label: "Consumables", permission: "view_consumables" },
  // { icon: Cpu, path: "/components", label: "Components", permission: "view_components" },
  { icon: Users, path: "/people", label: "People", permission: "view_people" },
];

  const createOptions = [
  { label: "Asset", path: "/assets/computer-assets/action/create", icon: Boxes, permission: "create_assets" },
  { label: "Client-License", path: "/client-licenses/action/create", icon: Key, permission: "create_clientlicenses" },
  { label: "Job", path: "/jobs/action/create", icon: Briefcase, permission: "create_jobs" },
  // { label: "Accessory", path: "/accessories/action/create", icon: Package, permission: "create_accessories" },
  // { label: "Consumable", path: "/consumables/action/create", icon: Archive, permission: "create_consumables" },
  // { label: "Component", path: "/components/action/create", icon: Cpu, permission: "create_components" },
  { label: "User (People)", path: "/people/action/create", icon: Users, permission: "create_people" },
];

  function getInitials(name) {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }

  const filename =
    user?.profile_image &&
    user.profile_image !== "null" &&
    user.profile_image !== "undefined" &&
    user.profile_image.trim() !== ""
      ? user.profile_image.split(/[\\/]/).pop()
      : null;

  const profileImageSrc = filename
    ? API.GET_PROFILE_IMAGE(filename)
    : null;

  const filteredQuickLinks = quickLinks.filter((item) => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.label === "People") return user?.role === "superadmin";
    return true;
  });

  // Show all create options; mark each as disabled if no permission
  const visibleCreateOptions = createOptions
    .filter((item) => {
      // Still hide People from non-superadmin entirely
      if (item.label === "User (People)") return user?.role === "superadmin";
      return true;
    })
    .map((item) => ({
      ...item,
      disabled: item.permission ? !hasPermission(item.permission) : false,
    }));

  // Disable the Create button itself if the user has no create permissions at all
  const hasAnyCreatePermission = visibleCreateOptions.some((item) => !item.disabled);

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: "linear-gradient(90deg, #111827 0%, #172033 50%, #1e293b 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        zIndex: (theme) => theme.zIndex.drawer + 1,
        height: 64,
        justifyContent: "center",
      }}
    >
<Toolbar sx={{ gap: 2, minHeight: "64px !important", px: { xs: 2, md: 2 } }}>

        {/* ── LEFT: Logo + title + quick links ── */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
          <Box component="img" src="/tsfe_icon.svg" alt="logo" sx={{ width: 32, height: 32 }} />
          <Typography
            variant="subtitle1"
            fontWeight={700}
            letterSpacing={0.5}
            sx={{ whiteSpace: "nowrap", display: { xs: "none", sm: "block" } }}
          >
            SAMPATTI MANAGEMENT 365
          </Typography>
        </Box>

        {/* Quick icon links */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5, ml: 2 }}>
          {filteredQuickLinks.map((item, i) => {
            const Icon = item.icon;
            return (
              <Tooltip key={i} title={item.label} placement="bottom" arrow>
                <IconButton
                  size="small"
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: "rgba(255,255,255,0.75)",
                    "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.12)" },
                    borderRadius: 1,
                    p: 0.75,
                  }}
                >
                  <Icon size={18} />
                </IconButton>
              </Tooltip>
            );
          })}
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* ── CENTER: Search ── */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            bgcolor: "rgba(255,255,255,0.12)",
            borderRadius: 1,
            px: 1.5,
            py: 0.5,
            width: 280,
            backdropFilter: "blur(8px)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
            transition: "background 0.2s",
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.6)", mr: 1 }} />
          <InputBase
            placeholder="Look up by Asset Tag"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchVal.trim()) {
                navigate(`/assets?search=${encodeURIComponent(searchVal.trim())}`);
              }
            }}
            sx={{
              color: "#fff",
              fontSize: "0.875rem",
              flex: 1,
              "& ::placeholder": { color: "rgba(255,255,255,0.55)", opacity: 1 },
            }}
          />
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* ── RIGHT: Bell + Create + User ── */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>

          {/* 🔔 Notification Bell */}
          <NotificationBell />

          {/* ➕ Create Button */}
          <Tooltip
            title={!hasAnyCreatePermission ? "You don't have permission to create any items" : ""}
            placement="bottom"
          >
            <span>
              <Button
                size="small"
                variant="contained"
                startIcon={<PlusIcon />}
                endIcon={<ChevronDownIcon />}
                disabled={!hasAnyCreatePermission}
                onClick={(e) => setCreateAnchor(e.currentTarget)}
                sx={{
                  bgcolor: "#fff",
                  color: "#2563eb",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  textTransform: "none",
                  px: 1.5,
                  "&:hover": { bgcolor: "#f0f4ff" },
                  boxShadow: "none",
                  "&.Mui-disabled": {
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "rgba(255,255,255,0.4)",
                  },
                }}
              >
                Create
              </Button>
            </span>
          </Tooltip>

          <Menu
            anchorEl={createAnchor}
            open={openCreate}
            onClose={() => setCreateAnchor(null)}
            PaperProps={{
              elevation: 4,
              sx: {
                mt: 1,
                minWidth: 200,
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            {visibleCreateOptions.map((item, i) => {
              const Icon = item.icon;
              return (
                <Tooltip
                  key={i}
                  title={item.disabled ? "You don't have permission to create this" : ""}
                  placement="left"
                  arrow
                >
                  <span>
                    <MenuItem
                      disabled={item.disabled}
                      onClick={() => { navigate(item.path); setCreateAnchor(null); }}
                      sx={{
                        fontSize: "0.875rem",
                        py: 1,
                        gap: 1.5,
                        "&.Mui-disabled": { opacity: 0.45, pointerEvents: "auto", cursor: "not-allowed" },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: "unset" }}>
                        <Icon
                          size={18}
                          color={item.disabled ? "#9ca3af" : "#6b7280"}
                        />
                      </ListItemIcon>
                      <ListItemText primaryTypographyProps={{ fontSize: "0.875rem" }}>
                        {item.label}
                      </ListItemText>
                    </MenuItem>
                  </span>
                </Tooltip>
              );
            })}
          </Menu>

          {/* 👤 User Avatar */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}
            onClick={(e) => setUserAnchor(e.currentTarget)}
          >
            <Avatar
              src={profileImageSrc || undefined}
              sx={{
                width: 34,
                height: 34,
                bgcolor: "rgba(255,255,255,0.25)",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {!profileImageSrc && getInitials(user?.full_name)}
            </Avatar>
            <ChevronDownIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }} />
          </Box>

          {/* User Dropdown */}
          <Menu
            anchorEl={userAnchor}
            open={openUser}
            onClose={() => setUserAnchor(null)}
            PaperProps={{
              elevation: 4,
              sx: {
                mt: 1,
                width: 288,
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            {/* Profile header */}
            <Box
              sx={{
                p: 2,
                background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
                display: "flex",
                gap: 1.5,
                alignItems: "center",
              }}
            >
 <Avatar
                src={profileImageSrc || undefined}
                sx={{ width: 52, height: 52, fontSize: "1.1rem", fontWeight: 700 }}
              >
                {!profileImageSrc && getInitials(user?.full_name)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {user?.full_name || "User"}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {user?.email || "No email"}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
                  <Chip
                    label={user?.role || "No Role"}
                    size="small"
                    sx={{ bgcolor: "#ede9fe", color: "#6d28d9", fontSize: "0.65rem", height: 18 }}
                  />
                  <Chip
                    label={user?.department || "No Dept"}
                    size="small"
                    sx={{ bgcolor: "#e0e7ff", color: "#3730a3", fontSize: "0.65rem", height: 18 }}
                  />
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* <MenuItem
              onClick={() => { navigate("/settings?tab=assets"); setUserAnchor(null); }}
              sx={{ fontSize: "0.875rem", py: 1, gap: 1.5 }}
            >
              <ListItemIcon><ClipboardListIcon fontSize="small" /></ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "0.875rem" }}>
                View Assigned Items
              </ListItemText>
            </MenuItem>

            <MenuItem
              onClick={() => { navigate("/requestable-items/requested"); setUserAnchor(null); }}
              sx={{ fontSize: "0.875rem", py: 1, gap: 1.5 }}
            >
              <ListItemIcon><CartIcon fontSize="small" /></ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "0.875rem" }}>
                Requestable Items
              </ListItemText>
            </MenuItem> */}

            <MenuItem
              onClick={() => { navigate("/feedback"); setUserAnchor(null); }}
              sx={{ fontSize: "0.875rem", py: 1, gap: 1.5 }}
            >
              <ListItemIcon><FeedbackIcon fontSize="small" /></ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "0.875rem" }}>
                Feedback
              </ListItemText>
            </MenuItem>

            <MenuItem
              onClick={() => { navigate("/websocket-test"); setUserAnchor(null); }}
              sx={{ fontSize: "0.875rem", py: 1, gap: 1.5 }}
            >
              <ListItemIcon><WebSocketIcon fontSize="small" /></ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "0.875rem" }}>
                WebSocket & Redis Diagnosis
              </ListItemText>
            </MenuItem>

            <MenuItem
              onClick={() => { navigate("/settings"); setUserAnchor(null); }}
              sx={{ fontSize: "0.875rem", py: 1, gap: 1.5 }}
            >
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "0.875rem" }}>
                Settings
              </ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem
              onClick={async () => { await logout(); navigate("/login"); setUserAnchor(null); }}
              sx={{ fontSize: "0.875rem", py: 1, gap: 1.5, color: "error.main" }}
            >
              <ListItemIcon><LogOutIcon fontSize="small" color="error" /></ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "0.875rem", color: "error.main" }}>
                Sign Out
              </ListItemText>
            </MenuItem>
          </Menu>

        </Box>
      </Toolbar>
    </AppBar>
  );
}