// ===============================
// File: src/pages/tasks/components/TaskAnalytics.jsx
// ===============================

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Avatar,
  Divider,
  LinearProgress,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import ShieldIcon from "@mui/icons-material/Shield";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupsIcon from "@mui/icons-material/Groups";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import UpdateIcon from "@mui/icons-material/Update";
import { API } from "../../../config/api"; // ⚠️ adjust path if needed
import { useAuth } from "../../../auth/AuthContext";

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

// Backend sends naive timestamps with no timezone marker — force UTC
// before formatting, same fix as TaskDetails.jsx, or every time here shows
// shifted by the local UTC offset.
function toDate(isoString) {
  if (!isoString) return null;
  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(isoString);
  return new Date(hasTimezone ? isoString : `${isoString}Z`);
}
function formatDateTime(iso) {
  const d = toDate(iso);
  if (!d || isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso) {
  const d = toDate(iso);
  if (!d || isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_COLORS = {
  "Pending":          "#6b7280",
  "In Progress":      "#2563eb",
  "Waiting Approval": "#9333ea",
  "Completed":        "#16a34a",
  "Overdue":          "#dc2626",
};

const PRIORITY_COLOR = { High: "#dc2626", Medium: "#d97706", Low: "#16a34a" };

// ─── Vivid gradient stat card ────────────────────────────────────────────────
function GradientStatCard({ label, value, icon, gradient }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        color: "#fff",
        background: gradient,
        display: "flex",
        alignItems: "center",
        gap: 2,
        position: "relative",
        overflow: "hidden",
        minHeight: 96,
      }}
    >
      <Box
        sx={{
          width: 46, height: 46, borderRadius: 2.5,
          bgcolor: "rgba(255,255,255,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>{value}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.92, fontWeight: 600 }}>{label}</Typography>
      </Box>
    </Paper>
  );
}

// ─── Merged activity item — same visual language as TaskDetails' feed ──────
function ActivityItem({ entry, taskTitle }) {
  const isStatus = entry.type === "status";
  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
      <Avatar sx={{ width: 26, height: 26, fontSize: 10, bgcolor: isStatus ? "#9333ea" : "#3b82f6", flexShrink: 0 }}>
        {isStatus ? <SyncAltIcon sx={{ fontSize: 13 }} /> : <UpdateIcon sx={{ fontSize: 13 }} />}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>{taskTitle}</Typography>
          <Typography variant="caption" color="text.secondary">{formatDateTime(entry.at)}</Typography>
        </Box>
        {isStatus ? (
          <Box sx={{ mt: 0.4, p: 1, borderRadius: 2, bgcolor: "#fdf4ff", border: "1px solid #f3e8ff" }}>
            <Typography variant="body2">
              Status changed <strong>{entry.old_status || "—"}</strong> → <strong>{entry.new_status}</strong>
            </Typography>
            {entry.remarks && <Typography variant="caption" color="text.secondary">{entry.remarks}</Typography>}
          </Box>
        ) : (
          <Box sx={{ mt: 0.4, p: 1, borderRadius: 2, bgcolor: "#eff6ff", border: "1px solid #dbeafe" }}>
            {entry.message && <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{entry.message}</Typography>}
            <Box sx={{ display: "flex", gap: 2, mt: 0.25, flexWrap: "wrap" }}>
              {!!entry.hours_worked && <Typography variant="caption" color="text.secondary">Worked: {entry.hours_worked}h</Typography>}
              {!!entry.hours_remaining && <Typography variant="caption" color="text.secondary">Remaining: {entry.hours_remaining}h</Typography>}
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#2563eb" }}>{entry.progress}%</Typography>
            </Box>
            {entry.blockers && (
              <Typography variant="caption" sx={{ display: "block", mt: 0.25, color: "#dc2626" }}>
                Blocker: {entry.blockers}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── TaskAnalytics ───────────────────────────────────────────────────────────
export default function TaskAnalytics() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("all");

  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [personHistory, setPersonHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── initial load — only if superadmin ────────────────────────────────
  useEffect(() => {
    if (!isSuperAdmin) { setLoading(false); return; }
    (async () => {
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
        toast.error("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isSuperAdmin]);

  const userMap = useMemo(() => {
    const m = {};
    users.forEach((u) => { m[u.id] = u.name; });
    return m;
  }, [users]);

  const departments = useMemo(() => {
    const set = new Set(tasks.map((t) => t.department).filter(Boolean));
    return Array.from(set).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (departmentFilter !== "all" && t.department !== departmentFilter) return false;
      if (personFilter !== "all" && String(t.assigned_to) !== String(personFilter)) return false;
      return true;
    });
  }, [tasks, departmentFilter, personFilter]);

  // ── overview stats ───────────────────────────────────────────────────
  const overview = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) => t.status === "Completed").length;
    const inProgress = filteredTasks.filter((t) => t.status === "In Progress").length;
    const overdue = filteredTasks.filter((t) => t.status === "Overdue").length;
    const waiting = filteredTasks.filter((t) => t.status === "Waiting Approval").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, overdue, waiting, completionRate };
  }, [filteredTasks]);

  // ── department-wise stacked bar data ─────────────────────────────────
  const deptChartData = useMemo(() => {
    const byDept = {};
    filteredTasks.forEach((t) => {
      const d = t.department || "Unassigned";
      if (!byDept[d]) byDept[d] = { department: d, Pending: 0, "In Progress": 0, "Waiting Approval": 0, Completed: 0, Overdue: 0 };
      if (byDept[d][t.status] != null) byDept[d][t.status] += 1;
    });
    return Object.values(byDept);
  }, [filteredTasks]);

  // ── status distribution pie ──────────────────────────────────────────
  const statusPieData = useMemo(() => {
    const counts = {};
    filteredTasks.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredTasks]);

  // ── person-wise summary cards ────────────────────────────────────────
  const personSummaries = useMemo(() => {
    const byPerson = {};
    filteredTasks.forEach((t) => {
      const pid = t.assigned_to;
      if (!byPerson[pid]) {
        byPerson[pid] = {
          id: pid,
          name: userMap[pid] || `User #${pid}`,
          total: 0, completed: 0, inProgress: 0, overdue: 0, waiting: 0, pending: 0,
          departments: new Set(),
        };
      }
      const p = byPerson[pid];
      p.total += 1;
      p.departments.add(t.department);
      if (t.status === "Completed") p.completed += 1;
      else if (t.status === "In Progress") p.inProgress += 1;
      else if (t.status === "Overdue") p.overdue += 1;
      else if (t.status === "Waiting Approval") p.waiting += 1;
      else if (t.status === "Pending") p.pending += 1;
    });
    return Object.values(byPerson)
      .map((p) => ({ ...p, departments: Array.from(p.departments).filter(Boolean), completionRate: p.total ? Math.round((p.completed / p.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTasks, userMap]);

  // ── drill into one person's full history (progress + status, merged) ─
  const loadPersonHistory = useCallback(async (personId) => {
    setSelectedPersonId(personId);
    setHistoryLoading(true);
    setPersonHistory([]);
    const personTasks = tasks.filter((t) => String(t.assigned_to) === String(personId));
    const headers = authHeaders();
    try {
      const results = await Promise.all(
        personTasks.map(async (t) => {
          const [progressRes, statusRes] = await Promise.all([
            axios.get(API.GET_TASK_PROGRESS_HISTORY(t.id), { headers }).catch(() => ({ data: [] })),
            axios.get(API.GET_TASK_STATUS_HISTORY(t.id), { headers }).catch(() => ({ data: [] })),
          ]);
          const progress = (progressRes.data || []).map((p) => ({ type: "progress", at: p.created_at, taskTitle: t.title, taskId: t.id, ...p }));
          const status = (statusRes.data || []).map((s) => ({ type: "status", at: s.changed_at, taskTitle: t.title, taskId: t.id, ...s }));
          return [...progress, ...status];
        })
      );
      const merged = results.flat().sort((a, b) => new Date(b.at) - new Date(a.at)); // newest first
      setPersonHistory(merged);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load history.");
    } finally {
      setHistoryLoading(false);
    }
  }, [tasks]);

  const selectedPerson = personSummaries.find((p) => String(p.id) === String(selectedPersonId));

  // ── access gate ───────────────────────────────────────────────────────
  if (!isSuperAdmin) {
    return (
      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2, color: "text.secondary" }}>
        <ShieldIcon sx={{ fontSize: 40, opacity: 0.4 }} />
        <Typography variant="body1" sx={{ fontWeight: 600 }}>This page is restricted to super admins.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "grey.50" }}>
      <Box sx={{ maxWidth: 1500, mx: "auto" }}>

        {/* ── Header + filters ─────────────────────────────────────────── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {selectedPersonId && (
              <IconButton size="small" onClick={() => setSelectedPersonId(null)}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {selectedPerson ? emailToName(selectedPerson.name) : "Task Analytics"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedPerson ? "Full activity history for this person" : "Company-wide overview — person & department breakdown"}
              </Typography>
            </Box>
          </Box>

          {!selectedPersonId && (
            <Stack direction="row" spacing={1.5}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Department</InputLabel>
                <Select value={departmentFilter} label="Department" onChange={(e) => setDepartmentFilter(e.target.value)}>
                  <MenuItem value="all">All Departments</MenuItem>
                  {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Person</InputLabel>
                <Select value={personFilter} label="Person" onChange={(e) => setPersonFilter(e.target.value)}>
                  <MenuItem value="all">All People</MenuItem>
                  {users.map((u) => <MenuItem key={u.id} value={u.id}>{emailToName(u.name)}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          )}
        </Box>

        {/* ══════════════════ PERSON DRILL-DOWN VIEW ══════════════════ */}
        {selectedPersonId ? (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ width: 44, height: 44, bgcolor: "#3b82f6", fontWeight: 700 }}>
                    {initialsFromEmail(selectedPerson?.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{emailToName(selectedPerson?.name || "")}</Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {selectedPerson?.departments.map((d) => (
                        <Chip key={d} label={d} size="small" sx={{ fontSize: 10, bgcolor: "#eff6ff", color: "#2563eb" }} />
                      ))}
                    </Stack>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Stack spacing={1.5}>
                  {[
                    { label: "Total Tasks", value: selectedPerson?.total, color: "#3b82f6" },
                    { label: "Completed", value: selectedPerson?.completed, color: "#16a34a" },
                    { label: "In Progress", value: selectedPerson?.inProgress, color: "#2563eb" },
                    { label: "Waiting Approval", value: selectedPerson?.waiting, color: "#9333ea" },
                    { label: "Pending", value: selectedPerson?.pending, color: "#6b7280" },
                    { label: "Overdue", value: selectedPerson?.overdue, color: "#dc2626" },
                  ].map((s) => (
                    <Box key={s.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                      <Chip label={s.value ?? 0} size="small" sx={{ fontWeight: 700, bgcolor: s.color + "20", color: s.color }} />
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Completion Rate</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedPerson?.completionRate}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={selectedPerson?.completionRate || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                  color={selectedPerson?.completionRate >= 70 ? "success" : selectedPerson?.completionRate >= 40 ? "warning" : "error"}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider", maxHeight: 620, overflowY: "auto" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Full Activity History
                </Typography>
                {historyLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress size={26} />
                  </Box>
                ) : personHistory.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No activity recorded yet.</Typography>
                ) : (
                  personHistory.map((entry, i) => (
                    <ActivityItem key={`${entry.type}-${entry.id ?? i}`} entry={entry} taskTitle={entry.taskTitle} />
                  ))
                )}
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <>
            {/* ══════════════════ OVERVIEW ══════════════════ */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={2.4}>
                <GradientStatCard
                  label="Total Tasks" value={overview.total}
                  icon={<AssignmentTurnedInIcon sx={{ color: "#fff" }} />}
                  gradient="linear-gradient(135deg, #6366f1, #4f46e5)"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <GradientStatCard
                  label="Completed" value={overview.completed}
                  icon={<AssignmentTurnedInIcon sx={{ color: "#fff" }} />}
                  gradient="linear-gradient(135deg, #22c55e, #16a34a)"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <GradientStatCard
                  label="In Progress" value={overview.inProgress}
                  icon={<HourglassTopIcon sx={{ color: "#fff" }} />}
                  gradient="linear-gradient(135deg, #38bdf8, #2563eb)"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <GradientStatCard
                  label="Overdue" value={overview.overdue}
                  icon={<WarningAmberIcon sx={{ color: "#fff" }} />}
                  gradient="linear-gradient(135deg, #f87171, #dc2626)"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <GradientStatCard
                  label="Completion Rate" value={`${overview.completionRate}%`}
                  icon={<TrendingUpIcon sx={{ color: "#fff" }} />}
                  gradient="linear-gradient(135deg, #a78bfa, #7c3aed)"
                />
              </Grid>
            </Grid>

            {/* ══════════════════ CHARTS ══════════════════ */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={12} md={7}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider", height: 340 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Tasks by Department & Status
                  </Typography>
                  <ResponsiveContainer width="100%" height={270}>
                    <BarChart data={deptChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <RechartsTooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Completed" stackId="a" fill={STATUS_COLORS["Completed"]} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="In Progress" stackId="a" fill={STATUS_COLORS["In Progress"]} />
                      <Bar dataKey="Pending" stackId="a" fill={STATUS_COLORS["Pending"]} />
                      <Bar dataKey="Waiting Approval" stackId="a" fill={STATUS_COLORS["Waiting Approval"]} />
                      <Bar dataKey="Overdue" stackId="a" fill={STATUS_COLORS["Overdue"]} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={5}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider", height: 340 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Status Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={270}>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {statusPieData.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#9ca3af"} />
                        ))}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

            {/* ══════════════════ PERSON-WISE CARDS ══════════════════ */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <GroupsIcon color="action" fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Person-wise Breakdown</Typography>
            </Box>

            <Grid container spacing={2}>
              {personSummaries.length === 0 ? (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">No tasks match the current filters.</Typography>
                </Grid>
              ) : (
                personSummaries.map((p) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                    <Paper
                      elevation={0}
                      onClick={() => loadPersonHistory(p.id)}
                      sx={{
                        p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider",
                        cursor: "pointer", transition: "all 0.15s",
                        "&:hover": { boxShadow: 4, borderColor: "#3b82f6" },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, fontSize: 12, bgcolor: "#3b82f6" }}>
                          {initialsFromEmail(p.name)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {emailToName(p.name)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {p.departments.join(", ") || "—"}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">{p.total} tasks</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: p.completionRate >= 70 ? "#16a34a" : p.completionRate >= 40 ? "#d97706" : "#dc2626" }}>
                          {p.completionRate}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={p.completionRate}
                        sx={{ height: 6, borderRadius: 3, mb: 1.25 }}
                        color={p.completionRate >= 70 ? "success" : p.completionRate >= 40 ? "warning" : "error"}
                      />

                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {p.completed > 0 && <Chip label={`${p.completed} done`} size="small" sx={{ fontSize: 10, bgcolor: "#f0fdf4", color: "#16a34a" }} />}
                        {p.inProgress > 0 && <Chip label={`${p.inProgress} active`} size="small" sx={{ fontSize: 10, bgcolor: "#eff6ff", color: "#2563eb" }} />}
                        {p.waiting > 0 && <Chip label={`${p.waiting} waiting`} size="small" sx={{ fontSize: 10, bgcolor: "#fdf4ff", color: "#9333ea" }} />}
                        {p.overdue > 0 && <Chip label={`${p.overdue} overdue`} size="small" sx={{ fontSize: 10, bgcolor: "#fef2f2", color: "#dc2626" }} />}
                      </Stack>
                    </Paper>
                  </Grid>
                ))
              )}
            </Grid>
          </>
        )}
      </Box>
    </Box>
  );
}