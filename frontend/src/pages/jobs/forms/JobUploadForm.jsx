// ===============================
// File: src/pages/jobs/forms/JobUploadForm.jsx
// ===============================

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Paper, Box, Typography, Button, IconButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableRow, TableCell, Chip, Stack, Collapse,
} from "@mui/material";
import UploadFileIcon    from "@mui/icons-material/UploadFile";
import DownloadIcon      from "@mui/icons-material/Download";
import DeleteIcon        from "@mui/icons-material/Delete";
import CloseIcon         from "@mui/icons-material/Close";
import InfoOutlinedIcon  from "@mui/icons-material/InfoOutlined";
import CheckCircleIcon   from "@mui/icons-material/CheckCircle";
import CancelIcon        from "@mui/icons-material/Cancel";
import ExpandMoreIcon    from "@mui/icons-material/ExpandMore";
import ExpandLessIcon    from "@mui/icons-material/ExpandLess";
import FolderZipIcon     from "@mui/icons-material/FolderZip";
import { API } from "../../../config/api";
import { useMyJobPermission } from "../../../hooks/useJobPermission";

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

// `key` = local staging key (unique). `flagKey` = backend boolean field.
const DOC_TYPES = [
  { key: "as_build",            flagKey: "as_build",            fileType: "AS_BUILD",            label: "As Build" },
  { key: "soft_copy",           flagKey: "soft_copy",           fileType: "SOFT_COPY",           label: "Soft Copy" },
  { key: "hard_copy",           flagKey: "hard_copy",           fileType: "HARD_COPY",           label: "Hard Copy" },
  { key: "factory_test_report", flagKey: "factory_test_report", fileType: "FACTORY_TEST_REPORT", label: "Factory Test Report" },
  { key: "bom_excel",           flagKey: "bom_excel",           fileType: "BOM_EXCEL",           label: "BOM Excel" },
  { key: "bom_pdf",             flagKey: "bom_pdf",             fileType: "BOM_PDF",             label: "BOM PDF" },
  { key: "photos",              flagKey: "photos",              fileType: "PHOTOS",              label: "Photos" },
  { key: "notes_and_tech_note", flagKey: "notes_and_tech_note", fileType: "NOTES_AND_TECH_NOTE", label: "Notes & Tech Note" },
  { key: "additional_data",     flagKey: "additional_data",     fileType: "ADDITIONAL_DATA",     label: "Additional Data" },
  { key: "mom_uploaded",        flagKey: "mom_uploaded",        fileType: "MOM",                 label: "MOM" },
];

// Backup sub-types — nested under one "Backup" header. All three share
// `flagKey: "backup_file"`, since the backend tracks a single boolean for
// all backup types combined; only the file_type differs per upload.
const BACKUP_TYPES = [
  { key: "plc_backup",   flagKey: "backup_file", fileType: "PLC_BACKUP",   label: "PLC Backup" },
  { key: "scada_backup", flagKey: "backup_file", fileType: "SCADA_BACKUP", label: "SCADA Backup" },
  { key: "other_backup", flagKey: "backup_file", fileType: "OTHER_BACKUP", label: "Other Backup" },
];

const ALL_DOC_TYPES = [...DOC_TYPES, ...BACKUP_TYPES];

const AUTO_EXPAND_THRESHOLD = 3;
const LIST_MAX_HEIGHT = 240;

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
  if (!email) return "—";
  const local = email.split("@")[0];
  return local.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

