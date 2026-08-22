// ===============================
// File: src/pages/tickets/components/TicketDashboard.jsx
// ===============================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Box, Grid, Paper, Typography, Button, Tooltip, CircularProgress,
  Avatar, Chip, Stack,
} from "@mui/material";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import InboxIcon from "@mui/icons-material/Inbox";
import BuildIcon from "@mui/icons-material/Build";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";
import { API } from "../../../config/api";
import { useAuth } from "../../../auth/AuthContext";
import { hasPermission } from "../../../utils/permissions";

function authHeaders() {
  const token = sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// email -> display name, e.g. adarsh.verma@tsfe365.com -> Adarsh Verma
function emailToName(email) {
  if (!email) return null;
  const local = email.split("@")[0];
  return local.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

function initialsFromEmail(raw = "") {
  const name = emailToName(raw) || raw || "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const PRIORITY_COLORS = {
  low:      { bg: "#e0f2fe", fg: "#075985" },
  medium:   { bg: "#fef9c3", fg: "#854d0e" },
  high:     { bg: "#ffedd5", fg: "#9a3412" },
  critical: { bg: "#fee2e2", fg: "#991b1b" },
};

function PriorityChip({ label }) {
  const key = (label || "").toLowerCase().trim();
  const c = PRIORITY_COLORS[key] || { bg: "#f1f5f9", fg: "#334155" };
  return (
    <Chip
      label={label || "—"}
      size="small"
      sx={{ fontSize: 10, fontWeight: 700, bgcolor: c.bg, color: c.fg }}
    />
  );
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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

// Loose match against status_name — tighten to exact equality once you've
// confirmed the actual values GET_TICKET_STATUSES returns for your data.
function statusKind(statusName) {
  const s = (statusName || "").toLowerCase();
  if (s.includes("progress"))  return "in_progress";
  if (s.includes("wait"))      return "waiting_review";
  if (s.includes("resolved"))  return "resolved";
  if (s.includes("closed"))    return "closed";
  if (s.includes("open"))      return "open";
  return "other";
}

// ── Vivid gradient stat card — same component/visual language as
// TaskAnalytics' GradientStatCard, so the two dashboards read as one
// family instead of two different apps. ─────────────────────────────────
function GradientStatCard({ label, value, icon, gradient, onClick }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
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
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": onClick ? { transform: "translateY(-2px)", boxShadow: 6 } : {},
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

export default function TicketDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const currentUserId = user?.user_id;

  const [tickets, setTickets]       = useState([]);
  const [users, setUsers]           = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses]     = useState([]);
  const [loading, setLoading]       = useState(true);

  const fetchDashboard = useCallback(async () => {
    const headers = authHeaders();
    try {
      const [ticketsRes, usersRes, prioritiesRes, statusesRes] = await Promise.all([
        axios.get(API.GET_TICKETS, { headers }),
        axios.get(API.GET_USERS, { headers }),
        axios.get(API.GET_TICKET_PRIORITIES, { headers }),
        axios.get(API.GET_TICKET_STATUSES, { headers }),
      ]);
      setTickets(ticketsRes.data || []);
      setUsers(usersRes.data || []);
      setPriorities(prioritiesRes.data || []);
      setStatuses(statusesRes.data || []);
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
    users.forEach((u) => { m[u.id] = u.name || emailToName(u.email) || u.email || `#${u.id}`; });
    return m;
  }, [users]);

  const priorityMap = useMemo(() => {
    const m = {};
    priorities.forEach((p) => { m[p.id] = p.priority_name; });
    return m;
  }, [priorities]);

  const statusMap = useMemo(() => {
    const m = {};
    statuses.forEach((s) => { m[s.id] = s.status_name; });
    return m;
  }, [statuses]);

  // ── visibility: superadmin sees every ticket; everyone else only sees
  // tickets assigned to them — same rule as TaskDashboard, so the numbers
  // here and the numbers in the ticket tabs always agree. ────────────────
  const visibleTickets = useMemo(() => {
    if (isSuperAdmin) return tickets;
    return tickets.filter((t) => t.assigned_to === currentUserId);
  }, [tickets, isSuperAdmin, currentUserId]);

  // ── stat cards — one per real menu page only (Open, In Progress,
  // Waiting Review, Resolved, Closed). No "Overdue" card/section: there's
  // no /tickets/overdue page in ticketsMenu, and the old overdue bucket
  // was also miscounting tickets due today as overdue. ───────────────────
  const stats = useMemo(() => {
    const kinds = visibleTickets.map((t) => statusKind(statusMap[t.status_id]));
    return {
      total:          visibleTickets.length,
      open:           kinds.filter((k) => k === "open").length,
      in_progress:    kinds.filter((k) => k === "in_progress").length,
      waiting_review: kinds.filter((k) => k === "waiting_review").length,
      resolved:       kinds.filter((k) => k === "resolved").length,
      closed:         kinds.filter((k) => k === "closed").length,
    };
  }, [visibleTickets, statusMap]);

  // ── weekly chart — real tickets bucketed by created_at weekday
  // (Mon–Sun of the current week), split by current status kind. ────────
  const weeklyChartData = useMemo(() => {
    const monday = startOfWeek(new Date());
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return labels.map((label, i) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dayTickets = visibleTickets.filter(
        (t) => t.created_at && sameDay(new Date(t.created_at), dayDate)
      );
      return {
        day: label,
        Open:        dayTickets.filter((t) => statusKind(statusMap[t.status_id]) === "open").length,
        "In Progress": dayTickets.filter((t) => statusKind(statusMap[t.status_id]) === "in_progress").length,
        Resolved:    dayTickets.filter((t) => statusKind(statusMap[t.status_id]) === "resolved").length,
      };
    });
  }, [visibleTickets, statusMap]);

  // ── currently assigned, still-open tickets (any assignee if superadmin
  // is looking at the whole board; visibleTickets already scopes that) ──
  const assignedTickets = useMemo(() => {
    return visibleTickets
      .filter((t) => {
        const kind = statusKind(statusMap[t.status_id]);
        return kind !== "resolved" && kind !== "closed";
      })
      .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0))
      .slice(0, 8)
      .map((t) => ({
        id: t.id,
        ticket_no: t.ticket_no,
        title: t.scope_of_work || t.customer_name || t.ticket_no,
        assigned_to: userMap[t.assigned_to] || "Unassigned",
        priority: priorityMap[t.priority_id],
        status: statusMap[t.status_id],
        due: formatShortDate(t.due_date),
      }));
  }, [visibleTickets, statusMap, priorityMap, userMap]);

  const canCreate = hasPermission("create_tickets");

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "grey.50" }}>
      <Box sx={{ maxWidth: 1500, mx: "auto" }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Ticket Dashboard</Typography>
            <Typography variant="body2" color="text.secondary">
              Company-wide overview of ticket status and workload
            </Typography>
          </Box>
          <Tooltip title={!canCreate ? "You don't have permission to create tickets" : ""}>
            <span>
              <Button
                variant="contained" size="small" disabled={!canCreate}
                onClick={() => navigate("/tickets/action/create")}
                sx={{ textTransform: "none" }}
              >
                + Create Ticket
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
            {/* ── Summary cards — gradient style, one per real page ────── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <GradientStatCard
                  label="Total Tickets" value={stats.total}
                  icon={<ConfirmationNumberIcon sx={{ color: "#fff" }} />}
                  gradient="linear-gradient(135deg, #6366f1, #4f46e5)"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <GradientStatCard
                  label="Open" value={stats.open}
                  icon={<InboxIcon sx={{ color: "#fff" }} />}
                  gradient="linear-gradient(135deg, #38bdf8, #0284c7)"
                  onClick={() => navigate("/tickets/open")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <GradientStatCard
                  label="In Progress" value={stats.in_progress}
                  icon={<BuildIcon sx={{ color: "#fff" }} />}
                  gradient="linear-gradient(135deg, #a78bfa, #7c3aed)"
                  onClick={() => navigate("/tickets/in-progress")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <GradientStatCard
                  label="Waiting Review" value={stats.waiting_review}
                  icon={<RateReviewIcon sx={{ color: "#fff" }} />}
                  gradient="linear-gradient(135deg, #fbbf24, #d97706)"
                  onClick={() => navigate("/tickets/waiting-review")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <GradientStatCard
                  label="Resolved" value={stats.resolved}
                  icon={<CheckCircleIcon sx={{ color: "#fff" }} />}
                  gradient="linear-gradient(135deg, #22c55e, #16a34a)"
                  onClick={() => navigate("/tickets/resolved")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <GradientStatCard
                  label="Closed" value={stats.closed}
                  icon={<DoneAllIcon sx={{ color: "#fff" }} />}
                  gradient="linear-gradient(135deg, #94a3b8, #64748b)"
                  onClick={() => navigate("/tickets/closed")}
                />
              </Grid>
            </Grid>

            {/* ── Chart + Recent Activity ──────────────────────────────── */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={12} md={7}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider", height: 320 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    This Week — Tickets Created
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={weeklyChartData} barSize={14}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <RechartsTooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Open" fill="#0284c7" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="In Progress" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Resolved" fill="#16a34a" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* ── Recent activity — no feed endpoint yet ────────────── */}
              <Grid item xs={12} md={5}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider", height: 320, display: "flex", flexDirection: "column" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Recent Activity</Typography>
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>
                    <InboxIcon sx={{ fontSize: 28, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2" sx={{ textAlign: "center" }}>No activity feed connected yet.</Typography>
                    <Typography variant="caption" sx={{ textAlign: "center", mt: 0.5 }}>Needs a dedicated backend endpoint.</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* ── Assigned tickets — full width now that Overdue is gone ─ */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Assigned Tickets</Typography>
              {assignedTickets.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No open tickets assigned.</Typography>
              ) : (
                <Grid container spacing={1.5}>
                  {assignedTickets.map((t) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={t.id}>
                      <Box
                        onClick={() => navigate(`/tickets/details/${t.id}`)}
                        sx={{
                          p: 1.5, height: "100%", borderRadius: 2, border: "1px solid", borderColor: "divider",
                          cursor: "pointer", transition: "all 0.15s",
                          "&:hover": { boxShadow: 4, borderColor: "#6366f1" },
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.title}
                          </Typography>
                          <PriorityChip label={t.priority} />
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                          <Avatar sx={{ width: 22, height: 22, fontSize: 10, bgcolor: "#3b82f6" }}>
                            {initialsFromEmail(t.assigned_to)}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {emailToName(t.assigned_to) || t.assigned_to}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="space-between">
                          <Chip label={t.status} size="small" sx={{ fontSize: 10, fontWeight: 600, bgcolor: "#eef2ff", color: "#4f46e5" }} />
                          <Typography variant="caption" color="text.secondary">Due {t.due}</Typography>
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}