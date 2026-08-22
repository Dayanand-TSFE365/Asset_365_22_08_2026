// ===============================
// File: src/pages/tasks/components/TaskDashboard.jsx
// ===============================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  LinearProgress,
  Button,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import BuildIcon from "@mui/icons-material/Build";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InboxIcon from "@mui/icons-material/Inbox";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { API } from "../../../config/api"; // ⚠️ adjust path if needed
import { useAuth } from "../../../auth/AuthContext";
import { hasPermission } from "../../../utils/permissions"; // ⚠️ adjust path if needed

function authHeaders() {
  const token = sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_COLOR = {
  High:   { bg: "#fef2f2", text: "#dc2626" },
  Medium: { bg: "#fffbeb", text: "#d97706" },
  Low:    { bg: "#f0fdf4", text: "#16a34a" },
};

const STATUS_COLOR = {
  "In Progress":      { bg: "#eff6ff", text: "#2563eb" },
  "Pending":          { bg: "#fafafa", text: "#6b7280" },
  "Waiting Approval": { bg: "#fdf4ff", text: "#9333ea" },
  "Completed":        { bg: "#f0fdf4", text: "#16a34a" },
};

function PriorityChip({ priority }) {
  const c = PRIORITY_COLOR[priority] || PRIORITY_COLOR.Low;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: c.bg, color: c.text }}>
      {priority}
    </span>
  );
}

function StatusChip({ status }) {
  const c = STATUS_COLOR[status] || STATUS_COLOR["Pending"];
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: c.bg, color: c.text }}>
      {status}
    </span>
  );
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sun ... 6 = Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift so week starts Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatShortDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, onClick }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        gap: 2,
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.15s",
        "&:hover": onClick ? { boxShadow: 3 } : {},
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          backgroundColor: color + "20",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

