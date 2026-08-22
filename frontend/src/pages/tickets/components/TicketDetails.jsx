// ===============================
// File: src/pages/tickets/components/TicketDetails.jsx
// ===============================

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Box, Paper, Typography, Chip, Grid, Divider, Button, Stack,
  CircularProgress, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Checkbox, FormControlLabel,
  Table, TableHead, TableBody, TableRow, TableCell,
} from "@mui/material";
import ArrowBackIcon    from "@mui/icons-material/ArrowBack";
import EditIcon         from "@mui/icons-material/Edit";
import SyncAltIcon      from "@mui/icons-material/SyncAlt";
import AttachFileIcon   from "@mui/icons-material/AttachFile";
import ChecklistIcon    from "@mui/icons-material/Checklist";
import HistoryIcon      from "@mui/icons-material/History";
import PrintIcon        from "@mui/icons-material/Print";
import AddIcon          from "@mui/icons-material/Add";
import DeleteIcon       from "@mui/icons-material/Delete";
import CheckIcon        from "@mui/icons-material/Check";
import CloseIcon        from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { API } from "../../../config/api";
import PermissionButton from "../../../components/common/PermissionButton";
import TicketChat from "./TicketChat";
import VisitReportPrintDialog from "../visitReport/VisitReportPrintDialog";

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

// crude but reliable enough check for "does this string look like an
// email" — used to catch backends that put the email INTO the name
// field itself, which `name || emailToName(email)` alone can't catch
// since a truthy `name` short-circuits before emailToName ever runs.
// Same helper as TicketChat.jsx, kept in sync.
function looksLikeEmail(str) {
  return typeof str === "string" && /\S+@\S+\.\S+/.test(str);
}

// email -> display name, e.g. dayanand.chauhan@tsfe365.com -> Dayanand Chauhan
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

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

// backend gives "HH:MM:SS" (sometimes with fractional seconds)
function formatTime(t) {
  if (!t) return "—";
  return t.slice(0, 5);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Flat colors (used for the small ColorChip pills) ───────────────────────
const PRIORITY_COLORS = {
  low:      { bg: "#e0f2fe", fg: "#075985" },
  medium:   { bg: "#fef9c3", fg: "#854d0e" },
  high:     { bg: "#ffedd5", fg: "#9a3412" },
  critical: { bg: "#fee2e2", fg: "#991b1b" },
};

const STATUS_COLORS = {
  open:             { bg: "#e0f2fe", fg: "#075985" },
  "in progress":    { bg: "#fef9c3", fg: "#854d0e" },
  draft:            { bg: "#f1f5f9", fg: "#475569" },
  submitted:        { bg: "#fef3c7", fg: "#92400e" },
  approved:         { bg: "#dcfce7", fg: "#166534" },
  resolved:         { bg: "#dcfce7", fg: "#166534" },
  closed:           { bg: "#f1f5f9", fg: "#475569" },
};

// ── Soft gradient variants — same idea as TaskDetails' STATUS_GRADIENT /
// PRIORITY_GRADIENT, used for the bigger chips at the top of the page so
// this page reads as a sibling of the task view rather than a different
// app. Flat ColorChip pills above are left alone (used inline in tables). ──
const PRIORITY_GRADIENT = {
  low:      "linear-gradient(135deg, #e0f2fe, #bae6fd)",
  medium:   "linear-gradient(135deg, #fef9c3, #fde68a)",
  high:     "linear-gradient(135deg, #ffedd5, #fed7aa)",
  critical: "linear-gradient(135deg, #fee2e2, #fecaca)",
};

const STATUS_GRADIENT = {
  open:          "linear-gradient(135deg, #e0f2fe, #bae6fd)",
  "in progress": "linear-gradient(135deg, #fef9c3, #fde68a)",
  draft:         "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
  submitted:     "linear-gradient(135deg, #fef3c7, #fde68a)",
  approved:      "linear-gradient(135deg, #dcfce7, #bbf7d0)",
  resolved:      "linear-gradient(135deg, #dcfce7, #bbf7d0)",
  closed:        "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
};

// Per-section accent color, same "zone" idea as TaskDetails' SECTION_ACCENT.
const SECTION_ACCENT = {
  details: "#6366f1",
  visit:   "#0ea5e9",
};

function ColorChip({ label, palette }) {
  const key = (label || "").toLowerCase().trim();
  const colors = palette[key] || { bg: "#f1f5f9", fg: "#334155" };
  return (
    <Chip
      label={label || "—"}
      size="small"
      sx={{ bgcolor: colors.bg, color: colors.fg, fontWeight: 600 }}
    />
  );
}

// Bigger gradient pill for the top of the Details card — mirrors the
// status/priority chips at the top of TaskDetails.
function GradientChip({ label, gradient, color }) {
  return (
    <Chip
      label={label || "—"}
      size="small"
      sx={{ backgroundImage: gradient, color, fontWeight: 700, fontSize: 11 }}
    />
  );
}

// Small colored icon badge + label used to open each card — same visual
// language as TaskDetails' SectionHeader.
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

function InfoField({ label, children }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>{children}</Typography>
    </Box>
  );
}

