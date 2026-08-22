// ===============================
// File: src/pages/jobs/components/JobDocumentsDashboard.jsx
// ===============================
//
// A calm, focused view of document status — per PANEL, since documents
// live on the panel (sub-job) under the Job/Sub-Job structure. One job
// with 3 panels shows as 3 rows here, each with its own document status.
// Columns: Job No, Customer, Sub Job No, Panel Description, MOM By (from
// the parent job), the 10 flat document columns, and one grouped "Backup"
// header spanning three sub-columns (PLC / SCADA / Other) — all three
// read off the same panel.backup_file boolean, only the file_type differs.
//
// Hovering a tick gives a quick one-line hint. Clicking it opens a popover
// with the full file table for that document type on that panel — name,
// size, uploaded date, uploader (resolved from their profile), a View
// action (opens the shared FileViewerDialog for previewable types) and a
// Download action per row.

import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Box, Paper, Stack, Typography, TextField, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, CircularProgress, Chip, IconButton, Popover,
} from "@mui/material";
import ArrowForwardIcon  from "@mui/icons-material/ArrowForward";
import RefreshIcon       from "@mui/icons-material/Refresh";
import SearchIcon        from "@mui/icons-material/Search";
import AssignmentIcon    from "@mui/icons-material/Assignment";
import CloseIcon         from "@mui/icons-material/Close";
import DownloadIcon      from "@mui/icons-material/Download";
import VisibilityIcon    from "@mui/icons-material/Visibility";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { API } from "../../../config/api";
import FileViewerDialog, { getPreviewKind } from "../../../components/common/FileViewerDialog";
import { useMyJobPermission } from "../../../hooks/useJobPermission";

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

// ── Flat document columns — these live on the PANEL (sub_job), not the
// job. bom_updated_on_erp / bom_updated_on_tally are manual toggles: no
// fileType, no file to look up. Backup is intentionally NOT here — it's
// grouped separately below. ────────────────────────────────────────────
const DOC_FIELDS = [
  { key: "as_build",              label: "As Build",          fileType: "AS_BUILD" },
  { key: "soft_copy",             label: "Soft Copy",         fileType: "SOFT_COPY" },
  { key: "hard_copy",             label: "Hard Copy",         fileType: "HARD_COPY" },
  { key: "factory_test_report",   label: "Factory Test",      fileType: "FACTORY_TEST_REPORT" },
  { key: "bom_excel",             label: "BOM Excel",         fileType: "BOM_EXCEL" },
  { key: "bom_pdf",               label: "BOM PDF",           fileType: "BOM_PDF" },
  { key: "bom_updated_on_erp",    label: "BOM ERP" },
  { key: "bom_updated_on_tally",  label: "BOM Tally" },
  { key: "photos",                label: "Photos",             fileType: "PHOTOS" },
  { key: "notes_and_tech_note",   label: "Notes & Tech Note",  fileType: "NOTES_AND_TECH_NOTE" },
  { key: "additional_data",       label: "Additional Data",    fileType: "ADDITIONAL_DATA" },
  { key: "mom_uploaded",          label: "MOM",                fileType: "MOM" },
];

// ── Backup sub-columns — grouped under one "Backup" header. All three
// read `done` off the same panel.backup_file boolean; only the fileType
// (for file lookup) differs per sub-column. ───────────────────────────────
const BACKUP_FIELDS = [
  { key: "backup_file", label: "PLC",   fileType: "PLC_BACKUP" },
  { key: "backup_file", label: "SCADA", fileType: "SCADA_BACKUP" },
  { key: "backup_file", label: "Other", fileType: "OTHER_BACKUP" },
];

// Total fields counted toward panel completeness — flat docs + backup
// counted once (not three times).
const COMPLETENESS_KEYS = [...DOC_FIELDS.map((d) => d.key), "backup_file"];

