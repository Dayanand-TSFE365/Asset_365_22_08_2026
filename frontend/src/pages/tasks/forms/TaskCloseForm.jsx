// ===============================
// File: src/pages/tasks/forms/TaskCloseForm.jsx
// ===============================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import toast from "react-hot-toast";
import { API } from "../../../config/api";

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

// Same UTC-forcing fix as TaskDetails.jsx — backend sends naive timestamps.
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

export default function TaskCloseForm({ data = {} }) {
  const navigate = useNavigate();

  const [decision, setDecision] = useState("approve"); // "approve" | "reject"
  const [comment, setComment]   = useState("");
  const [rating, setRating]     = useState(null);
  const [saving, setSaving]     = useState(false);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(API.GET_USERS, { headers: authHeaders() });
        setUsers(res.data || []);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  const assignedUser = users.find((u) => u.id === data.assigned_to);
  const assignedName = assignedUser ? emailToName(assignedUser.name) : (data.assigned_to != null ? `User #${data.assigned_to}` : "—");
  const dueDate = formatDate(data.deadline);

  const checklist = data.checklists || [];
  const doneCount = checklist.filter((c) => c.is_completed).length;
  const progress = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

  const handleSubmit = async () => {
    if (decision === "reject" && !comment.trim()) {
      toast.error("Please explain why the task is being sent back.");
      return;
    }
    if (!data.id) {
      toast.error("No task selected.");
      return;
    }

    setSaving(true);
    const headers = authHeaders();
    try {
      // ── Approve = mark Completed, Reject = send back to In Progress.
      // This goes through CHANGE_TASK_STATUS — the exact same call
      // "Submit for Approval" uses — so it lands in status-history and
      // renders as a clean, centered "Status changed X → Y" entry in the
      // Discussion panel, instead of a separate emoji-laden chat bubble. ──
      const newStatus = decision === "approve" ? "Completed" : "In Progress";

      const parts = [];
      parts.push(decision === "approve" ? "Approved and closed" : "Sent back for rework");
      if (decision === "approve" && rating != null) parts.push(`Quality rating: ${rating}/5`);
      if (comment.trim()) parts.push(comment.trim());
      const remarks = parts.join(" — ");

      await axios.patch(
        API.CHANGE_TASK_STATUS(data.id),
        { status: newStatus, remarks },
        { headers }
      );

      toast.success(decision === "approve" ? "Task approved & closed." : "Task sent back to employee.");
      navigate(`/tasks/details/${data.id}`);
    } catch (err) {
      console.error("Close task failed:", err.response?.data || err);
      if (err?.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(err?.response?.data?.detail?.[0]?.msg || "Failed to update task.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        overflowY: "auto",
        bgcolor: "background.default",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        p: 3,
      }}
    >
      <Paper elevation={3} sx={{ width: "100%", maxWidth: 480, borderRadius: 2, overflow: "hidden" }}>
        {/* ── Header ────────────────────────────────────────────────── */}
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Close Task</Typography>
            <Typography variant="body2" color="text.secondary">
              {data.title || "Untitled task"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => navigate(-1)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mt: 1.5 }} />

        {/* ── Task summary ──────────────────────────────────────────── */}
        <Box sx={{ px: 2.5, pt: 2, display: "flex", gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Assigned To</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {loadingUsers ? <CircularProgress size={12} /> : assignedName}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Progress</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{progress}%</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Due</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{dueDate}</Typography>
          </Box>
        </Box>

        {/* ── Decision toggle ───────────────────────────────────────── */}
        <Box sx={{ px: 2.5, pt: 2.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Decision</Typography>
          <ToggleButtonGroup value={decision} exclusive onChange={(_, v) => v && setDecision(v)} fullWidth>
            <ToggleButton
              value="approve"
              sx={{ textTransform: "none", gap: 1, "&.Mui-selected": { bgcolor: "#f0fdf4", color: "#16a34a", "&:hover": { bgcolor: "#dcfce7" } } }}
            >
              <CheckCircleIcon fontSize="small" /> Approve & Close
            </ToggleButton>
            <ToggleButton
              value="reject"
              sx={{ textTransform: "none", gap: 1, "&.Mui-selected": { bgcolor: "#fef2f2", color: "#dc2626", "&:hover": { bgcolor: "#fee2e2" } } }}
            >
              <CancelIcon fontSize="small" /> Send Back
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* ── Optional quality rating (only on approve) ────────────── */}
        {decision === "approve" && (
          <Box sx={{ px: 2.5, pt: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Quality (optional)</Typography>
            <Box sx={{ display: "flex", gap: 0.75 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Chip
                  key={n}
                  label={`${n}★`}
                  size="small"
                  onClick={() => setRating(rating === n ? null : n)}
                  sx={{
                    cursor: "pointer",
                    bgcolor: rating === n ? "#fffbeb" : undefined,
                    color: rating === n ? "#d97706" : undefined,
                    border: rating === n ? "1px solid #d97706" : undefined,
                    fontWeight: rating === n ? 700 : 400,
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* ── Comment ───────────────────────────────────────────────── */}
        <Box sx={{ px: 2.5, pt: 2.5 }}>
          <TextField
            label={decision === "approve" ? "Comment (optional)" : "Reason for sending back"}
            placeholder={
              decision === "approve"
                ? "Great work, closing this out..."
                : "e.g. Testing incomplete, please redo section 3..."
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            size="small"
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            This will appear as a status update in the task's Discussion.
          </Typography>
        </Box>

        <Divider sx={{ mt: 2.5 }} />

        {/* ── Footer ────────────────────────────────────────────────── */}
        <Box sx={{ px: 2.5, py: 1.5, display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            color={decision === "approve" ? "success" : "error"}
            sx={{ textTransform: "none", borderRadius: 1.5, px: 2.5 }}
          >
            {saving ? "Saving..." : decision === "approve" ? "Approve & Close" : "Send Back"}
          </Button>
          <Button variant="text" onClick={() => navigate(-1)} sx={{ textTransform: "none", color: "text.secondary" }}>
            Cancel
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}