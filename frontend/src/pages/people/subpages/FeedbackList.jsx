// ===============================
// File: src/pages/feedback/FeedbackList.jsx
// ===============================

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Box, Paper, Typography, Grid, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Button, Stack, Tabs, Tab,
  CircularProgress, Avatar, Rating, Divider, InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { API } from "../../../config/api";

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

// crude but reliable "does this look like an email" check — same helper
// used in TicketDetails/TicketChat so display names never leak emails.
function looksLikeEmail(str) {
  return typeof str === "string" && /\S+@\S+\.\S+/.test(str);
}

function emailToName(email) {
  if (!email) return null;
  const local = email.split("@")[0];
  return local.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

function resolveDisplayName(u) {
  if (!u) return null;
  if (u.name && !looksLikeEmail(u.name)) return u.name;
  if (u.email) return emailToName(u.email) || u.email;
  if (u.name) return emailToName(u.name) || u.name;
  return null;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

const STATUS_OPTIONS = ["Pending", "Reviewed", "Resolved"];

const STATUS_COLORS = {
  pending:  { bg: "#fef3c7", fg: "#92400e" },
  reviewed: { bg: "#dbeafe", fg: "#1e40af" },
  resolved: { bg: "#dcfce7", fg: "#166534" },
};

const CATEGORY_COLORS = {
  bug:        { bg: "#fee2e2", fg: "#991b1b" },
  suggestion: { bg: "#ede9fe", fg: "#5b21b6" },
  feature:    { bg: "#e0f2fe", fg: "#075985" },
  complaint:  { bg: "#ffedd5", fg: "#9a3412" },
  other:      { bg: "#f1f5f9", fg: "#475569" },
};

function StatusChip({ status }) {
  const key = (status || "pending").toLowerCase();
  const c = STATUS_COLORS[key] || STATUS_COLORS.pending;
  return (
    <Chip size="small" label={status || "Pending"} sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 700 }} />
  );
}

function CategoryChip({ category }) {
  const key = (category || "other").toLowerCase();
  const c = CATEGORY_COLORS[key] || CATEGORY_COLORS.other;
  return (
    <Chip size="small" label={category || "Other"} sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 600 }} />
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{
        width: 42, height: 42, borderRadius: 2, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        bgcolor: `${color}1f`,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" fontWeight={700} lineHeight={1.1}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
    </Paper>
  );
}