// ── Formatters ────────────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}
// email → display name, e.g. adarsh.verma@tsfe365.com → Adarsh Verma
function emailToName(email) {
  if (!email) return null;
  const local = email.split("@")[0];
  return local.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

// ── Flatten jobs+sub_jobs into one row per panel. Panel-less jobs are
// tracked separately (nothing to show in a document table for them). ───────
function flattenToPanelRows(jobs) {
  const rows = [];
  let jobsWithNoPanels = 0;
  jobs.forEach((job) => {
    const subJobs = Array.isArray(job.sub_jobs) ? job.sub_jobs : [];
    if (subJobs.length === 0) {
      jobsWithNoPanels += 1;
      return;
    }
    subJobs.forEach((panel) => {
      rows.push({
        job_id: job.job_id,
        job_no: job.job_no,
        customer_name: job.customer_name,
        mom_by: job.mom_by,
        sub_job_id: panel.sub_job_id,
        sub_job_no: panel.sub_job_no,
        panel_description: panel.panel_description,
        ...COMPLETENESS_KEYS.reduce((acc, k) => ({ ...acc, [k]: !!panel[k] }), {}),
      });
    });
  });
  return { rows, jobsWithNoPanels };
}

// ── Doc cell — tick/cross, quick hover hint, click opens the details popover ─
function DocCell({ jobId, subJobId, subJobNo, done, fileType, docLabel, fileCache, onHoverFile, onOpen }) {
  const entry = fileCache[subJobId];
  const { can, isSuperAdmin } = useMyJobPermission(jobId);
  const canViewFile = isSuperAdmin || can("can_view_file");
  const fileCount = fileType && entry && !entry.loading && !entry.error
    ? (entry.files || []).filter((f) => f.file_type === fileType && !f.is_deleted).length
    : null;

  const hoverHint = !fileType
    ? "Click for details"
    : !canViewFile
     ? "You don't have permission to view files"
    : !done
      ? "No file uploaded"
      : fileCount == null
        ? "Click for details"
        : `${fileCount} file${fileCount === 1 ? "" : "s"} — click for details`;

  return (
    <Tooltip
      title={hoverHint}
      onOpen={() => {
        if (done && fileType && canViewFile && !fileCache[subJobId]) onHoverFile(jobId, subJobId);
      }}
      arrow
    >
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => onOpen(e, { jobId, subJobId, subJobNo, done, fileType, docLabel })}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 26, height: 26, borderRadius: 8, fontSize: "0.85rem", cursor: "pointer",
          background: done ? "#e7f7ee" : "#fdecec",
          color: done ? "#1f9d5c" : "#e0574c",
        }}
      >
        {done ? "✓" : "✕"}
      </span>
    </Tooltip>
  );
}

