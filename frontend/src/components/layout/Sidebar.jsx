// Sidebar.jsx — MUI version (all functionality preserved)
import { NavLink } from "react-router-dom";
import { sidebarMenu } from "../../data/sidebarMenu";
import { hasPermission } from "../../utils/permissions";
import { Menu as MenuIcon, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";

import AssetSidebar from "../../pages/assets/components/AssetSidebar";
import PeopleSidebar from "../../pages/people/components/PeopleSidebar";
import ReportsSidebar from "../../pages/reports/components/ReportsSidebar";
import RequestableSidebar from "../../pages/requestable-items/components/RequestableSidebar";
import JobsSidebar from "../../pages/jobs/components/JobsSidebar";
import TicketsSidebar from "../../pages/tickets/components/TicketsSidebar";
import TaskSidebar from "../../pages/tasks/components/TaskSidebar";

import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Tooltip,
  Collapse,
} from "@mui/material";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

// ── Design tokens ────────────────────────────────────────────────────────────
const SIDEBAR_WIDTH_OPEN   = 256;
const SIDEBAR_WIDTH_CLOSED = 72;
const BG_START  = "#111827";
const BG_MID    = "#172033";
const BG_END    = "#1e293b";
const ITEM_ACTIVE_BG  = "rgba(255,255,255,0.10)";
const ITEM_HOVER_BG   = "rgba(255,255,255,0.07)";
const TEXT_PRIMARY    = "#e2e8f0";
const TEXT_MUTED      = "rgba(226,232,240,0.55)";
const ACCENT          = "#6366f1"; // indigo accent line on active items

