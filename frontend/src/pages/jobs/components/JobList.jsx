// ===============================
// File: src/pages/jobs/components/JobList.jsx
// ===============================

import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiCopy, FiEdit, FiTrash2, FiShield, FiLayers } from "react-icons/fi";
import toast from "react-hot-toast";
import {
  Select, MenuItem, Box, Typography, Tooltip, CircularProgress,
  Popover, Dialog, DialogTitle, DialogContent, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DataTable from "../common/DataTable";
import { API } from "../../../config/api";
import PermissionButton from "../../../components/common/PermissionButton";
import FileViewerDialog, { getPreviewKind } from "../../../components/common/FileViewerDialog";
import { useIsSuperAdmin, useMyJobPermission } from "../../../hooks/useJobPermission";
import JobPermissionsDialog from "./JobPermissionsDialog";

// ── Panel (sub-job) doc fields — each still becomes its OWN column in the
// Panels dialog table, EXCEPT the backup types, which are grouped under a
// single "Backup" header spanning three sub-columns (see BACKUP_FIELDS). ──
const DOC_FIELDS = [
  { key: "as_build",              label: "As Build",            fileType: "AS_BUILD" },
  { key: "soft_copy",             label: "Soft Copy",           fileType: "SOFT_COPY" },
  { key: "hard_copy",             label: "Hard Copy",           fileType: "HARD_COPY" },
  { key: "factory_test_report",   label: "Factory Test",        fileType: "FACTORY_TEST_REPORT" },
  { key: "bom_excel",             label: "BOM Excel",           fileType: "BOM_EXCEL" },
  { key: "bom_pdf",               label: "BOM PDF",             fileType: "BOM_PDF" },
  { key: "bom_updated_on_erp",    label: "BOM ERP" },
  { key: "bom_updated_on_tally",  label: "BOM Tally" },
  { key: "photos",                label: "Photos",               fileType: "PHOTOS" },
  { key: "notes_and_tech_note",   label: "Notes & Tech Note",    fileType: "NOTES_AND_TECH_NOTE" },
  { key: "additional_data",       label: "Additional Data",      fileType: "ADDITIONAL_DATA" },
  { key: "mom_uploaded",          label: "MOM",                  fileType: "MOM" },
];

// Backup sub-columns — shown ONLY nested under the "Backup" group header.
// All three read `done` off the same panel.backup_file boolean; only the
// fileType (for file lookup/filtering) differs per sub-column.
const BACKUP_FIELDS = [
  { key: "backup_file", label: "PLC",   fileType: "PLC_BACKUP" },
  { key: "backup_file", label: "SCADA", fileType: "SCADA_BACKUP" },
  { key: "backup_file", label: "Other", fileType: "OTHER_BACKUP" },
];

function getFYYear(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const month = d.getMonth() + 1;
  return month >= 4 ? d.getFullYear() : d.getFullYear() - 1;
}
function generateFYOptionsFromData(data) {
  const years = new Set();
  data.forEach((row) => { const fy = getFYYear(row.job_date); if (fy != null) years.add(fy); });
  const sorted = Array.from(years).sort((a, b) => b - a);
  return [{ label: "All Years", value: "all" }, ...sorted.map((y) => ({ label: `${y}-${y + 1}`, value: String(y) }))];
}
function filterByFY(data, fyYear) {
  if (fyYear === "all") return data;
  const start = new Date(`${fyYear}-04-01`);
  const end   = new Date(`${parseInt(fyYear) + 1}-03-31T23:59:59`);
  return data.filter((row) => {
    if (!row.job_date) return false;
    const d = new Date(row.job_date);
    return d >= start && d <= end;
  });
}
function filterBySearch(data, term) {
  if (!term) return data;
  const q = term.trim().toLowerCase();
  if (!q) return data;
  return data.filter((row) => {
    const haystack = [
      row.job_no, row.customer_name, row.end_user, row.so_no,
      row.remarks_action, row.tested_by, row.site_commissioned, row.mom_by,
      ...(row.sub_jobs || []).map((p) => p.panel_description),
      ...(row.sub_jobs || []).map((p) => p.sub_job_no),
    ];
    return haystack.some((v) => v && String(v).toLowerCase().includes(q));
  });
}

function formatSize(bytes) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}
function emailToName(email) {
  if (!email) return null;
  const local = email.split("@")[0];
  return local.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

function mapItem(item) {
  return {
    id: item.job_id,
    job_id: item.job_id,
    job_no: item.job_no,
    customer_name: item.customer_name,
    end_user: item.end_user,
    job_status_id: item.job_status_id,
    remarks_action: item.remarks_action,
    tested_by: item.tested_by,
    site_commissioned: item.site_commissioned,
    so_no: item.so_no,
    mom_by: item.mom_by,
    job_date: item.job_date,
    created_at: item.created_at,
    updated_at: item.updated_at,
    sub_jobs: Array.isArray(item.sub_jobs) ? item.sub_jobs : [],
  };
}

function DocStatusCell({ jobId, jobNo, subJobId, subJobNo, done, fileType, docLabel, fileCache, onHover, onOpen }) {
  const entry = fileCache[subJobId];
  const { can, isSuperAdmin } = useMyJobPermission(jobId);
  const canViewFile = isSuperAdmin || can("can_view_file");

  const renderFileTooltip = () => {
    if (!done) return "No file uploaded";
    if (!canViewFile) return "You don't have permission to view files";
    if (!entry || entry.loading) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={12} color="inherit" /><span>Loading…</span>
        </Box>
      );
    }
    if (entry.error) return "Failed to load file details";
    const file = (entry.files || []).find((f) => f.file_type === fileType && !f.is_deleted);
    if (!file) return "No file details found";
    return (
      <Box sx={{ maxWidth: 240 }}>
        <div><strong>{file.original_file_name}</strong></div>
        <div>{formatSize(file.file_size)}</div>
        <div>Uploaded {formatDate(file.uploaded_at)}</div>
      </Box>
    );
  };

  const renderManualTooltip = () => (
    <Box sx={{ maxWidth: 220 }}>
      <div><strong>{done ? "Marked complete" : "Not marked"}</strong></div>
      <div>No file attached — set directly on the panel</div>
    </Box>
  );

  return (
    <Tooltip
      title={fileType ? renderFileTooltip() : renderManualTooltip()}
      onOpen={() => { if (done && fileType && canViewFile && !fileCache[subJobId]) onHover(jobId, subJobId); }}
      arrow
    >
      <div
        role="button" tabIndex={0}
        onClick={(e) => onOpen(e, { jobId, jobNo, subJobId, subJobNo, done, fileType, docLabel })}
        className="flex items-center justify-center cursor-pointer"
        style={{ overflow: "visible" }}
      >
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-sm ${
          done ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
        }`}>
          {done ? "✅" : "❌"}
        </span>
      </div>
    </Tooltip>
  );
}

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
      open={open} anchorEl={anchorEl} onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      slotProps={{ paper: { sx: { borderRadius: 3, boxShadow: "0 16px 48px rgba(15,23,42,0.14)", mt: 0.5, zIndex: 1400 } } }}
    >
      <Box sx={{ width: fileType ? 460 : 260, maxWidth: "90vw" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, pt: 1.75, pb: 1 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#1e293b" }}>{docLabel}</Typography>
            <Typography variant="caption" color="text.secondary">Panel {subJobNo}</Typography>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>

        {!fileType ? (
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: done ? "#1f9d5c" : "#e0574c" }}>
              {done ? "Marked complete" : "Not marked"}
            </Typography>
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
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : filesError ? (
          <Typography variant="body2" color="error.main" sx={{ px: 2, pb: 2 }}>Failed to load file details.</Typography>
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
                      <TableCell sx={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.78rem" }}>{f.original_file_name}</TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", color: "text.secondary", whiteSpace: "nowrap" }}>{formatSize(f.file_size)}</TableCell>
                      <TableCell sx={{ fontSize: "0.76rem", color: "text.secondary", whiteSpace: "nowrap" }}>{formatDate(f.uploaded_at)}</TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", color: "text.secondary", whiteSpace: "nowrap" }}>{uploaderName}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {previewKind && can("can_view_file") && (
                          <IconButton size="small" title="View File" onClick={() => onView(f)}><VisibilityIcon fontSize="small" /></IconButton>
                        )}
                        {can("can_download_file") && (
                          <IconButton size="small" title="Download" onClick={() => onDownload(f)}><DownloadIcon fontSize="small" /></IconButton>
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

// ── Per-panel Upload button — navigates to the full upload FORM for that
// specific panel. ─────────────────────────────────────────────────────────
function PanelUploadButton({ jobId, jobNo, subJobId, subJobNo, onUpload }) {
  const { can, isSuperAdmin } = useMyJobPermission(jobId);
  if (!(isSuperAdmin || can("can_upload_file"))) return null;
  return (
    <IconButton
      size="small"
      color="primary"
      title="Upload files"
      onClick={() => onUpload({ jobId, jobNo, subJobId, subJobNo })}
    >
      <UploadFileIcon fontSize="small" />
    </IconButton>
  );
}

// ── Panels dialog — each non-backup doc field is its own column (rowSpan 2
// header). Backup is ONE grouped header ("Backup", colSpan 3) with three
// sub-columns (PLC / SCADA / Other) underneath — no flat top-level Backup
// columns. ─────────────────────────────────────────────────────────────────
function PanelsDialog({
  open, onClose, jobId, jobNo, subJobs,
  fileCache, onHoverDoc, onOpenDoc, onUpload,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Panels — Job {jobNo}</Typography>
          <Typography variant="caption" color="text.secondary">
            {subJobs.length} panel{subJobs.length === 1 ? "" : "s"}
          </Typography>
        </Box>
        <IconButton onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {subJobs.length === 0 ? (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <FiLayers size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
            <Typography variant="body2" color="text.secondary">
              No panels yet — add one from Update.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={{ fontWeight: 700, bgcolor: "#f8fafc", whiteSpace: "nowrap", verticalAlign: "bottom" }}>Sub Job No</TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 700, bgcolor: "#f8fafc", verticalAlign: "bottom" }}>Description</TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 700, bgcolor: "#f8fafc", verticalAlign: "bottom" }}>Qty</TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 700, bgcolor: "#f8fafc", verticalAlign: "bottom" }}>Remarks</TableCell>
                  {DOC_FIELDS.map((d) => (
                    <TableCell key={d.key} rowSpan={2} align="center" sx={{ fontWeight: 700, bgcolor: "#f8fafc", whiteSpace: "nowrap", verticalAlign: "bottom" }}>
                      {d.label}
                    </TableCell>
                  ))}
                  <TableCell colSpan={BACKUP_FIELDS.length} align="center" sx={{ fontWeight: 700, bgcolor: "#eef2ff", whiteSpace: "nowrap", borderBottom: "1px solid", borderColor: "divider" }}>
                    Backup
                  </TableCell>
                  <TableCell rowSpan={2} align="center" sx={{ fontWeight: 700, bgcolor: "#f8fafc", verticalAlign: "bottom" }}>Upload</TableCell>
                </TableRow>
                <TableRow>
                  {BACKUP_FIELDS.map((d) => (
                    <TableCell key={d.fileType} align="center" sx={{ fontWeight: 700, bgcolor: "#eef2ff", whiteSpace: "nowrap", fontSize: "0.72rem" }}>
                      {d.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {subJobs.map((panel) => (
                  <TableRow key={panel.sub_job_id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 600 }}>{panel.sub_job_no}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>{panel.panel_description || "—"}</TableCell>
                    <TableCell>{panel.panel_quantity ?? "—"}</TableCell>
                    <TableCell sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {panel.remarks || "—"}
                    </TableCell>
                    {DOC_FIELDS.map((d) => (
                      <TableCell key={d.key} align="center">
                        <DocStatusCell
                          jobId={jobId}
                          jobNo={jobNo}
                          subJobId={panel.sub_job_id}
                          subJobNo={panel.sub_job_no}
                          done={!!panel[d.key]}
                          fileType={d.fileType}
                          docLabel={d.label}
                          fileCache={fileCache}
                          onHover={onHoverDoc}
                          onOpen={onOpenDoc}
                        />
                      </TableCell>
                    ))}
                    {BACKUP_FIELDS.map((d) => (
                      <TableCell key={d.fileType} align="center" sx={{ bgcolor: "#fafbff" }}>
                        <DocStatusCell
                          jobId={jobId}
                          jobNo={jobNo}
                          subJobId={panel.sub_job_id}
                          subJobNo={panel.sub_job_no}
                          done={!!panel[d.key]}
                          fileType={d.fileType}
                          docLabel={`Backup — ${d.label}`}
                          fileCache={fileCache}
                          onHover={onHoverDoc}
                          onOpen={onOpenDoc}
                        />
                      </TableCell>
                    ))}
                    <TableCell align="center">
                      <PanelUploadButton
                        jobId={jobId}
                        jobNo={jobNo}
                        subJobId={panel.sub_job_id}
                        subJobNo={panel.sub_job_no}
                        onUpload={onUpload}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Completeness for the Panels chip: DOC_FIELDS + backup_file counted once
// (not three times, since all three backup sub-columns share one boolean).
const COMPLETENESS_KEYS = [...DOC_FIELDS.map((d) => d.key), "backup_file"];

function PanelsCell({ subJobs, onOpen }) {
  const count = subJobs.length;
  const doneCount = subJobs.filter((p) => COMPLETENESS_KEYS.every((k) => !!p[k])).length;
  return (
    <Chip
      size="small"
      icon={<FiLayers size={13} style={{ marginLeft: 6 }} />}
      label={count === 0 ? "No panels" : `${count} panel${count === 1 ? "" : "s"}${doneCount ? ` · ${doneCount} complete` : ""}`}
      color={count === 0 ? "default" : "primary"}
      variant="outlined"
      onClick={onOpen}
      sx={{ cursor: "pointer" }}
    />
  );
}

function JobActionsCell({ row, isSuperAdmin, onAction, onOpenPerm }) {
  return (
    <div className="flex gap-2" style={{ overflow: "visible", position: "relative" }}>
      <PermissionButton permission="update_jobs" onClick={() => onAction("update", row)}>
        <IconBtnStatic label="Update" color="text-green-600"><FiEdit size={16} /></IconBtnStatic>
      </PermissionButton>
      <PermissionButton permission="clone_jobs" onClick={() => onAction("clone", row)}>
        <IconBtnStatic label="Clone" color="text-blue-600"><FiCopy size={16} /></IconBtnStatic>
      </PermissionButton>
      <PermissionButton permission="delete_jobs" onClick={() => onAction("delete", row)}>
        <IconBtnStatic label="Delete" color="text-red-600"><FiTrash2 size={16} /></IconBtnStatic>
      </PermissionButton>
      {isSuperAdmin && (
        <IconBtnStatic label="Permissions" color="text-amber-600" onClick={() => onOpenPerm(row)}>
          <FiShield size={16} />
        </IconBtnStatic>
      )}
    </div>
  );
}

function IconBtnStatic({ onClick, children, label, color }) {
  return (
    <div className="relative group" style={{ overflow: "visible" }}>
      <button onClick={onClick} className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 ${color}`}>{children}</button>
      <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
        {label}
      </span>
    </div>
  );
}

