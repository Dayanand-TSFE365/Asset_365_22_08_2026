// ===============================
// File: src/pages/tasks/forms/TaskCreateForm.jsx
// ===============================

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  Divider,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  Collapse,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ChecklistIcon from "@mui/icons-material/FormatListBulleted";
import PersonIcon from "@mui/icons-material/PersonOutline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import FlagIcon from "@mui/icons-material/Flag";
import toast from "react-hot-toast";
import { API } from "../../../config/api";
import { useAuth } from "../../../auth/AuthContext";

const PRIORITIES = [
  { label: "High",   color: "#dc2626" },
  { label: "Medium", color: "#d97706" },
  { label: "Low",    color: "#16a34a" },
];

function initialsFromEmail(email = "") {
  const namePart = email.split("@")[0] || "";
  const parts = namePart.split(/[._]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return namePart.slice(0, 2).toUpperCase();
}

function authHeaders() {
  const token = sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function ChecklistItem({ item, onChange, onDelete }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
      <Checkbox
        size="small"
        checked={item.done}
        onChange={(e) => onChange({ ...item, done: e.target.checked })}
        sx={{ p: 0.5 }}
      />
      <TextField
        size="small"
        variant="standard"
        placeholder="Checklist item..."
        value={item.text}
        onChange={(e) => onChange({ ...item, text: e.target.value })}
        sx={{ flex: 1 }}
        InputProps={{ disableUnderline: false }}
      />
      <IconButton size="small" onClick={onDelete} sx={{ color: "text.disabled" }}>
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export default function TaskCreateForm() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

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
  }, [user]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState(null);
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState(null);
  const [detailed, setDetailed] = useState(false);

  const [assigneeAnchor, setAssigneeAnchor] = useState(null);
  const [priorityAnchor, setPriorityAnchor] = useState(null);
  const fileInputRef = useRef(null);

  const addChecklistItem = () => {
    setChecklist((prev) => [...prev, { id: Date.now(), text: "", done: false }]);
  };
  const updateChecklistItem = (id, updated) => {
    setChecklist((prev) => prev.map((i) => (i.id === id ? updated : i)));
  };
  const deleteChecklistItem = (id) => {
    setChecklist((prev) => prev.filter((i) => i.id !== id));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };
  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleTab = (tab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
    if (tab === "checklist" && checklist.length === 0) {
      setChecklist([{ id: Date.now(), text: "", done: false }]);
    }
    if (tab === "files") {
      setTimeout(() => fileInputRef.current?.click(), 50);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Task title is required.");
      return;
    }
    if (!assignee) {
      toast.error("Please assign this task to someone.");
      return;
    }

    if (
      checklist.length === 0 ||
      checklist.every((item) => !item.text.trim())
    ) {
      toast.error("Please add at least one checklist item.");
      return;
    }


    setSaving(true);
    try {
      const headers = authHeaders();

      const payload = {
        title,
        description,
        assigned_to: assignee.id,
        priority,
        estimated_hours: estimatedHours ? Number(estimatedHours) : 0,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        checklists: checklist
          .filter((c) => c.text.trim())
          .map((c) => ({ title: c.text, is_completed: c.done })),
      };

      const res = await axios.post(API.CREATE_TASK, payload, { headers });
      const newTaskId = res.data.id;

      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach((f) => formData.append("files", f));
        await axios.post(API.UPLOAD_TASK_ATTACHMENTS(newTaskId), formData, {
          headers: { ...headers, "Content-Type": "multipart/form-data" },
        });
      }

      toast.success("Task created successfully!");
      navigate("/tasks/my");
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(err?.response?.data?.detail?.[0]?.msg || "Failed to create task.");
      }
    } finally {
      setSaving(false);
    }
  };

  const priorityColor = PRIORITIES.find((p) => p.label === priority)?.color || "#d97706";

  if (loadingMeta) {
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
      <Paper elevation={3} sx={{ width: "100%", maxWidth: 600, borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
          <TextField
            placeholder="Task name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="standard"
            fullWidth
            autoFocus
            InputProps={{ disableUnderline: true, style: { fontSize: 20, fontWeight: 700 } }}
          />
          <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
            <Tooltip title={`Priority: ${priority}`}>
              <IconButton size="small" onClick={(e) => setPriorityAnchor(e.currentTarget)} sx={{ color: priorityColor }}>
                <FlagIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => navigate("/tasks")}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ px: 2.5, pb: 1 }}>
          <TextField
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            variant="standard"
            fullWidth
            multiline
            minRows={detailed ? 4 : 2}
            InputProps={{ disableUnderline: true, style: { fontSize: 14, color: "#6b7280" } }}
          />
        </Box>

        <Divider />

        <Box sx={{ px: 2.5, py: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
          <Box
            onClick={(e) => setAssigneeAnchor(e.currentTarget)}
            sx={{
              display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer",
              "&:hover": { bgcolor: "action.hover", borderRadius: 1 },
              px: 1, py: 0.5, borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ width: 90 }}>
              Assignee:
            </Typography>
            {assignee ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar sx={{ width: 22, height: 22, fontSize: 10, bgcolor: "#3b82f6" }}>
                  {initialsFromEmail(assignee.name)}
                </Avatar>
                <Typography variant="body2">{assignee.name}</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                <PersonIcon fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Assign to...
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ width: 90 }}>
              Deadline:
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CalendarMonthIcon fontSize="small" sx={{ color: "#3b82f6" }} />
              <TextField
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                size="small"
                variant="standard"
                InputProps={{ disableUnderline: true, style: { fontSize: 14 } }}
                sx={{ "& input": { cursor: "pointer" } }}
              />
            </Box>
          </Box>

          <Collapse in={detailed}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ width: 90 }}>
                  Priority:
                </Typography>
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
                <Typography variant="body2" color="text.secondary" sx={{ width: 90 }}>
                  Est. Hours:
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  variant="standard"
                  placeholder="0"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  InputProps={{ disableUnderline: true, style: { fontSize: 14 } }}
                  sx={{ width: 80 }}
                />
              </Box>
            </Box>
          </Collapse>
        </Box>

        <Divider />

        <Collapse in={activeTab !== null}>
          <Box sx={{ px: 2.5, py: 1.5 }}>
            {activeTab === "files" && (
              <Box>
                <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileChange} />
                {attachments.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    No files attached. Click "Files" again to browse.
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {attachments.map((f, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          p: 0.75, borderRadius: 1, border: "1px solid", borderColor: "divider",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                          <AttachFileIcon fontSize="small" color="action" />
                          <Typography variant="caption" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.name}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => removeAttachment(i)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ textTransform: "none", alignSelf: "flex-start", mt: 0.5 }}
                    >
                      Add more
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {activeTab === "checklist" && (
              <Box>
                {checklist.map((item) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    onChange={(updated) => updateChecklistItem(item.id, updated)}
                    onDelete={() => deleteChecklistItem(item.id)}
                  />
                ))}
                <Button size="small" startIcon={<AddIcon />} onClick={addChecklistItem} sx={{ textTransform: "none", mt: 0.5 }}>
                  Add item
                </Button>
              </Box>
            )}
          </Box>
          <Divider />
        </Collapse>

        <Box sx={{ px: 2.5, py: 1, display: "flex", gap: 0.5 }}>
          {[
            { key: "files",     icon: <AttachFileIcon sx={{ fontSize: 15 }} />, label: "Files",      badge: attachments.length },
            { key: "checklist", icon: <ChecklistIcon sx={{ fontSize: 15 }} />,  label: "Checklists", badge: checklist.length },
          ].map((tab) => (
            <Button
              key={tab.key}
              size="small"
              variant={activeTab === tab.key ? "contained" : "outlined"}
              startIcon={tab.icon}
              onClick={() => toggleTab(tab.key)}
              sx={{
                textTransform: "none", fontSize: 12, borderRadius: 5, px: 1.5, py: 0.5,
                ...(activeTab === tab.key ? {} : { borderColor: "divider", color: "text.secondary" }),
              }}
            >
              {tab.label}
              {tab.badge > 0 && (
                <Box
                  component="span"
                  sx={{
                    ml: 0.5, fontSize: 10,
                    bgcolor: activeTab === tab.key ? "rgba(255,255,255,0.3)" : "#e5e7eb",
                    color: activeTab === tab.key ? "#fff" : "#374151",
                    borderRadius: 99, px: 0.75, py: 0.1, fontWeight: 700,
                  }}
                >
                  {tab.badge}
                </Box>
              )}
            </Button>
          ))}
        </Box>

        <Divider />

        <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button variant="contained" onClick={handleCreate} disabled={saving} sx={{ textTransform: "none", borderRadius: 1.5, px: 2.5 }}>
              {saving ? "Creating..." : "Create"}
            </Button>
            <Button variant="text" onClick={() => navigate("/tasks")} sx={{ textTransform: "none", color: "text.secondary" }}>
              Cancel
            </Button>
          </Box>

          <Button
            size="small"
            endIcon={detailed ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            onClick={() => setDetailed((v) => !v)}
            sx={{ textTransform: "none", color: "text.secondary", fontSize: 12 }}
          >
            {detailed ? "Simple form" : "Detailed form"}
          </Button>
        </Box>
      </Paper>

      <Menu
        anchorEl={assigneeAnchor}
        open={Boolean(assigneeAnchor)}
        onClose={() => setAssigneeAnchor(null)}
        PaperProps={{ sx: { minWidth: 240, maxHeight: 320, borderRadius: 2 } }}
      >
        <Box sx={{ px: 1.5, py: 0.75 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            ASSIGN TO
          </Typography>
        </Box>
        <Divider />
        {users.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">No users found</Typography>
          </MenuItem>
        ) : (
          users.map((u) => (
            <MenuItem
              key={u.id}
              onClick={() => {
                setAssignee(u);
                setAssigneeAnchor(null);
              }}
              selected={assignee?.id === u.id}
              sx={{ gap: 1.5 }}
            >
              <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: "#3b82f6" }}>
                {initialsFromEmail(u.name)}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.name}</Typography>
            </MenuItem>
          ))
        )}
      </Menu>

      <Menu anchorEl={priorityAnchor} open={Boolean(priorityAnchor)} onClose={() => setPriorityAnchor(null)} PaperProps={{ sx: { minWidth: 150, borderRadius: 2 } }}>
        {PRIORITIES.map((p) => (
          <MenuItem key={p.label} onClick={() => { setPriority(p.label); setPriorityAnchor(null); }} selected={priority === p.label} sx={{ gap: 1 }}>
            <FlagIcon fontSize="small" sx={{ color: p.color }} />
            <Typography variant="body2">{p.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}