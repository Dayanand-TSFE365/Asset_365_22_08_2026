import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API } from "../../../config/api"
import { useNavigate, useLocation } from "react-router-dom";

import {
  Alert, Box, Button, Chip, Dialog, DialogContent, DialogTitle,
  Divider, FormControl, Grid, InputLabel, MenuItem,
  Paper, Select, Stack, TextField, Typography, IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

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

// ─── Field visibility per license type ───────────────────────────────────────
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

// ─── License file upload row (generic, same as Create form) ─────────────────
// Staged files are uploaded AFTER the clone is created, since the upload
// endpoint needs a license_id (POST /license-files/upload/{license_id}).
// Note: the ORIGINAL license's files are intentionally NOT auto-copied here —
// a clone is a distinct license record (new key/serial), so its documents
// start empty unless the user attaches new ones.
function LicenseFileUploadRow({ files, onSelectFiles, onRemoveFile }) {
  return (
    <Box sx={{ py: 1.25, px: 1.5, borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <InsertDriveFileIcon fontSize="small" color={files.length ? "success" : "disabled"} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>License Files</Typography>
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

      {files.length === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          No files selected — you can also add these later from Update.
        </Typography>
      )}

      {files.length > 0 && (
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {files.map((f, idx) => (
            <Box
              key={`${f.name}-${idx}`}
              sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                bgcolor: "action.hover", borderRadius: 1, px: 1, py: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}
              >
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

// ─────────────────────────────────────────────────────────────────────────────
export default function LicenseCloneForm() {
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

  // ── license files staged for upload after the clone is created ─────────
  const [licenseFiles, setLicenseFiles] = useState([]);

  const handleSelectLicenseFiles = (picked) =>
    setLicenseFiles((prev) => [...prev, ...picked]);

  const handleRemoveLicenseFile = (index) =>
    setLicenseFiles((prev) => {
      const arr = [...prev];
      arr.splice(index, 1);
      return arr;
    });

  // ── prefill form — product_key & serial_number cleared (must be unique) ──
  const [form, setForm] = useState({
    license_type_id:       prefill.license_type_id       ?? "",
    job_po_no:             prefill.job_po_no              ?? "",
    client_name:           prefill.client_name            ?? "",
    customer_po:           prefill.customer_po            ?? "",
    contract:              prefill.contract               ?? "",
    product_name:          prefill.product_name           ?? "",
    description:           prefill.description            ?? "",
    serial_number:         "",   // cleared — unique per license
    product_key:           "",   // cleared — unique per license
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
      if (prefill.license_type_id) {
        const found = types.find((t) => t.license_type_id === prefill.license_type_id);
        if (found) setSelectedTypeName(found.name);
      }
    });
    axios.get(API.GET_SUPPLIERS, h).then((r) => setSuppliers(safeArray(r)));
  }, []);

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

  // ── submit POST (same create endpoint — new record) ─────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.license_type_id) { toast.error("Please select a License Type"); return; }
    let createdLicenseId = null;
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
        serial_number:         show("serial_number")  ? form.serial_number  || null : null,
        product_key:           show("product_key")    ? form.product_key    || null : null,
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
      const createRes = await axios.post(API.CREATE_CLIENT_LICENSE, payload, { headers: authHeaders() });
      createdLicenseId = createRes.data?.license_id ?? createRes.data?.id;

      // ── upload staged license files, now that we have a license_id ──
      if (createdLicenseId && licenseFiles.length > 0) {
        const formData = new FormData();
        licenseFiles.forEach((f) => formData.append("files", f));

        await axios.post(
          API.UPLOAD_LICENSE_FILES(createdLicenseId),
          formData,
          { headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } }
        );
      }

      toast.success("License cloned successfully");
      navigate("/client-licenses");
    } catch (err) {
      console.error(err);
      if (createdLicenseId) {
        toast.error("License cloned, but some files failed to upload. Open Update to retry.");
        navigate("/client-licenses");
      } else {
        toast.error(err?.response?.data?.detail || "Failed to clone License");
      }
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
          <Stack direction="row" alignItems="center" spacing={1}>
            <ContentCopyIcon fontSize="small" sx={{ color: "primary.main" }} />
            <Typography variant="h6" fontWeight={700}>Clone License</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Cloning from: <strong>{prefill.product_name || prefill.client_name || `ID ${prefill.id}`}</strong>
            {" — "}details are pre-filled. Enter a new Product Key and Serial Number before saving.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Stack spacing={3}>

            {/* Banner */}
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <strong>Product Key</strong> and <strong>Serial Number</strong> have been cleared — they must be unique for the cloned record.
            </Alert>

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
                      <TextField size="small" fullWidth required label="Serial Number *" name="serial_number"
                        value={form.serial_number} onChange={handleChange}
                        helperText="Must be unique — enter a new value" />
                    </Grid>
                  )}
                  {show("product_key") && (
                    <Grid item xs={12} sm={6}>
                      <TextField size="small" fullWidth required label="Product Key *" name="product_key"
                        value={form.product_key} onChange={handleChange}
                        helperText="Must be unique — enter a new value" />
                    </Grid>
                  )}
                  {show("expired_on") && (
                    <Grid item xs={12} sm={6}>
                      <TextField size="small" fullWidth type="date" label="Expired On" name="expired_on"
                        value={form.expired_on} onChange={handleChange} InputLabelProps={{ shrink: true }} />
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
                <TextField size="small" fullWidth label="Contract" name="contract" value={form.contract} onChange={handleChange}
                />
              </Grid>
            </Grid>

            {/* 5. License Files */}
            <Divider />
            <SectionTitle label="License Files" />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Attach any files for this cloned license — the original license's files are not
              copied automatically. Files are uploaded right after the clone is created.
            </Typography>
            <LicenseFileUploadRow
              files={licenseFiles}
              onSelectFiles={handleSelectLicenseFiles}
              onRemoveFile={handleRemoveLicenseFile}
            />

            {/* Actions */}
            <Divider />
            <Stack direction="row" spacing={1.5} pt={1}>
              <Button type="submit" variant="contained" disabled={loading} startIcon={<ContentCopyIcon />}
                sx={{ background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)", fontWeight: 600, px: 3 }}>
                {loading ? "Cloning..." : "Clone License"}
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
    </Box>
  );
}