// ─── TaskDashboard ────────────────────────────────────────────────────────────
export default function TaskDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const currentUserId = user?.user_id;

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    const headers = authHeaders();
    try {
      const [tasksRes, usersRes] = await Promise.all([
        axios.get(API.GET_TASKS, { headers }),
        axios.get(API.GET_USERS, { headers }),
      ]);
      setTasks(tasksRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const userMap = useMemo(() => {
    const m = {};
    users.forEach((u) => { m[u.id] = u.name; });
    return m;
  }, [users]);

  // ── visibility: superadmin sees every task; everyone else only sees
  // tasks assigned to them — same rule as TaskList, so the numbers here
  // and the numbers in the task tabs always agree. ─────────────────────
  const visibleTasks = useMemo(() => {
    if (isSuperAdmin) return tasks;
    return tasks.filter((t) => t.assigned_to === currentUserId);
  }, [tasks, isSuperAdmin, currentUserId]);

  // ── stat cards ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    return {
      assigned_today:   visibleTasks.filter((t) => t.created_at && sameDay(new Date(t.created_at), now)).length,
      pending:          visibleTasks.filter((t) => t.status === "Pending").length,
      in_progress:      visibleTasks.filter((t) => t.status === "In Progress").length,
      waiting_approval: visibleTasks.filter((t) => t.status === "Waiting Approval").length,
      completed:        visibleTasks.filter((t) => t.status === "Completed").length,
      overdue:          visibleTasks.filter((t) => t.status === "Overdue").length,
    };
  }, [visibleTasks]);

  // ── weekly chart — real tasks bucketed by created_at weekday (Mon–Sun
  // of the current week), split by current status. ────────────────────
  const weeklyChartData = useMemo(() => {
    const monday = startOfWeek(new Date());
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return labels.map((label, i) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dayTasks = visibleTasks.filter(
        (t) => t.created_at && sameDay(new Date(t.created_at), dayDate)
      );
      return {
        day: label,
        Completed: dayTasks.filter((t) => t.status === "Completed").length,
        Pending: dayTasks.filter((t) => t.status === "Pending").length,
        Overdue: dayTasks.filter((t) => t.status === "Overdue").length,
      };
    });
  }, [visibleTasks]);

  // ── due today ─────────────────────────────────────────────────────────
  const dueToday = useMemo(() => {
    const now = new Date();
    return visibleTasks
      .filter((t) => t.deadline && sameDay(new Date(t.deadline), now) && t.status !== "Completed")
      .map((t) => {
        const total = t.checklists?.length || 0;
        const done  = t.checklists?.filter((c) => c.is_completed).length || 0;
        return {
          id: t.id,
          title: t.title,
          assigned_to: userMap[t.assigned_to] || `User #${t.assigned_to}`,
          priority: t.priority,
          status: t.status,
          progress: total > 0 ? Math.round((done / total) * 100) : 0,
        };
      });
  }, [visibleTasks, userMap]);

  // ── overdue tasks ─────────────────────────────────────────────────────
  const overdueTasks = useMemo(() => {
    const now = new Date();
    return visibleTasks
      .filter((t) => t.status === "Overdue" && t.deadline)
      .map((t) => ({
        id: t.id,
        title: t.title,
        assigned_to: userMap[t.assigned_to] || `User #${t.assigned_to}`,
        priority: t.priority,
        due: formatShortDate(t.deadline),
        days_overdue: Math.max(0, Math.floor((now - new Date(t.deadline)) / 86400000)),
      }))
      .sort((a, b) => b.days_overdue - a.days_overdue);
  }, [visibleTasks, userMap]);

  const canCreate = hasPermission("create_tasks");

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "background.default" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Task Dashboard
        </Typography>
        <Tooltip title={!canCreate ? "You don't have permission to create tasks" : ""}>
          <span>
            <Button
              variant="contained"
              size="small"
              disabled={!canCreate}
              onClick={() => navigate("/tasks/action/create")}
              sx={{ textTransform: "none" }}
            >
              + Create Task
            </Button>
          </span>
        </Tooltip>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          {/* ── Stat cards ─────────────────────────────────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: "Assigned Today",   value: stats.assigned_today,   icon: <AssignmentIcon />,     color: "#3b82f6", path: "/tasks/my" },
              { label: "Pending",          value: stats.pending,          icon: <HourglassEmptyIcon />, color: "#f59e0b", path: "/tasks/pending" },
              { label: "In Progress",      value: stats.in_progress,      icon: <BuildIcon />,          color: "#8b5cf6", path: "/tasks/in-progress" },
              { label: "Waiting Approval", value: stats.waiting_approval, icon: <ThumbUpIcon />,        color: "#06b6d4", path: "/tasks/waiting-approval" },
              { label: "Completed",        value: stats.completed,        icon: <CheckCircleIcon />,    color: "#16a34a", path: "/tasks/completed" },
              { label: "Overdue",          value: stats.overdue,          icon: <WarningAmberIcon />,   color: "#dc2626", path: "/tasks/overdue" },
            ].map((s) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={s.label}>
                <StatCard {...s} onClick={() => navigate(s.path)} />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* ── Weekly bar chart ──────────────────────────────────────── */}
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", height: 280 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  This Week — Tasks Created
                </Typography>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={weeklyChartData} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <RechartsTooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Completed" fill="#16a34a" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Pending"   fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Overdue"   fill="#dc2626" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* ── Recent activity — no feed endpoint yet, see note above ── */}
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", height: 280, display: "flex", flexDirection: "column" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Recent Activity
                </Typography>
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>
                  <InboxIcon sx={{ fontSize: 28, mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2" sx={{ textAlign: "center" }}>
                    No activity feed connected yet.
                  </Typography>
                  <Typography variant="caption" sx={{ textAlign: "center", mt: 0.5 }}>
                    Needs a dedicated backend endpoint.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            {/* ── Today's due tasks ─────────────────────────────────────── */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Due Today
                </Typography>
                {dueToday.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No tasks due today.
                  </Typography>
                ) : (
                  dueToday.map((t) => (
                    <Box
                      key={t.id}
                      onClick={() => navigate(`/tasks/details/${t.id}`)}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        borderRadius: 1.5,
                        border: "1px solid",
                        borderColor: "divider",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {t.title}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <PriorityChip priority={t.priority} />
                          <StatusChip status={t.status} />
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                        {t.assigned_to}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={t.progress}
                          sx={{ flex: 1, height: 5, borderRadius: 3 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {t.progress}%
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Paper>
            </Grid>

            {/* ── Overdue tasks ─────────────────────────────────────────── */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Overdue Tasks
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate("/tasks/overdue")}
                    sx={{ textTransform: "none", fontSize: 12 }}
                  >
                    View all
                  </Button>
                </Box>
                {overdueTasks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No overdue tasks. 🎉
                  </Typography>
                ) : (
                  overdueTasks.map((t) => (
                    <Box
                      key={t.id}
                      onClick={() => navigate(`/tasks/details/${t.id}`)}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        borderRadius: 1.5,
                        border: "1px solid",
                        borderColor: "#fecaca",
                        bgcolor: "#fff5f5",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "#fee2e2" },
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box sx={{ minWidth: 0, mr: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {t.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.assigned_to} · Due {t.due}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5, flexShrink: 0 }}>
                          <PriorityChip priority={t.priority} />
                          <Typography variant="caption" sx={{ color: "#dc2626", fontWeight: 600 }}>
                            {t.days_overdue}d overdue
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}