// ── Details popover — file table for a doc type, or manual-toggle summary ───
function DocDetailsPopover({
  anchorEl, onClose, jobId, subJobNo, docLabel, fileType, done,
  files, filesLoading, filesError, uploaderCache, onResolveUploader,
  onDownload, onView,
}) {
  const open = Boolean(anchorEl);
  const { can, isSuperAdmin } = useMyJobPermission(jobId);
  const canViewFile = isSuperAdmin || can("can_view_file");
  useEffect(() => {
    if (!open || !fileType || !files) return;
    const ids = [...new Set(files.map((f) => f.uploaded_by).filter((id) => id != null))];
    ids.forEach((id) => { if (!uploaderCache[id]) onResolveUploader(id); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, files]);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      slotProps={{ paper: { sx: { borderRadius: 3, boxShadow: "0 16px 48px rgba(15,23,42,0.14)", mt: 0.5 } } }}
    >
      <Box sx={{ width: fileType ? 460 : 260, maxWidth: "90vw" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, pt: 1.75, pb: 1 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#1e293b" }}>{docLabel}</Typography>
            <Typography variant="caption" color="text.secondary">Panel {subJobNo}</Typography>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Stack>

        {!fileType ? (
          // ── manual toggle (BOM ERP / BOM Tally) — no file to list ──
          <Box sx={{ px: 2, pb: 2 }}>
            <Chip
              size="small"
              label={done ? "Marked complete" : "Not marked"}
              sx={{
                fontWeight: 700, mb: 1,
                bgcolor: done ? "#e7f7ee" : "#fdecec",
                color: done ? "#1f9d5c" : "#e0574c",
              }}
            />
            <Typography variant="body2" color="text.secondary">
              No file attached — this status is set directly on the panel.
            </Typography>
          </Box>
        ) : !canViewFile ? (
          <Box sx={{ px: 2, pb: 3, textAlign: "center" }}>
            <InsertDriveFileIcon sx={{ fontSize: 28, color: "text.disabled", mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              You don't have permission to view files for this job.
            </Typography>
          </Box>
        ) : filesLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
            <CircularProgress size={22} />
          </Stack>
        ) : filesError ? (
          <Typography variant="body2" color="error.main" sx={{ px: 2, pb: 2 }}>
            Failed to load file details.
          </Typography>
        ) : !files || files.length === 0 ? (
          <Box sx={{ px: 2, pb: 3, textAlign: "center" }}>
            <InsertDriveFileIcon sx={{ fontSize: 28, color: "text.disabled", mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary">No files uploaded yet.</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 280, borderTop: "1px solid", borderColor: "divider" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", color: "text.secondary", bgcolor: "#f8fafc" }}>File</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", color: "text.secondary", bgcolor: "#f8fafc" }}>Size</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", color: "text.secondary", bgcolor: "#f8fafc" }}>Uploaded</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", color: "text.secondary", bgcolor: "#f8fafc" }}>By</TableCell>
                  <TableCell align="right" sx={{ bgcolor: "#f8fafc" }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((f) => {
                  const uploader = f.uploaded_by != null ? uploaderCache[f.uploaded_by] : null;
                  const uploaderName = uploader?.loading ? "…" : (uploader?.name || (f.uploaded_by != null ? `#${f.uploaded_by}` : "—"));
                  const previewKind = getPreviewKind(f.original_file_name);
                  return (
                    <TableRow key={f.file_id} hover>
                      <TableCell sx={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.78rem" }}>
                        {f.original_file_name}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                        {formatSize(f.file_size)}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.76rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                        {formatDate(f.uploaded_at)}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                        {uploaderName}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {previewKind && can("can_view_file") && (
                          <IconButton size="small" title="View" onClick={() => onView(f)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        )}
                        {can("can_download_file") && (
                          <IconButton size="small" title="Download" onClick={() => onDownload(f)}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Popover>
  );
}

export default function JobDocumentsDashboard() {
  const navigate = useNavigate();

  const [rawJobs, setRawJobs]   = useState([]);   // jobs-new response, with embedded sub_jobs
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("all"); // all | complete | pending

  // sub_job_id -> { loading, files, error }
  const [fileCache, setFileCache] = useState({});
  // user_id -> { loading, name }
  const [uploaderCache, setUploaderCache] = useState({});

  // popover state
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [popoverInfo, setPopoverInfo] = useState(null); // { jobId, subJobId, subJobNo, done, fileType, docLabel }

  // file viewer dialog state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  const [viewerKind, setViewerKind] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState(false);
  const [viewerPdfData, setViewerPdfData] = useState(null);
  const [viewerImageUrl, setViewerImageUrl] = useState(null);
  const [viewerTextContent, setViewerTextContent] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API.GET_JOBS_NEW, { headers: authHeaders() });
      setRawJobs(Array.isArray(res.data) ? res.data : []);
      setFileCache({});
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      toast.error(err.response?.data?.detail || "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const { rows: panelRows, jobsWithNoPanels } = useMemo(() => flattenToPanelRows(rawJobs), [rawJobs]);

  const fetchPanelFiles = useCallback(async (jobId, subJobId) => {
    setFileCache((prev) => ({ ...prev, [subJobId]: { loading: true, files: prev[subJobId]?.files || [] } }));
    try {
      const res = await axios.get(API.GET_JOB_FILES_NEW(subJobId), {
        headers: authHeaders(), params: { job_id: jobId },
      });
      setFileCache((prev) => ({ ...prev, [subJobId]: { loading: false, files: res.data || [] } }));
    } catch (err) {
      console.error("Failed to fetch panel files:", err);
      setFileCache((prev) => ({ ...prev, [subJobId]: { loading: false, files: [], error: true } }));
    }
  }, []);

  const fetchUploader = useCallback(async (userId) => {
    setUploaderCache((prev) => ({ ...prev, [userId]: { loading: true, name: null } }));
    try {
      const res = await axios.get(API.GET_MY_PROFILE(userId), { headers: authHeaders() });
      const email = res.data?.email || "";
      setUploaderCache((prev) => ({ ...prev, [userId]: { loading: false, name: emailToName(email) || email || null } }));
    } catch {
      setUploaderCache((prev) => ({ ...prev, [userId]: { loading: false, name: null } }));
    }
  }, []);

  // ── download (saves to disk) ────────────────────────────────────────────
  const handleDownload = useCallback(async (file) => {
    try {
      const res = await axios.get(API.DOWNLOAD_JOB_FILE_NEW(file.file_id), {
        headers: authHeaders(), responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.original_file_name || "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download file.");
    }
  }, []);

  // ── view (fetches the file and hands it to FileViewerDialog to render
  // inline — PDFs go through react-pdf/pdf.js so rendering never depends
  // on the server's Content-Type header; images/text are shown directly) ──
  const handleView = useCallback(async (file) => {
    const kind = getPreviewKind(file.original_file_name);
    if (!kind) return; // shouldn't happen — button is hidden for these

    setViewerFile(file);
    setViewerKind(kind);
    setViewerOpen(true);
    setViewerLoading(true);
    setViewerError(false);
    setViewerPdfData(null);
    setViewerImageUrl(null);
    setViewerTextContent("");

    try {
      const res = await axios.get(API.DOWNLOAD_JOB_FILE_NEW(file.file_id), {
        headers: authHeaders(), responseType: "blob",
      });
      const blob = res.data;

      if (kind === "pdf") {
        const buffer = await blob.arrayBuffer();
        setViewerPdfData({ data: new Uint8Array(buffer) });
      } else if (kind === "image") {
        setViewerImageUrl(window.URL.createObjectURL(blob));
      } else if (kind === "text") {
        setViewerTextContent(await blob.text());
      }
    } catch (err) {
      console.error("Failed to load file preview:", err);
      setViewerError(true);
    } finally {
      setViewerLoading(false);
    }
  }, []);

  const handleCloseViewer = useCallback(() => {
    if (viewerImageUrl) window.URL.revokeObjectURL(viewerImageUrl);
    setViewerOpen(false);
    setViewerFile(null);
    setViewerKind(null);
    setViewerPdfData(null);
    setViewerImageUrl(null);
    setViewerTextContent("");
    setViewerError(false);
  }, [viewerImageUrl]);

  const handleOpenPopover = useCallback((event, info) => {
    setPopoverAnchor(event.currentTarget);
    setPopoverInfo(info);
    // make sure the panel's files are loaded (hover may not have fired yet)
    if (info.done && info.fileType && !fileCache[info.subJobId]) {
      fetchPanelFiles(info.jobId, info.subJobId);
    }
  }, [fileCache, fetchPanelFiles]);

  const handleClosePopover = useCallback(() => {
    setPopoverAnchor(null);
    setPopoverInfo(null);
  }, []);

  const panelDocCount = (panel) => COMPLETENESS_KEYS.filter((k) => !!panel[k]).length;

  const filteredPanels = useMemo(() => {
    let list = panelRows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) =>
        (p.job_no || "").toLowerCase().includes(q) ||
        (p.sub_job_no || "").toLowerCase().includes(q) ||
        (p.customer_name || "").toLowerCase().includes(q) ||
        (p.panel_description || "").toLowerCase().includes(q) ||
        (p.mom_by || "").toLowerCase().includes(q)
      );
    }
    if (filter === "complete") {
      list = list.filter((p) => panelDocCount(p) === COMPLETENESS_KEYS.length);
    } else if (filter === "pending") {
      list = list.filter((p) => panelDocCount(p) < COMPLETENESS_KEYS.length);
    }
    return list;
  }, [panelRows, search, filter]);

  const totalPanels = panelRows.length;
  const completePanels = panelRows.filter((p) => panelDocCount(p) === COMPLETENESS_KEYS.length).length;
  const pendingPanels = totalPanels - completePanels;

  // popover derived data
  const popoverEntry = popoverInfo ? fileCache[popoverInfo.subJobId] : null;
  const popoverFiles = popoverInfo?.fileType && popoverEntry && !popoverEntry.loading && !popoverEntry.error
    ? (popoverEntry.files || []).filter((f) => f.file_type === popoverInfo.fileType && !f.is_deleted)
    : [];

  // Job No, Customer, Sub Job No, Panel, MOM By, Progress
  const totalColumns = DOC_FIELDS.length + BACKUP_FIELDS.length + 6;

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#fafbfc" }}>

      {/* ── HEADER ── */}
      <Paper elevation={0} sx={{
        px: 3, py: 2.5, flexShrink: 0, borderBottom: "1px solid", borderColor: "divider", bgcolor: "#fff",
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box sx={{
                width: 34, height: 34, borderRadius: 2, bgcolor: "#eef2ff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <AssignmentIcon sx={{ fontSize: 18, color: "#6366f1" }} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: "-0.01em", color: "#1e293b" }}>
                Job Documents
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: "44px" }}>
              {totalPanels} panels · {completePanels} complete · {pendingPanels} pending
              {jobsWithNoPanels > 0 && ` · ${jobsWithNoPanels} job${jobsWithNoPanels === 1 ? "" : "s"} with no panels yet`}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchJobs} size="small" sx={{ border: "1px solid", borderColor: "divider" }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Box
              component="button"
              onClick={() => navigate("/jobs/list")}
              sx={{
                display: "flex", alignItems: "center", gap: 0.75,
                px: 2, py: 1, borderRadius: 2, border: "1px solid #e0e7ff",
                bgcolor: "#eef2ff", color: "#4f46e5",
                fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
                "&:hover": { bgcolor: "#e0e7ff" },
              }}
            >
              Open Jobs List <ArrowForwardIcon sx={{ fontSize: 14 }} />
            </Box>
          </Stack>
        </Stack>

        {/* Search + filter */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search by Job No, Sub Job No, Customer, Panel or MOM By…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 18, color: "text.disabled", mr: 1 }} /> }}
            sx={{ minWidth: 320, "& fieldset": { borderRadius: 2 } }}
          />
          <Select
            size="small"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ minWidth: 160, borderRadius: 2 }}
          >
            <MenuItem value="all">All panels</MenuItem>
            <MenuItem value="complete">Complete only</MenuItem>
            <MenuItem value="pending">Pending only</MenuItem>
          </Select>
        </Stack>
      </Paper>

      {/* ── BODY ── */}
      <Box sx={{ flex: 1, overflow: "auto", px: 3, py: 3 }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: 300 }} spacing={2}>
            <CircularProgress size={32} sx={{ color: "#6366f1" }} />
            <Typography variant="body2" color="text.secondary">Loading jobs…</Typography>
          </Stack>
        ) : (
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden", bgcolor: "#fff" }}>
            <TableContainer sx={{ maxHeight: "calc(100vh - 260px)" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell rowSpan={2} sx={{
                      fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase",
                      letterSpacing: "0.06em", color: "#64748b", bgcolor: "#f8fafc",
                      py: 1.5, whiteSpace: "nowrap", position: "sticky", left: 0, zIndex: 3,
                      verticalAlign: "bottom",
                    }}>
                      Job No
                    </TableCell>
                    <TableCell rowSpan={2} sx={{
                      fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase",
                      letterSpacing: "0.06em", color: "#64748b", bgcolor: "#f8fafc",
                      py: 1.5, whiteSpace: "nowrap", verticalAlign: "bottom",
                    }}>
                      Customer
                    </TableCell>
                    <TableCell rowSpan={2} sx={{
                      fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase",
                      letterSpacing: "0.06em", color: "#64748b", bgcolor: "#f8fafc",
                      py: 1.5, whiteSpace: "nowrap", verticalAlign: "bottom",
                    }}>
                      Sub Job No
                    </TableCell>
                    <TableCell rowSpan={2} sx={{
                      fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase",
                      letterSpacing: "0.06em", color: "#64748b", bgcolor: "#f8fafc",
                      py: 1.5, whiteSpace: "nowrap", verticalAlign: "bottom",
                    }}>
                      Panel
                    </TableCell>
                    <TableCell rowSpan={2} sx={{
                      fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase",
                      letterSpacing: "0.06em", color: "#64748b", bgcolor: "#f8fafc",
                      py: 1.5, whiteSpace: "nowrap", verticalAlign: "bottom",
                    }}>
                      MOM By
                    </TableCell>
                    {DOC_FIELDS.map((d) => (
                      <TableCell key={d.key} rowSpan={2} align="center" sx={{
                        fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase",
                        letterSpacing: "0.04em", color: "#64748b", bgcolor: "#f8fafc",
                        py: 1.5, whiteSpace: "nowrap", verticalAlign: "bottom",
                      }}>
                        {d.label}
                      </TableCell>
                    ))}
                    <TableCell colSpan={BACKUP_FIELDS.length} align="center" sx={{
                      fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase",
                      letterSpacing: "0.04em", color: "#4f46e5", bgcolor: "#eef2ff",
                      py: 1, whiteSpace: "nowrap", borderBottom: "1px solid", borderColor: "divider",
                    }}>
                      Backup
                    </TableCell>
                    <TableCell rowSpan={2} align="center" sx={{
                      fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase",
                      letterSpacing: "0.06em", color: "#64748b", bgcolor: "#f8fafc",
                      py: 1.5, whiteSpace: "nowrap", verticalAlign: "bottom",
                    }}>
                      Progress
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    {BACKUP_FIELDS.map((d) => (
                      <TableCell key={d.fileType} align="center" sx={{
                        fontWeight: 700, fontSize: "0.64rem", textTransform: "uppercase",
                        color: "#4f46e5", bgcolor: "#eef2ff", py: 1, whiteSpace: "nowrap",
                      }}>
                        {d.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredPanels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={totalColumns} align="center" sx={{ py: 6, color: "text.secondary" }}>
                        No panels match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPanels.map((p) => {
                      const done = panelDocCount(p);
                      const total = COMPLETENESS_KEYS.length;
                      const isComplete = done === total;
                      return (
                        <TableRow
                          key={p.sub_job_id}
                          hover
                          sx={{
                            "&:last-child td": { borderBottom: 0 },
                            "&:hover": { bgcolor: "#fafbff" },
                          }}
                        >
                          <TableCell sx={{
                            fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap",
                            position: "sticky", left: 0, bgcolor: "#fff", zIndex: 1,
                          }}>
                            {p.job_no || "—"}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.customer_name || "—"}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap" }}>
                            {p.sub_job_no || "—"}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.panel_description || "—"}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                            {p.mom_by || "—"}
                          </TableCell>
                          {DOC_FIELDS.map((d) => (
                            <TableCell key={d.key} align="center">
                              <DocCell
                                jobId={p.job_id}
                                subJobId={p.sub_job_id}
                                subJobNo={p.sub_job_no}
                                done={!!p[d.key]}
                                fileType={d.fileType}
                                docLabel={d.label}
                                fileCache={fileCache}
                                onHoverFile={fetchPanelFiles}
                                onOpen={handleOpenPopover}
                              />
                            </TableCell>
                          ))}
                          {BACKUP_FIELDS.map((d) => (
                            <TableCell key={d.fileType} align="center" sx={{ bgcolor: "#fafbff" }}>
                              <DocCell
                                jobId={p.job_id}
                                subJobId={p.sub_job_id}
                                subJobNo={p.sub_job_no}
                                done={!!p[d.key]}
                                fileType={d.fileType}
                                docLabel={`Backup — ${d.label}`}
                                fileCache={fileCache}
                                onHoverFile={fetchPanelFiles}
                                onOpen={handleOpenPopover}
                              />
                            </TableCell>
                          ))}
                          <TableCell align="center">
                            <Chip
                              label={`${done} / ${total}`}
                              size="small"
                              sx={{
                                fontWeight: 700, fontSize: "0.7rem", height: 22, borderRadius: "999px",
                                bgcolor: isComplete ? "#e7f7ee" : done === 0 ? "#fdecec" : "#fef6e6",
                                color: isComplete ? "#1f9d5c" : done === 0 ? "#e0574c" : "#b8860b",
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>

      {popoverInfo && (
        <DocDetailsPopover
          anchorEl={popoverAnchor}
          onClose={handleClosePopover}
          jobId={popoverInfo.jobId}
          subJobNo={popoverInfo.subJobNo}
          docLabel={popoverInfo.docLabel}
          fileType={popoverInfo.fileType}
          done={popoverInfo.done}
          files={popoverFiles}
          filesLoading={!!popoverEntry?.loading}
          filesError={!!popoverEntry?.error}
          uploaderCache={uploaderCache}
          onResolveUploader={fetchUploader}
          onDownload={handleDownload}
          onView={handleView}
        />
      )}

      <FileViewerDialog
        open={viewerOpen}
        onClose={handleCloseViewer}
        fileName={viewerFile?.original_file_name}
        kind={viewerKind}
        loading={viewerLoading}
        error={viewerError}
        pdfData={viewerPdfData}
        imageUrl={viewerImageUrl}
        textContent={viewerTextContent}
        onDownload={() => viewerFile && handleDownload(viewerFile)}
      />
    </Box>
  );
}