export default function FeedbackList() {
  const [feedback, setFeedback] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);

  const [statusTab, setStatusTab]   = useState("All");
  const [searchText, setSearchText] = useState("");

  const [selected, setSelected] = useState(null);
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [status, setStatus]     = useState("Pending");
  const [adminResponse, setAdminResponse] = useState("");

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API.GET_ALL_FEEDBACK, { headers: authHeaders() });
      setFeedback(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
    if (API.GET_USERS) {
      axios.get(API.GET_USERS, { headers: authHeaders() })
        .then((res) => setUsers(res.data || []))
        .catch(console.error);
    }
  }, []);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => { map[u.id] = resolveDisplayName(u); });
    return map;
  }, [users]);

  const stats = useMemo(() => {
    const total = feedback.length;
    const pending = feedback.filter((f) => (f.status || "Pending").toLowerCase() === "pending").length;
    const reviewed = feedback.filter((f) => (f.status || "").toLowerCase() === "reviewed").length;
    const resolved = feedback.filter((f) => (f.status || "").toLowerCase() === "resolved").length;
    return { total, pending, reviewed, resolved };
  }, [feedback]);

  const filtered = useMemo(() => {
    let list = feedback;
    if (statusTab !== "All") {
      list = list.filter((f) => (f.status || "Pending").toLowerCase() === statusTab.toLowerCase());
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter((f) => {
        const name = (userMap[f.user_id] || "").toLowerCase();
        return (
          f.subject?.toLowerCase().includes(q) ||
          f.message?.toLowerCase().includes(q) ||
          f.category?.toLowerCase().includes(q) ||
          name.includes(q)
        );
      });
    }
    return [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [feedback, statusTab, searchText, userMap]);

  const openEditor = (row) => {
    setSelected(row);
    setStatus(row.status || "Pending");
    setAdminResponse(row.admin_response || "");
    setOpen(true);
  };

  const closeEditor = () => {
    setOpen(false);
    setSelected(null);
    setAdminResponse("");
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await axios.patch(
        API.UPDATE_FEEDBACK(selected.id),
        { status, admin_response: adminResponse },
        { headers: authHeaders() }
      );
      toast.success("Feedback updated.");
      fetchFeedback();
      closeEditor();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update feedback.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "background.default" }}>
      <Box sx={{ maxWidth: 1100, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        <Typography variant="h5" fontWeight={700}>Feedback</Typography>

        {/* Stat cards */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<FeedbackOutlinedIcon sx={{ color: "#3b82f6" }} />} label="Total" value={stats.total} color="#3b82f6" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<HourglassEmptyIcon sx={{ color: "#d97706" }} />} label="Pending" value={stats.pending} color="#d97706" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<VisibilityIcon sx={{ color: "#2563eb" }} />} label="Reviewed" value={stats.reviewed} color="#2563eb" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<CheckCircleOutlineIcon sx={{ color: "#16a34a" }} />} label="Resolved" value={stats.resolved} color="#16a34a" />
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, px: 2, pt: 1.5 }}>
            <Tabs
              value={statusTab}
              onChange={(_, v) => setStatusTab(v)}
              sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 600 } }}
            >
              {["All", "Pending", "Reviewed", "Resolved"].map((tab) => (
                <Tab key={tab} value={tab} label={tab} />
              ))}
            </Tabs>
            <TextField
              size="small"
              placeholder="Search subject, message, user…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              sx={{ minWidth: 260, mb: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* List */}
          <Divider />
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={26} />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No feedback matches your filters.
              </Typography>
            </Box>
          ) : (
            <Stack divider={<Divider />}>
              {filtered.map((f) => {
                const name = userMap[f.user_id] || `User #${f.user_id}`;
                return (
                  <Box
                    key={f.id}
                    sx={{
                      display: "flex", alignItems: "flex-start", gap: 2,
                      px: 2, py: 1.75,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Avatar sx={{ width: 36, height: 36, fontSize: "0.85rem", bgcolor: "#3b82f6" }}>
                      {name.charAt(0).toUpperCase()}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.25 }}>
                        <Typography variant="body2" fontWeight={700}>{name}</Typography>
                        <Rating value={f.rating || 0} readOnly size="small" />
                        <CategoryChip category={f.category} />
                        <StatusChip status={f.status} />
                      </Box>

                      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>
                        {f.subject}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                      >
                        {f.message}
                      </Typography>

                      {f.admin_response && (
                        <Box sx={{ mt: 1, p: 1, borderRadius: 1.5, bgcolor: "#f0fdf4", border: "1px solid #dcfce7" }}>
                          <Typography variant="caption" fontWeight={700} color="#166534" sx={{ display: "block" }}>
                            Admin response
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{f.admin_response}</Typography>
                        </Box>
                      )}

                      <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.75 }}>
                        {formatDateTime(f.created_at)}
                      </Typography>
                    </Box>

                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon fontSize="small" />}
                      onClick={() => openEditor(f)}
                      sx={{ textTransform: "none", flexShrink: 0 }}
                    >
                      Respond
                    </Button>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Paper>
      </Box>

      <Dialog open={open} onClose={closeEditor} fullWidth maxWidth="sm">
        <DialogTitle>Respond to Feedback</DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Box sx={{ mb: 2, p: 1.5, borderRadius: 1.5, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Typography variant="body2" fontWeight={700}>
                  {userMap[selected.user_id] || `User #${selected.user_id}`}
                </Typography>
                <Rating value={selected.rating || 0} readOnly size="small" />
              </Box>
              <Typography variant="body2" fontWeight={600}>{selected.subject}</Typography>
              <Typography variant="body2" color="text.secondary">{selected.message}</Typography>
            </Box>
          )}

          <Stack spacing={2}>
            <TextField
              label="Status"
              select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              fullWidth
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Admin Response"
              fullWidth
              multiline
              minRows={3}
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              placeholder="Let the user know what happened next…"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditor} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} variant="contained">
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}