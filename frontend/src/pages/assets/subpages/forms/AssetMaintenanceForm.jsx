import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { API } from "../../../../config/api";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
  Stack,
} from "@mui/material";

export default function AssetMaintenanceForm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const asset = state?.data || {};

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    maintenance_type: "repair",
    status: "pending",
    start_date: "",
    expected_completion_date: "",
    completion_date: "",
    cost: "",
    warranty: false,
    vendor: "",
    ticket_url: "",
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = sessionStorage.getItem("access_token");

      const payload = {
        title: form.title,
        maintenance_type: form.maintenance_type,
        status: form.status,
        start_date: form.start_date || null,
        expected_completion_date:
          form.expected_completion_date || null,
        completion_date: form.completion_date || null,
        cost: Number(form.cost || 0),
        warranty: form.warranty,
        vendor: form.vendor,
        ticket_url: form.ticket_url,
        notes: form.notes,
      };

      await axios.post(
        API.CREATE_ASSET_MAINTENANCE(asset.id),
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Maintenance created successfully!");
      navigate("/assets");

    } catch (err) {
      console.error(err);

      toast.error(
        err?.response?.data?.detail ||
        "Failed to create maintenance"
      );

    } finally {
      setLoading(false);
    }
  };

  const fieldLabel =
    "block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300";

  const inputClass =
    "w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100";

  return (
    <Box
      sx={{
        height: "100%",
        overflowY: "auto",
        bgcolor: "background.default",
        p: 3,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          maxWidth: 1000,
          mx: "auto",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h5" fontWeight={700}>
            Create Maintenance
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {asset.asset_tag || asset.tag || "Unknown Asset"} •{" "}
            {asset.asset_name || asset.name || "Unnamed Asset"}
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          {/* BASIC INFO */}
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Basic Information
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Laptop screen replacement"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Maintenance Type</InputLabel>

                <Select
                  name="maintenance_type"
                  value={form.maintenance_type}
                  label="Maintenance Type"
                  onChange={handleChange}
                  MenuProps={{
                    disablePortal: true,
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                  }}
                >
                  <MenuItem value="repair">Repair</MenuItem>
                  <MenuItem value="inspection">Inspection</MenuItem>
                  <MenuItem value="upgrade">Upgrade</MenuItem>
                  <MenuItem value="cleaning">Cleaning</MenuItem>
                  <MenuItem value="replacement">Replacement</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>

                <Select
                  name="status"
                  value={form.status}
                  label="Status"
                  onChange={handleChange}
                  MenuProps={{
                    disablePortal: true,
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                  }}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* SCHEDULE */}
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Schedule
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Expected Completion"
                name="expected_completion_date"
                value={form.expected_completion_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Completion Date"
                name="completion_date"
                value={form.completion_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* COST & VENDOR */}
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Cost & Vendor
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Cost"
                name="cost"
                value={form.cost}
                onChange={handleChange}
                placeholder="Enter cost in ₹"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor"
                name="vendor"
                value={form.vendor}
                onChange={handleChange}
                placeholder="Service provider"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ticket URL"
                name="ticket_url"
                value={form.ticket_url}
                onChange={handleChange}
                placeholder="Support ticket or reference link"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* ADDITIONAL DETAILS */}
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Additional Details
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Any additional details..."
          />

          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Checkbox
                name="warranty"
                checked={form.warranty}
                onChange={handleChange}
              />
            }
            label="Under Warranty"
          />

          <Divider sx={{ my: 4 }} />

          {/* BUTTONS */}
          <Stack direction="row" spacing={2}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Maintenance"}
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate("/assets")}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}