// ===============================
// File: src/pages/tickets/components/TicketChat.jsx
// ===============================

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Box, Typography, Avatar, CircularProgress, Tooltip, IconButton } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import { API } from "../../../config/api";
import TicketReplyBox from "./TicketReplyBox";
import useNotification from "../../../hooks/useNotification";

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

// crude but reliable enough check for "does this string look like an
// email" — used to catch backends that put the email INTO the name
// field itself, which `name || emailToName(email)` alone can't catch
// since a truthy `name` short-circuits before emailToName ever runs.
function looksLikeEmail(str) {
  return typeof str === "string" && /\S+@\S+\.\S+/.test(str);
}

function emailToName(email) {
  if (!email) return null;
  const local = email.split("@")[0];
  return local.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

// Resolves a display name for a user record, guaranteed never to return
// a raw email — falls through: real name -> derived from email field ->
// derived from name field (if THAT was actually an email) -> `#id`.
function resolveDisplayName(u) {
  if (!u) return null;
  if (u.name && !looksLikeEmail(u.name)) return u.name;
  if (u.email) return emailToName(u.email) || u.email;
  if (u.name) return emailToName(u.name) || u.name; // name field held an email
  return `#${u.id}`;
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function formatSize(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ws://.../ws/tickets/{ticket_id} — built off the same host/protocol the
// REST ticket API already uses, so it automatically matches http/ws or
// https/wss without a separate env var. Same pattern as TaskDetails'
// buildTaskSocketUrl.
function buildTicketSocketUrl(ticketId) {
  try {
    const restUrl = new URL(API.GET_TICKET(ticketId));
    const wsProtocol = restUrl.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${restUrl.host}/ws/tickets/${ticketId}`;
  } catch {
    return null;
  }
}

// ── system entry — status/submit/approve style events, shown centered
// like TaskDetails' StatusEntry, sourced from ticket-notifications
// (excluding "new_reply" which is already rendered as a chat bubble). ──
const SYSTEM_ICON = {
  status_changed: SyncAltIcon,
  submitted: SendOutlinedIcon,
  approved: ThumbUpAltOutlinedIcon,
  ticket_assigned: ConfirmationNumberOutlinedIcon,
};

// One palette entry per event type — soft gradient pill background,
// matching border, and an icon tint. Mirrors TaskDetails' StatusEntry
// pill but color-coded per event instead of always purple, since a
// ticket's system feed carries more event variety than a task's.
const SYSTEM_PALETTE = {
  status_changed:  { bg: "linear-gradient(135deg, #f3e8ff, #ede9fe)", border: "#e9d5ff", icon: "#9333ea" },
  submitted:       { bg: "linear-gradient(135deg, #fef3c7, #fde68a)", border: "#fde68a", icon: "#d97706" },
  approved:        { bg: "linear-gradient(135deg, #dcfce7, #bbf7d0)", border: "#bbf7d0", icon: "#16a34a" },
  ticket_assigned: { bg: "linear-gradient(135deg, #dbeafe, #bfdbfe)", border: "#bfdbfe", icon: "#3b82f6" },
};

function SystemEntry({ entry }) {
  const Icon = SYSTEM_ICON[entry.notification_type] || SyncAltIcon;
  const palette = SYSTEM_PALETTE[entry.notification_type] || SYSTEM_PALETTE.status_changed;

  // Prefer explicit old_status/new_status fields (bold "A → B", same as
  // TaskDetails' StatusEntry) when the backend sends them on the
  // notification payload; otherwise fall back to whatever title/message
  // the backend already generated.
  const isStatusChange = entry.notification_type === "status_changed";
  const hasStatusPair = isStatusChange && entry.old_status && entry.new_status;

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
      <Box sx={{
        display: "flex", alignItems: "flex-start", gap: 1,
        p: 1, px: 1.75, borderRadius: 99, maxWidth: "90%",
        backgroundImage: palette.bg,
        border: "1px solid", borderColor: palette.border,
      }}>
        <Icon sx={{ fontSize: 15, color: palette.icon, mt: 0.15, flexShrink: 0 }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ display: "block", fontWeight: 600 }}>
            {hasStatusPair ? (
              <>Status changed <strong>{entry.old_status}</strong> → <strong>{entry.new_status}</strong></>
            ) : (
              entry.title || "Update"
            )}
          </Typography>
          {entry.message && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {entry.message}
            </Typography>
          )}
          <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.25 }}>
            {formatTime(entry.created_at)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Reply thread + activity feed for a single ticket. Fetches replies from
 * GET /tickets/{id} once on mount, then stays live via a websocket at
 * /ws/tickets/{ticket_id}: any { type: "new_reply", reply } message
 * appends that reply immediately. Status/submit/approve system events
 * come from the global ticket-notifications list (NotificationContext),
 * filtered to this ticket and merged into the same time-sorted feed —
 * mirrors how TaskDetails merges progress + status history.
 *
 * Pass ticketId; optionally pass a pre-fetched `initialReplies` if
 * TicketDetails already loaded the ticket.
 *
 * Note: a toast for these events is handled centrally in
 * NotificationContext (only "submitted" / "approved" pop a toast — plain
 * replies and routine status changes just update the bell + this feed).
 */
export default function TicketChat({ ticketId, initialReplies = null }) {
  const [replies, setReplies] = useState(initialReplies || []);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(!initialReplies);
  const [wsConnected, setWsConnected] = useState(false);

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const {
    ticketNotifications,
    fetchTicketNotifications,
    markTicketNotificationsRead,
  } = useNotification();

  const currentUserId = useMemo(() => {
    const user = getStoredUser();
    return user?.user_id ?? user?.id ?? null;
  }, []);

  useEffect(() => {
    if (API.GET_USERS) {
      axios.get(API.GET_USERS, { headers: authHeaders() })
        .then((res) => setUsers(res.data || []))
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (initialReplies) return; // already have them, skip fetch
    if (!ticketId) return;

    setLoading(true);
    axios
      .get(API.GET_TICKET(ticketId), { headers: authHeaders() })
      .then((res) => setReplies(res.data?.replies || []))
      .catch((err) => {
        console.error("Failed to load ticket replies:", err);
        toast.error("Failed to load conversation.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  // clear unread ticket notifications for this ticket the moment the
  // chat is open, same pattern TaskDetails uses for task notifications
  useEffect(() => {
    if (!ticketId || !markTicketNotificationsRead) return;
    markTicketNotificationsRead(ticketId);
  }, [ticketId, markTicketNotificationsRead]);

  // append a reply if it isn't already in the list (guards against the
  // sender's own optimistic append arriving twice — once locally via
  // handleReplySent, once again when the socket echoes it back)
  const appendReplyIfNew = useCallback((reply) => {
    if (!reply?.id) return;
    setReplies((prev) => (prev.some((r) => r.id === reply.id) ? prev : [...prev, reply]));
  }, []);

  // ── WebSocket — live reply sync for this ticket. Notification pushes
  // (status/submit/approve) arrive on the separate global notification
  // socket in NotificationContext, which we just resync from here. ──────
  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;

    const connect = () => {
      const url = buildTicketSocketUrl(ticketId);
      if (!url) return;

      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;
        setWsConnected(true);
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.type === "new_reply" && data.reply) {
          appendReplyIfNew(data.reply);
        }

        // status/submit/approve events on this ticket also refresh the
        // shared ticket-notifications list so the system entries below
        // update without waiting for the next global notification push
        if (
          data.type === "status_changed" ||
          data.type === "submitted" ||
          data.type === "approved" ||
          data.type === "ticket_assigned"
        ) {
          fetchTicketNotifications?.();
        }
      };

      socket.onclose = () => {
        if (cancelled) return;
        setWsConnected(false);
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [ticketId, appendReplyIfNew, fetchTicketNotifications]);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.id] = resolveDisplayName(u);
    });
    return map;
  }, [users]);

  const handleReplySent = (newReply) => {
    appendReplyIfNew(newReply);
  };

  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      const response = await axios.get(
        API.DOWNLOAD_TICKET_ATTACHMENT(attachmentId),
        { headers: authHeaders(), responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "attachment";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download attachment.");
    }
  };

  const handleDeleteAttachment = async (attachmentId, replyId) => {
    const confirmed = window.confirm("Delete this attachment?");
    if (!confirmed) return;
    try {
      await axios.delete(API.DELETE_TICKET_ATTACHMENT(attachmentId), { headers: authHeaders() });
      setReplies((prev) =>
        prev.map((r) =>
          r.id === replyId
            ? { ...r, attachments: (r.attachments || []).filter((a) => a.id !== attachmentId) }
            : r
        )
      );
      toast.success("Attachment deleted.");
    } catch (err) {
      console.error("Delete attachment failed:", err);
      toast.error(err.response?.data?.detail?.[0]?.msg || "Failed to delete attachment.");
    }
  };

  // ── merged, time-sorted feed: chat replies + system entries (status
  // changed / submitted / approved / assigned) from ticket notifications
  // scoped to this ticket, excluding new_reply (already a chat bubble). ──
  const activity = useMemo(() => {
    const systemEntries = (ticketNotifications || [])
      .filter((n) => n.ticket_id === ticketId && n.notification_type !== "new_reply")
      .map((n) => ({ type: "system", at: n.created_at, ...n }));

    const replyEntries = replies.map((r) => ({ type: "reply", at: r.created_at, ...r }));

    return [...replyEntries, ...systemEntries].sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [replies, ticketNotifications, ticketId]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{
        px: 1.5, py: 0.75, display: "flex", alignItems: "center", gap: 0.75,
        borderBottom: "1px solid", borderColor: "divider",
        backgroundImage: "linear-gradient(90deg, #ffffff, #f8fafc)",
      }}>
        <Tooltip title={wsConnected ? "Live updates connected" : "Reconnecting…"}>
          <CircleIcon
            sx={{
              fontSize: 9, color: wsConnected ? "#16a34a" : "#d1d5db",
              "@keyframes ticketChatLivePulse": {
                "0%":   { boxShadow: "0 0 0 0 rgba(22,163,74,0.5)" },
                "70%":  { boxShadow: "0 0 0 6px rgba(22,163,74,0)" },
                "100%": { boxShadow: "0 0 0 0 rgba(22,163,74,0)" },
              },
              animation: wsConnected ? "ticketChatLivePulse 2s infinite" : "none",
              borderRadius: "50%",
            }}
          />
        </Tooltip>
        <Typography variant="caption" color="text.secondary">
          {wsConnected ? "Live" : "Reconnecting…"}
        </Typography>
      </Box>

      <Box sx={{
        flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1.5,
        backgroundImage: "linear-gradient(180deg, #fafafa 0%, #f5f3ff 100%)",
      }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : activity.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            No replies yet. Start the conversation below.
          </Typography>
        ) : (
          activity.map((entry, i) => {
            if (entry.type === "system") {
              return <SystemEntry key={`sys-${entry.id ?? i}`} entry={entry} />;
            }

            const r = entry;
            const isMine = String(r.sender_id) === String(currentUserId);
            const senderName = userMap[r.sender_id] || `#${r.sender_id}`;
            return (
              <Box
                key={`reply-${r.id}`}
                sx={{
                  display: "flex",
                  flexDirection: isMine ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 28, height: 28, fontSize: "0.75rem", flexShrink: 0,
                    backgroundImage: isMine
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "linear-gradient(135deg, #f59e0b, #f97316)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  }}
                >
                  {senderName.charAt(0).toUpperCase()}
                </Avatar>
                <Box
                  sx={{
                    maxWidth: "70%",
                    borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    backgroundImage: isMine ? "linear-gradient(135deg, #6366f1, #7c3aed)" : "none",
                    bgcolor: isMine ? "transparent" : "#ffffff",
                    color: isMine ? "#fff" : "text.primary",
                    border: isMine ? "none" : "1px solid",
                    borderColor: "divider",
                    boxShadow: isMine ? "0 4px 12px rgba(99,102,241,0.28)" : "0 1px 3px rgba(15,23,42,0.06)",
                    px: 1.5, py: 1,
                  }}
                >
                  {!isMine && (
                    <Typography variant="caption" fontWeight={700} sx={{ display: "block", opacity: 0.8 }}>
                      {senderName}
                    </Typography>
                  )}
                  {r.message && (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {r.message}
                    </Typography>
                  )}
                  {r.attachments?.length > 0 && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: r.message ? 0.75 : 0 }}>
                      {r.attachments.map((a) => {
                        const name = a.original_file_name || a.file_name || a.name || "Attachment";
                        return (
                          <Box
                            key={a.id}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1,
                              px: 1, py: 0.5,
                              borderRadius: 1.5,
                              bgcolor: isMine ? "rgba(255,255,255,0.15)" : "background.paper",
                              border: "1px solid",
                              borderColor: isMine ? "rgba(255,255,255,0.3)" : "divider",
                              transition: "box-shadow 0.15s ease, transform 0.15s ease",
                              "&:hover": { boxShadow: "0 2px 8px rgba(15,23,42,0.1)", transform: "translateY(-1px)" },
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                              <AttachFileIcon sx={{ fontSize: 14, flexShrink: 0 }} />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="caption" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                                  {name}
                                </Typography>
                                {a.file_size != null && (
                                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                    {formatSize(a.file_size)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadAttachment(a.id, name)}
                                title="Download"
                                sx={{ color: "inherit" }}
                              >
                                <DownloadIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                              {isMine && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteAttachment(a.id, r.id)}
                                  title="Delete attachment"
                                  sx={{ color: "inherit" }}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 0.5, opacity: 0.7, textAlign: isMine ? "right" : "left" }}
                  >
                    {formatTime(r.created_at)}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      <TicketReplyBox ticketId={ticketId} onReplySent={handleReplySent} />
    </Box>
  );
}