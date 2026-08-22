// ===============================
// File: src/pages/tasks/forms/TaskProgressForm.jsx
// ===============================

import { useState, useRef } from "react";
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
  LinearProgress,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import toast from "react-hot-toast";
import { API } from "../../../config/api";

function authHeaders() {
  const token = sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function TaskProgressForm({ data = {} }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Progress is no longer picked manually here — it's derived from the
  // task's checklist, same as everywhere else (TaskDetails, TaskList).
  // `data` is the task object passed via navigate() state, and already
  // carries `checklists` from GET_TASK / GET_TASKS.
  const checklist = data.checklists || [];
  const checklistTotal = checklist.length;
  const checklistDone = checklist.filter((c) => c.is_completed).length;
  const checklistProgress = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  // ── form state ──────────────────────────────────────────────────────
  const [update, setUpdate]         = useState("");
  const [hoursWorked, setHoursWorked] = useState("");
  const [hoursRemaining, setHoursRemaining] = useState("");
  const [blockers, setBlockers]     = useState("");
  const [images, setImages]         = useState([]); // File[]
  const [saving, setSaving]         = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!update.trim()) {
      toast.error("Please describe today's work.");
      return;
    }
    if (!data.id) {
      toast.error("No task selected.");
      return;
    }

    setSaving(true);
    try {
      const headers = authHeaders();

      // 1) Create the progress entry — POST /tasks/{task_id}/progress.
      // `progress` is the checklist-derived snapshot, not a manual pick.
      const payload = {
        message: update,
        hours_worked: hoursWorked ? Number(hoursWorked) : 0,
        hours_remaining: hoursRemaining ? Number(hoursRemaining) : 0,
        progress: checklistProgress,
        blockers: blockers || "",
      };

      const res = await axios.post(API.CREATE_TASK_PROGRESS(data.id), payload, { headers });
      const progressId = res.data?.id;

      // 2) If images were staged, upload them to that progress entry.
      if (progressId && images.length > 0) {
        const formData = new FormData();
        images.forEach((f) => formData.append("files", f));
        try {
          await axios.post(API.UPLOAD_PROGRESS_ATTACHMENTS(progressId), formData, {
            headers: { ...headers, "Content-Type": "multipart/form-data" },
          });
        } catch (uploadErr) {
          console.error("Attachment upload failed:", uploadErr.response?.data || uploadErr);
          toast.error("Update saved, but image upload failed. You can retry from task details.");
          navigate(`/tasks/details/${data.id}`);
          return;
        }
      }

      toast.success("Update submitted.");
      navigate(`/tasks/details/${data.id}`);
    } catch (err) {
      console.error("Progress submit failed:", err.response?.data || err);
      if (err?.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(err?.response?.data?.detail?.[0]?.msg || "Failed to submit update.");
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
      <Paper elevation={3} sx={{ width: "100%", maxWidth: 520, borderRadius: 2, overflow: "hidden" }}>
        {/* ── Header ────────────────────────────────────────────────── */}
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Today's Update</Typography>
            <Typography variant="body2" color="text.secondary">
              {data.title || "Untitled task"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => navigate(-1)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mt: 1.5 }} />

        {/* ── What did you do today ────────────────────────────────── */}
        <Box sx={{ px: 2.5, pt: 2 }}>
          <TextField
            label="What did you do today?"
            placeholder="e.g. Completed wiring, started testing..."
            value={update}
            onChange={(e) => setUpdate(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            size="small"
          />
        </Box>

        {/* ── Hours row ─────────────────────────────────────────────── */}
        <Box sx={{ px: 2.5, pt: 2, display: "flex", gap: 2 }}>
          <TextField
            label="Hours Worked"
            type="number"
            value={hoursWorked}
            onChange={(e) => setHoursWorked(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Hours Remaining"
            type="number"
            value={hoursRemaining}
            onChange={(e) => setHoursRemaining(e.target.value)}
            size="small"
            fullWidth
          />
        </Box>

        {/* ── Progress — read-only, driven by checklist completion ──── */}
        <Box sx={{ px: 2.5, pt: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Progress (from checklist)</Typography>
            <Typography variant="body2" color="text.secondary">{checklistProgress}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={checklistProgress} sx={{ height: 8, borderRadius: 4 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {checklistTotal === 0
              ? "This task has no checklist items."
              : `${checklistDone}/${checklistTotal} checklist items complete. Check items off from the task details page to move this.`}
          </Typography>
        </Box>

        {/* ── Blockers ──────────────────────────────────────────────── */}
        <Box sx={{ px: 2.5, pt: 2 }}>
          <TextField
            label="Blockers (optional)"
            placeholder="e.g. Waiting for spare part..."
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            size="small"
          />
        </Box>

        <Divider sx={{ mt: 2 }} />

        {/* ── Image upload ─────────────────────────────────────────── */}
        <Box sx={{ px: 2.5, py: 2 }}>
          <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={handleFileChange} />
          <Button
            size="small"
            variant="outlined"
            startIcon={<AttachFileIcon fontSize="small" />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ textTransform: "none", mb: 1 }}
          >
            Upload Image
          </Button>
          {images.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {images.map((f, i) => (
                <Chip key={i} label={f.name} size="small" onDelete={() => removeImage(i)} />
              ))}
            </Box>
          )}
        </Box>

        <Divider />

        {/* ── Footer ────────────────────────────────────────────────── */}
        <Box sx={{ px: 2.5, py: 1.5, display: "flex", gap: 1 }}>
          <Button variant="contained" onClick={handleSubmit} disabled={saving} sx={{ textTransform: "none", borderRadius: 1.5, px: 2.5 }}>
            {saving ? "Submitting..." : "Submit Update"}
          </Button>
          <Button variant="text" onClick={() => navigate(-1)} sx={{ textTransform: "none", color: "text.secondary" }}>
            Cancel
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}