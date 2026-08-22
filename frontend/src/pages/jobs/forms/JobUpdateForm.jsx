// ===============================
// File: src/pages/jobs/forms/JobUpdateForm.jsx
// ===============================

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Paper, Box, TextField, Button, Typography, Grid, Divider,
  CircularProgress, MenuItem, Chip, Switch, FormControlLabel,
  IconButton, Collapse,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteIcon     from "@mui/icons-material/Delete";
import AddIcon        from "@mui/icons-material/Add";
import { API } from "../../../config/api";

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

// Read-only display only — these flags are set by uploading a file on the
// Jobs list (Panels → Upload), never edited by hand here.
const DOC_STATUS_FIELDS = [
  { key: "as_build",            label: "As Build" },
  { key: "soft_copy",           label: "Soft Copy" },
  { key: "hard_copy",           label: "Hard Copy" },
  { key: "factory_test_report", label: "Factory Test Report" },
  { key: "bom_excel",           label: "BOM Excel" },
  { key: "bom_pdf",             label: "BOM PDF" },
  { key: "photos",              label: "Photos" },
  { key: "backup_file",         label: "Backup File" },
  { key: "mom_uploaded",        label: "MOM" },
];

// ─── One editable panel card ────────────────────────────────────────────────
function PanelEditCard({ panel, headers, onSaved, onDeleted }) {
  // local draft, seeded once from the panel prop — editing here shouldn't
  // get clobbered by unrelated re-renders of the parent form
  const [draft, setDraft] = useState(() => ({
    panel_description:    panel.panel_description || "",
    panel_quantity:       panel.panel_quantity ?? "",
    remarks:              panel.remarks || "",
    bom_updated_on_erp:   !!panel.bom_updated_on_erp,
    bom_updated_on_tally: !!panel.bom_updated_on_tally,
  }));
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleChange = (field) => (e) => {
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSwitch = (field) => (e) =>
    setDraft((prev) => ({ ...prev, [field]: e.target.checked }));

  const validate = () => {
    const newErrors = {};
    if (!draft.panel_description?.trim()) newErrors.panel_description = "Description is required";
    if (draft.panel_quantity === "" || isNaN(Number(draft.panel_quantity)))
      newErrors.panel_quantity = "Quantity must be a number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        panel_description:    draft.panel_description,
        panel_quantity:       Number(draft.panel_quantity),
        remarks:              draft.remarks,
        bom_updated_on_erp:   draft.bom_updated_on_erp,
        bom_updated_on_tally: draft.bom_updated_on_tally,
        // carried through unchanged — this form never sets these, they're
        // derived from uploads on the Jobs list, not typed by hand
        as_build:             !!panel.as_build,
        soft_copy:            !!panel.soft_copy,
        hard_copy:            !!panel.hard_copy,
        factory_test_report:  !!panel.factory_test_report,
        bom_excel:            !!panel.bom_excel,
        bom_pdf:              !!panel.bom_pdf,
        photos:               !!panel.photos,
        backup_file:          !!panel.backup_file,
        mom_uploaded:         !!panel.mom_uploaded,
      };
      const res = await axios.put(API.UPDATE_SUB_JOB(panel.sub_job_id), payload, { headers });
      toast.success(`Panel ${panel.sub_job_no} updated`);
      onSaved(panel.sub_job_id, res.data);
    } catch (error) {
      console.error("Panel update failed:", error.response?.data || error);
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
        toast.error(detail || "Failed to update panel.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete panel "${panel.sub_job_no}"? This cannot be undone.`);
    if (!confirmed) return;
    setDeleting(true);
    try {
      await axios.delete(API.DELETE_SUB_JOB(panel.sub_job_id), { headers });
      toast.success(`Panel ${panel.sub_job_no} deleted`);
      onDeleted(panel.sub_job_id);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete panel.");
      setDeleting(false);
    }
  };

  const activeDocFlags = DOC_STATUS_FIELDS.filter((d) => panel[d.key]);

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 1 }}
        onClick={() => setExpanded((e) => !e)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ whiteSpace: "nowrap" }}>
            {panel.sub_job_no}
          </Typography>
          <Typography
            variant="body2" color="text.secondary"
            sx={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {panel.panel_description || "—"}
          </Typography>
          <Chip size="small" label={`Qty ${panel.panel_quantity ?? "—"}`} variant="outlined" />
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={expanded} timeout="auto">
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              label="Panel Description" fullWidth required multiline minRows={2}
              value={draft.panel_description} onChange={handleChange("panel_description")}
              error={!!errors.panel_description} helperText={errors.panel_description}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Panel Quantity" type="number" fullWidth required
              value={draft.panel_quantity} onChange={handleChange("panel_quantity")}
              error={!!errors.panel_quantity} helperText={errors.panel_quantity}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Panel Remarks" fullWidth
              value={draft.remarks} onChange={handleChange("remarks")} />
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mt: 2 }}>
          <FormControlLabel
            control={<Switch checked={draft.bom_updated_on_erp} onChange={handleSwitch("bom_updated_on_erp")} />}
            label="BOM Updated on ERP"
          />
          <FormControlLabel
            control={<Switch checked={draft.bom_updated_on_tally} onChange={handleSwitch("bom_updated_on_tally")} />}
            label="BOM Updated on Tally"
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            Documents — set by uploading on the Jobs list, not editable here
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {activeDocFlags.length === 0 ? (
              <Typography variant="caption" color="text.disabled">No documents uploaded yet</Typography>
            ) : (
              activeDocFlags.map((d) => (
                <Chip key={d.key} size="small" label={d.label} color="success" variant="outlined" />
              ))
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2.5 }}>
          <Button
            color="error" variant="outlined" size="small"
            onClick={handleDelete} disabled={deleting || saving}
            startIcon={deleting ? <CircularProgress size={14} /> : <DeleteIcon fontSize="small" />}
          >
            {deleting ? "Deleting..." : "Delete Panel"}
          </Button>
          <Button variant="contained" size="small" onClick={handleSave} disabled={saving || deleting}>
            {saving ? "Saving..." : "Save Panel"}
          </Button>
        </Box>
      </Collapse>
    </Paper>
  );
}

