// RequestableSidebar.jsx — MUI version
import { NavLink } from "react-router-dom";
import { requestableMenu } from "../requestableMenu";
import { Box, Typography } from "@mui/material";

const BG_START       = "#111827";
const BG_MID         = "#172033";
const BG_END         = "#1e293b";
const ITEM_ACTIVE_BG = "rgba(255,255,255,0.10)";
const ITEM_HOVER_BG  = "rgba(255,255,255,0.07)";
const TEXT_PRIMARY   = "#e2e8f0";
const TEXT_MUTED     = "rgba(226,232,240,0.55)";
const ACCENT         = "#6366f1";

const COLLAPSED_SIDEBAR_WIDTH = 72;
const FLYOUT_WIDTH            = 220;

export default function RequestableSidebar({ visible, isOpen, setShow, anchorTop }) {

  // ── EXPANDED MODE ─────────────────────────────────────────────────────────
  if (isOpen) {
    if (!visible) return null;
    return (
      <Box sx={{ display: "flex", flexDirection: "column", mt: 0.5, mb: 0.5 }}>
        {requestableMenu.map((item, i) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={i}
              to={item.path}
              end={item.path === "/requestable-items"}
              style={{ textDecoration: "none" }}
            >
              {({ isActive }) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    pl: 5,
                    pr: 1.5,
                    py: 0.9,
                    mx: 1,
                    borderRadius: 1.5,
                    cursor: "pointer",
                    position: "relative",
                    color: isActive ? TEXT_PRIMARY : TEXT_MUTED,
                    bgcolor: isActive ? ITEM_ACTIVE_BG : "transparent",
                    transition: "all 0.15s",
                    "&:hover": { bgcolor: ITEM_HOVER_BG, color: TEXT_PRIMARY },
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
                  <Box sx={{ display: "flex", flexShrink: 0, opacity: isActive ? 1 : 0.65 }}>
                    <Icon size={14} />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "0.8rem", fontWeight: isActive ? 600 : 400, color: "inherit", whiteSpace: "nowrap" }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              )}
            </NavLink>
          );
        })}
      </Box>
    );
  }

  // ── COLLAPSED MODE: flyout ────────────────────────────────────────────────
  const ITEM_HEIGHT   = 38;
  const HEADER_HEIGHT = 44;
  const PADDING       = 16;
  const contentHeight = HEADER_HEIGHT + requestableMenu.length * ITEM_HEIGHT + PADDING;
  const maxTop        = typeof window !== "undefined" ? window.innerHeight - contentHeight - 8 : 0;
  const top           = Math.min(anchorTop ?? 0, Math.max(maxTop, 8));

  return (
    <Box
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      sx={{
        position: "fixed",
        top,
        left: COLLAPSED_SIDEBAR_WIDTH,
        width: FLYOUT_WIDTH,
        zIndex: 9999,
        pointerEvents: visible ? "auto" : "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-8px)",
        transition: "opacity 0.18s ease, transform 0.18s ease",
        borderRadius: "0 10px 10px 0",
        overflow: "hidden",
        boxShadow: "4px 4px 24px rgba(0,0,0,0.45)",
        background: `linear-gradient(180deg, ${BG_START} 0%, ${BG_MID} 60%, ${BG_END} 100%)`,
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeft: "none",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <Typography
          variant="caption"
          fontWeight={700}
          letterSpacing={1}
          sx={{ color: TEXT_PRIMARY, fontSize: "0.72rem", textTransform: "uppercase" }}
        >
          Requestable Items
        </Typography>
      </Box>

      <Box sx={{ py: 1 }}>
        {requestableMenu.map((item, i) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={i}
              to={item.path}
              end={item.path === "/requestable-items"}
              style={{ textDecoration: "none" }}
            >
              {({ isActive }) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    px: 2,
                    py: 0.9,
                    cursor: "pointer",
                    position: "relative",
                    color: isActive ? TEXT_PRIMARY : TEXT_MUTED,
                    bgcolor: isActive ? ITEM_ACTIVE_BG : "transparent",
                    transition: "all 0.15s",
                    "&:hover": { bgcolor: ITEM_HOVER_BG, color: TEXT_PRIMARY },
                    ...(isActive && {
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: "15%",
                        height: "70%",
                        width: 3,
                        bgcolor: ACCENT,
                        borderRadius: "0 2px 2px 0",
                      },
                    }),
                  }}
                >
                  <Box sx={{ display: "flex", flexShrink: 0, opacity: isActive ? 1 : 0.65 }}>
                    <Icon size={15} />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "0.8125rem", fontWeight: isActive ? 600 : 400, color: "inherit", whiteSpace: "nowrap" }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              )}
            </NavLink>
          );
        })}
      </Box>
    </Box>
  );
}