export default function Sidebar({ isOpen, toggleSidebar }) {
  const [showAssetSidebar,      setShowAssetSidebar]      = useState(false);
  const [showPeopleSidebar,     setShowPeopleSidebar]     = useState(false);
  const [showReportsSidebar,    setShowReportsSidebar]    = useState(false);
  const [showRequestableSidebar,setShowRequestableSidebar]= useState(false);
  const [showJobsSidebar, setShowJobsSidebar]             = useState(false);
  const [showTicketsSidebar, setShowTicketsSidebar]       = useState(false);
  const [showTaskSidebar, setShowTaskSidebar]             = useState(false);

  const [flyoutTop, setFlyoutTop] = useState(0);
  const [tooltip,   setTooltip]   = useState({ show: false, text: "", top: 0 });

  const { user } = useAuth();

  const [openAssetsMenu,      setOpenAssetsMenu]      = useState(false);
  const [openPeopleMenu,      setOpenPeopleMenu]      = useState(false);
  const [openReportsMenu,     setOpenReportsMenu]     = useState(false);
  const [openRequestableMenu, setOpenRequestableMenu] = useState(false);
  const [openJobsMenu, setOpenJobsMenu]               = useState(false);
  const [openTicketsMenu, setOpenTicketsMenu]         = useState(false);
  const [openTaskMenu, setOpenTaskMenu]               = useState(false);

  const filteredMenu = sidebarMenu.filter((item) => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.name === "People") return user?.role === "superadmin";
    return true;
  });

  const resetAllSidebars = () => {
    setShowAssetSidebar(false);
    setShowPeopleSidebar(false);
    setShowReportsSidebar(false);
    setShowRequestableSidebar(false);
    setShowJobsSidebar(false);
    setShowTicketsSidebar(false);
    setShowTaskSidebar(false);
  };

  return (
    <>
      {/* ── MAIN SIDEBAR ─────────────────────────────────────────────────── */}
      <Box
        component="nav"
        sx={{
          width: isOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED,
          flexShrink: 0,
          height: "100vh",
          position: "sticky",
          top: 0,
          background: `linear-gradient(180deg, ${BG_START} 0%, ${BG_MID} 50%, ${BG_END} 100%)`,
          borderRight: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
          zIndex: 50,
        }}
      >
        {/* Top bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: isOpen ? "space-between" : "center",
            px: isOpen ? 2 : 1,
            py: 1.25,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            minHeight: 63,
          }}
        >
          {isOpen && (
            <Typography
              variant="caption"
              fontWeight={800}
              letterSpacing={1.5}
              sx={{ color: TEXT_PRIMARY, fontSize: "0.9rem" }}
            >
              SAMPATTI MANAGER
            </Typography>
          )}
          <Tooltip title={isOpen ? "Collapse" : "Expand"} placement="right">
            <IconButton
              size="small"
              onClick={toggleSidebar}
              sx={{
                color: TEXT_MUTED,
                "&:hover": { color: TEXT_PRIMARY, bgcolor: ITEM_HOVER_BG },
                borderRadius: 1.5,
              }}
            >
              {isOpen ? <MenuOpenIcon fontSize="small" /> : <MenuRoundedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Menu list */}
        <Box
          sx={{
            mt: 1,
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            pb: 2,
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.08)", borderRadius: 4 },
          }}
        >
          {filteredMenu.map((item, index) => {
            const Icon = item.icon;
            const isAssets      = item.name === "Assets";
            const isPeople      = item.name === "People";
            const isReports     = item.name === "Reports";
            const isRequestable = item.name === "Requestable Items";
            const isJobs        = item.name === "Panel Jobs";
            const isTickets     = item.name === "Service Tickets";
            const isTasks       = item.name === "Tasks";
            const hasSubmenu    = isAssets || isPeople || isReports || isRequestable ||isJobs ||isTickets ||isTasks;

            const isExpanded =
              (isAssets      && openAssetsMenu)       ||
              (isPeople      && openPeopleMenu)       ||
              (isReports     && openReportsMenu)      ||
              (isRequestable && openRequestableMenu)  ||
              (isJobs        && openJobsMenu)         ||
              (isTickets     && openTicketsMenu)      ||
              (isTasks       && openTaskMenu);

            return (
              <Box
                key={index}
                sx={{ position: "relative" }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();

                  if (!isOpen) {
                    setTooltip({ show: true, text: item.name, top: rect.top + rect.height / 2 });
                  }

                  if (!isOpen && hasSubmenu) {
                    setFlyoutTop(rect.top);
                    resetAllSidebars();
                    if (isAssets)      setShowAssetSidebar(true);
                    else if (isPeople) setShowPeopleSidebar(true);
                    else if (isReports)setShowReportsSidebar(true);
                    else if (isRequestable) setShowRequestableSidebar(true);
                    else if (isJobs) setShowJobsSidebar(true);
                    else if (isTickets) setShowTicketsSidebar(true);
                    else if (isTasks) setShowTaskSidebar(true);
                  }
                }}
                onMouseLeave={() => {
                  setTooltip((prev) => ({ ...prev, show: false }));
                  if (!isOpen) resetAllSidebars();
                }}
              >
                <NavLink
                  to={item.path}
                  onClick={(e) => {
                    if (!hasSubmenu || !isOpen) return;
                    e.preventDefault();
                    if (isAssets)      setOpenAssetsMenu(p => !p);
                    if (isPeople)      setOpenPeopleMenu(p => !p);
                    if (isReports)     setOpenReportsMenu(p => !p);
                    if (isRequestable) setOpenRequestableMenu(p => !p);
                    if (isJobs)        setOpenJobsMenu((p) => !p);
                    if (isTickets)     setOpenTicketsMenu((p) => !p);
                    if (isTasks)       setOpenTaskMenu((p)=>!p);
                  }}
                  style={{ textDecoration: "none" }}
                >
                  {({ isActive }) => (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mx: 1,
                        px: 1.5,
                        py: 1.25,
                        borderRadius: 1.5,
                        cursor: "pointer",
                        position: "relative",
                        bgcolor: isActive ? ITEM_ACTIVE_BG : "transparent",
                        color: isActive ? TEXT_PRIMARY : TEXT_MUTED,
                        transition: "all 0.15s",
                        "&:hover": {
                          bgcolor: ITEM_HOVER_BG,
                          color: TEXT_PRIMARY,
                        },
                        // Accent left bar on active
                        ...(isActive && {
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: "20%",
                            height: "60%",
                            width: 3,
                            bgcolor: ACCENT,
                            borderRadius: "0 2px 2px 0",
                          },
                        }),
                      }}
                    >
                      {/* Icon */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          width: 20,
                          height: 20,
                          color: "inherit",
                        }}
                      >
                        <Icon size={18} />
                      </Box>

                      {/* Label */}
                      {isOpen && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "0.8125rem",
                            fontWeight: isActive ? 600 : 400,
                            color: "inherit",
                            flex: 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.name}
                        </Typography>
                      )}

                      {/* Chevron */}
                      {isOpen && hasSubmenu && (
                        <Box sx={{ ml: "auto", color: TEXT_MUTED, display: "flex" }}>
                          {isExpanded
                            ? <ChevronDown size={14} />
                            : <ChevronRight size={14} />}
                        </Box>
                      )}
                    </Box>
                  )}
                </NavLink>

                {/* Inline sub-menus (expanded only) */}
                {isOpen && (
                  <>
                    {isAssets && (
                      <AssetSidebar visible={openAssetsMenu} isOpen={isOpen} setShow={setShowAssetSidebar} />
                    )}
                    {isPeople && (
                      <PeopleSidebar visible={openPeopleMenu} isOpen={isOpen} setShow={setShowPeopleSidebar} />
                    )}
                    {isReports && (
                      <ReportsSidebar visible={openReportsMenu} isOpen={isOpen} setShow={setShowReportsSidebar} />
                    )}
                    {isRequestable && (
                      <RequestableSidebar visible={openRequestableMenu} isOpen={isOpen} setShow={setShowRequestableSidebar} />
                    )}
                    {isJobs && (
                      <JobsSidebar visible={openJobsMenu} isOpen={isOpen} setShow={setShowJobsSidebar} />
                    )}
                    {isTickets && (
                      <TicketsSidebar visible={openTicketsMenu} isOpen={isOpen} setShow={setShowTicketsSidebar} />
                    )}
                    {isTasks && (
                        <TaskSidebar visible={openTaskMenu} isOpen={isOpen} setShow={setShowTaskSidebar} />
                    )}
                  </>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ── FLYOUT PANELS (collapsed sidebar only) ───────────────────────── */}
      {!isOpen && (
        <>
          <AssetSidebar
            visible={showAssetSidebar}
            isOpen={isOpen}
            setShow={setShowAssetSidebar}
            anchorTop={flyoutTop}
          />
          <PeopleSidebar
            visible={showPeopleSidebar}
            isOpen={isOpen}
            setShow={setShowPeopleSidebar}
            anchorTop={flyoutTop}
          />
          <ReportsSidebar
            visible={showReportsSidebar}
            isOpen={isOpen}
            setShow={setShowReportsSidebar}
            anchorTop={flyoutTop}
          />
          <RequestableSidebar
            visible={showRequestableSidebar}
            isOpen={isOpen}
            setShow={setShowRequestableSidebar}
            anchorTop={flyoutTop}
          />
          <JobsSidebar
            visible={showJobsSidebar}
            isOpen={isOpen}
            setShow={setShowJobsSidebar}
            anchorTop={flyoutTop}
          />
          <TicketsSidebar
            visible={showTicketsSidebar}
            isOpen={isOpen}
            setShow={setShowTicketsSidebar}
            anchorTop={flyoutTop}
          />
          <TaskSidebar
            visible={showTaskSidebar}
            isOpen={isOpen}
            setShow={setShowTaskSidebar}
            anchorTop={flyoutTop}
          />
        </>
      )}

      {/* ── Tooltip (collapsed mode) ─────────────────────────────────────── */}
      {!isOpen && tooltip.show && (
        <Box
          sx={{
            position: "fixed",
            left: 86,
            top: tooltip.top,
            transform: "translateY(-50%)",
            bgcolor: "#0f172a",
            color: "#f1f5f9",
            fontSize: "0.75rem",
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 99999,
          }}
        >
          {tooltip.text}
        </Box>
      )}
    </>
  );
}