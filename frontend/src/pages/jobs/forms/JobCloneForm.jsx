// ===============================
// File: src/pages/jobs/forms/JobCloneForm.jsx
// ===============================

import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Paper, Box, TextField, Button, Typography, Grid, Divider,
  Alert, IconButton, Switch, FormControlLabel, Stack, Chip, MenuItem,
} from "@mui/material";
import UploadFileIcon      from "@mui/icons-material/UploadFile";
import CloseIcon           from "@mui/icons-material/Close";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CheckCircleIcon     from "@mui/icons-material/CheckCircle";
import FolderZipIcon       from "@mui/icons-material/FolderZip";
import { API } from "../../../config/api";

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

// Real file uploads — same as JobCreateForm. `key` is the LOCAL staging key
// (unique per row). `flagKey` is the backend boolean the payload sets.
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

// Backup sub-types — grouped under a single "Backup" header in the UI.
// All three share `flagKey: "backup_file"`.
const BACKUP_TYPES = [
  { key: "plc_backup",   flagKey: "backup_file", fileType: "PLC_BACKUP",   label: "PLC Backup" },
  { key: "scada_backup", flagKey: "backup_file", fileType: "SCADA_BACKUP", label: "SCADA Backup" },
  { key: "other_backup", flagKey: "backup_file", fileType: "OTHER_BACKUP", label: "Other Backup" },
];

const MANUAL_FLAGS = [
  { key: "bom_updated_on_erp",   label: "BOM Updated on ERP" },
  { key: "bom_updated_on_tally", label: "BOM Updated on Tally" },
];

const today = new Date().toISOString().split("T")[0];

const EMPTY_PANEL = {
  panel_description:    "",
  panel_quantity:       "",
  remarks:              "",
  bom_updated_on_erp:   false,
  bom_updated_on_tally: false,
};

