import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API } from "../../../config/api"
import { useNavigate, useLocation } from "react-router-dom";

import {
  Box, Button, Chip, Dialog, DialogContent, DialogTitle, DialogActions,
  Divider, FormControl, Grid, InputLabel, MenuItem,
  Paper, Select, Stack, TextField, Typography, IconButton,
  CircularProgress, Collapse, Table, TableBody, TableRow, TableCell,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PermissionButton from "../../../components/common/PermissionButton";

// ─── helpers ──────────────────────────────────────────────────────────────────
const safeArray = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.items)) return d.items;
  return [];
};

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

const cleanDate = (val) => {
  if (!val || val === "-" || val === null) return "";
  return String(val).split("T")[0];
};

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
  if (!email) return "—";
  const local = email.split("@")[0];
  return local.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

// Below this many existing files, the list auto-expands.
const AUTO_EXPAND_THRESHOLD = 3;
const LIST_MAX_HEIGHT = 240;

// ─── Field visibility per license type name ───────────────────────────────────
const LICENSE_FIELDS = {
  ROCKWELL: {
    description: true, serial_number: true, product_key: true,
    expired_on: true, email_id: true, password: false,
    note_1: false, note_2: false, remarks: true,
  },
  "MICROSOFT WINDOWS": {
    description: true, serial_number: false, product_key: true,
    expired_on: false, email_id: false, password: false,
    note_1: false, note_2: false, remarks: true,
  },
  "MICROSOFT EXCEL": {
    description: true, serial_number: false, product_key: true,
    expired_on: false, email_id: true, password: true,
    note_1: false, note_2: false, remarks: true,
  },
  "MICROSOFT SQL": {
    description: true, serial_number: false, product_key: true,
    expired_on: false, email_id: true, password: true,
    note_1: false, note_2: false, remarks: true,
  },
  OTHER: {
    description: true, serial_number: false, product_key: true,
    expired_on: false, email_id: false, password: false,
    note_1: true, note_2: true, remarks: true,
  },
};

const ALL_FIELDS = {
  description: true, serial_number: true, product_key: true,
  expired_on: true, email_id: true, password: true,
  note_1: true, note_2: true, remarks: true,
};

