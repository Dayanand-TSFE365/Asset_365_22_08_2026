import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API } from "../../../../config/api";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

// ─── helpers ─────────────────────────────────────────────────────────────────
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

// ─── ModalWrapper — defined OUTSIDE parent to prevent remount on every render ─
function ModalWrapper({ open, onClose, title, children, onSave }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>{title}</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {children}
        </Stack>
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="outlined" size="small" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" size="small" onClick={onSave}>
            Save
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

// ─── SelectWithNew — defined OUTSIDE parent to prevent remount on every render ─
function SelectWithNew({ label, name, value, options, onChange, onNew }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-end">
      <FormControl size="small" fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select name={name} value={value} label={label} onChange={onChange}>
          <MenuItem value="">
            <em>Select {label}</em>
          </MenuItem>
          {options.map((o) => (
            <MenuItem key={o.id} value={o.id}>
              {o.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={onNew}
        sx={{ whiteSpace: "nowrap", minWidth: 90 }}
      >
        New
      </Button>
    </Stack>
  );
}

// ─── section heading helper (pure fn, no hooks, safe outside) ─────────────────
function SectionTitle({ label }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: "block",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 1.2,
        color: "text.secondary",
        mb: 2,
        mt: 1,
      }}
    >
      {label}
    </Typography>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ComputerAssetCreateForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // ── dropdown lists ──────────────────────────────────────────────────────
  const [manufacturers, setManufacturers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // ── modal visibility ────────────────────────────────────────────────────
  const [showManufacturerModal, setShowManufacturerModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // ── new-entity forms ────────────────────────────────────────────────────
  const [newManufacturer, setNewManufacturer] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
  });

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
  });

  // ── main form ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    asset_type: "COMPANY",
    assigned_to: "",
    asset_no: "",
    client_name: "",
    job_po_no: "",
    pc_name: "",
    administrator_name: "",
    administrator_password: "",
    email_id: "",
    email_password: "",
    operating_system: "",
    office_version: "",
    rockwell_software: "",
    other_software: "",
    item_description: "",
    year_of_mfg: "",
    warranty_expire: "",
    manufacturer_id: "",
    serial_no: "",
    system_configuration: "",
    supplier_id: "",
    order_number: "",
    purchase_order_number: "",
    purchase_date: "",
    configure_date: "",
    purchase_cost: "",
  });

  // ── fetch dropdowns on mount ────────────────────────────────────────────
  useEffect(() => {
    const h = { headers: authHeaders() };
    axios.get(API.GET_MANUFACTURERS, h).then((r) => setManufacturers(safeArray(r)));
    axios.get(API.GET_SUPPLIERS, h).then((r) => setSuppliers(safeArray(r)));
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── create manufacturer ─────────────────────────────────────────────────
  const handleSaveManufacturer = async () => {
    try {
      const res = await axios.post(
        API.CREATE_MANUFACTURER,
        {
          name: newManufacturer.name,
          contact_email: newManufacturer.contact_email,
          contact_phone: newManufacturer.contact_phone,
        },
        { headers: authHeaders() }
      );
      const created = res.data;
      setManufacturers((prev) => [...prev, created]);
      setForm((prev) => ({
        ...prev,
        manufacturer_id: created.id ?? created.manufacturer_id ?? "",
      }));
      setNewManufacturer({ name: "", contact_email: "", contact_phone: "" });
      setShowManufacturerModal(false);
      toast.success("Manufacturer created successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create Manufacturer");
    }
  };

  // ── create supplier ─────────────────────────────────────────────────────
  const handleSaveSupplier = async () => {
    try {
      const res = await axios.post(
        API.CREATE_SUPPLIER,
        {
          name: newSupplier.name,
          contact_person: newSupplier.contact_person,
          email: newSupplier.email,
          phone: newSupplier.phone,
          address: newSupplier.address,
        },
        { headers: authHeaders() }
      );
      const created = res.data;
      setSuppliers((prev) => [...prev, created]);
      setForm((prev) => ({
        ...prev,
        supplier_id: created.id ?? created.supplier_id ?? "",
      }));
      setNewSupplier({ name: "", contact_person: "", email: "", phone: "", address: "" });
      setShowSupplierModal(false);
      toast.success("Supplier created successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create Supplier");
    }
  };

  // ── submit main form ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        asset_type: form.asset_type,
        assigned_to: form.assigned_to,
        asset_no: form.asset_no,
        client_name: form.asset_type === "CLIENT" ? form.client_name : null,
        job_po_no: form.asset_type === "CLIENT" ? form.job_po_no : null,
        pc_name: form.pc_name,
        administrator_name: form.administrator_name,
        administrator_password: form.administrator_password,
        email_id: form.email_id,
        email_password: form.email_password,
        operating_system: form.operating_system,
        office_version: form.office_version,
        rockwell_software: form.rockwell_software,
        other_software: form.other_software,
        item_description: form.item_description,
        year_of_mfg: form.year_of_mfg ? Number(form.year_of_mfg) : null,
        warranty_expire: form.warranty_expire || null,
        manufacturer_id: form.manufacturer_id ? Number(form.manufacturer_id) : null,
        serial_no: form.serial_no,
        system_configuration: form.system_configuration,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        order_number: form.order_number,
        purchase_order_number: form.purchase_order_number,
        purchase_date: form.purchase_date || null,
        configure_date: form.configure_date || null,
        purchase_cost: form.purchase_cost ? Number(form.purchase_cost) : null,
      };

      await axios.post(API.CREATE_COMPUTER_ASSET, payload, {
        headers: authHeaders(),
      });

      toast.success("Computer Asset created successfully");
      navigate("/assets/computer-assets");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to create Computer Asset");
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "background.default" }}>
      <Paper
        elevation={2}
        sx={{ maxWidth: 900, mx: "auto", borderRadius: 3, overflow: "hidden" }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            Create Computer Asset
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Fill in the details below to register a new computer asset
          </Typography>
        </Box>

        {/* ── Form body ── */}
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Stack spacing={3}>

            {/* ── 1. Basic Info ── */}
            <SectionTitle label="Basic Information" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Asset Type</InputLabel>
                  <Select
                    name="asset_type"
                    value={form.asset_type}
                    label="Asset Type"
                    onChange={handleChange}
                  >
                    <MenuItem value="COMPANY">COMPANY</MenuItem>
                    <MenuItem value="CLIENT">CLIENT</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Assigned To"
                  name="assigned_to"
                  value={form.assigned_to}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Asset Number"
                  name="asset_no"
                  value={form.asset_no}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="PC Name"
                  name="pc_name"
                  value={form.pc_name}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            {/* ── 2. Client Fields (conditional) ── */}
            {form.asset_type === "CLIENT" && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Client Name"
                    name="client_name"
                    value={form.client_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Job / PO Number"
                    name="job_po_no"
                    value={form.job_po_no}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            )}

            {/* ── 3. Admin Credentials ── */}
            <Divider />
            <SectionTitle label="Administrator Credentials" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Administrator Name"
                  name="administrator_name"
                  value={form.administrator_name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  type="password"
                  label="Administrator Password"
                  name="administrator_password"
                  value={form.administrator_password}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
            <Divider />
            <SectionTitle label="Email Credentials" />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Email ID"
                  name="email_id"
                  value={form.email_id}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  type="password"
                  label="Email Password"
                  name="email_password"
                  value={form.email_password}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            {/* ── 4. Software ── */}
            <Divider />
            <SectionTitle label="Software & OS" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Operating System"
                  name="operating_system"
                  value={form.operating_system}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Office Version"
                  name="office_version"
                  value={form.office_version}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Rockwell Software"
                  name="rockwell_software"
                  value={form.rockwell_software}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Other Software"
                  name="other_software"
                  value={form.other_software}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            {/* ── 5. Hardware Details ── */}
            <Divider />
            <SectionTitle label="Hardware Details" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  rows={3}
                  label="Item Description"
                  name="item_description"
                  value={form.item_description}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack spacing={2}>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    label="Year of Manufacture"
                    name="year_of_mfg"
                    value={form.year_of_mfg}
                    onChange={handleChange}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    type="date"
                    label="Warranty Expiry"
                    name="warranty_expire"
                    value={form.warranty_expire}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Serial Number"
                  name="serial_no"
                  value={form.serial_no}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  rows={3}
                  label="System Configuration"
                  name="system_configuration"
                  value={form.system_configuration}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            {/* ── 6. Manufacturer ── */}
            <SelectWithNew
              label="Manufacturer"
              name="manufacturer_id"
              value={form.manufacturer_id}
              options={manufacturers}
              onChange={handleChange}
              onNew={() => setShowManufacturerModal(true)}
            />

            {/* ── 7. Purchase Information ── */}
            <Divider />
            <SectionTitle label="Purchase Information" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <SelectWithNew
                  label="Supplier"
                  name="supplier_id"
                  value={form.supplier_id}
                  options={suppliers}
                  onChange={handleChange}
                  onNew={() => setShowSupplierModal(true)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Order Number"
                  name="order_number"
                  value={form.order_number}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Purchase Order Number"
                  name="purchase_order_number"
                  value={form.purchase_order_number}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  type="date"
                  label="Purchase Date"
                  name="purchase_date"
                  value={form.purchase_date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  type="date"
                  label="Configure Date"
                  name="configure_date"
                  value={form.configure_date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  label="Purchase Cost"
                  name="purchase_cost"
                  value={form.purchase_cost}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                        ₹
                      </Typography>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {/* ── Action Buttons ── */}
            <Divider />
            <Stack direction="row" spacing={1.5} pt={1}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                  fontWeight: 600,
                  px: 3,
                }}
              >
                {loading ? "Creating..." : "Create Computer Asset"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/assets/computer-assets")}
              >
                Cancel
              </Button>
            </Stack>

          </Stack>
        </Box>
      </Paper>

      {/* ══════════════════════════════════════════
          MODAL: NEW MANUFACTURER
      ══════════════════════════════════════════ */}
      <ModalWrapper
        open={showManufacturerModal}
        onClose={() => setShowManufacturerModal(false)}
        title="Create Manufacturer"
        onSave={handleSaveManufacturer}
      >
        <TextField
          size="small"
          fullWidth
          label="Manufacturer Name"
          value={newManufacturer.name}
          onChange={(e) =>
            setNewManufacturer((prev) => ({ ...prev, name: e.target.value }))
          }
        />
        <TextField
          size="small"
          fullWidth
          label="Contact Email"
          value={newManufacturer.contact_email}
          onChange={(e) =>
            setNewManufacturer((prev) => ({ ...prev, contact_email: e.target.value }))
          }
        />
        <TextField
          size="small"
          fullWidth
          label="Contact Phone"
          value={newManufacturer.contact_phone}
          onChange={(e) =>
            setNewManufacturer((prev) => ({ ...prev, contact_phone: e.target.value }))
          }
        />
      </ModalWrapper>

      {/* ══════════════════════════════════════════
          MODAL: NEW SUPPLIER
      ══════════════════════════════════════════ */}
      <ModalWrapper
        open={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title="Create Supplier"
        onSave={handleSaveSupplier}
      >
        <TextField
          size="small"
          fullWidth
          label="Supplier Name"
          value={newSupplier.name}
          onChange={(e) =>
            setNewSupplier((prev) => ({ ...prev, name: e.target.value }))
          }
        />
        <TextField
          size="small"
          fullWidth
          label="Contact Person"
          value={newSupplier.contact_person}
          onChange={(e) =>
            setNewSupplier((prev) => ({ ...prev, contact_person: e.target.value }))
          }
        />
        <TextField
          size="small"
          fullWidth
          label="Email"
          value={newSupplier.email}
          onChange={(e) =>
            setNewSupplier((prev) => ({ ...prev, email: e.target.value }))
          }
        />
        <TextField
          size="small"
          fullWidth
          label="Phone"
          value={newSupplier.phone}
          onChange={(e) =>
            setNewSupplier((prev) => ({ ...prev, phone: e.target.value }))
          }
        />
        <TextField
          size="small"
          fullWidth
          multiline
          rows={2}
          label="Address"
          value={newSupplier.address}
          onChange={(e) =>
            setNewSupplier((prev) => ({ ...prev, address: e.target.value }))
          }
        />
      </ModalWrapper>
    </Box>
  );
}