function FileInfoDialog({ open, file, docLabel, onClose }) {
  const [uploaderDisplay, setUploaderDisplay] = useState("—");
  const [loadingUploader, setLoadingUploader] = useState(false);

  useEffect(() => {
    if (!open || !file) { setUploaderDisplay("—"); return; }
    if (!file.uploaded_by) { setUploaderDisplay("—"); return; }
    setLoadingUploader(true);
    axios
      .get(API.GET_MY_PROFILE(file.uploaded_by), { headers: authHeaders() })
      .then((res) => {
        const email = res.data?.email || "";
        setUploaderDisplay(email ? `${emailToName(email)} (${email})` : String(file.uploaded_by));
      })
      .catch(() => setUploaderDisplay(String(file.uploaded_by)))
      .finally(() => setLoadingUploader(false));
  }, [open, file?.uploaded_by]);

  if (!file) return null;

  const rows = [
    { label: "Document Type", value: docLabel },
    { label: "File Name",     value: file.original_file_name },
    { label: "Stored Name",   value: file.stored_file_name },
    { label: "File Path",     value: file.file_path },
    { label: "File Size",     value: formatSize(file.file_size) },
    { label: "File ID",       value: file.file_id },
    { label: "Sub Job ID",    value: file.sub_job_id },
    { label: "File Type",     value: file.file_type },
    { label: "Uploaded By",   value: loadingUploader ? "Loading..." : uploaderDisplay },
    { label: "Uploaded At",   value: formatDate(file.uploaded_at) },
    { label: "Status",        value: file.is_deleted ? "Deleted" : "Active" },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <InfoOutlinedIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>File Details</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Table size="small">
          <TableBody>
            {rows.map(({ label, value }) => (
              <TableRow key={label} sx={{ "&:last-child td": { border: 0 } }}>
                <TableCell sx={{
                  width: 150, fontWeight: 600, color: "text.secondary", fontSize: "0.78rem",
                  verticalAlign: "top", py: 1, pl: 2, borderRight: "1px solid", borderColor: "divider", whiteSpace: "nowrap",
                }}>
                  {label}
                </TableCell>
                <TableCell sx={{ fontSize: "0.82rem", py: 1, px: 2, wordBreak: "break-all" }}>
                  {label === "Status" ? (
                    <Chip label={value} size="small" color={value === "Active" ? "success" : "error"} variant="outlined" />
                  ) : String(value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} size="small" variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function DocUploadRow({
  label, done, existingFiles, pendingFiles,
  onSelectFiles, onRemovePending, onDeleteExisting, onDownload, onInfo,
  deletingFileId, canDownload, canDelete, dense,
}) {
  const hasExisting = existingFiles.length > 0;
  const hasPending  = pendingFiles.length > 0;
  const manyFiles   = existingFiles.length > AUTO_EXPAND_THRESHOLD;
  const [expanded, setExpanded] = useState(!manyFiles);

  return (
    <Box sx={{
      py: dense ? 1 : 1.25, px: 1.5, borderRadius: 1.5,
      border: "1px solid", borderColor: "divider", mb: 1,
      bgcolor: dense ? "background.paper" : undefined,
    }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {done ? <CheckCircleIcon fontSize="small" color="success" /> : <CancelIcon fontSize="small" color="error" />}
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
          {hasExisting && (
            <Chip
              size="small"
              label={`${existingFiles.length} file${existingFiles.length > 1 ? "s" : ""}`}
              color="success" variant="outlined"
              onClick={() => setExpanded((e) => !e)}
              icon={expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              sx={{ cursor: "pointer" }}
            />
          )}
        </Box>
        <Button component="label" size="small" variant={hasExisting || hasPending ? "outlined" : "contained"}
          startIcon={<UploadFileIcon fontSize="small" />} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>
          {hasExisting ? "Add More" : "Choose Files"}
          <input type="file" hidden multiple
            onChange={(e) => {
              const picked = Array.from(e.target.files || []);
              if (picked.length) onSelectFiles(picked);
              e.target.value = "";
            }}
          />
        </Button>
      </Stack>

      {!hasExisting && !hasPending && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          No file uploaded
        </Typography>
      )}

      {hasExisting && (
        <Collapse in={expanded} timeout="auto">
          <Box sx={{ maxHeight: LIST_MAX_HEIGHT, overflowY: "auto", mt: 1, pr: 0.5 }}>
            <Stack spacing={0.5}>
              {existingFiles.map((file) => (
                <Box key={file.file_id} sx={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  bgcolor: "success.50", borderRadius: 1, px: 1, py: 0.5, flexWrap: "wrap", gap: 0.5,
                }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="success.main" sx={{
                      display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280,
                    }}>
                      {file.original_file_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[formatSize(file.file_size), formatDate(file.uploaded_at)].filter(Boolean).join(" · ")}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                    <IconButton size="small" onClick={() => onInfo(file)} title="File details">
                      <InfoOutlinedIcon fontSize="small" color="info" />
                    </IconButton>
                    {canDownload && (
                      <IconButton size="small" title="Download" onClick={() => onDownload(file)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    )}
                    {canDelete && (
                      <IconButton
                        size="small" color="error" title="Delete"
                        disabled={deletingFileId === file.file_id}
                        onClick={() => onDeleteExisting(file)}
                      >
                        {deletingFileId === file.file_id ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                      </IconButton>
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Collapse>
      )}

      {hasPending && (
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {pendingFiles.map((f, idx) => (
            <Box key={`${f.name}-${idx}`} sx={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              bgcolor: "primary.50", borderRadius: 1, px: 1, py: 0.5,
            }}>
              <Typography variant="caption" color="primary.main" sx={{
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280,
              }}>
                New: {f.name} <Box component="span" sx={{ color: "text.secondary" }}>({formatSize(f.size)})</Box>
              </Typography>
              <IconButton size="small" onClick={() => onRemovePending(idx)}><CloseIcon fontSize="small" /></IconButton>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

// ── Backup group — one "Backup" header, three nested rows inside
// (PLC / SCADA / Other), each with its own existing + pending files.
function BackupGroup({
  panelHeader, existingFiles, pendingFiles,
  onSelectFiles, onRemovePending, onDeleteExisting, onDownload, onInfo,
  deletingFileId, canDownload, canDelete, getExistingFilesFor,
}) {
  const totalExisting = BACKUP_TYPES.reduce((sum, d) => sum + getExistingFilesFor(d.fileType).length, 0);
  return (
    <Box sx={{ borderRadius: 1.5, border: "1px solid", borderColor: "divider", mb: 1, overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, bgcolor: "#f8fafc", borderBottom: "1px solid", borderColor: "divider" }}>
        <FolderZipIcon fontSize="small" color={panelHeader.backup_file ? "success" : "disabled"} />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>Backup</Typography>
        {totalExisting > 0 && (
          <Chip size="small" label={`${totalExisting} file${totalExisting > 1 ? "s" : ""}`} color="success" variant="outlined" />
        )}
      </Box>
      <Box sx={{ p: 1.5, pl: 3 }}>
        {BACKUP_TYPES.map((doc) => (
          <DocUploadRow
            key={doc.key}
            label={doc.label}
            done={!!panelHeader.backup_file}
            existingFiles={getExistingFilesFor(doc.fileType)}
            pendingFiles={pendingFiles[doc.key] || []}
            onSelectFiles={onSelectFiles(doc.key)}
            onRemovePending={onRemovePending(doc.key)}
            onDeleteExisting={onDeleteExisting}
            onDownload={onDownload}
            onInfo={onInfo(doc.label)}
            deletingFileId={deletingFileId}
            canDownload={canDownload}
            canDelete={canDelete}
            dense
          />
        ))}
      </Box>
    </Box>
  );
}

// ─── Main Form — scoped to a single sub-job (panel), passed via navigate()
// state from JobList's Panels dialog. ─────────────────────────────────────
export default function JobUploadForm() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const passed    = location.state || {};
  const jobId     = passed.jobId;
  const jobNo     = passed.jobNo;
  const subJobId  = passed.subJobId;
  const subJobNo  = passed.subJobNo;

  const { can, loading: permLoading, isSuperAdmin } = useMyJobPermission(jobId);

  const [panelHeader, setPanelHeader] = useState(null); // doc "done" flags for this sub-job
  const [existingFiles, setExistingFiles] = useState([]);
  const [pendingFiles,  setPendingFiles]  = useState({});
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [infoDialog,    setInfoDialog]    = useState({ open: false, file: null, label: "" });

  const fetchAll = useCallback(async () => {
    if (!jobId || !subJobId) return;
    setLoading(true);
    try {
      const [jobRes, filesRes] = await Promise.all([
        axios.get(API.GET_JOB_NEW(jobId), { headers: authHeaders() }),
        axios.get(API.GET_JOB_FILES_NEW(subJobId), { headers: authHeaders(), params: { job_id: jobId } }),
      ]);
      const panel = (jobRes.data?.sub_jobs || []).find((p) => p.sub_job_id === subJobId);
      setPanelHeader({
        as_build:             !!panel?.as_build,
        soft_copy:            !!panel?.soft_copy,
        hard_copy:            !!panel?.hard_copy,
        factory_test_report:  !!panel?.factory_test_report,
        bom_excel:            !!panel?.bom_excel,
        bom_pdf:              !!panel?.bom_pdf,
        photos:               !!panel?.photos,
        backup_file:          !!panel?.backup_file,
        notes_and_tech_note:  !!panel?.notes_and_tech_note,
        additional_data:      !!panel?.additional_data,
        mom_uploaded:         !!panel?.mom_uploaded,
      });
      setExistingFiles((filesRes.data || []).filter((f) => !f.is_deleted));
    } catch (error) {
      console.error("Failed to load panel:", error.response?.data || error);
      toast.error(error.response?.data?.detail || "Failed to load panel.");
    } finally {
      setLoading(false);
    }
  }, [jobId, subJobId]);

  useEffect(() => {
    if (!jobId || !subJobId) { toast.error("No panel selected."); navigate("/jobs/list"); return; }
    fetchAll();
  }, [jobId, subJobId, fetchAll, navigate]);

  const getExistingFilesFor = (fileType) => existingFiles.filter((f) => f.file_type === fileType);

  const handleFilesSelect = (docKey) => (pickedFiles) =>
    setPendingFiles((prev) => ({ ...prev, [docKey]: [...(prev[docKey] || []), ...pickedFiles] }));

  const handleRemovePending = (docKey) => (index) =>
    setPendingFiles((prev) => {
      const arr = [...(prev[docKey] || [])];
      arr.splice(index, 1);
      return { ...prev, [docKey]: arr };
    });

  const handleDeleteExisting = async (file) => {
    const confirmed = window.confirm(`Delete "${file.original_file_name}"?`);
    if (!confirmed) return;
    setDeletingFileId(file.file_id);
    try {
      await axios.delete(API.DELETE_JOB_FILE_NEW(file.file_id), { headers: authHeaders() });
      toast.success("File deleted.");
      await fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete file.");
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleDownload = async (file) => {
    try {
      const res  = await axios.get(API.DOWNLOAD_JOB_FILE_NEW(file.file_id), { headers: authHeaders(), responseType: "blob" });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", file.original_file_name || "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download file.");
    }
  };

  const handleInfo = (label) => (file) => setInfoDialog({ open: true, file, label });

  const hasAnyPending = Object.values(pendingFiles).some((arr) => arr && arr.length > 0);

  const handleSave = async () => {
    if (!hasAnyPending) { toast.error("Select at least one file to upload."); return; }
    setSaving(true);
    try {
      for (const doc of ALL_DOC_TYPES) {
        const docFiles = pendingFiles[doc.key];
        if (!docFiles || docFiles.length === 0) continue;
        const formData = new FormData();
        formData.append("file_type", doc.fileType);
        docFiles.forEach((f) => formData.append("files", f));

        await axios.post(API.UPLOAD_JOB_FILE_NEW(subJobId), formData, {
          headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
          params: { job_id: jobId },
        });
      }
      toast.success("Files uploaded successfully!");
      navigate("/jobs/list");
    } catch (error) {
      console.error("Upload failed:", error.response?.data || error);
      toast.error(error.response?.data?.detail || "Failed to upload files.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !panelHeader) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isSuperAdmin && permLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isSuperAdmin && !can("can_upload_file")) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          You don't have permission to upload files for this job.
        </Typography>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate("/jobs/list")}>
          Back to Jobs
        </Button>
      </Box>
    );
  }

  const canDownload = isSuperAdmin || can("can_download_file");
  const canDelete   = isSuperAdmin || can("can_delete_file");

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "background.default" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Upload Documents</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Job {jobNo} · Panel {subJobNo}
      </Typography>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, maxWidth: 900 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          Add new files or replace/remove existing ones. You can select multiple files at once
          per document type. Click the file-count chip to expand/collapse the list, and ℹ️ on
          any file for full details.
        </Typography>

        {DOC_TYPES.map((doc) => {
          const existing = getExistingFilesFor(doc.fileType);
          return (
            <DocUploadRow
              key={doc.key}
              label={doc.label}
              done={!!panelHeader[doc.flagKey]}
              existingFiles={existing}
              pendingFiles={pendingFiles[doc.key] || []}
              onSelectFiles={handleFilesSelect(doc.key)}
              onRemovePending={handleRemovePending(doc.key)}
              onDeleteExisting={handleDeleteExisting}
              onDownload={handleDownload}
              onInfo={handleInfo(doc.label)}
              deletingFileId={deletingFileId}
              canDownload={canDownload}
              canDelete={canDelete}
            />
          );
        })}

        <BackupGroup
          panelHeader={panelHeader}
          existingFiles={existingFiles}
          pendingFiles={pendingFiles}
          onSelectFiles={handleFilesSelect}
          onRemovePending={handleRemovePending}
          onDeleteExisting={handleDeleteExisting}
          onDownload={handleDownload}
          onInfo={handleInfo}
          deletingFileId={deletingFileId}
          canDownload={canDownload}
          canDelete={canDelete}
          getExistingFilesFor={getExistingFilesFor}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}>
          <Button variant="outlined" onClick={() => navigate("/jobs/list")} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !hasAnyPending}>
            {saving ? "Uploading..." : "Upload Files"}
          </Button>
        </Box>
      </Paper>

      <FileInfoDialog
        open={infoDialog.open}
        file={infoDialog.file}
        docLabel={infoDialog.label}
        onClose={() => setInfoDialog({ open: false, file: null, label: "" })}
      />
    </Box>
  );
}