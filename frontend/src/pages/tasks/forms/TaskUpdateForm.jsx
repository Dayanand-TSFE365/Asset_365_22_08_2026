// ===============================
// File: src/pages/tasks/forms/TaskUpdateForm.jsx
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
  Menu,
  MenuItem,
  Avatar,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FlagIcon from "@mui/icons-material/Flag";
import toast from "react-hot-toast";
import { API } from "../../../config/api";
import { useAuth } from "../../../auth/AuthContext";

const PRIORITIES = [
  { label: "High",   color: "#dc2626" },
  { label: "Medium", color: "#d97706" },
  { label: "Low",    color: "#16a34a" },
];

const STATUSES = ["Pending", "In Progress", "Waiting Approval", "Completed", "Overdue"];

function initialsFromEmail(email = "") {
  const namePart = email.split("@")[0] || "";
  const parts = namePart.split(/[._]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return namePart.slice(0, 2).toUpperCase();
}

function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function authHeaders() {
  const token = sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function TaskUpdateForm({ data = {} }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingTask, setLoadingTask] = useState(!data.title);

  const taskId = data.id;

  const [title, setTitle]           = useState(data.title || "");
  const [description, setDescription] = useState(data.description || "");
  const [assignee, setAssignee]     = useState(null);
  const [deadline, setDeadline]     = useState(toDatetimeLocal(data.deadline || data.due_date));
  const [priority, setPriority]     = useState(data.priority || "Medium");
  const [status, setStatus]         = useState(data.status || "Pending");
  const [estimatedHours, setEstimatedHours] = useState(data.estimated_hours || "");
  const [saving, setSaving]         = useState(false);

  // ── checklist: edit-only — title / is_completed, PATCH per changed item.
  // No create/delete endpoint exists yet, so items can't be added/removed
  // here. originalChecklist is kept so Save only PATCHes what actually
  // changed instead of re-sending every item. ─────────────────────────────
  const [checklist, setChecklist]         = useState(data.checklists || []);
  const [originalChecklist, setOriginalChecklist] = useState(data.checklists || []);

  const [priorityAnchor, setPriorityAnchor] = useState(null);
  const [statusAnchor, setStatusAnchor]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const headers = authHeaders();
        const usersRes = await axios.get(API.GET_USERS, { headers });
        setUsers(usersRes.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load users.");
      } finally {
        setLoadingMeta(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (data.title || !taskId) {
      setLoadingTask(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(API.GET_TASK(taskId), { headers: authHeaders() });
        const t = res.data;
        setTitle(t.title || "");
        setDescription(t.description || "");
        setDeadline(toDatetimeLocal(t.deadline));
        setPriority(t.priority || "Medium");
        setStatus(t.status || "Pending");
        setEstimatedHours(t.estimated_hours || "");
        setChecklist(t.checklists || []);
        setOriginalChecklist(t.checklists || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load task.");
      } finally {
        setLoadingTask(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    if (users.length === 0) return;

    const assignedId = data.assigned_to;

    if (assignedId) {
      const match = users.find((u) => u.id === assignedId);
      if (match) setAssignee(match);
    }
  }, [users, data.assigned_to]);

  const priorityColor =
    PRIORITIES.find((p) => p.label === priority)?.color || "#d97706";


  // ── checklist handlers — local edits only, PATCHed on Save ────────────
  const handleChecklistToggle = (id) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_completed: !c.is_completed } : c))
    );
  };

  const handleChecklistTitleChange = (id, value) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: value } : c))
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Task title is required.");
      return;
    }
    setSaving(true);
    try {
      const headers = authHeaders();

      const payload = {
        title,
        description,
        assigned_to: assignee?.id,
        priority,
        estimated_hours: estimatedHours ? Number(estimatedHours) : 0,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      };

      await axios.put(API.UPDATE_TASK(taskId), payload, { headers });

      if (status && status !== data.status) {
        await axios.patch(
          API.CHANGE_TASK_STATUS(taskId),
          { status, remarks: "Updated via task edit form" },
          { headers }
        );
      }

      // ── checklist: only send items that actually changed vs what was
      // loaded, so we don't spam PATCH requests for untouched items. ─────
      const changedItems = checklist.filter((c) => {
        const orig = originalChecklist.find((o) => o.id === c.id);
        return orig && (orig.title !== c.title || orig.is_completed !== c.is_completed);
      });

      if (changedItems.length > 0) {
        try {
          await Promise.all(
            changedItems.map((c) =>
              axios.patch(
                API.UPDATE_CHECKLIST(c.id),
                { title: c.title, is_completed: c.is_completed },
                { headers }
              )
            )
          );
        } catch (checklistErr) {
          console.error("Checklist update failed:", checklistErr.response?.data || checklistErr);
          toast.error("Task saved, but some checklist items failed to update.");
        }
      }

      toast.success("Task updated successfully!");
      navigate(`/tasks/details/${taskId}`);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(err?.response?.data?.detail?.[0]?.msg || "Failed to update task.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingMeta || loadingTask) {
    return (
      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const doneCount = checklist.filter((c) => c.is_completed).length;

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
      <Paper elevation={3} sx={{ width: "100%", maxWidth: 600, borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
          <TextField
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task name"
            variant="standard"
            fullWidth
            InputProps={{ disableUnderline: true, style: { fontSize: 20, fontWeight: 700 } }}
          />
          <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
            <IconButton size="small" onClick={(e) => setPriorityAnchor(e.currentTarget)} sx={{ color: priorityColor }}>
              <FlagIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => navigate(-1)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ px: 2.5, pb: 1 }}>
          <TextField
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            variant="standard"
            fullWidth
            multiline
            minRows={3}
            InputProps={{ disableUnderline: true, style: { fontSize: 14, color: "#6b7280" } }}
          />
        </Box>

        <Divider />

        <Box sx={{ px: 2.5, py: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
          {/* Assignee can't be changed from here — reassignment happens via
              the "Reassign" action in the task list, which has its own
              flow/permissions. Clicking this just points the user there. */}
          <Box
            onClick={() => toast("Use Reassign from the task list to change the assignee.")}
            sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", px: 1, py: 0.5, borderRadius: 1, "&:hover": { bgcolor: "action.hover" } }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ width: 100 }}>Assignee:</Typography>
            {assignee ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar sx={{ width: 22, height: 22, fontSize: 10, bgcolor: "#3b82f6" }}>
                  {initialsFromEmail(assignee.name)}
                </Avatar>
                <Typography variant="body2">{assignee.name}</Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">Assign to...</Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ width: 100 }}>Deadline:</Typography>
            <TextField
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              size="small"
              variant="standard"
              InputProps={{ disableUnderline: true, style: { fontSize: 14 } }}
            />
          </Box>

          <Box
            onClick={(e) => setStatusAnchor(e.currentTarget)}
            sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", px: 1, py: 0.5, borderRadius: 1, "&:hover": { bgcolor: "action.hover" } }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ width: 100 }}>Status:</Typography>
            <Chip label={status} size="small" sx={{ fontWeight: 600 }} />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ width: 100 }}>Priority:</Typography>
            <Box sx={{ display: "flex", gap: 0.75 }}>
              {PRIORITIES.map((p) => (
                <Chip
                  key={p.label}
                  label={p.label}
                  size="small"
                  onClick={() => setPriority(p.label)}
                  sx={{
                    bgcolor: priority === p.label ? p.color + "20" : undefined,
                    color: p.color,
                    fontWeight: priority === p.label ? 700 : 400,
                    border: priority === p.label ? `1px solid ${p.color}` : undefined,
                    cursor: "pointer",
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ width: 100 }}>Est. Hours:</Typography>
            <TextField
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              size="small"
              variant="standard"
              InputProps={{ disableUnderline: true, style: { fontSize: 14 } }}
              sx={{ width: 80 }}
            />
          </Box>
        </Box>

        <Divider />

        {/* ── Checklist — edit title / toggle complete only. No add/remove
            until a create/delete endpoint exists. ────────────────────── */}
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Checklist ({doneCount}/{checklist.length})
          </Typography>

          {checklist.length === 0 ? (
            <Typography variant="caption" color="text.secondary">No checklist items.</Typography>
          ) : (
            checklist.map((item) => (
              <Box key={item.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Checkbox
                  size="small"
                  checked={!!item.is_completed}
                  onChange={() => handleChecklistToggle(item.id)}
                  sx={{ p: 0.5 }}
                />
                <TextField
                  value={item.title}
                  onChange={(e) => handleChecklistTitleChange(item.id, e.target.value)}
                  variant="standard"
                  size="small"
                  fullWidth
                  InputProps={{
                    disableUnderline: true,
                    style: {
                      fontSize: 14,
                      textDecoration: item.is_completed ? "line-through" : "none",
                      color: item.is_completed ? "#9ca3af" : undefined,
                    },
                  }}
                />
              </Box>
            ))
          )}
        </Box>

        <Divider />

        <Box sx={{ px: 2.5, py: 1.5, display: "flex", gap: 1 }}>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ textTransform: "none", borderRadius: 1.5, px: 2.5 }}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="text" onClick={() => navigate(-1)} sx={{ textTransform: "none", color: "text.secondary" }}>
            Cancel
          </Button>
        </Box>
      </Paper>

      <Menu anchorEl={priorityAnchor} open={Boolean(priorityAnchor)} onClose={() => setPriorityAnchor(null)} PaperProps={{ sx: { minWidth: 150, borderRadius: 2 } }}>
        {PRIORITIES.map((p) => (
          <MenuItem key={p.label} onClick={() => { setPriority(p.label); setPriorityAnchor(null); }} selected={priority === p.label} sx={{ gap: 1 }}>
            <FlagIcon fontSize="small" sx={{ color: p.color }} />
            <Typography variant="body2">{p.label}</Typography>
          </MenuItem>
        ))}
      </Menu>

      <Menu anchorEl={statusAnchor} open={Boolean(statusAnchor)} onClose={() => setStatusAnchor(null)} PaperProps={{ sx: { minWidth: 170, borderRadius: 2 } }}>
        {STATUSES.map((s) => (
          <MenuItem key={s} onClick={() => { setStatus(s); setStatusAnchor(null); }} selected={status === s}>
            <Typography variant="body2">{s}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}