// ─── Main Form ──────────────────────────────────────────────────────────────
export default function JobUpdateForm() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const passedJob = location.state?.data;
  const jobId     = passedJob?.job_id;

  const [form,    setForm]    = useState(null);
  const [panels,  setPanels]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});
  const [jobStatuses, setJobStatuses] = useState([]);

  const headers = authHeaders();

  useEffect(() => {
    axios
      .get(API.GET_JOB_STATUS, { headers: authHeaders() })
      .then((res) => setJobStatuses(res.data || []))
      .catch(console.error);
  }, []);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await axios.get(API.GET_JOB_NEW(jobId), { headers: authHeaders() });
      const d = res.data;
      setForm({
        job_no:            d.job_no            || "",
        customer_name:     d.customer_name     || "",
        end_user:          d.end_user          || "",
        job_status_id:     d.job_status_id     || "",
        remarks_action:    d.remarks_action    || "",
        site_commissioned: d.site_commissioned || "",
        tested_by:         d.tested_by         || "",
        so_no:             d.so_no             || "",
        mom_by:             d.mom_by            || "",
        job_date:          d.job_date          || "",
      });
      setPanels(Array.isArray(d.sub_jobs) ? d.sub_jobs : []);
    } catch (error) {
      console.error("Failed to load job:", error);
      toast.error(error.response?.data?.detail || "Failed to load job.");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) { toast.error("No job selected."); navigate("/jobs/list"); return; }
    fetchJob();
  }, [jobId, fetchJob, navigate]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.job_no?.trim())        newErrors.job_no        = "Job No is required";
    if (!form.customer_name?.trim()) newErrors.customer_name = "Customer name is required";
    if (!form.job_date)              newErrors.job_date      = "Job date is required";
    if (!form.job_status_id)         newErrors.job_status_id = "Job status is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        job_no:            form.job_no,
        customer_name:     form.customer_name,
        end_user:          form.end_user,
        job_status_id:     Number(form.job_status_id),
        remarks_action:    form.remarks_action,
        site_commissioned: form.site_commissioned,
        tested_by:         form.tested_by,
        so_no:             form.so_no,
        mom_by:             form.mom_by,
        job_date:          form.job_date,
      };

      await axios.put(API.UPDATE_JOB_NEW(jobId), payload, { headers: authHeaders() });
      toast.success("Job updated successfully!");
      navigate("/jobs/list");
    } catch (error) {
      console.error("Update failed:", error.response?.data || error);
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
        toast.error(detail || "Failed to update job.");
      }
    } finally {
      setSaving(false);
    }
  };

  // panel saved → merge the API's returned fields back into local state
  // so the collapsed-card summary (desc/qty chip, doc chips) stays fresh
  const handlePanelSaved = useCallback((subJobId, updated) => {
    setPanels((prev) => prev.map((p) => (p.sub_job_id === subJobId ? { ...p, ...updated } : p)));
  }, []);

  const handlePanelDeleted = useCallback((subJobId) => {
    setPanels((prev) => prev.filter((p) => p.sub_job_id !== subJobId));
  }, []);

  // "Add Panel" — the job already exists and its current values are sitting
  // right here in `form`, so hand them straight to Create Form instead of
  // sending the person to a blank screen to retype everything. Create Form
  // uses `fromJobUpdate` to know it should prefill + lock the job section
  // and route back here (not the jobs list) once the panel is saved.
  const handleAddPanel = useCallback(() => {
    navigate("/jobs/action/create", {
      state: {
        data: { ...form, job_id: jobId },
        fromJobUpdate: true,
      },
    });
  }, [navigate, form, jobId]);

  if (loading || !form) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "background.default" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Update Job</Typography>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, maxWidth: 900, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Basic Information</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Job No" fullWidth required
              value={form.job_no} onChange={handleChange("job_no")}
              error={!!errors.job_no} helperText={errors.job_no} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Customer Name" fullWidth required
              value={form.customer_name} onChange={handleChange("customer_name")}
              error={!!errors.customer_name} helperText={errors.customer_name} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="End User" fullWidth value={form.end_user} onChange={handleChange("end_user")} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Remarks / Action" fullWidth value={form.remarks_action} onChange={handleChange("remarks_action")} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Job Status" fullWidth
              value={form.job_status_id} onChange={handleChange("job_status_id")}
              error={!!errors.job_status_id} helperText={errors.job_status_id}
              required>
              {jobStatuses.map((status) => (
                <MenuItem key={status.status_id} value={status.status_id}>{status.status_name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="SO No" fullWidth value={form.so_no} onChange={handleChange("so_no")} helperText="Sales Order Number" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Job Date" type="date" fullWidth required
              value={form.job_date} onChange={handleChange("job_date")}
              error={!!errors.job_date} helperText={errors.job_date}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Tested By" fullWidth value={form.tested_by} onChange={handleChange("tested_by")} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Site Commissioned By" fullWidth
              value={form.site_commissioned} onChange={handleChange("site_commissioned")}
              helperText="Name of the engineer who commissioned the site" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="MOM By" fullWidth value={form.mom_by} onChange={handleChange("mom_by")}
              helperText="Name of person who took Minutes of Meeting" />
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}>
          <Button variant="outlined" onClick={() => navigate("/jobs/list")} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, maxWidth: 900 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Panels ({panels.length})
          </Typography>
          <Button
            size="small" variant="outlined" startIcon={<AddIcon fontSize="small" />}
            onClick={handleAddPanel}
            sx={{ textTransform: "none" }}
          >
            Add Panel
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          Adds a new panel to this same job ("{form.job_no}") — job details carry over
          automatically, you'll only need to fill in the panel's own info.
        </Typography>

        {panels.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No panels on this job yet.</Typography>
        ) : (
          panels.map((panel) => (
            <PanelEditCard
              key={panel.sub_job_id}
              panel={panel}
              headers={headers}
              onSaved={handlePanelSaved}
              onDeleted={handlePanelDeleted}
            />
          ))
        )}
      </Paper>
    </Box>
  );
}