// ===============================
// File: src/pages/tasks/subpages/CalendarView.jsx
// ===============================

import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Popover,
  Select,
  MenuItem,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import EventIcon from "@mui/icons-material/Event";
import CloseIcon from "@mui/icons-material/Close";
import { API } from "../../../config/api";
import { useAuth } from "../../../auth/AuthContext";

function authHeaders() {
  const token = sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Same visibility rule as TaskList — superadmin sees everything,
// everyone else only sees tasks assigned to them. ──────────────────────────
function useTaskVisibility() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  return { isSuperAdmin, currentUserId: user?.user_id };
}

const PRIORITY_COLOR = { High: "#dc2626", Medium: "#d97706", Low: "#16a34a" };
const STATUS_STYLE = {
  "Pending":          { bg: "#f3f4f6", text: "#6b7280" },
  "In Progress":      { bg: "#eff6ff", text: "#2563eb" },
  "Waiting Approval": { bg: "#fdf4ff", text: "#9333ea" },
  "Completed":        { bg: "#f0fdf4", text: "#16a34a" },
  "Overdue":          { bg: "#fef2f2", text: "#dc2626" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MAX_VISIBLE_PER_CELL = 3;

function toISODate(y, m, d) {
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

// task.deadline is a full ISO datetime ("2026-07-29T05:41:00") — this pulls
// just the date part so it matches the calendar cell's iso key.
function deadlineToISODate(deadline) {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return null;
  return toISODate(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatCellDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function CalendarView() {
  const navigate = useNavigate();
  const { isSuperAdmin, currentUserId } = useTaskVisibility();

  const [rawTasks, setRawTasks] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API.GET_TASKS, { headers: authHeaders() });
      setRawTasks(res.data || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── visible tasks — superadmin sees all, others only their own ──────────
  const tasks = useMemo(() => {
    const visible = isSuperAdmin
      ? rawTasks
      : rawTasks.filter((t) => t.assigned_to === currentUserId);
    return visible.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      due_date: deadlineToISODate(t.deadline),
      raw: t,
    })).filter((t) => t.due_date); // skip tasks with no deadline — nothing to plot
  }, [rawTasks, isSuperAdmin, currentUserId]);

  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  // ── Build task lookup by ISO date ───────────────────────────────────
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!map[t.due_date]) map[t.due_date] = [];
      map[t.due_date].push(t);
    });
    return map;
  }, [tasks]);

  // ── Build grid cells (6 rows x 7 cols, including prev/next month fillers) ──
  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startWeekday = firstDayOfMonth.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const totalCells = 42; // 6 weeks, keeps grid stable
    const result = [];

    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - startWeekday + 1;

      let cellYear = year, cellMonth = month, cellDay, inCurrentMonth;

      if (dayNum < 1) {
        cellMonth = month - 1;
        cellYear = month === 0 ? year - 1 : year;
        cellDay = daysInPrevMonth + dayNum;
        inCurrentMonth = false;
      } else if (dayNum > daysInMonth) {
        cellMonth = month + 1;
        cellYear = month === 11 ? year + 1 : year;
        cellDay = dayNum - daysInMonth;
        inCurrentMonth = false;
      } else {
        cellDay = dayNum;
        inCurrentMonth = true;
      }

      const normMonth = ((cellMonth % 12) + 12) % 12;
      const iso = toISODate(cellYear, normMonth, cellDay);
      const isToday = iso === toISODate(today.getFullYear(), today.getMonth(), today.getDate());

      result.push({
        iso,
        day: cellDay,
        inCurrentMonth,
        isToday,
        tasks: tasksByDate[iso] || [],
      });
    }
    return result;
  }, [cursor, tasksByDate]);

  const goPrevMonth = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const goNextMonth = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  const goToday = () => setCursor(new Date(today.getFullYear(), today.getMonth(), 1));

  // ── Jump-to-date popover — pick any year/month via dropdowns, or an
  // exact date via the native picker (jumps the grid to that date's month). ──
  const [jumpAnchor, setJumpAnchor] = useState(null);
  const [jumpYear, setJumpYear] = useState(cursor.getFullYear());
  const [jumpMonth, setJumpMonth] = useState(cursor.getMonth());
  const [jumpExactDate, setJumpExactDate] = useState("");

  const openJumpPicker = (e) => {
    setJumpYear(cursor.getFullYear());
    setJumpMonth(cursor.getMonth());
    setJumpExactDate("");
    setJumpAnchor(e.currentTarget);
  };
  const closeJumpPicker = () => setJumpAnchor(null);

  const applyYearMonth = () => {
    setCursor(new Date(jumpYear, jumpMonth, 1));
    closeJumpPicker();
  };

  const applyExactDate = () => {
    if (!jumpExactDate) return;
    const d = new Date(`${jumpExactDate}T00:00:00`);
    if (isNaN(d.getTime())) return;
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    closeJumpPicker();
  };

  const YEAR_RANGE = useMemo(() => {
    const base = today.getFullYear();
    const years = [];
    for (let y = base - 5; y <= base + 5; y++) years.push(y);
    return years;
  }, [today]);

  // ── Day-detail dialog — opens when a cell has more tasks than fit,
  // shows the full list, click a row to go to that task's details. ────────
  const [dayDialog, setDayDialog] = useState({ open: false, iso: null, tasks: [] });

  const openDayDialog = (cell) => setDayDialog({ open: true, iso: cell.iso, tasks: cell.tasks });
  const closeDayDialog = () => setDayDialog({ open: false, iso: null, tasks: [] });

  const goToTask = (t) => {
    closeDayDialog();
    navigate(`/tasks/details/${t.id}`, { state: { data: t.raw } });
  };

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "background.default" }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Calendar
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Jump to date">
            <IconButton size="small" onClick={openJumpPicker}>
              <EventIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {/* <Tooltip title="Today">
            <IconButton size="small" onClick={goToday}>
              <TodayIcon fontSize="small" />
            </IconButton>
          </Tooltip> */}
          <IconButton size="small" onClick={goPrevMonth}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, minWidth: 160, textAlign: "center" }}>
            {monthLabel}
          </Typography>
          <IconButton size="small" onClick={goNextMonth}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          {/* ── Weekday header row ──────────────────────────────────── */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, mb: 1 }}>
            {WEEKDAYS.map((d) => (
              <Typography
                key={d}
                variant="caption"
                sx={{ textAlign: "center", fontWeight: 700, color: "text.secondary" }}
              >
                {d}
              </Typography>
            ))}
          </Box>

          {/* ── Calendar grid ───────────────────────────────────────── */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gridAutoRows: "minmax(110px, auto)",
              gap: 1,
            }}
          >
            {cells.map((cell) => (
              <Paper
                key={cell.iso}
                elevation={0}
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: cell.isToday ? "#2563eb" : "divider",
                  bgcolor: cell.inCurrentMonth ? "background.paper" : "#fafafa",
                  opacity: cell.inCurrentMonth ? 1 : 0.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  overflow: "hidden",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: cell.isToday ? 700 : 500,
                    color: cell.isToday ? "#2563eb" : "text.secondary",
                    alignSelf: "flex-start",
                  }}
                >
                  {cell.day}
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4, overflow: "hidden" }}>
                  {cell.tasks.slice(0, MAX_VISIBLE_PER_CELL).map((t) => (
                    <Tooltip key={t.id} title={`${t.title} — ${t.status}`}>
                      <Chip
                        label={t.title}
                        size="small"
                        onClick={() => navigate(`/tasks/details/${t.id}`, { state: { data: t.raw } })}
                        sx={{
                          justifyContent: "flex-start",
                          fontSize: 10,
                          height: 20,
                          borderRadius: 0.75,
                          cursor: "pointer",
                          bgcolor: (PRIORITY_COLOR[t.priority] || "#9ca3af") + "20",
                          color: PRIORITY_COLOR[t.priority] || "#6b7280",
                          "& .MuiChip-label": {
                            px: 0.75,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        }}
                      />
                    </Tooltip>
                  ))}
                  {cell.tasks.length > MAX_VISIBLE_PER_CELL && (
                    <Typography
                      variant="caption"
                      color="primary"
                      onClick={() => openDayDialog(cell)}
                      sx={{
                        fontSize: 10, pl: 0.5, fontWeight: 700, cursor: "pointer",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      +{cell.tasks.length - MAX_VISIBLE_PER_CELL} more
                    </Typography>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        </>
      )}

      {/* ── Jump-to-date popover ─────────────────────────────────────── */}
      <Popover
        open={Boolean(jumpAnchor)}
        anchorEl={jumpAnchor}
        onClose={closeJumpPicker}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ p: 2, width: 260 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Jump to month
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
            <Select
              size="small"
              value={jumpMonth}
              onChange={(e) => setJumpMonth(Number(e.target.value))}
              sx={{ flex: 1.4 }}
            >
              {MONTH_NAMES.map((m, i) => (
                <MenuItem key={m} value={i}>{m}</MenuItem>
              ))}
            </Select>
            <Select
              size="small"
              value={jumpYear}
              onChange={(e) => setJumpYear(Number(e.target.value))}
              sx={{ flex: 1 }}
            >
              {YEAR_RANGE.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </Box>
          <Button size="small" variant="contained" fullWidth onClick={applyYearMonth} sx={{ textTransform: "none", mb: 2 }}>
            Go
          </Button>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Or pick an exact date
          </Typography>
          <TextField
            type="date"
            size="small"
            fullWidth
            value={jumpExactDate}
            onChange={(e) => setJumpExactDate(e.target.value)}
            sx={{ mb: 1.5 }}
          />
          <Button size="small" variant="outlined" fullWidth onClick={applyExactDate} disabled={!jumpExactDate} sx={{ textTransform: "none" }}>
            Go to date
          </Button>
        </Box>
      </Popover>

      {/* ── Day-detail dialog — full task list for one date ─────────────── */}
      <Dialog open={dayDialog.open} onClose={closeDayDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {formatCellDate(dayDialog.iso)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dayDialog.tasks.length} task{dayDialog.tasks.length === 1 ? "" : "s"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={closeDayDialog}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, maxHeight: 420 }}>
          <List disablePadding>
            {dayDialog.tasks.map((t) => {
              const statusStyle = STATUS_STYLE[t.status] || STATUS_STYLE["Pending"];
              return (
                <ListItemButton key={t.id} onClick={() => goToTask(t)} sx={{ py: 1.25, px: 2 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.title}
                        </Typography>
                        <Chip
                          label={t.priority}
                          size="small"
                          sx={{
                            fontWeight: 700, fontSize: 10, height: 20,
                            bgcolor: (PRIORITY_COLOR[t.priority] || "#9ca3af") + "20",
                            color: PRIORITY_COLOR[t.priority] || "#6b7280",
                          }}
                        />
                        <Chip
                          label={t.status}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: 10, height: 20, bgcolor: statusStyle.bg, color: statusStyle.text }}
                        />
                      </Box>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
}