// ===============================
// File: src/pages/tasks/components/TaskProgressLog.jsx
// ===============================

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box, Paper, Typography, Divider, Avatar, IconButton,
  Chip, LinearProgress, Tooltip, CircularProgress,
} from "@mui/material";
import ArrowBackIcon       from "@mui/icons-material/ArrowBack";
import DownloadIcon        from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import toast from "react-hot-toast";
import { API } from "../../../config/api"; // ⚠️ adjust path if needed

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

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatSize(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── one row in the log ─────────────────────────────────────────────────────
function LogEntry({ entry, authorName, onDownloadAttachment }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar sx={{ width: 26, height: 26, fontSize: 11, bgcolor: "#3b82f6" }}>
            {initialsFromEmail(authorName)}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{emailToName(authorName)}</Typography>
            <Typography variant="caption" color="text.secondary">{formatDateTime(entry.created_at)}</Typography>
          </Box>
        </Box>
        <Chip
          label={`${entry.progress ?? 0}%`}
          size="small"
          sx={{ fontWeight: 700, bgcolor: "#eff6ff", color: "#2563eb" }}
        />
      </Box>

      {entry.message && (
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>{entry.message}</Typography>
      )}

      {(!!entry.hours_worked || !!entry.hours_remaining || entry.blockers) && (
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 1 }}>
          {!!entry.hours_worked && (
            <Typography variant="caption" color="text.secondary">Worked: {entry.hours_worked}h</Typography>
          )}
          {!!entry.hours_remaining && (
            <Typography variant="caption" color="text.secondary">Remaining: {entry.hours_remaining}h</Typography>
          )}
          {entry.blockers && (
            <Typography variant="caption" sx={{ color: "#dc2626" }}>Blocker: {entry.blockers}</Typography>
          )}
        </Box>
      )}

      {entry.attachments && entry.attachments.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
          {entry.attachments.map((f) => (
            <Box
              key={f.id}
              sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1,
                px: 1, py: 0.5, borderRadius: 1, bgcolor: "background.default",
                border: "1px solid", borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                <InsertDriveFileIcon fontSize="small" color="action" />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>
                    {f.file_name}
                  </Typography>
                  {f.file_size != null && (
                    <Typography variant="caption" color="text.secondary">{formatSize(f.file_size)}</Typography>
                  )}
                </Box>
              </Box>
              <Tooltip title="Download">
                <IconButton size="small" onClick={() => onDownloadAttachment(f.id, f.file_name)}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

// ─── TaskProgressLog ─────────────────────────────────────────────────────────
export default function TaskProgressLog() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const taskId = Number(id) || location.state?.data?.id;
  const passedTask = location.state?.data || null;

  const [task, setTask] = useState(passedTask);
  const [users, setUsers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    const h = authHeaders();
    try {
      const requests = [
        axios.get(API.GET_TASK_PROGRESS_HISTORY(taskId), { headers: h }),
        axios.get(API.GET_USERS, { headers: h }),
      ];
      // Only fetch the task itself if we don't already have it from
      // navigation state — avoids one extra call when TaskDetails passed it.
      if (!passedTask) requests.push(axios.get(API.GET_TASK(taskId), { headers: h }));

      const results = await Promise.all(requests);
      const progressRes = results[0];
      const usersRes = results[1];
      const taskRes = results[2];

      // most recent first
      const sorted = [...(progressRes.data || [])].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setEntries(sorted);
      setUsers(usersRes.data || []);
      if (taskRes) setTask(taskRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load progress log.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const userMap = useMemo(() => {
    const m = {};
    users.forEach((u) => { m[u.id] = u.name; });
    return m;
  }, [users]);

  const latestProgress = entries.length ? entries[0].progress : 0;

  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      const response = await axios.get(
        API.DOWNLOAD_PROGRESS_ATTACHMENT(attachmentId),
        { headers: authHeaders(), responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "attachment";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download attachment.");
    }
  };

  return (
    <Box sx={{ height: "100%", overflowY: "auto", bgcolor: "background.default", p: 3 }}>
      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <IconButton size="small" onClick={() => navigate(-1)}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {task?.title ? `Update Log — ${task.title}` : "Update Log"}
            </Typography>
            {task?.id && (
              <Typography variant="caption" color="text.secondary">
                T{String(task.id).padStart(3, "0")}
              </Typography>
            )}
          </Box>
        </Box>

        {!loading && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Current Progress</Typography>
              <Typography variant="body2" color="text.secondary">{latestProgress}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={latestProgress} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={26} />
          </Box>
        ) : entries.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No progress updates submitted for this task yet.
          </Typography>
        ) : (
          entries.map((entry) => (
            <LogEntry
              key={entry.id}
              entry={entry}
              authorName={userMap[entry.created_by] || `User #${entry.created_by}`}
              onDownloadAttachment={handleDownloadAttachment}
            />
          ))
        )}
      </Box>
    </Box>
  );
}