// Attachments — the reply schema carries an `attachments` array per reply,
// but there's no dedicated upload endpoint yet. This aggregates whatever
// attachments come back on replies; it's a read-only list until the
// backend exposes upload/download for them.
function TicketAttachments({ replies }) {
  const attachments = useMemo(
    () => (replies || []).flatMap((r) => r.attachments || []),
    [replies]
  );

  if (attachments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No attachments yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {attachments.map((a, i) => (
        <Box key={a.id ?? i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AttachFileIcon fontSize="small" color="action" />
          <Typography variant="body2">{a.file_name || a.name || `Attachment ${i + 1}`}</Typography>
        </Box>
      ))}
    </Stack>
  );
}

/**
 * Daily Update Task checklist — add / check / edit / delete tasks for
 * this ticket. `is_selected` (the checkbox) marks a task as a "main
 * task" — those are the ones the Visit Report PDF pulls into POINTS.
 *
 * `tasks` / `onTasksChange` are lifted to TicketDetails so this dialog,
 * the read-only log dialog, and the PDF print flow share one fetch.
 */
function DailyUpdateDialog({ open, onClose, ticketId, tasks, loading, onTasksChange }) {
  const [newText, setNewText] = useState("");
  const [newDate, setNewDate] = useState(todayStr());
  const [adding, setAdding]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText]   = useState("");
  const [editDate, setEditDate]   = useState("");

  const addTask = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    try {
      const res = await axios.post(
        API.CREATE_DAILY_TASKS(ticketId),
        { tasks: [{ task_description: newText.trim(), work_date: newDate }] },
        { headers: authHeaders() }
      );
      onTasksChange([...(tasks || []), ...(res.data || [])]);
      setNewText("");
      setNewDate(todayStr());
    } catch (error) {
      console.error("Failed to add task:", error);
      toast.error(error.response?.data?.detail || "Failed to add task.");
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (task) => {
    try {
      const res = await axios.patch(
        API.CHECK_DAILY_TASK(task.id),
        { is_selected: !task.is_selected },
        { headers: authHeaders() }
      );
      onTasksChange(tasks.map((t) => (t.id === task.id ? res.data : t)));
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error(error.response?.data?.detail || "Failed to update task.");
    }
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditText(task.task_description);
    setEditDate(task.work_date);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (task) => {
    try {
      const res = await axios.put(
        API.UPDATE_DAILY_TASK(task.id),
        { task_description: editText, work_date: editDate },
        { headers: authHeaders() }
      );
      onTasksChange(tasks.map((t) => (t.id === task.id ? res.data : t)));
      setEditingId(null);
    } catch (error) {
      console.error("Failed to save task:", error);
      toast.error(error.response?.data?.detail || "Failed to save task.");
    }
  };

  const removeTask = async (task) => {
    try {
      await axios.delete(API.DELETE_DAILY_TASK(task.id), { headers: authHeaders() });
      onTasksChange(tasks.filter((t) => t.id !== task.id));
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error(error.response?.data?.detail || "Failed to delete task.");
    }
  };

  const checkedCount = (tasks || []).filter((t) => t.is_selected).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Daily Update Tasks</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Stack spacing={2}>
            <Typography variant="caption" color="text.secondary">
              Check the main tasks that should show up in the visit report. Everything
              added here is saved regardless of whether it's checked.
            </Typography>

            <Stack spacing={1}>
              {(tasks || []).length === 0 && (
                <Typography variant="body2" color="text.secondary">No tasks added yet.</Typography>
              )}
              {(tasks || []).map((task) => (
                <Box key={task.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Checkbox
                    size="small"
                    checked={!!task.is_selected}
                    onChange={() => toggleTask(task)}
                    sx={{ mt: 0.25 }}
                  />

                  {editingId === task.id ? (
                    <Box sx={{ flex: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <TextField
                        size="small" fullWidth value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <TextField
                        size="small" type="date" value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <IconButton size="small" color="success" onClick={() => saveEdit(task)}>
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={cancelEdit}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">{task.task_description}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(task.work_date)}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => startEdit(task)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => removeTask(task)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
              ))}
            </Stack>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <TextField
                size="small" fullWidth placeholder="Add a task done today"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTask(); } }}
                sx={{ flex: 1, minWidth: 180 }}
              />
              <TextField
                size="small" type="date" value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="outlined" startIcon={<AddIcon />} onClick={addTask}
                disabled={adding} sx={{ textTransform: "none" }}
              >
                {adding ? "Adding..." : "Add"}
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary">
              {checkedCount} of {(tasks || []).length} marked as main tasks.
            </Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Read-only history of every daily task ever logged on this ticket —
 * who added it, when, and whether it's currently marked as a main task.
 */
function UpdateLogDialog({ open, onClose, tasks, loading, userMap }) {
  const sorted = useMemo(
    () =>
      [...(tasks || [])].sort(
        (a, b) => new Date(b.work_date) - new Date(a.work_date) || new Date(b.created_at) - new Date(a.created_at)
      ),
    [tasks]
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Update Log</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : sorted.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No daily update tasks logged yet.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Added By</TableCell>
                <TableCell>Added At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{formatDate(task.work_date)}</TableCell>
                  <TableCell>{task.task_description}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={task.is_selected ? "Main Task" : "Logged"}
                      sx={task.is_selected
                        ? { bgcolor: "#dcfce7", color: "#166534", fontWeight: 600 }
                        : { bgcolor: "#f1f5f9", color: "#475569", fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>{userMap[task.created_by] || "—"}</TableCell>
                  <TableCell>{formatDateTime(task.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses]     = useState([]);
  const [users, setUsers]           = useState([]);

  const [dailyUpdateOpen, setDailyUpdateOpen] = useState(false);
  const [updateLogOpen, setUpdateLogOpen]     = useState(false);
  const [printOpen, setPrintOpen]             = useState(false);
  const [dailyTasks, setDailyTasks]           = useState([]);
  const [dailyTasksLoading, setDailyTasksLoading] = useState(false);
  const [dailyTasksLoaded, setDailyTasksLoaded]   = useState(false);

  const fetchTicket = () => {
    setLoading(true);
    axios
      .get(API.GET_TICKET(id), { headers: authHeaders() })
      .then((res) => setTicket(res.data))
      .catch((err) => {
        console.error("Failed to load ticket:", err);
        toast.error(err.response?.data?.detail || "Failed to load ticket.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTicket();

    axios.get(API.GET_TICKET_PRIORITIES, { headers: authHeaders() })
      .then((res) => setPriorities(res.data || []))
      .catch(console.error);

    axios.get(API.GET_TICKET_STATUSES, { headers: authHeaders() })
      .then((res) => setStatuses(res.data || []))
      .catch(console.error);

    if (API.GET_USERS) {
      axios.get(API.GET_USERS, { headers: authHeaders() })
        .then((res) => setUsers(res.data || []))
        .catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // fetch daily tasks lazily the first time any of the three consumers opens
  useEffect(() => {
    if (!(dailyUpdateOpen || updateLogOpen || printOpen) || dailyTasksLoaded) return;
    setDailyTasksLoading(true);
    axios
      .get(API.GET_DAILY_TASKS(id), { headers: authHeaders() })
      .then((res) => {
        setDailyTasks(res.data || []);
        setDailyTasksLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load daily tasks:", err);
        toast.error(err.response?.data?.detail || "Failed to load daily update tasks.");
      })
      .finally(() => setDailyTasksLoading(false));
  }, [dailyUpdateOpen, updateLogOpen, printOpen, dailyTasksLoaded, id]);

  const priorityName = useMemo(
    () => priorities.find((p) => p.id === ticket?.priority_id)?.priority_name,
    [priorities, ticket]
  );
  const statusName = useMemo(
    () => statuses.find((s) => s.id === ticket?.status_id)?.status_name,
    [statuses, ticket]
  );

  // Fixed: was `u.name || emailToName(u.email) || u.email` — a truthy
  // `name` that itself held an email address short-circuited straight
  // past emailToName, so emails leaked into Assigned By / Assigned To /
  // Added By everywhere. resolveDisplayName checks name-looks-like-email
  // before trusting it.
  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.id] = resolveDisplayName(u);
    });
    return map;
  }, [users]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">Ticket not found.</Typography>
      </Box>
    );
  }

  const priorityKey = (priorityName || "").toLowerCase().trim();
  const statusKey = (statusName || "").toLowerCase().trim();
  const priorityGradient = PRIORITY_GRADIENT[priorityKey] || PRIORITY_GRADIENT.low;
  const statusGradient = STATUS_GRADIENT[statusKey] || STATUS_GRADIENT.open;
  const priorityFg = (PRIORITY_COLORS[priorityKey] || PRIORITY_COLORS.low).fg;
  const statusFg = (STATUS_COLORS[statusKey] || STATUS_COLORS.open).fg;

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "background.default" }}>
      {/* Header */}
      <Box sx={{
        display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1,
        p: 1.5, borderRadius: 2,
        backgroundImage: "linear-gradient(90deg, #ffffff, #f8fafc)",
        border: "1px solid", borderColor: "divider",
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Tooltip title="Back">
            <IconButton
              onClick={() => navigate(-1)}
              size="small"
              sx={{ "&:hover": { bgcolor: "rgba(99,102,241,0.08)", color: "#6366f1" } }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
            <Box sx={{ width: 4, borderRadius: 2, alignSelf: "stretch", backgroundImage: "linear-gradient(180deg, #6366f1, #8b5cf6)" }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{ticket.customer_name || ticket.ticket_no}</Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700, fontFamily: "monospace", display: "inline-block", mt: 0.25,
                  px: 1, py: 0.15, borderRadius: 1,
                  bgcolor: "rgba(99,102,241,0.08)", color: "#4f46e5", fontSize: 12,
                }}
              >
                {ticket.ticket_no}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          <GradientChip label={priorityName} gradient={priorityGradient} color={priorityFg} />
          <GradientChip label={statusName} gradient={statusGradient} color={statusFg} />

          <Button
            size="small"
            variant="outlined"
            startIcon={<PrintIcon fontSize="small" />}
            onClick={() => setPrintOpen(true)}
            sx={{ textTransform: "none", borderRadius: 5, transition: "transform 0.15s ease", "&:hover": { transform: "translateY(-1px)" } }}
          >
            Print Visit Report
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ChecklistIcon fontSize="small" />}
            onClick={() => setDailyUpdateOpen(true)}
            sx={{ textTransform: "none", borderRadius: 5, transition: "transform 0.15s ease", "&:hover": { transform: "translateY(-1px)" } }}
          >
            Daily Update Task
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<HistoryIcon fontSize="small" />}
            onClick={() => setUpdateLogOpen(true)}
            sx={{ textTransform: "none", borderRadius: 5, transition: "transform 0.15s ease", "&:hover": { transform: "translateY(-1px)" } }}
          >
            View Update Log
          </Button>
          <PermissionButton
            permission="update_tickets"
            onClick={() => navigate("/tickets/action/update", { state: { data: ticket, action: "update" } })}
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon fontSize="small" />}
              sx={{ textTransform: "none", borderRadius: 5, transition: "transform 0.15s ease", "&:hover": { transform: "translateY(-1px)" } }}
            >
              Edit
            </Button>
          </PermissionButton>
          <PermissionButton
            permission="status_tickets"
            onClick={() => navigate("/tickets/action/status", { state: { data: ticket, action: "status" } })}
          >
            <Button
              size="small"
              variant="contained"
              startIcon={<SyncAltIcon fontSize="small" />}
              sx={{
                textTransform: "none", borderRadius: 5,
                backgroundImage: "linear-gradient(135deg, #6366f1, #7c3aed)",
                boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                transition: "transform 0.15s ease",
                "&:hover": { transform: "translateY(-1px)", backgroundImage: "linear-gradient(135deg, #4f46e5, #6d28d9)" },
              }}
            >
              Change Status
            </Button>
          </PermissionButton>
        </Stack>
      </Box>

      <Grid container  spacing={2}>
        {/* LEFT: details + visit report info + attachments */}
        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <Paper
              elevation={0}
              variant="outlined"
              sx={{ p: 2.5, borderRadius: 2, borderLeft: `4px solid ${SECTION_ACCENT.details}` }}
            >
              <SectionHeader
                icon={<InfoOutlinedIcon sx={{ fontSize: 16 }} />}
                label="Details"
                color={SECTION_ACCENT.details}
              />
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <ColorChip label={priorityName} palette={PRIORITY_COLORS} />
                  <ColorChip label={statusName} palette={STATUS_COLORS} />
                </Box>
                <Divider />
                <InfoField label="Scope Of Work">
                  {ticket.scope_of_work || "—"}
                </InfoField>
                <Divider />
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <InfoField label="Assigned By">{userMap[ticket.created_by] || "—"}</InfoField>
                  </Grid>
                  <Grid item xs={6}>
                    <InfoField label="Assigned To">{userMap[ticket.assigned_to] || "Unassigned"}</InfoField>
                  </Grid>
                  <Grid item xs={6}>
                    <InfoField label="Due Date">{formatDate(ticket.due_date)}</InfoField>
                  </Grid>
                  <Grid item xs={6}>
                    <InfoField label="Created Date">{formatDate(ticket.created_at)}</InfoField>
                  </Grid>
                  {ticket.closed_at && (
                    <Grid item xs={6}>
                      <InfoField label="Closed Date">{formatDate(ticket.closed_at)}</InfoField>
                    </Grid>
                  )}
                </Grid>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              variant="outlined"
              sx={{ p: 2.5, borderRadius: 2, borderLeft: `4px solid ${SECTION_ACCENT.visit}` }}
            >
              <SectionHeader
                icon={<DescriptionOutlinedIcon sx={{ fontSize: 16 }} />}
                label="Visit Report Info"
                color={SECTION_ACCENT.visit}
              />
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <InfoField label="Customer Name">{ticket.customer_name || "—"}</InfoField>
                </Grid>
                <Grid item xs={6}>
                  <InfoField label="Venue">{ticket.venue || "—"}</InfoField>
                </Grid>
                <Grid item xs={6}>
                  <InfoField label="Meeting Date">{formatDate(ticket.meeting_date)}</InfoField>
                </Grid>
                <Grid item xs={6}>
                  <InfoField label="Meeting Time">{formatTime(ticket.meeting_time)}</InfoField>
                </Grid>
                <Grid item xs={6}>
                  <InfoField label="Order No">{ticket.order_no || "—"}</InfoField>
                </Grid>
                <Grid item xs={12}>
                  <InfoField label="Agenda">{ticket.agenda || "—"}</InfoField>
                </Grid>
              </Grid>
            </Paper>

            {/* <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Attachments</Typography>
              <TicketAttachments replies={ticket.replies} />
            </Paper> */}
          </Stack>
        </Grid>

        {/* RIGHT: chat */}
        <Grid item xs={12} md={7}>
          <Box sx={{ height: { xs: 500, md: "calc(100vh - 200px)" } }}>
            <TicketChat ticketId={ticket.id} initialReplies={ticket.replies} />
          </Box>
        </Grid>
      </Grid>

      <DailyUpdateDialog
        open={dailyUpdateOpen}
        onClose={() => setDailyUpdateOpen(false)}
        ticketId={ticket.id}
        tasks={dailyTasks}
        loading={dailyTasksLoading}
        onTasksChange={setDailyTasks}
      />

      <UpdateLogDialog
        open={updateLogOpen}
        onClose={() => setUpdateLogOpen(false)}
        tasks={dailyTasks}
        loading={dailyTasksLoading}
        userMap={userMap}
      />

      <VisitReportPrintDialog
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        ticket={ticket}
        statuses={statuses}
        onTicketUpdated={fetchTicket}
      />
    </Box>
  );
}