// ===============================
// File: src/components/layout/NotificationBell.jsx
// ===============================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconButton,
  Badge,
  Menu,
  Box,
  Typography,
  MenuItem,
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import AssignmentIcon from "@mui/icons-material/Assignment";
import UpdateIcon from "@mui/icons-material/Update";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import CircleIcon from "@mui/icons-material/Circle";
import useNotification from "../../hooks/useNotification";

// Backend sends naive timestamps with no timezone marker — same fix as
// TaskDetails' toDate(), force UTC so relative/absolute times line up.
function toDate(isoString) {
  if (!isoString) return null;
  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(isoString);
  return new Date(hasTimezone ? isoString : `${isoString}Z`);
}

function formatRelative(iso) {
  const d = toDate(iso);
  if (!d || isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

// ── task notification styling (unchanged) ──
const TASK_TYPE_ICON = {
  task_assigned: AssignmentIcon,
  progress_created: UpdateIcon,
  status_changed: SyncAltIcon,
  attachment_uploaded: AttachFileIcon,
  task_completed: CheckCircleIcon,
};
const TASK_TYPE_COLOR = {
  task_assigned: "#3b82f6",
  progress_created: "#0ea5e9",
  status_changed: "#9333ea",
  attachment_uploaded: "#6b7280",
  task_completed: "#16a34a",
};

// ── ticket notification styling (new) ──
const TICKET_TYPE_ICON = {
  new_reply: ChatBubbleOutlineIcon,
  status_changed: SyncAltIcon,
  submitted: SendOutlinedIcon,
  approved: ThumbUpAltOutlinedIcon,
  ticket_assigned: ConfirmationNumberOutlinedIcon,
};
const TICKET_TYPE_COLOR = {
  new_reply: "#0ea5e9",
  status_changed: "#9333ea",
  submitted: "#d97706",
  approved: "#16a34a",
  ticket_assigned: "#3b82f6",
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const {
    // task notifications
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    markTaskNotificationsRead,
    // ticket notifications
    ticketNotifications,
    ticketUnreadCount,
    ticketLoading,
    markTicketAsRead,
    markAllTicketAsRead,
    markTicketNotificationsRead,
  } = useNotification();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const totalUnread = unreadCount + ticketUnreadCount;
  const isLoading = loading || ticketLoading;

  // merge both domains into one time-sorted feed, tagging each with its
  // kind so click handling and icon lookup know which map to use
  const merged = [
    ...notifications.map((n) => ({ ...n, __kind: "task" })),
    ...ticketNotifications.map((n) => ({ ...n, __kind: "ticket" })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const visible = merged.slice(0, 20);

  const handleClickNotification = async (n) => {
    if (n.__kind === "task") {
      if (!n.is_read) await markAsRead(n.id);
      handleClose();
      if (n.task_id != null) {
        await markTaskNotificationsRead(n.task_id);
        navigate(`/tasks/details/${n.task_id}`);
      }
    } else {
      if (!n.is_read) await markTicketAsRead(n.id);
      handleClose();
      if (n.ticket_id != null) {
        await markTicketNotificationsRead(n.ticket_id);
        navigate(`/tickets/details/${n.ticket_id}`);
      }
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    await Promise.all([markAllAsRead(), markAllTicketAsRead()]);
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        sx={{
          color: "rgba(255,255,255,0.85)",
          "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.12)" },
        }}
      >
        <Badge
          badgeContent={totalUnread}
          max={99}
          color="error"
          sx={{ "& .MuiBadge-badge": { fontSize: 10, height: 16, minWidth: 16 } }}
        >
          <NotificationsOutlinedIcon sx={{ fontSize: 20 }} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 4,
          sx: {
            mt: 1,
            width: 380,
            maxHeight: 460,
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={{ px: 2, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
          {totalUnread > 0 && (
            <Button size="small" onClick={handleMarkAllRead} sx={{ textTransform: "none", fontSize: 12, minWidth: 0, p: 0.5 }}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        <Box sx={{ maxHeight: 380, overflowY: "auto" }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={22} />
            </Box>
          ) : visible.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">No notifications yet.</Typography>
            </Box>
          ) : (
            visible.map((n) => {
              const isTicket = n.__kind === "ticket";
              const Icon = isTicket
                ? (TICKET_TYPE_ICON[n.notification_type] || ConfirmationNumberOutlinedIcon)
                : (TASK_TYPE_ICON[n.notification_type] || AssignmentIcon);
              const color = isTicket
                ? (TICKET_TYPE_COLOR[n.notification_type] || "#3b82f6")
                : (TASK_TYPE_COLOR[n.notification_type] || "#3b82f6");
              return (
                <MenuItem
                  key={`${n.__kind}-${n.id}`}
                  onClick={() => handleClickNotification(n)}
                  sx={{
                    alignItems: "flex-start",
                    gap: 1.25,
                    py: 1.1,
                    whiteSpace: "normal",
                    bgcolor: n.is_read ? "transparent" : "action.hover",
                  }}
                >
                  <Box sx={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    bgcolor: `${color}1f`,
                  }}>
                    <Icon sx={{ fontSize: 15, color }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: n.is_read ? 500 : 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {n.title || (isTicket ? "Ticket update" : "Notification")}
                      </Typography>
                      {!n.is_read && <CircleIcon sx={{ fontSize: 7, color: "#2563eb", flexShrink: 0 }} />}
                    </Box>
                    {n.message && (
                      <Typography variant="caption" color="text.secondary" sx={{
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {n.message}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.25 }}>
                      {isTicket && n.ticket_id != null ? `Ticket #${n.ticket_id} · ` : ""}
                      {formatRelative(n.created_at)}
                    </Typography>
                  </Box>
                </MenuItem>
              );
            })
          )}
        </Box>
      </Menu>
    </>
  );
}