// ─── ModalWrapper ─────────────────────────────────────────────────────────────
function ModalWrapper({ open, onClose, title, children, onSave }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>{title}</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>{children}</Stack>
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="outlined" size="small" onClick={onClose}>Cancel</Button>
          <Button variant="contained" size="small" onClick={onSave}>Save</Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

// ─── SelectWithNew ────────────────────────────────────────────────────────────
function SelectWithNew({ label, name, value, options, optionId, optionLabel, onChange, onNew }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-end">
      <FormControl size="small" fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select name={name} value={value} label={label} onChange={onChange}>
          <MenuItem value=""><em>Select {label}</em></MenuItem>
          {options.map((o) => (
            <MenuItem key={o[optionId]} value={o[optionId]}>{o[optionLabel]}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={onNew}
        sx={{ whiteSpace: "nowrap", minWidth: 90 }}>
        New
      </Button>
    </Stack>
  );
}

function SectionTitle({ label }) {
  return (
    <Typography variant="caption" sx={{
      display: "block", fontWeight: 700, textTransform: "uppercase",
      letterSpacing: 1.2, color: "text.secondary", mb: 1, mt: 1,
    }}>
      {label}
    </Typography>
  );
}

// ─── File Info Dialog ─────────────────────────────────────────────────────────
// Resolves the uploader's name/email from their profile, the same way
// JobUpdateForm's FileInfoDialog does — previously this just printed the
// raw uploaded_by id/value instead of a name + email.
function FileInfoDialog({ open, file, onClose }) {
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
    { label: "File Name",   value: file.original_file_name },
    { label: "Stored Name", value: file.stored_file_name },
    { label: "File Path",   value: file.file_path },
    { label: "File Size",   value: formatSize(file.file_size) },
    { label: "File ID",     value: file.file_id },
    { label: "License ID",  value: file.license_id },
    { label: "Uploaded By", value: loadingUploader ? "Loading..." : uploaderDisplay },
    { label: "Uploaded At", value: formatDate(file.uploaded_at) },
    { label: "Status",      value: file.is_deleted ? "Deleted" : "Active" },
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
                  width: 150, fontWeight: 600, color: "text.secondary",
                  fontSize: "0.78rem", verticalAlign: "top",
                  py: 1, pl: 2, borderRight: "1px solid", borderColor: "divider", whiteSpace: "nowrap",
                }}>
                  {label}
                </TableCell>
                <TableCell sx={{ fontSize: "0.82rem", py: 1, px: 2, wordBreak: "break-all" }}>
                  {label === "Status" ? (
                    <Chip label={value} size="small"
                      color={value === "Active" ? "success" : "error"} variant="outlined" />
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

// ─── License Files section — existing files (collapsible list, scrolls once
// expanded) + newly staged files, with per-file download / info / delete ────
function LicenseFilesSection({
  existingFiles, pendingFiles, filesLoading,
  onSelectFiles, onRemovePending, onDeleteExisting, onDownload, onInfo,
  deletingFileId,
}) {
  const hasExisting = existingFiles.length > 0;
  const hasPending  = pendingFiles.length > 0;
  const manyFiles   = existingFiles.length > AUTO_EXPAND_THRESHOLD;
  const [expanded, setExpanded] = useState(!manyFiles);

  return (
    <Box sx={{ py: 1.25, px: 1.5, borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>License Files</Typography>
          {filesLoading && <CircularProgress size={14} />}
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
        <Button
          component="label" size="small"
          variant={hasExisting || hasPending ? "outlined" : "contained"}
          startIcon={<UploadFileIcon fontSize="small" />}
          sx={{ textTransform: "none", whiteSpace: "nowrap" }}
        >
          {hasExisting ? "Add More" : "Choose Files"}
          <input
            type="file"
            hidden
            multiple
            onChange={(e) => {
              const picked = Array.from(e.target.files || []);
              if (picked.length) onSelectFiles(picked);
              e.target.value = "";
            }}
          />
        </Button>
      </Stack>

      {!hasExisting && !hasPending && !filesLoading && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          No files uploaded
        </Typography>
      )}

      {/* already-uploaded files */}
      {hasExisting && (
        <Collapse in={expanded} timeout="auto">
          <Box sx={{ maxHeight: LIST_MAX_HEIGHT, overflowY: "auto", mt: 1, pr: 0.5 }}>
            <Stack spacing={0.5}>
              {existingFiles.map((file) => (
                <Box
                  key={file.file_id}
                  sx={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    bgcolor: "success.50", borderRadius: 1, px: 1, py: 0.5, flexWrap: "wrap", gap: 0.5,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption" color="success.main"
                      sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}
                    >
                      {file.original_file_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[formatSize(file.file_size), formatDate(file.uploaded_at)].filter(Boolean).join(" · ")}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                    <IconButton size="small" onClick={() => onInfo(file)} title="File details" type="button">
                      <InfoOutlinedIcon fontSize="small" color="info" />
                    </IconButton>
                    <PermissionButton permission="download_clientlicenses" onClick={() => onDownload(file)}>
                      <IconButton size="small" title="Download" type="button">
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </PermissionButton>
                    <PermissionButton permission="delete_attachment_clientlicenses" onClick={() => onDeleteExisting(file)}>
                      <IconButton size="small" color="error" disabled={deletingFileId === file.file_id} title="Delete" type="button">
                        {deletingFileId === file.file_id ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                      </IconButton>
                    </PermissionButton>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Collapse>
      )}

      {/* newly staged, not-yet-uploaded files */}
      {hasPending && (
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {pendingFiles.map((f, idx) => (
            <Box
              key={`${f.name}-${idx}`}
              sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                bgcolor: "primary.50", borderRadius: 1, px: 1, py: 0.5,
              }}
            >
              <Typography
                variant="caption" color="primary.main"
                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}
              >
                New: {f.name}{" "}
                <Box component="span" sx={{ color: "text.secondary" }}>({formatSize(f.size)})</Box>
              </Typography>
              <IconButton size="small" onClick={() => onRemovePending(idx)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LicenseUpdateForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.data || {};

  const [loading, setLoading] = useState(false);
  const [licenseTypes, setLicenseTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedTypeName, setSelectedTypeName] = useState("");
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "", contact_person: "", email: "", phone: "", address: "",
  });

  // ── license files state ─────────────────────────────────────────────────
  const [existingFiles, setExistingFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]); // File[] staged, not yet uploaded
  const [filesLoading, setFilesLoading] = useState(true);
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [infoDialog, setInfoDialog] = useState({ open: false, file: null });

  // ── prefill form ────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    license_type_id:       prefill.license_type_id       ?? "",
    job_po_no:             prefill.job_po_no              ?? "",
    client_name:           prefill.client_name            ?? "",
    customer_po:           prefill.customer_po            ?? "",
    contract:              prefill.contract               ?? "",
    product_name:          prefill.product_name           ?? "",
    description:           prefill.description            ?? "",
    serial_number: "",
    product_key:"",
    email_id:              prefill.email_id               ?? "",
    password:              prefill.password               ?? "",
    note_1:                prefill.note_1                 ?? "",
    note_2:                prefill.note_2                 ?? "",
    remarks:               prefill.remarks                ?? "",
    expired_on:            cleanDate(prefill.expired_on),
    supplier_id:           prefill.supplier_id            ?? "",
    order_number:          prefill.order_number           ?? "",
    purchase_order_number: prefill.purchase_order_number  ?? "",
    purchase_date:         cleanDate(prefill.purchase_date),
    purchase_cost:         prefill.purchase_cost          ?? "",
  });

  // ── fetch dropdowns ─────────────────────────────────────────────────────
  useEffect(() => {
    const h = { headers: authHeaders() };
    axios.get(API.GET_CLIENT_LICENSE_TYPES, h).then((r) => {
      const types = safeArray(r);
      setLicenseTypes(types);
      // resolve the name for the prefilled type_id so fields show correctly
      if (prefill.license_type_id) {
        const found = types.find((t) => t.license_type_id === prefill.license_type_id);
        if (found) setSelectedTypeName(found.name);
      }
    });
    axios.get(API.GET_SUPPLIERS, h).then((r) => setSuppliers(safeArray(r)));
  }, []);

  // ── fetch existing license files ────────────────────────────────────────
  const fetchLicenseFiles = useCallback(async () => {
    if (!prefill.id) { setFilesLoading(false); return; }
    setFilesLoading(true);
    try {
      const res = await axios.get(API.GET_LICENSE_FILES(prefill.id), { headers: authHeaders() });
      setExistingFiles((res.data || []).filter((f) => !f.is_deleted));
    } catch (err) {
      console.error("Failed to fetch license files:", err);
      toast.error("Failed to load license files.");
    } finally {
      setFilesLoading(false);
    }
  }, [prefill.id]);

  useEffect(() => { fetchLicenseFiles(); }, [fetchLicenseFiles]);

  // ── field visibility ────────────────────────────────────────────────────
  const visibleFields = selectedTypeName
    ? (LICENSE_FIELDS[selectedTypeName] ?? ALL_FIELDS)
    : null;
  const show = (field) => visibleFields?.[field] ?? false;

  const activeFieldChips = visibleFields
    ? Object.entries(visibleFields).filter(([, v]) => v).map(([k]) => k.replace(/_/g, " "))
    : [];

  // ── handlers ────────────────────────────────────────────────────────────
  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleTypeChange = (e) => {
    const selectedId = e.target.value;
    setForm((prev) => ({ ...prev, license_type_id: selectedId }));
    const found = licenseTypes.find((t) => t.license_type_id === selectedId);
    setSelectedTypeName(found?.name ?? "");
  };

  // ── create supplier ─────────────────────────────────────────────────────
  const handleSaveSupplier = async () => {
    try {
      const res = await axios.post(API.CREATE_SUPPLIER, {
        name: newSupplier.name, contact_person: newSupplier.contact_person,
        email: newSupplier.email, phone: newSupplier.phone, address: newSupplier.address,
      }, { headers: authHeaders() });
      const created = res.data;
      setSuppliers((prev) => [...prev, created]);
      setForm((prev) => ({ ...prev, supplier_id: created.id ?? created.supplier_id ?? "" }));
      setNewSupplier({ name: "", contact_person: "", email: "", phone: "", address: "" });
      setShowSupplierModal(false);
      toast.success("Supplier created successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create Supplier");
    }
  };

  // ── license file handlers ───────────────────────────────────────────────
  const handleSelectFiles = (picked) =>
    setPendingFiles((prev) => [...prev, ...picked]);

  const handleRemovePending = (index) =>
    setPendingFiles((prev) => {
      const arr = [...prev];
      arr.splice(index, 1);
      return arr;
    });

  // NOTE: takes `file` directly (not curried) — see JobUpdateForm for why
  // that distinction matters: a curried `(file) => async () => {}` passed
  // straight to onClick={fn} never actually invokes the inner function.
  const handleDeleteExisting = async (file) => {
    const confirmed = window.confirm(`Delete "${file.original_file_name}"?`);
    if (!confirmed) return;
    setDeletingFileId(file.file_id);
    try {
      await axios.delete(API.DELETE_LICENSE_FILE(file.file_id), { headers: authHeaders() });
      toast.success("File deleted.");
      await fetchLicenseFiles();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete file.");
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleDownload = async (file) => {
    try {
      const res = await axios.get(API.DOWNLOAD_LICENSE_FILE(file.file_id), {
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
  };

  const handleInfo = (file) => setInfoDialog({ open: true, file });

  // ── submit PUT ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prefill.id) { toast.error("License ID missing — cannot update."); return; }
    if (!form.license_type_id) { toast.error("Please select a License Type"); return; }
    try {
      setLoading(true);
      const payload = {
        license_type_id:       Number(form.license_type_id),
        job_po_no:             form.job_po_no             || null,
        client_name:           form.client_name           || null,
        customer_po:           form.customer_po           || null,
        contract:              form.contract              || null,
        product_name:          form.product_name          || null,
        description:           show("description")    ? form.description    || null : null,
        // serial_number:         show("serial_number")  ? form.serial_number  || null : null,
        // product_key:           show("product_key")    ? form.product_key    || null : null,
        email_id:              show("email_id")       ? form.email_id       || null : null,
        password:              show("password")       ? form.password       || null : null,
        note_1:                show("note_1")         ? form.note_1         || null : null,
        note_2:                show("note_2")         ? form.note_2         || null : null,
        remarks:               show("remarks")        ? form.remarks        || null : null,
        expired_on:            show("expired_on")     ? form.expired_on     || null : null,
        supplier_id:           form.supplier_id       ? Number(form.supplier_id)    : null,
        order_number:          form.order_number          || null,
        purchase_order_number: form.purchase_order_number || null,
        purchase_date:         form.purchase_date         || null,
        purchase_cost:         form.purchase_cost         ? Number(form.purchase_cost) : null,
      };
      if (show("product_key") && form.product_key.trim() !== "") {
  payload.product_key = form.product_key;
}
      if (show("serial_number") && form.serial_number.trim() !== "") {
        payload.serial_number = form.serial_number;
      }
      await axios.put(API.UPDATE_CLIENT_LICENSE(prefill.id), payload, { headers: authHeaders() });

      // ── upload any newly staged license files ──
      if (pendingFiles.length > 0) {
        const formData = new FormData();
        pendingFiles.forEach((f) => formData.append("files", f));
        await axios.post(
          API.UPLOAD_LICENSE_FILES(prefill.id),
          formData,
          { headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } }
        );
        setPendingFiles([]);
      }

      toast.success("License updated successfully");
      navigate("/client-licenses");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to update License");
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "background.default" }}>
      <Paper elevation={2} sx={{ maxWidth: 900, mx: "auto", borderRadius: 3, overflow: "hidden" }}>

        {/* Header */}
        <Box sx={{ px: 3, py: 2.5, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
          <Typography variant="h6" fontWeight={700}>Update License</Typography>
          <Typography variant="caption" color="text.secondary">
            Editing: <strong>{prefill.product_name || prefill.client_name || `ID ${prefill.id}`}</strong>
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Stack spacing={3}>

            {/* 1. License Type */}
            <SectionTitle label="License Type" />
            <FormControl size="small" fullWidth required>
              <InputLabel>License Type *</InputLabel>
              <Select name="license_type_id" value={form.license_type_id} label="License Type *" onChange={handleTypeChange}>
                <MenuItem value=""><em>Select License Type</em></MenuItem>
                {licenseTypes.map((t) => (
                  <MenuItem key={t.license_type_id} value={t.license_type_id}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedTypeName && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {activeFieldChips.map((f) => (
                  <Chip key={f} label={f} size="small" variant="outlined" color="primary"
                    sx={{ textTransform: "capitalize", fontSize: "0.7rem" }} />
                ))}
              </Box>
            )}

            {/* 2. Client Info */}
            <Divider />
            <SectionTitle label="Client Information" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Job No / PO No" name="job_po_no" value={form.job_po_no} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Client Name" name="client_name" value={form.client_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Customer PO" name="customer_po" value={form.customer_po} onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Product Name" name="product_name" value={form.product_name} onChange={handleChange} />
              </Grid>
            </Grid>

            {/* 3. Dynamic License Fields */}
            {visibleFields ? (
              <>
                <Divider />
                <SectionTitle label={`License Details — ${selectedTypeName}`} />
                <Grid container spacing={2}>
                  {show("description") && (
                    <Grid item xs={12} sm={6}>
                      <TextField size="small" fullWidth label="Description" name="description" value={form.description} onChange={handleChange} />
                    </Grid>
                  )}
                  {show("serial_number") && (
                    <Grid item xs={12} sm={6}>
                      <TextField size="small" fullWidth label="Serial Number" name="serial_number" value={form.serial_number} onChange={handleChange} />
                    </Grid>
                  )}
                  {show("product_key") && (
                    <Grid item xs={12} sm={6}>
                      <TextField size="small" fullWidth label="Product Key" name="product_key" value={form.product_key} onChange={handleChange} />
                    </Grid>
                  )}
                  {show("expired_on") && (
                    <Grid item xs={12} sm={6}>
                      <TextField size="small" fullWidth type="date" label="Expired On" name="expired_on" value={form.expired_on} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                    </Grid>
                  )}
                  {show("email_id") && (
                    <Grid item xs={12} sm={6}>
                      <TextField size="small" fullWidth label="Email ID" name="email_id" value={form.email_id} onChange={handleChange} />
                    </Grid>
                  )}
                  {show("password") && (
                    <Grid item xs={12} sm={6}>
                      <TextField size="small" fullWidth type="password" label="Password" name="password" value={form.password} onChange={handleChange} />
                    </Grid>
                  )}
                  {show("note_1") && (
                    <Grid item xs={12} sm={6}>
                      <TextField size="small" fullWidth label="Note 1" name="note_1" value={form.note_1} onChange={handleChange} />
                    </Grid>
                  )}
                  {show("note_2") && (
                    <Grid item xs={12} sm={6}>
                      <TextField size="small" fullWidth label="Note 2" name="note_2" value={form.note_2} onChange={handleChange} />
                    </Grid>
                  )}
                  {show("remarks") && (
                    <Grid item xs={12}>
                      <TextField size="small" fullWidth label="Remarks" name="remarks" value={form.remarks} onChange={handleChange} multiline rows={2} />
                    </Grid>
                  )}
                </Grid>
              </>
            ) : (
              <Box sx={{ border: "2px dashed", borderColor: "divider", borderRadius: 2, py: 4, textAlign: "center", color: "text.disabled" }}>
                <Typography variant="body2">Select a License Type above to see the relevant fields</Typography>
              </Box>
            )}

            {/* 4. Purchase Details */}
            <Divider />
            <SectionTitle label="Purchase Details" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <SelectWithNew
                  label="Supplier" name="supplier_id" value={form.supplier_id}
                  options={suppliers} optionId="id" optionLabel="name"
                  onChange={handleChange} onNew={() => setShowSupplierModal(true)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Order Number" name="order_number" value={form.order_number} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Purchase Order Number" name="purchase_order_number" value={form.purchase_order_number} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth type="date" label="Purchase Date" name="purchase_date" value={form.purchase_date} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth type="number" label="Purchase Cost" name="purchase_cost" value={form.purchase_cost} onChange={handleChange}
                  InputProps={{ startAdornment: <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>₹</Typography> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Contract"
                  name="contract"
                  value={form.contract}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            {/* 5. License Files */}
            <Divider />
            <SectionTitle label="License Files" />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Add new files or remove existing ones. Click the file-count chip to expand/collapse
              the list, and ℹ️ on any file for full details.
            </Typography>
            <LicenseFilesSection
              existingFiles={existingFiles}
              pendingFiles={pendingFiles}
              filesLoading={filesLoading}
              onSelectFiles={handleSelectFiles}
              onRemovePending={handleRemovePending}
              onDeleteExisting={handleDeleteExisting}
              onDownload={handleDownload}
              onInfo={handleInfo}
              deletingFileId={deletingFileId}
            />

            {/* Actions */}
            <Divider />
            <Stack direction="row" spacing={1.5} pt={1}>
              <Button type="submit" variant="contained" disabled={loading}
                sx={{ background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)", fontWeight: 600, px: 3 }}>
                {loading ? "Updating..." : "Update License"}
              </Button>
              <Button variant="outlined" onClick={() => navigate("/client-licenses")}>Cancel</Button>
            </Stack>

          </Stack>
        </Box>
      </Paper>

      <ModalWrapper open={showSupplierModal} onClose={() => setShowSupplierModal(false)} title="Create Supplier" onSave={handleSaveSupplier}>
        <TextField size="small" fullWidth label="Supplier Name" value={newSupplier.name} onChange={(e) => setNewSupplier((p) => ({ ...p, name: e.target.value }))} />
        <TextField size="small" fullWidth label="Contact Person" value={newSupplier.contact_person} onChange={(e) => setNewSupplier((p) => ({ ...p, contact_person: e.target.value }))} />
        <TextField size="small" fullWidth label="Email" value={newSupplier.email} onChange={(e) => setNewSupplier((p) => ({ ...p, email: e.target.value }))} />
        <TextField size="small" fullWidth label="Phone" value={newSupplier.phone} onChange={(e) => setNewSupplier((p) => ({ ...p, phone: e.target.value }))} />
        <TextField size="small" fullWidth multiline rows={2} label="Address" value={newSupplier.address} onChange={(e) => setNewSupplier((p) => ({ ...p, address: e.target.value }))} />
      </ModalWrapper>

      <FileInfoDialog
        open={infoDialog.open}
        file={infoDialog.file}
        onClose={() => setInfoDialog({ open: false, file: null })}
      />
    </Box>
  );
}