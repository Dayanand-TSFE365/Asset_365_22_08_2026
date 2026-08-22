// ===============================
// File: src/pages/tasks/components/TaskDetails.jsx
// ===============================

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box, Paper, Typography, Divider, Avatar, IconButton,
  Chip, LinearProgress, TextField, Button, Checkbox,
  Tooltip, CircularProgress,
} from "@mui/material";
import ArrowBackIcon      from "@mui/icons-material/ArrowBack";
import EditIcon           from "@mui/icons-material/Edit";
import AttachFileIcon     from "@mui/icons-material/AttachFile";
import SendIcon           from "@mui/icons-material/Send";
import DownloadIcon       from "@mui/icons-material/Download";
import DeleteIcon         from "@mui/icons-material/Delete";
import CheckCircleIcon    from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import FlagIcon           from "@mui/icons-material/Flag";
import SyncAltIcon        from "@mui/icons-material/SyncAlt";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CloseIcon          from "@mui/icons-material/Close";
import CircleIcon         from "@mui/icons-material/Circle";
import ListAltIcon        from "@mui/icons-material/ListAlt";
import InfoOutlinedIcon   from "@mui/icons-material/InfoOutlined";
import TrendingUpIcon     from "@mui/icons-material/TrendingUp";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import FolderOpenIcon     from "@mui/icons-material/FolderOpen";
import ForumIcon          from "@mui/icons-material/Forum";
import toast              from "react-hot-toast";
import { API } from "../../../config/api"; // ⚠️ adjust path to wherever api.js lives
import { useAuth } from "../../../auth/AuthContext";
import { hasPermission } from "../../../utils/permissions"; // ⚠️ adjust path if needed
import useNotification from "../../../hooks/useNotification";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_COLOR = { High: "#dc2626", Medium: "#d97706", Low: "#16a34a" };
const STATUS_STYLE   = {
  "Pending":          { bg: "#f3f4f6", text: "#6b7280" },
  "In Progress":      { bg: "#eff6ff", text: "#2563eb" },
  "Waiting Approval": { bg: "#fdf4ff", text: "#9333ea" },
  "Completed":        { bg: "#f0fdf4", text: "#16a34a" },
  "Overdue":          { bg: "#fef2f2", text: "#dc2626" },
};

// ── Purely presentational additions — soft gradient variants of the maps
// above (used for chip backgrounds) and a small per-section accent palette
// so each card on the left panel reads as its own "zone" at a glance. ──────
const STATUS_GRADIENT = {
  "Pending":          "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
  "In Progress":      "linear-gradient(135deg, #dbeafe, #bfdbfe)",
  "Waiting Approval": "linear-gradient(135deg, #f3e8ff, #e9d5ff)",
  "Completed":        "linear-gradient(135deg, #dcfce7, #bbf7d0)",
  "Overdue":          "linear-gradient(135deg, #fee2e2, #fecaca)",
};
const PRIORITY_GRADIENT = {
  High:   "linear-gradient(135deg, #fee2e2, #fecaca)",
  Medium: "linear-gradient(135deg, #fef3c7, #fde68a)",
  Low:    "linear-gradient(135deg, #dcfce7, #bbf7d0)",
};
const SECTION_ACCENT = {
  info:        "#6366f1",
  progress:    "#10b981",
  checklist:   "#f59e0b",
  attachments: "#0ea5e9",
  discussion:  "#8b5cf6",
};

