// ===============================
// File: src/pages/tasks/forms/TaskReassignForm.jsx
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
  Avatar,
  Menu,
  MenuItem,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import toast from "react-hot-toast";
import { API } from "../../../config/api";

function authHeaders() {
  const token = sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function initialsFromName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function TaskReassignForm({ data = {} }) {
  const navigate = useNavigate();

  const [users, setUsers]         = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(API.GET_USERS, { headers: authHeaders() });
        setUsers(res.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load users.");
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  // task.assigned_to on the task object is a user id — match against that,
  // not against a display name.
  const currentAssignee = users.find((u) => u.id === data.assigned_to) || null;
  const otherUsers = users.filter((u) => u.id !== currentAssignee?.id);

  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [reason, setReason]               = useState("");
  const [notifyOld, setNotifyOld]         = useState(true);
  const [resetProgress, setResetProgress] = useState(false);
  const [saving, setSaving]               = useState(false);
  const [assigneeAnchor, setAssigneeAnchor] = useState(null);

  const newAssignee = users.find((u) => u.id === Number(newAssigneeId));

  // Progress is now checklist-derived, not a stored task field — so
  // "reset progress to 0%" means un-checking every checklist item on this
  // task via UPDATE_CHECKLIST. The `reset_progress` flag is still sent to
  // the assign endpoint too (in case the backend has its own handling),
  // but this makes sure the UI actually reflects 0% right away regardless.
  const resetChecklistItems = async () => {
    const items = data.checklists || [];
    const completedItems = items.filter((c) => c.is_completed);
    if (completedItems.length === 0) return;
    const headers = authHeaders();
    const results = await Promise.allSettled(
      completedItems.map((c) =>
        axios.patch(API.UPDATE_CHECKLIST(c.id), { title: c.title, is_completed: false }, { headers })
      )
    );
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error(`Failed to reset ${failed.length} checklist item(s):`, failed);
      throw new Error("partial_reset_failure");
    }
  };

  const handleReassign = async () => {
    if (!newAssigneeId) {
      toast.error("Please select a new assignee.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for reassignment.");
      return;
    }
    if (!data.id) {
      toast.error("No task selected.");
      return;
    }

    setSaving(true);
    try {
      await axios.patch(
        API.ASSIGN_TASK(data.id),
        {
          assigned_to: Number(newAssigneeId),
          reason,
          note: "Task Reassigned",
          notify_old: notifyOld,
          reset_progress: resetProgress,
        },
        { headers: authHeaders() }
      );

      if (resetProgress) {
        try {
          await resetChecklistItems();
          toast.success(`Task reassigned to ${newAssignee?.name}. Progress reset to 0%.`);
        } catch {
          toast.error(`Reassigned to ${newAssignee?.name}, but couldn't reset all checklist items — check them off manually if needed.`);
        }
      } else {
        toast.success(`Task reassigned to ${newAssignee?.name}.`);
      }

      navigate(`/tasks/details/${data.id}`);
    } catch (err) {
      console.error("Reassign failed:", err.response?.data || err);
      if (err?.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(err?.response?.data?.detail?.[0]?.msg || "Failed to reassign task.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingUsers) {
    return (
      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

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
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Reassign Task</Typography>
            <Typography variant="body2" color="text.secondary">
              {data.title || "Untitled task"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => navigate(-1)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mt: 1.5 }} />

        {/* ── From → To visual ─────────────────────────────────────── */}
        <Box sx={{ px: 2.5, pt: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ width: 26, height: 26, fontSize: 10, bgcolor: "#9ca3af" }}>
              {currentAssignee ? initialsFromName(currentAssignee.name) : "?"}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {currentAssignee?.name || "Unassigned"}
            </Typography>
          </Box>
          <ArrowRightAltIcon fontSize="small" color="disabled" />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ width: 26, height: 26, fontSize: 10, bgcolor: newAssignee ? "#3b82f6" : "#e5e7eb" }}>
              {newAssignee ? initialsFromName(newAssignee.name) : "?"}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: newAssignee ? 600 : 400 }}>
              {newAssignee?.name || "Select new..."}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mt: 2 }} />

        {/* ── New assignee picker ──────────────────────────────────── */}
        <Box sx={{ px: 2.5, py: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Reassign to
          </Typography>
          <Box
            onClick={(e) => setAssigneeAnchor(e.currentTarget)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.5,
              cursor: "pointer",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            {newAssignee ? (
              <>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: 11,
                    bgcolor: "#3b82f6",
                  }}
                >
                  {initialsFromName(newAssignee.name)}
                </Avatar>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {newAssignee.name}
                  </Typography>
                  {newAssignee.email && (
                    <Typography variant="caption" color="text.secondary">
                      {newAssignee.email}
                    </Typography>
                  )}
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Select user...
              </Typography>
            )}
          </Box>
        </Box>

        <Divider />

        {/* ── Reason ────────────────────────────────────────────────── */}
        <Box sx={{ px: 2.5, py: 2 }}>
          <TextField
            label="Reason for reassignment"
            placeholder="e.g. Rahul is on leave, moving to Kulwinder..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            size="small"
          />
        </Box>

        {/* ── Options ───────────────────────────────────────────────── */}
        <Box sx={{ px: 2.5, pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Checkbox
              size="small"
              checked={notifyOld}
              onChange={(e) => setNotifyOld(e.target.checked)}
            />
            <Typography variant="body2">
              Notify previous assignee
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Checkbox
              size="small"
              checked={resetProgress}
              onChange={(e) => setResetProgress(e.target.checked)}
            />
            <Typography variant="body2">
              Reset progress to 0%
            </Typography>
          </Box>
          {resetProgress && (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 5, display: "block", mt: -0.5 }}>
              Un-checks every checklist item on this task.
            </Typography>
          )}
        </Box>

        <Divider />

        {/* ── Footer ────────────────────────────────────────────────── */}
        <Box sx={{ px: 2.5, py: 1.5, display: "flex", gap: 1 }}>
          <Button variant="contained" onClick={handleReassign} disabled={saving} sx={{ textTransform: "none", borderRadius: 1.5, px: 2.5 }}>
            {saving ? "Reassigning..." : "Reassign"}
          </Button>
          <Button variant="text" onClick={() => navigate(-1)} sx={{ textTransform: "none", color: "text.secondary" }}>
            Cancel
          </Button>
        </Box>
      </Paper>
      <Menu
  anchorEl={assigneeAnchor}
  open={Boolean(assigneeAnchor)}
  onClose={() => setAssigneeAnchor(null)}
  PaperProps={{
    sx: {
      minWidth: 240,
      maxHeight: 320,
      borderRadius: 2,
    },
  }}
>
  {otherUsers.length === 0 ? (
    <MenuItem disabled>No other users available</MenuItem>
  ) : (
    otherUsers.map((u) => (
      <MenuItem
        key={u.id}
        onClick={() => {
          setNewAssigneeId(String(u.id));
          setAssigneeAnchor(null);
        }}
        selected={Number(newAssigneeId) === u.id}
        sx={{ gap: 1.5 }}
      >
        <Avatar
          sx={{
            width: 28,
            height: 28,
            fontSize: 11,
            bgcolor: "#3b82f6",
          }}
        >
          {initialsFromName(u.name)}
        </Avatar>

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {u.name}
          </Typography>

          {u.email && (
            <Typography variant="caption" color="text.secondary">
              {u.email}
            </Typography>
          )}
        </Box>
      </MenuItem>
    ))
  )}
</Menu>
    </Box>
  );
}