function formatSize(bytes) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocUploadRow({ label, files, onSelectFiles, onRemoveFile, dense }) {
  return (
    <Box sx={{
      py: dense ? 1 : 1.25, px: 1.5, borderRadius: 1.5,
      border: "1px solid", borderColor: "divider", mb: 1,
      bgcolor: dense ? "background.paper" : undefined,
    }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <InsertDriveFileIcon fontSize="small" color={files.length ? "success" : "disabled"} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
          {files.length > 0 && (
            <Chip size="small" label={`${files.length} selected`} color="primary" variant="outlined" />
          )}
        </Box>
        <Button
          component="label" size="small"
          variant={files.length ? "outlined" : "contained"}
          startIcon={<UploadFileIcon fontSize="small" />}
          sx={{ textTransform: "none", whiteSpace: "nowrap" }}
        >
          {files.length ? "Add More" : "Choose Files"}
          <input
            type="file" hidden multiple
            onChange={(e) => {
              const picked = Array.from(e.target.files || []);
              if (picked.length) onSelectFiles(picked);
              e.target.value = "";
            }}
          />
        </Button>
      </Stack>

      {files.length === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          No files selected
        </Typography>
      )}

      {files.length > 0 && (
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {files.map((f, idx) => (
            <Box
              key={`${f.name}-${idx}`}
              sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "action.hover", borderRadius: 1, px: 1, py: 0.5 }}
            >
              <Typography variant="caption" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>
                {f.name}{" "}
                <Box component="span" sx={{ color: "text.secondary" }}>({formatSize(f.size)})</Box>
              </Typography>
              <IconButton size="small" onClick={() => onRemoveFile(idx)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

// ── Backup group — "Backup" header, three nested rows inside (PLC/SCADA/Other).
function BackupGroup({ files, onSelectFiles, onRemoveFile }) {
  const totalSelected = BACKUP_TYPES.reduce((sum, d) => sum + (files[d.key]?.length || 0), 0);
  return (
    <Box sx={{ borderRadius: 1.5, border: "1px solid", borderColor: "divider", mb: 1, overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, bgcolor: "#f8fafc", borderBottom: "1px solid", borderColor: "divider" }}>
        <FolderZipIcon fontSize="small" color={totalSelected ? "success" : "disabled"} />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>Backup</Typography>
        {totalSelected > 0 && (
          <Chip size="small" label={`${totalSelected} selected`} color="primary" variant="outlined" />
        )}
      </Box>
      <Box sx={{ p: 1.5, pl: 3 }}>
        {BACKUP_TYPES.map((doc) => (
          <DocUploadRow
            key={doc.key}
            label={doc.label}
            files={files[doc.key] || []}
            onSelectFiles={onSelectFiles(doc.key)}
            onRemoveFile={onRemoveFile(doc.key)}
            dense
          />
        ))}
      </Box>
    </Box>
  );
}

export default function JobCloneForm() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const sourceJob = location.state?.data;

  const sourcePanels = sourceJob?.sub_jobs || [];

  const ALL_DOC_TYPES = [...DOC_TYPES, ...BACKUP_TYPES];

  const [jobForm, setJobForm] = useState({
    job_no:            sourceJob?.job_no ? `${sourceJob.job_no}-COPY` : "",
    customer_name:     sourceJob?.customer_name     || "",
    site_commissioned: sourceJob?.site_commissioned || "",
    so_no:             sourceJob?.so_no             || "",
    mom_by:            sourceJob?.mom_by            || "",
    job_date:          today,
    tested_by:         sourceJob?.tested_by         || "",
    end_user:          sourceJob?.end_user          || "",
    job_status_id:     sourceJob?.job_status_id     || "",
    remarks_action:    sourceJob?.remarks_action    || "",
  });

  const [sourcePanelIndex, setSourcePanelIndex] = useState(sourcePanels.length > 0 ? 0 : "");
  const [panelForm, setPanelForm] = useState(
    sourcePanels.length > 0
      ? {
          panel_description:    sourcePanels[0].panel_description || "",
          panel_quantity:       sourcePanels[0].panel_quantity ?? "",
          remarks:              sourcePanels[0].remarks || "",
          bom_updated_on_erp:   false, // reset on clone — same as before
          bom_updated_on_tally: false,
        }
      : EMPTY_PANEL
  );

  const [files,   setFiles]   = useState({});
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});
  const [jobStatuses, setJobStatuses] = useState([]);
  const [clonedPanels, setClonedPanels] = useState([]);

  useEffect(() => {
    axios
      .get(API.GET_JOB_STATUS, { headers: authHeaders() })
      .then((res) => setJobStatuses(res.data || []))
      .catch(console.error);
  }, []);

  if (!sourceJob) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No job selected to clone.</Alert>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate("/jobs/list")}>
          Back to Jobs
        </Button>
      </Box>
    );
  }

  if (sourcePanels.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          "{sourceJob.job_no}" has no panels yet, so there's nothing to clone —
          every job needs at least one panel. Use Create Job instead to start fresh.
        </Alert>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate("/jobs/list")}>
          Back to Jobs
        </Button>
      </Box>
    );
  }

  const handleJobChange = (field) => (e) => {
    setJobForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePanelChange = (field) => (e) => {
    setPanelForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleManualFlag = (field) => (e) =>
    setPanelForm((prev) => ({ ...prev, [field]: e.target.checked }));

  const handleSourcePanelChange = (e) => {
    const idx = e.target.value;
    setSourcePanelIndex(idx);
    const src = sourcePanels[idx];
    setPanelForm({
      panel_description:    src?.panel_description || "",
      panel_quantity:       src?.panel_quantity ?? "",
      remarks:              src?.remarks || "",
      bom_updated_on_erp:   false,
      bom_updated_on_tally: false,
    });
    setFiles({}); // fresh uploads only, per panel
  };

  const handleFilesSelect = (key) => (pickedFiles) =>
    setFiles((prev) => ({ ...prev, [key]: [...(prev[key] || []), ...pickedFiles] }));

  const handleRemoveFile = (key) => (index) =>
    setFiles((prev) => {
      const arr = [...(prev[key] || [])];
      arr.splice(index, 1);
      return { ...prev, [key]: arr };
    });

  const validate = () => {
    const newErrors = {};
    if (!jobForm.job_no?.trim()) newErrors.job_no = "Job No is required";
    if (sourceJob.job_no &&
        jobForm.job_no.trim().toLowerCase() === sourceJob.job_no.trim().toLowerCase())
      newErrors.job_no = "Clone needs a different Job No from the original";
    if (!jobForm.customer_name?.trim()) newErrors.customer_name = "Customer name is required";
    if (!jobForm.job_date) newErrors.job_date = "Job date is required";
    if (!panelForm.panel_description?.trim()) newErrors.panel_description = "Panel description is required";
    if (panelForm.panel_quantity === "" || isNaN(Number(panelForm.panel_quantity)))
      newErrors.panel_quantity = "Quantity must be a number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => {
    // Multiple rows can share the same flagKey (backup types → backup_file)
    // — OR the results together.
    const fileFlags = {};
    ALL_DOC_TYPES.forEach((doc) => {
      const hasFiles = !!(files[doc.key] && files[doc.key].length > 0);
      fileFlags[doc.flagKey] = !!fileFlags[doc.flagKey] || hasFiles;
    });
    return {
      job_no:            jobForm.job_no,
      customer_name:     jobForm.customer_name,
      site_commissioned: jobForm.site_commissioned,
      so_no:             jobForm.so_no,
      mom_by:            jobForm.mom_by,
      job_date:          jobForm.job_date,
      tested_by:         jobForm.tested_by,
      end_user:          jobForm.end_user,
      job_status_id:     jobForm.job_status_id ? Number(jobForm.job_status_id) : null,
      remarks_action:    jobForm.remarks_action,

      panel_description: panelForm.panel_description,
      panel_quantity:    Number(panelForm.panel_quantity),
      remarks:           panelForm.remarks,

      ...fileFlags,
      bom_updated_on_erp:   panelForm.bom_updated_on_erp,
      bom_updated_on_tally: panelForm.bom_updated_on_tally,
    };
  };

  const uploadStagedFiles = async (jobId, subJobId) => {
    const failedTypes = [];
    for (const doc of ALL_DOC_TYPES) {
      const docFiles = files[doc.key];
      if (!docFiles || docFiles.length === 0) continue;
      const formData = new FormData();
      formData.append("file_type", doc.fileType);
      docFiles.forEach((f) => formData.append("files", f));
      try {
        await axios.post(API.UPLOAD_JOB_FILE_NEW(subJobId), formData, {
          headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
          params: { job_id: jobId },
        });
      } catch (err) {
        console.error(`Upload failed for ${doc.label}:`, err.response?.data || err);
        failedTypes.push(doc.label);
      }
    }
    return failedTypes;
  };

  // saveAndContinue = true  -> "Save & Clone Another Panel"
  // saveAndContinue = false -> "Save & Finish"
  const handleSave = async (saveAndContinue) => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await axios.post(API.CREATE_JOB_NEW, buildPayload(), { headers: authHeaders() });
      const { job_id, job_no, sub_job_id, sub_job_no } = res.data || {};

      let failedUploads = [];
      if (sub_job_id) {
        failedUploads = await uploadStagedFiles(job_id, sub_job_id);
      }

      setClonedPanels((prev) => [...prev, { sub_job_no, description: panelForm.panel_description }]);

      if (failedUploads.length > 0) {
        toast.error(`Panel ${sub_job_no} created, but these failed to upload: ${failedUploads.join(", ")}. Retry from Update.`);
      } else {
        toast.success(`Panel ${sub_job_no || ""} added to Job ${job_no || jobForm.job_no}`);
      }

      if (saveAndContinue) {
        setFiles({});
        // leave panelForm as-is so they can tweak the same source before
        // saving again, or pick a different source panel from the dropdown
      } else {
        navigate("/jobs/list");
      }
    } catch (error) {
      console.error("Clone failed:", error.response?.data || error);
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        const fieldErrors = {};
        detail.forEach((d) => {
          const field = d.loc?.[d.loc.length - 1];
          if (field) fieldErrors[field] = d.msg;
        });
        setErrors(fieldErrors);
        toast.error("Please fix the highlighted fields.");
      } else {
        toast.error(detail || "Failed to clone job.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "background.default" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Clone Job</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Cloned from <strong>{sourceJob.job_no}</strong>. Job No must differ from the original.
        Documents aren't copied — upload fresh files below if you have them.
      </Typography>

      {clonedPanels.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: "success.50", border: "1px solid", borderColor: "success.light", maxWidth: 900 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <CheckCircleIcon fontSize="small" color="success" />
            Panels cloned this session
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {clonedPanels.map((p, i) => (
              <Chip key={i} size="small" label={`${p.sub_job_no} — ${p.description}`} color="success" variant="outlined" />
            ))}
          </Stack>
        </Paper>
      )}

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, maxWidth: 900 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Job Information</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Job No" fullWidth required
              value={jobForm.job_no} onChange={handleJobChange("job_no")}
              error={!!errors.job_no} helperText={errors.job_no}
              disabled={clonedPanels.length > 0}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Customer Name" fullWidth required
              value={jobForm.customer_name} onChange={handleJobChange("customer_name")}
              error={!!errors.customer_name} helperText={errors.customer_name} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="End User" fullWidth
              value={jobForm.end_user} onChange={handleJobChange("end_user")} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Remarks / Action" fullWidth
              value={jobForm.remarks_action} onChange={handleJobChange("remarks_action")} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Job Status" fullWidth
              value={jobForm.job_status_id} onChange={handleJobChange("job_status_id")}>
              {jobStatuses.map((status) => (
                <MenuItem key={status.status_id} value={status.status_id}>{status.status_name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="SO No" fullWidth
              value={jobForm.so_no} onChange={handleJobChange("so_no")}
              helperText="Sales Order Number" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Job Date" type="date" fullWidth required
              value={jobForm.job_date} onChange={handleJobChange("job_date")}
              error={!!errors.job_date} helperText={errors.job_date}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Tested By" fullWidth
              value={jobForm.tested_by} onChange={handleJobChange("tested_by")} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Site Commissioned By" fullWidth
              value={jobForm.site_commissioned} onChange={handleJobChange("site_commissioned")} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="MOM By" fullWidth
              value={jobForm.mom_by} onChange={handleJobChange("mom_by")} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          Panel {clonedPanels.length > 0 ? `#${clonedPanels.length + 1}` : ""}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              select label="Clone panel from" fullWidth
              value={sourcePanelIndex}
              onChange={handleSourcePanelChange}
              helperText="Loads that panel's description/quantity/remarks as a starting point — edit freely below"
            >
              {sourcePanels.map((p, idx) => (
                <MenuItem key={p.sub_job_id} value={idx}>
                  {p.sub_job_no} — {p.panel_description}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Panel Description" fullWidth required multiline minRows={2}
              value={panelForm.panel_description} onChange={handlePanelChange("panel_description")}
              error={!!errors.panel_description} helperText={errors.panel_description} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Panel Quantity" type="number" fullWidth required
              value={panelForm.panel_quantity} onChange={handlePanelChange("panel_quantity")}
              error={!!errors.panel_quantity} helperText={errors.panel_quantity} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Panel Remarks" fullWidth
              value={panelForm.remarks} onChange={handlePanelChange("remarks")} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>BOM Status</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Always reset on clone.
        </Typography>
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {MANUAL_FLAGS.map((flag) => (
            <FormControlLabel
              key={flag.key}
              control={<Switch checked={panelForm[flag.key]} onChange={handleManualFlag(flag.key)} />}
              label={flag.label}
            />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>Documents</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          Optional — files are never copied from the source. Upload fresh ones now if you have them.
        </Typography>
        {DOC_TYPES.map((doc) => (
          <DocUploadRow
            key={doc.key}
            label={doc.label}
            files={files[doc.key] || []}
            onSelectFiles={handleFilesSelect(doc.key)}
            onRemoveFile={handleRemoveFile(doc.key)}
          />
        ))}
        <BackupGroup
          files={files}
          onSelectFiles={handleFilesSelect}
          onRemoveFile={handleRemoveFile}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}>
          <Button variant="outlined" onClick={() => navigate("/jobs/list")} disabled={saving}>Cancel</Button>
          <Button variant="outlined" onClick={() => handleSave(true)} disabled={saving}>
            {saving ? "Saving..." : "Save & Clone Another Panel"}
          </Button>
          <Button variant="contained" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? "Saving..." : "Save & Finish"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}