function authHeaders() {
  const token = sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function emailToName(raw = "") {
  if (!raw) return raw;
  if (!raw.includes("@")) return raw;
  const local = raw.split("@")[0];
  return local.split(/[._]/).filter(Boolean).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

function initialsFromEmail(raw = "") {
  const name = emailToName(raw);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function useTaskAuth() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  return { isSuperAdmin, currentUserId: user?.user_id };
}

// Backend sends naive timestamps ("2026-07-31T05:33:00") with no timezone
// marker. Without forcing UTC here, `new Date(iso)` treats them as if
// already local, which is why times were off by exactly the IST offset.
function toDate(isoString) {
  if (!isoString) return null;
  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(isoString);
  return new Date(hasTimezone ? isoString : `${isoString}Z`);
}

function formatDate(iso) {
  const d = toDate(iso);
  if (!d || isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(iso) {
  const d = toDate(iso);
  if (!d || isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatSize(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Task websocket ONLY — notification websocket lives entirely in
// NotificationContext now, connected once at the Layout level. ─────────────
function buildTaskSocketUrl(taskId) {
  try {
    const restUrl = new URL(API.GET_TASK(taskId));
    const wsProtocol = restUrl.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${restUrl.host}/ws/tasks/${taskId}`;
  } catch {
    return null;
  }
}

function MetaRow({ label, children }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 130, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box>{children}</Box>
    </Box>
  );
}

// Small colored icon badge + label used to open every card on the left
// panel — gives each section its own "zone" without adding real structure.
function SectionHeader({ icon, label, color, right }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 28, height: 28, borderRadius: 1.5,
            display: "flex", alignItems: "center", justifyContent: "center",
            bgcolor: `${color}1f`, color,
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
          {label}
        </Typography>
      </Box>
      {right}
    </Box>
  );
}

// Three-dot "someone is typing" indicator — purely decorative, sits next
// to the existing typingLabel text.
function TypingDots() {
  return (
    <Box sx={{ display: "inline-flex", gap: 0.4, verticalAlign: "middle", ml: 0.75 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 5, height: 5, borderRadius: "50%", bgcolor: "#8b5cf6",
            animation: "taskChatTypingBounce 1.2s infinite",
            animationDelay: `${i * 0.15}s`,
            "@keyframes taskChatTypingBounce": {
              "0%, 60%, 100%": { transform: "translateY(0)", opacity: 0.4 },
              "30%": { transform: "translateY(-3px)", opacity: 1 },
            },
          }}
        />
      ))}
    </Box>
  );
}

// ─── Chat bubble for a progress entry — message text + any attached files ──
function ChatMessage({ entry, senderName, isOwn, attachments, attachmentsLoading, onDeleteAttachment, onDownloadAttachment, canDeleteAttachment }) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexDirection: isOwn ? "row-reverse" : "row" }}>
      <Avatar
        sx={{
          width: 28, height: 28, fontSize: 11, flexShrink: 0,
          backgroundImage: isOwn
            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
            : "linear-gradient(135deg, #f59e0b, #f97316)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
      >
        {initialsFromEmail(senderName)}
      </Avatar>
      <Box sx={{ minWidth: 0, maxWidth: "80%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25, flexDirection: isOwn ? "row-reverse" : "row" }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>{isOwn ? "You" : emailToName(senderName)}</Typography>
          <Typography variant="caption" color="text.secondary">{formatDateTime(entry.created_at)}</Typography>
        </Box>

        <Box sx={{
          p: 1.25,
          borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          backgroundImage: isOwn ? "linear-gradient(135deg, #6366f1, #7c3aed)" : "none",
          bgcolor: isOwn ? "transparent" : "#ffffff",
          color: isOwn ? "#fff" : "text.primary",
          border: isOwn ? "none" : "1px solid",
          borderColor: "divider",
          boxShadow: isOwn ? "0 4px 12px rgba(99,102,241,0.28)" : "0 1px 3px rgba(15,23,42,0.06)",
          transition: "box-shadow 0.15s ease",
        }}>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{entry.message}</Typography>

          {(entry.hours_worked || entry.hours_remaining || entry.blockers) && (
            <Box sx={{ display: "flex", gap: 2, mt: 0.5, flexWrap: "wrap" }}>
              {!!entry.hours_worked && (
                <Typography variant="caption" sx={{ opacity: isOwn ? 0.85 : undefined }} color={isOwn ? undefined : "text.secondary"}>
                  Worked: {entry.hours_worked}h
                </Typography>
              )}
              {!!entry.hours_remaining && (
                <Typography variant="caption" sx={{ opacity: isOwn ? 0.85 : undefined }} color={isOwn ? undefined : "text.secondary"}>
                  Remaining: {entry.hours_remaining}h
                </Typography>
              )}
              {entry.blockers && (
                <Typography variant="caption" sx={{ color: isOwn ? "#fecaca" : "#dc2626", fontWeight: 600 }}>
                  Blocker: {entry.blockers}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Attachments for this message */}
        {attachmentsLoading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
            <CircularProgress size={12} />
            <Typography variant="caption" color="text.secondary">Loading attachments…</Typography>
          </Box>
        ) : attachments && attachments.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.75 }}>
            {attachments.map((f) => (
              <Box
                key={f.id}
                sx={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1,
                  px: 1, py: 0.5, borderRadius: 1.5, bgcolor: "background.paper",
                  border: "1px solid", borderColor: "divider",
                  transition: "box-shadow 0.15s ease, transform 0.15s ease",
                  "&:hover": { boxShadow: "0 2px 8px rgba(15,23,42,0.1)", transform: "translateY(-1px)" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                  <Box sx={{
                    width: 22, height: 22, borderRadius: 1, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    bgcolor: "rgba(14,165,233,0.12)", color: "#0ea5e9",
                  }}>
                    <InsertDriveFileIcon sx={{ fontSize: 14 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                      {f.file_name}
                    </Typography>
                    {f.file_size != null && (
                      <Typography variant="caption" color="text.secondary">{formatSize(f.file_size)}</Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <IconButton
                    size="small"
                    onClick={() => onDownloadAttachment(f.id, f.file_name)}
                    title="Download"
                    sx={{ "&:hover": { bgcolor: "rgba(14,165,233,0.1)", color: "#0ea5e9" } }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>

                  {canDeleteAttachment && (
                    <IconButton
                      size="small"
                      onClick={() => onDeleteAttachment(f.id, entry.id)}
                      title="Delete attachment"
                      sx={{ "&:hover": { bgcolor: "rgba(220,38,38,0.08)" } }}
                    >
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

// ─── Status-change entry — kept separate from chat bubbles, shown centered ──
function StatusEntry({ entry }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
      <Box sx={{
        display: "flex", alignItems: "center", gap: 1,
        p: 1, px: 1.75, borderRadius: 99, maxWidth: "90%",
        backgroundImage: "linear-gradient(135deg, #f3e8ff, #ede9fe)",
        border: "1px solid #e9d5ff",
      }}>
        <SyncAltIcon sx={{ fontSize: 14, color: "#9333ea", flexShrink: 0 }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ display: "block" }}>
            Status changed <strong>{entry.old_status || "—"}</strong> → <strong>{entry.new_status}</strong>
          </Typography>
          {entry.remarks && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{entry.remarks}</Typography>
          )}
          <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.25 }}>
            {formatDateTime(entry.changed_at)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ─── TaskDetails ──────────────────────────────────────────────────────────────
export default function TaskDetails() {
  const { id }      = useParams();
  const location    = useLocation();
  const navigate    = useNavigate();
  const { isSuperAdmin, currentUserId } = useTaskAuth();
  const { markTaskNotificationsRead } = useNotification();

  const taskId = Number(id) || location.state?.data?.id;

  const [task, setTask]               = useState(location.state?.data || null);
  const [users, setUsers]             = useState([]);
  const [progressHistory, setProgressHistory] = useState([]);
  const [statusHistory, setStatusHistory]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  const [checklist, setChecklist]     = useState([]);
  // itemId -> true while a PATCH for that item is in flight
  const [checklistSavingIds, setChecklistSavingIds] = useState({});

  // Progress is derived entirely from checklist completion — no more
  // separate stored/picked progress value. Recomputes live on every
  // checklist toggle since it just reads current `checklist` state.
  const doneCount = checklist.filter((i) => i.is_completed).length;
  const currentProgress = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

  // ── chat state ──
  const [chatText, setChatText]       = useState("");
  const [chatFiles, setChatFiles]     = useState([]); // File[] staged for the next message
  const [sending, setSending]         = useState(false);
  const chatFileInputRef = useRef(null);

  // progress_id -> { loading, files, error }
  const [attachmentsCache, setAttachmentsCache] = useState({});

  // ── typing indicator ──
  const [typingUsers, setTypingUsers] = useState({});
  const typingUsersTimeoutsRef = useRef({});
  const typingThrottleRef = useRef(0);

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const fetchProgressAttachments = useCallback(async (progressId) => {
    setAttachmentsCache((prev) => ({ ...prev, [progressId]: { loading: true, files: prev[progressId]?.files || [] } }));
    try {
      const res = await axios.get(API.GET_PROGRESS_ATTACHMENTS(progressId), { headers: authHeaders() });
      setAttachmentsCache((prev) => ({ ...prev, [progressId]: { loading: false, files: res.data || [] } }));
    } catch (err) {
      console.error(`Failed to load attachments for progress ${progressId}:`, err);
      setAttachmentsCache((prev) => ({ ...prev, [progressId]: { loading: false, files: [], error: true } }));
    }
  }, []);

  // ── targeted refetchers ──
  const fetchTaskOnly = useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await axios.get(API.GET_TASK(taskId), { headers: authHeaders() });
      setTask(res.data);
      setChecklist(res.data.checklists || []);
    } catch (err) {
      console.error("Failed to refetch task:", err);
    }
  }, [taskId]);

  const fetchProgressHistory = useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await axios.get(API.GET_TASK_PROGRESS_HISTORY(taskId), { headers: authHeaders() });
      const progress = res.data || [];
      setProgressHistory(progress);
      progress.forEach((p) => {
        setAttachmentsCache((prev) => {
          if (!prev[p.id]) fetchProgressAttachments(p.id);
          return prev;
        });
      });
    } catch (err) {
      console.error("Failed to refetch progress history:", err);
    }
  }, [taskId, fetchProgressAttachments]);

  const fetchStatusHistory = useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await axios.get(API.GET_TASK_STATUS_HISTORY(taskId), { headers: authHeaders() });
      setStatusHistory(res.data || []);
    } catch (err) {
      console.error("Failed to refetch status history:", err);
    }
  }, [taskId]);

  // ── initial full load ────────────────────────────────────────────────
  useEffect(() => {
    if (!taskId) return;
    (async () => {
      setLoading(true);
      const h = authHeaders();
      try {
        const [taskRes, usersRes, progressRes, statusRes] = await Promise.all([
          axios.get(API.GET_TASK(taskId), { headers: h }),
          axios.get(API.GET_USERS, { headers: h }),
          axios.get(API.GET_TASK_PROGRESS_HISTORY(taskId), { headers: h }),
          axios.get(API.GET_TASK_STATUS_HISTORY(taskId), { headers: h }),
        ]);
        setTask(taskRes.data);
        setUsers(usersRes.data || []);
        const progress = progressRes.data || [];
        setProgressHistory(progress);
        setStatusHistory(statusRes.data || []);
        setChecklist(taskRes.data.checklists || []);
        progress.forEach((p) => fetchProgressAttachments(p.id));
      } catch (err) {
        console.error(err);
        if (err?.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
        } else {
          toast.error("Failed to load task.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [taskId, fetchProgressAttachments]);

  // ── clear notifications for this task once it's loaded, regardless of
  // whether the person arrived via a notification click, the Task No link
  // in TaskList, or any other route. Delegates entirely to
  // NotificationContext now — no local fetch/patch logic here. ────────────
  useEffect(() => {
    if (!taskId || !markTaskNotificationsRead) return;
    markTaskNotificationsRead(taskId);
  }, [taskId, markTaskNotificationsRead]);

  // ── WebSocket — TASK updates only. Notification websocket lives in
  // NotificationContext, connected once at the Layout level — nothing
  // notification-related happens in this file anymore. ────────────────────
  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;

    const connect = () => {
      const url = buildTaskSocketUrl(taskId);
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

        switch (data.type) {
          case "progress_created":
          fetchProgressHistory();

          if (document.visibilityState === "visible") {
              markTaskNotificationsRead(taskId);
          }

          break;

          case "attachment_uploaded":
            fetchProgressAttachments(data.progress_id);
            break;

          case "status_changed":
            fetchTaskOnly();
            fetchStatusHistory();
            break;

          case "checklist_updated":
            fetchTaskOnly();
            break;

          case "typing": {
            const uid = data.user_id;
            if (uid == null || uid === currentUserId) break;
            setTypingUsers((prev) => ({ ...prev, [uid]: Date.now() }));
            if (typingUsersTimeoutsRef.current[uid]) {
              clearTimeout(typingUsersTimeoutsRef.current[uid]);
            }
            typingUsersTimeoutsRef.current[uid] = setTimeout(() => {
              setTypingUsers((prev) => {
                const next = { ...prev };
                delete next[uid];
                return next;
              });
            }, 3000);
            break;
          }

          default:
            break;
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
      Object.values(typingUsersTimeoutsRef.current).forEach(clearTimeout);
      typingUsersTimeoutsRef.current = {};
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [taskId, fetchProgressHistory, fetchTaskOnly, fetchStatusHistory, fetchProgressAttachments, currentUserId]);

  const userMap = useMemo(() => {
    const m = {};
    users.forEach((u) => { m[u.id] = u.name; });
    return m;
  }, [users]);

  const typingLabel = useMemo(() => {
    const names = Object.keys(typingUsers)
      .filter((uid) => Number(uid) !== currentUserId)
      .map((uid) => emailToName(userMap[uid] || `User #${uid}`));
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing…`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
    return `${names.length} people are typing…`;
  }, [typingUsers, userMap, currentUserId]);

  // ── merged, time-sorted activity feed from real data ─────────────────
  const activity = useMemo(() => {
    const items = [
      ...progressHistory.map((p) => ({ type: "progress", at: p.created_at, ...p })),
      ...statusHistory.map((s) => ({ type: "status", at: s.changed_at, ...s })),
    ];
    return items.sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [progressHistory, statusHistory]);

  // ── checklist: real PATCH via UPDATE_CHECKLIST, optimistic with
  // rollback on failure. Since currentProgress derives from `checklist`
  // state, toggling an item here moves the progress bar immediately. ────
  const handleChecklistToggle = async (item) => {
    const nextCompleted = !item.is_completed;
    setChecklist((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_completed: nextCompleted } : i)));
    setChecklistSavingIds((prev) => ({ ...prev, [item.id]: true }));
    try {
      await axios.patch(
        API.UPDATE_CHECKLIST(item.id),
        { title: item.title, is_completed: nextCompleted },
        { headers: authHeaders() }
      );
    } catch (err) {
      console.error("Checklist update failed:", err.response?.data || err);
      toast.error("Failed to update checklist item.");
      setChecklist((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_completed: item.is_completed } : i)));
    } finally {
      setChecklistSavingIds((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  // ── chat: file staging ──────────────────────────────────────────────
  const handleChatFileChange = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length) setChatFiles((prev) => [...prev, ...picked]);
    e.target.value = "";
  };
  const removeChatFile = (idx) => {
    setChatFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const sendTypingEvent = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const now = Date.now();
    if (now - typingThrottleRef.current < 2000) return;
    typingThrottleRef.current = now;
    try {
      socket.send(JSON.stringify({ type: "typing", user_id: currentUserId, task_id: taskId }));
    } catch {
      // socket hiccup — not worth surfacing to the user for a typing ping
    }
  }, [currentUserId, taskId]);

  const handleChatTextChange = (e) => {
    setChatText(e.target.value);
    sendTypingEvent();
  };

  // ── chat: send message (= a progress entry) + optional attachments.
  // `progress` sent is the current checklist-derived snapshot, not
  // manually chosen. ────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!chatText.trim()) {
      toast.error("Type a message first.");
      return;
    }
    if (!taskId) return;

    setSending(true);
    const h = authHeaders();
    try {
      const res = await axios.post(
        API.CREATE_TASK_PROGRESS(taskId),
        {
          message: chatText,
          hours_worked: 0,
          hours_remaining: 0,
          progress: currentProgress,
          blockers: "",
        },
        { headers: h }
      );
      const progressId = res.data?.id;
      const newEntry = res.data;

      setProgressHistory((prev) => [...prev, newEntry]);

      if (progressId && chatFiles.length > 0) {
        const formData = new FormData();
        chatFiles.forEach((f) => formData.append("files", f));
        try {
          const uploadRes = await axios.post(API.UPLOAD_PROGRESS_ATTACHMENTS(progressId), formData, {
            headers: { ...h, "Content-Type": "multipart/form-data" },
          });

          const uploadedFiles = Array.isArray(uploadRes.data)
            ? uploadRes.data
            : (uploadRes.data?.files || uploadRes.data?.data || []);

          if (uploadedFiles.length > 0) {
            setAttachmentsCache((prev) => ({
              ...prev,
              [progressId]: {
                loading: false,
                files: [...(prev[progressId]?.files || []), ...uploadedFiles],
              },
            }));
          } else {
            fetchProgressAttachments(progressId);
          }
        } catch (uploadErr) {
          console.error("Attachment upload failed:", uploadErr.response?.data || uploadErr);
          toast.error("Message sent, but attachment upload failed.");
        }
      } else if (progressId) {
        setAttachmentsCache((prev) => (prev[progressId] ? prev : { ...prev, [progressId]: { loading: false, files: [] } }));
      }

      setChatText("");
      setChatFiles([]);
    } catch (err) {
      console.error("Send message failed:", err.response?.data || err);
      if (err?.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(err?.response?.data?.detail?.[0]?.msg || "Failed to send message.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId, progressId) => {
    const confirmed = window.confirm("Delete this attachment?");
    if (!confirmed) return;
    try {
      await axios.delete(API.DELETE_PROGRESS_ATTACHMENT(attachmentId), { headers: authHeaders() });
      toast.success("Attachment deleted.");
      fetchProgressAttachments(progressId);
    } catch (err) {
      console.error("Delete attachment failed:", err.response?.data || err);
      toast.error(err?.response?.data?.detail?.[0]?.msg || "Failed to delete attachment.");
    }
  };

  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      const response = await axios.get(
        API.DOWNLOAD_PROGRESS_ATTACHMENT(attachmentId),
        {
          headers: authHeaders(),
          responseType: "blob",
        }
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

  const handleSubmitForApproval = async () => {
    try {
      await axios.patch(
        API.CHANGE_TASK_STATUS(taskId),
        { status: "Waiting Approval", remarks: "Submitted for approval" },
        { headers: authHeaders() }
      );
      setTask((prev) => ({ ...prev, status: "Waiting Approval" }));
      toast.success("Submitted for approval.");
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Failed to update status.");
      }
    }
  };

  if (loading || !task) {
    return (
      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const statusStyle = STATUS_STYLE[task.status] || STATUS_STYLE["Pending"];
  const statusGradient = STATUS_GRADIENT[task.status] || STATUS_GRADIENT["Pending"];
  const priorityGradient = PRIORITY_GRADIENT[task.priority] || PRIORITY_GRADIENT.Low;
  const assignedName = userMap[task.assigned_to] || `User #${task.assigned_to}`;
  const createdByName = userMap[task.created_by] || `User #${task.created_by}`;

  // ── permission gates ──
  const canEdit         = hasPermission("update_tasks");
  const canReassign      = hasPermission("assign_tasks");
  const canChangeStatus  = hasPermission("update_tasks");

  const isAssignee = task.assigned_to === currentUserId;
  const isOwner     = task.created_by === currentUserId;

  const progressComplete = currentProgress >= 100;

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "background.default" }}>
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <Box sx={{
        px: 2, py: 1, display: "flex", alignItems: "center", gap: 1,
        borderBottom: "1px solid", borderColor: "divider", flexShrink: 0,
        backgroundImage: "linear-gradient(90deg, #ffffff, #f8fafc)",
      }}>
        <IconButton
          size="small"
          onClick={() => navigate(-1)}
          sx={{ "&:hover": { bgcolor: "rgba(99,102,241,0.08)", color: "#6366f1" } }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" color="text.secondary">Tasks /</Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700, fontFamily: "monospace", px: 1, py: 0.25, borderRadius: 1,
            bgcolor: "rgba(99,102,241,0.08)", color: "#4f46e5",
          }}
        >
          T{String(task.id).padStart(3, "0")}
        </Typography>

        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title={wsConnected ? "Live updates connected" : "Reconnecting…"}>
            <CircleIcon
              sx={{
                fontSize: 9, color: wsConnected ? "#16a34a" : "#d1d5db",
                "@keyframes taskDetailsLivePulse": {
                  "0%":   { boxShadow: "0 0 0 0 rgba(22,163,74,0.5)" },
                  "70%":  { boxShadow: "0 0 0 6px rgba(22,163,74,0)" },
                  "100%": { boxShadow: "0 0 0 0 rgba(22,163,74,0)" },
                },
                animation: wsConnected ? "taskDetailsLivePulse 2s infinite" : "none",
                borderRadius: "50%",
              }}
            />
          </Tooltip>
          <Chip
            label={task.status}
            size="small"
            sx={{ backgroundImage: statusGradient, color: statusStyle.text, fontWeight: 700, fontSize: 11 }}
          />

          <Tooltip title={!canReassign ? "You don't have permission to reassign tasks" : ""}>
            <span>
              <Button
                size="small"
                variant="outlined"
                disabled={!canReassign}
                onClick={() => navigate("/tasks/action/reassign", { state: { data: task } })}
                sx={{
                  textTransform: "none", fontSize: 12, borderRadius: 5,
                  transition: "transform 0.15s ease",
                  "&:hover": { transform: "translateY(-1px)" },
                }}
              >
                Reassign
              </Button>
            </span>
          </Tooltip>

          <Tooltip title={!canEdit ? "You don't have permission to edit tasks" : ""}>
            <span>
              <Button
                size="small"
                variant="outlined"
                disabled={!canEdit}
                onClick={() => navigate("/tasks/action/update", { state: { data: task } })}
                startIcon={<EditIcon fontSize="small" />}
                sx={{
                  textTransform: "none", fontSize: 12, borderRadius: 5,
                  transition: "transform 0.15s ease",
                  "&:hover": { transform: "translateY(-1px)" },
                }}
              >
                Edit
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Main content: left + right ──────────────────────────────── */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ══ LEFT PANEL ════════════════════════════════════════════ */}
        <Box sx={{ width: { xs: "100%", md: "65%" }, borderRight: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>

            <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start", mb: 1 }}>
              <Box sx={{ width: 4, borderRadius: 2, alignSelf: "stretch", backgroundImage: "linear-gradient(180deg, #6366f1, #8b5cf6)" }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{task.title}</Typography>
            </Box>

            <Box sx={{ mb: 2, pl: 2.25 }}>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {task.description || "No description."}
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Meta info box */}
            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, mb: 2, borderLeft: `4px solid ${SECTION_ACCENT.info}` }}
            >
              <SectionHeader icon={<InfoOutlinedIcon sx={{ fontSize: 16 }} />} label="Task Info" color={SECTION_ACCENT.info} />
              <MetaRow label="Task owner:">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar sx={{ width: 22, height: 22, fontSize: 10, backgroundImage: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}>
                    {initialsFromEmail(createdByName)}
                  </Avatar>
                  <Typography variant="body2">{emailToName(createdByName)}</Typography>
                </Box>
              </MetaRow>
              <MetaRow label="Assignee:">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar sx={{ width: 22, height: 22, fontSize: 10, backgroundImage: "linear-gradient(135deg, #60a5fa, #3b82f6)" }}>
                    {initialsFromEmail(assignedName)}
                  </Avatar>
                  <Typography variant="body2">{emailToName(assignedName)}</Typography>
                </Box>
              </MetaRow>
              <MetaRow label="Deadline:">
                <Typography variant="body2">{formatDate(task.deadline)}</Typography>
              </MetaRow>
              <MetaRow label="Status:">
                <Chip
                  label={task.status}
                  size="small"
                  sx={{ backgroundImage: statusGradient, color: statusStyle.text, fontWeight: 600, fontSize: 11 }}
                />
              </MetaRow>
              <MetaRow label="Priority:">
                <Box sx={{
                  display: "inline-flex", alignItems: "center", gap: 0.5,
                  px: 1, py: 0.25, borderRadius: 99, backgroundImage: priorityGradient,
                }}>
                  <FlagIcon sx={{ fontSize: 14, color: PRIORITY_COLOR[task.priority] }} />
                  <Typography variant="body2" sx={{ color: PRIORITY_COLOR[task.priority], fontWeight: 600 }}>
                    {task.priority}
                  </Typography>
                </Box>
              </MetaRow>
              <MetaRow label="Department:">
                <Typography variant="body2">{task.department}</Typography>
              </MetaRow>
              <MetaRow label="Est. Hours:">
                <Typography variant="body2">{task.estimated_hours ?? "—"}</Typography>
              </MetaRow>
              <MetaRow label="Created:">
                <Typography variant="body2">{formatDateTime(task.created_at)} / ID: {task.id}</Typography>
              </MetaRow>
            </Paper>

            {/* Progress — derived from checklist completion. */}
            <Box sx={{ mb: 2 }}>
              <SectionHeader
                icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
                label="Progress"
                color={SECTION_ACCENT.progress}
                right={
                  <Chip
                    label={`${currentProgress}%`}
                    size="small"
                    sx={{
                      fontWeight: 700, color: "#fff",
                      backgroundImage: "linear-gradient(135deg, #10b981, #34d399)",
                    }}
                  />
                }
              />
              <LinearProgress
                variant="determinate"
                value={currentProgress}
                sx={{
                  height: 10, borderRadius: 6,
                  bgcolor: "rgba(16,185,129,0.12)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 6,
                    backgroundImage: "linear-gradient(90deg, #10b981, #34d399)",
                  },
                }}
              />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {checklist.length > 0
                    ? `${doneCount}/${checklist.length} checklist items complete`
                    : "No checklist items."}
                </Typography>
                <Button
                  size="small"
                  startIcon={<ListAltIcon fontSize="small" />}
                  onClick={() =>
                    navigate(`/tasks/details/${task.id}/log`, {
                      state: { data: task },
                    })
                  }
                  sx={{ textTransform: "none", fontSize: 12 }}
                >
                  View Update Log
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Checklist — toggling PATCHes immediately AND drives the
                progress bar above. */}
            <Box sx={{ mb: 2 }}>
              <SectionHeader
                icon={<PlaylistAddCheckIcon sx={{ fontSize: 16 }} />}
                label={`Checklist (${doneCount}/${checklist.length})`}
                color={SECTION_ACCENT.checklist}
              />
              {checklist.length === 0 ? (
                <Typography variant="caption" color="text.secondary">No checklist items.</Typography>
              ) : (
                checklist.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: "flex", alignItems: "center", gap: 0.5, mb: 0.5,
                      borderRadius: 1.5, px: 1, py: 0.25,
                      bgcolor: item.is_completed ? "rgba(16,185,129,0.07)" : "transparent",
                      transition: "background-color 0.15s ease",
                      "&:hover": { bgcolor: item.is_completed ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.06)" },
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={item.is_completed}
                      onChange={() => handleChecklistToggle(item)}
                      disabled={!!checklistSavingIds[item.id]}
                      icon={<RadioButtonUncheckedIcon fontSize="small" />}
                      checkedIcon={<CheckCircleIcon fontSize="small" color="success" />}
                      sx={{ p: 0.5 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ textDecoration: item.is_completed ? "line-through" : "none", color: item.is_completed ? "text.disabled" : "text.primary" }}
                    >
                      {item.title}
                    </Typography>
                    {checklistSavingIds[item.id] && <CircularProgress size={12} sx={{ ml: 0.5 }} />}
                  </Box>
                ))
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Attachments — from task.attachments (files added at task creation) */}
            <Box>
              <SectionHeader
                icon={<FolderOpenIcon sx={{ fontSize: 16 }} />}
                label="Attachments"
                color={SECTION_ACCENT.attachments}
              />
              {(!task.attachments || task.attachments.length === 0) ? (
                <Typography variant="caption" color="text.secondary">No attachments.</Typography>
              ) : (
                task.attachments.map((f, i) => (
                  <Box
                    key={f.id ?? i}
                    sx={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", p: 1, mb: 0.75,
                      borderRadius: 1.5, border: "1px solid", borderColor: "divider",
                      transition: "box-shadow 0.15s ease, transform 0.15s ease",
                      "&:hover": { boxShadow: "0 2px 10px rgba(15,23,42,0.08)", transform: "translateY(-1px)" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: 1.5,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        bgcolor: "rgba(14,165,233,0.12)", color: "#0ea5e9",
                      }}>
                        <AttachFileIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{f.file_name || f.name || `File ${i + 1}`}</Typography>
                        {f.file_size && (
                          <Typography variant="caption" color="text.secondary">
                            {(f.file_size / 1024).toFixed(1)} KB
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleDownloadAttachment(
                            f.id,
                            f.file_name || f.name
                          )
                        }
                        sx={{ "&:hover": { bgcolor: "rgba(14,165,233,0.1)", color: "#0ea5e9" } }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))
              )}
            </Box>
          </Box>

          {/* ── Bottom action buttons ─────────────────────────────────── */}
          <Box sx={{ px: 3, py: 1.5, borderTop: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1, bgcolor: "background.paper", flexShrink: 0 }}>

            <Tooltip
              title={
                !isAssignee ? "Only the assignee can update progress" :
                task.status === "Completed" ? "Task is completed — nothing left to update" :
                task.status === "Waiting Approval" ? "Waiting on owner's review — nothing left to update" :
                progressComplete ? "Progress is at 100% — submit for approval" :
                ""
              }
            >
              <span>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    textTransform: "none", borderRadius: 5,
                    backgroundImage: "linear-gradient(135deg, #6366f1, #7c3aed)",
                    boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                    transition: "transform 0.15s ease",
                    "&:hover": { transform: "translateY(-1px)", backgroundImage: "linear-gradient(135deg, #4f46e5, #6d28d9)" },
                    "&.Mui-disabled": { backgroundImage: "none" },
                  }}
                  disabled={!isAssignee || task.status === "Completed" || task.status === "Waiting Approval" || progressComplete}
                  onClick={() => navigate("/tasks/action/progress", { state: { data: task } })}
                >
                  Update Progress
                </Button>
              </span>
            </Tooltip>

            {task.status !== "Completed" && task.status !== "Waiting Approval" && (
              <Tooltip title={!isAssignee ? "Only the assignee can submit for approval" : ""}>
                <span>
                  <Button
                    variant={progressComplete ? "contained" : "outlined"}
                    color={progressComplete ? "success" : "primary"}
                    size="small"
                    sx={{
                      textTransform: "none", borderRadius: 5,
                      transition: "transform 0.15s ease",
                      "&:hover": { transform: "translateY(-1px)" },
                      ...(progressComplete && {
                        backgroundImage: "linear-gradient(135deg, #16a34a, #22c55e)",
                        boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
                      }),
                    }}
                    disabled={!isAssignee}
                    onClick={handleSubmitForApproval}
                  >
                    Submit for Approval
                  </Button>
                </span>
              </Tooltip>
            )}

            {task.status === "Waiting Approval" && (
              <Tooltip
                title={
                  !canChangeStatus ? "You don't have permission" :
                  !isOwner ? "Only the task owner can review & close" : ""
                }
              >
                <span>
                  <Button
                    variant="outlined"
                    color="success"
                    size="small"
                    sx={{
                      textTransform: "none", borderRadius: 5,
                      transition: "transform 0.15s ease",
                      "&:hover": { transform: "translateY(-1px)" },
                    }}
                    disabled={!canChangeStatus || !isOwner}
                    onClick={() => navigate("/tasks/action/close", { state: { data: task } })}
                  >
                    Review & Close
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* ══ RIGHT PANEL — real chat, built on Task Progress, live via WS ═ */}
        <Box sx={{ flex: 1, display: { xs: "none", md: "flex" }, flexDirection: "column", overflow: "hidden" }}>
          <Box sx={{
            px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0,
            backgroundImage: "linear-gradient(135deg, #eef2ff, #f5f3ff)",
            display: "flex", alignItems: "center", gap: 1,
          }}>
            <Box sx={{
              width: 30, height: 30, borderRadius: 1.5, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              bgcolor: `${SECTION_ACCENT.discussion}22`, color: SECTION_ACCENT.discussion,
            }}>
              <ForumIcon sx={{ fontSize: 17 }} />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Discussion</Typography>
              <Typography variant="caption" color="text.secondary">
                {activity.length} update{activity.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
          </Box>

          <Box sx={{
            flex: 1, overflowY: "auto", px: 2, py: 2,
            backgroundImage: "linear-gradient(180deg, #fafafa 0%, #f5f3ff 100%)",
          }}>
            {activity.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No messages yet — say something below.</Typography>
            ) : (
              activity.map((entry, i) => {
                if (entry.type === "status") {
                  return <StatusEntry key={`status-${entry.id ?? i}`} entry={entry} />;
                }
                const cacheEntry = attachmentsCache[entry.id];
                const isOwnEntry = entry.created_by === currentUserId;
                return (
                  <ChatMessage
                    key={`progress-${entry.id ?? i}`}
                    entry={entry}
                    senderName={userMap[entry.created_by] || `User #${entry.created_by}`}
                    isOwn={isOwnEntry}
                    attachments={cacheEntry?.files}
                    attachmentsLoading={!!cacheEntry?.loading}
                    onDeleteAttachment={handleDeleteAttachment}
                    onDownloadAttachment={handleDownloadAttachment}
                    canDeleteAttachment={isOwnEntry}
                  />
                );
              })
            )}
          </Box>

          {typingLabel && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 2, pb: 0.5, fontStyle: "italic", display: "flex", alignItems: "center" }}
            >
              {typingLabel}
              <TypingDots />
            </Typography>
          )}

          {/* ── Chat input — sends a task-progress entry, files optional ── */}
          <Box sx={{ px: 2, py: 1.5, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper", flexShrink: 0 }}>
            {chatFiles.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                {chatFiles.map((f, i) => (
                  <Chip
                    key={`${f.name}-${i}`}
                    size="small"
                    icon={<AttachFileIcon sx={{ fontSize: 14 }} />}
                    label={f.name}
                    onDelete={() => removeChatFile(i)}
                    deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                    sx={{ bgcolor: "rgba(99,102,241,0.08)" }}
                  />
                ))}
              </Box>
            )}
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
              <input ref={chatFileInputRef} type="file" multiple hidden onChange={handleChatFileChange} />
              <Tooltip title="Attach file">
                <IconButton
                  size="small"
                  onClick={() => chatFileInputRef.current?.click()}
                  sx={{ mb: 0.25, "&:hover": { bgcolor: "rgba(99,102,241,0.08)", color: "#6366f1" } }}
                >
                  <AttachFileIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <TextField
                size="small"
                fullWidth
                multiline
                maxRows={4}
                placeholder="Write a message..."
                value={chatText}
                onChange={handleChatTextChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3, fontSize: 13, bgcolor: "#f8fafc",
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#8b5cf6" },
                  },
                }}
              />
              <IconButton
                size="small"
                onClick={handleSendMessage}
                disabled={sending || !chatText.trim()}
                sx={{
                  mb: 0.25, color: "#fff",
                  backgroundImage: chatText.trim() ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "none",
                  bgcolor: chatText.trim() ? "transparent" : "#e5e7eb",
                  boxShadow: chatText.trim() ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  "&:hover": {
                    backgroundImage: chatText.trim() ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "none",
                    transform: chatText.trim() ? "scale(1.08)" : "none",
                  },
                  "&.Mui-disabled": { color: "#9ca3af" },
                }}
              >
                {sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon fontSize="small" />}
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}