export default function JobList() {
  const navigate = useNavigate();

  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fyYear, setFyYear] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [jobStatuses, setJobStatuses] = useState([]);

  const token = sessionStorage.getItem("access_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(API.GET_JOB_STATUS, { headers }).then((res) => setJobStatuses(res.data || [])).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusMap = useMemo(() => {
    const map = {};
    jobStatuses.forEach((s) => { map[s.status_id] = s.status_name; });
    return map;
  }, [jobStatuses]);

  const [fileCache, setFileCache] = useState({});
  const [uploaderCache, setUploaderCache] = useState({});
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [popoverInfo, setPopoverInfo] = useState(null);
  const [panelsDialog, setPanelsDialog] = useState({ open: false, jobId: null, jobNo: null, subJobs: [] });

  const isSuperAdmin = useIsSuperAdmin();
  const [permDialog, setPermDialog] = useState({ open: false, job: null });

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  const [viewerKind, setViewerKind] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState(false);
  const [viewerPdfData, setViewerPdfData] = useState(null);
  const [viewerImageUrl, setViewerImageUrl] = useState(null);
  const [viewerTextContent, setViewerTextContent] = useState("");

  const FY_OPTIONS = useMemo(() => generateFYOptionsFromData(rawData), [rawData]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API.GET_JOBS_NEW, { headers });
      setRawData((res.data || []).map(mapItem));
      setFileCache({});
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      toast.error(error.response?.data?.detail || "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    if (!panelsDialog.open) return;
    const job = rawData.find((j) => j.job_id === panelsDialog.jobId);
    if (job) setPanelsDialog((prev) => ({ ...prev, subJobs: job.sub_jobs }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData]);

  const handleSearch = useCallback((term) => setSearchTerm(term || ""), []);

  const data = useMemo(
    () => filterBySearch(filterByFY(rawData, fyYear), searchTerm),
    [rawData, fyYear, searchTerm]
  );

  const handleDelete = async (row) => {
    const confirmed = window.confirm(`Delete job "${row.job_no}"?`);
    if (!confirmed) return;
    try {
      await axios.delete(API.DELETE_JOB_NEW(row.job_id), { headers });
      toast.success("Job deleted successfully!");
      fetchJobs();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete job.");
    }
  };

  const handleAction = (type, row) => {
    if (type === "delete") { handleDelete(row); return; }
    navigate(`/jobs/action/${type}`, { state: { data: row, action: type } });
  };

  const fetchPanelFiles = useCallback(async (jobId, subJobId) => {
    setFileCache((prev) => ({ ...prev, [subJobId]: { loading: true, files: prev[subJobId]?.files || [] } }));
    try {
      const res = await axios.get(API.GET_JOB_FILES_NEW(subJobId), { headers, params: { job_id: jobId } });
      setFileCache((prev) => ({ ...prev, [subJobId]: { loading: false, files: res.data || [] } }));
    } catch (error) {
      console.error("Failed to fetch panel files:", error);
      setFileCache((prev) => ({ ...prev, [subJobId]: { loading: false, files: [], error: true } }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUploader = useCallback(async (userId) => {
    setUploaderCache((prev) => ({ ...prev, [userId]: { loading: true, name: null } }));
    try {
      const res = await axios.get(API.GET_MY_PROFILE(userId), { headers });
      const email = res.data?.email || "";
      setUploaderCache((prev) => ({ ...prev, [userId]: { loading: false, name: emailToName(email) || email || null } }));
    } catch {
      setUploaderCache((prev) => ({ ...prev, [userId]: { loading: false, name: null } }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownloadFile = useCallback(async (file) => {
    try {
      const res = await axios.get(API.DOWNLOAD_JOB_FILE_NEW(file.file_id), { headers, responseType: "blob" });
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewFile = useCallback(async (file) => {
    const kind = getPreviewKind(file.original_file_name);
    if (!kind) return;
    setViewerFile(file); setViewerKind(kind); setViewerOpen(true);
    setViewerLoading(true); setViewerError(false);
    setViewerPdfData(null); setViewerImageUrl(null); setViewerTextContent("");
    try {
      const res = await axios.get(API.DOWNLOAD_JOB_FILE_NEW(file.file_id), { headers, responseType: "blob" });
      const blob = res.data;
      if (kind === "pdf") { const buffer = await blob.arrayBuffer(); setViewerPdfData({ data: new Uint8Array(buffer) }); }
      else if (kind === "image") setViewerImageUrl(window.URL.createObjectURL(blob));
      else if (kind === "text") setViewerTextContent(await blob.text());
    } catch (err) {
      console.error("Failed to load file preview:", err);
      setViewerError(true);
    } finally { setViewerLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCloseViewer = useCallback(() => {
    if (viewerImageUrl) window.URL.revokeObjectURL(viewerImageUrl);
    setViewerOpen(false); setViewerFile(null); setViewerKind(null);
    setViewerPdfData(null); setViewerImageUrl(null); setViewerTextContent(""); setViewerError(false);
  }, [viewerImageUrl]);

  const handleOpenDocPopover = useCallback((event, info) => {
    setPopoverAnchor(event.currentTarget);
    setPopoverInfo(info);
    if (info.done && info.fileType && !fileCache[info.subJobId]) fetchPanelFiles(info.jobId, info.subJobId);
  }, [fileCache, fetchPanelFiles]);

  const handleCloseDocPopover = useCallback(() => { setPopoverAnchor(null); setPopoverInfo(null); }, []);

  const handleOpenPanels = useCallback((row) => {
    setPanelsDialog({ open: true, jobId: row.job_id, jobNo: row.job_no, subJobs: row.sub_jobs });
  }, []);
  const handleClosePanels = useCallback(() => {
    setPanelsDialog({ open: false, jobId: null, jobNo: null, subJobs: [] });
    handleCloseDocPopover();
  }, [handleCloseDocPopover]);

  // ── Navigate to the full upload FORM for a specific panel. State carries
  // everything JobUploadForm needs. ─────────────────────────────────────────
  const handleGoToUpload = useCallback(({ jobId, jobNo, subJobId, subJobNo }) => {
    navigate("/jobs/action/upload", { state: { jobId, jobNo, subJobId, subJobNo } });
  }, [navigate]);

  const columns = [
    { header: "Job No", accessor: "job_no" },
    { header: "Customer", accessor: "customer_name" },
    { header: "End User", accessor: "end_user" },
    {
      header: "Job Status",
      render: (row) => statusMap[row.job_status_id] || "-",
      exportValue: (row) => statusMap[row.job_status_id] || "-",
    },
    { header: "Remarks / Action", accessor: "remarks_action" },
    { header: "SO No", accessor: "so_no" },
    { header: "Job Date", accessor: "job_date" },
    { header: "Tested By", accessor: "tested_by" },
    { header: "Site Commissioned", accessor: "site_commissioned" },
    { header: "MOM By", accessor: "mom_by" },
    {
      header: "Panels",
      compact: true,
      render: (row) => <PanelsCell subJobs={row.sub_jobs} onOpen={() => handleOpenPanels(row)} />,
      exportValue: (row) => `${row.sub_jobs.length}`,
    },
    {
      header: "Actions",
      render: (row) => (
        <JobActionsCell
          row={row}
          isSuperAdmin={isSuperAdmin}
          onAction={handleAction}
          onOpenPerm={(job) => setPermDialog({ open: true, job })}
        />
      ),
    },
  ];

  const fySelector = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>FY</Typography>
      <Select size="small" value={fyYear} onChange={(e) => setFyYear(e.target.value)} sx={{ fontSize: "0.8rem", height: 36, minWidth: 120 }}>
        {FY_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value} sx={{ fontSize: "0.8rem" }}>{o.label}</MenuItem>)}
      </Select>
    </Box>
  );

  const popoverEntry = popoverInfo ? fileCache[popoverInfo.subJobId] : null;
  const popoverFiles = popoverInfo?.fileType && popoverEntry && !popoverEntry.loading && !popoverEntry.error
    ? (popoverEntry.files || []).filter((f) => f.file_type === popoverInfo.fileType && !f.is_deleted)
    : [];

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-semibold mb-4">Jobs</h1>
      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={data}
          onRefresh={fetchJobs}
          onSearch={handleSearch}
          createRoute="/jobs/action/create"
          createLabel="Create Job"
          toolbarLeft={fySelector}
        />
      </div>

      <PanelsDialog
        open={panelsDialog.open}
        onClose={handleClosePanels}
        jobId={panelsDialog.jobId}
        jobNo={panelsDialog.jobNo}
        subJobs={panelsDialog.subJobs}
        fileCache={fileCache}
        onHoverDoc={fetchPanelFiles}
        onOpenDoc={handleOpenDocPopover}
        onUpload={handleGoToUpload}
      />

      {popoverInfo && (
        <DocDetailsPopover
          anchorEl={popoverAnchor}
          onClose={handleCloseDocPopover}
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
          onDownload={handleDownloadFile}
          onView={handleViewFile}
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
        onDownload={() => viewerFile && handleDownloadFile(viewerFile)}
      />
      <JobPermissionsDialog open={permDialog.open} job={permDialog.job} onClose={() => setPermDialog({ open: false, job: null })} />
    </div>
  );
}