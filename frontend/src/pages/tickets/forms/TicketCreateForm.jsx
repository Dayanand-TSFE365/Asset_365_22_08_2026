// ===============================
// File: src/pages/tickets/forms/TicketCreateForm.jsx
// ===============================

import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Paper, Box, TextField, Button, Typography, Grid, MenuItem,
} from "@mui/material";
import { API } from "../../../config/api";

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

function emailToName(email) {
  if (!email) return null;
  const local = email.split("@")[0];
  return local.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

const INITIAL_STATE = {
  scope_of_work: "",
  priority_id:   "",
  assigned_to:   "",
  due_date:      "",

  // ── visit-report fields ──
  customer_name: "",
  meeting_date:  "",
  meeting_time:  "",
  venue:         "",
  order_no:      "",
  agenda:        "",
};

export default function TicketCreateForm() {
  const navigate = useNavigate();

  const [form,   setForm]   = useState(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [priorities, setPriorities] = useState([]);
  const [users, setUsers]           = useState([]);

  useEffect(() => {
    axios
      .get(API.GET_TICKET_PRIORITIES, { headers: authHeaders() })
      .then((res) => setPriorities(res.data || []))
      .catch(console.error);

    if (API.GET_USERS) {
      axios
        .get(API.GET_USERS, { headers: authHeaders() })
        .then((res) => setUsers(res.data || []))
        .catch(console.error);
    }
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.scope_of_work?.trim()) newErrors.scope_of_work = "Scope of Work is required";
    if (!form.priority_id)           newErrors.priority_id   = "Priority is required";
    if (!form.assigned_to)           newErrors.assigned_to   = "Assignee is required";
    if (!form.due_date)              newErrors.due_date      = "Due date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const payload = {
        scope_of_work: form.scope_of_work,
        priority_id:   Number(form.priority_id),
        assigned_to:   Number(form.assigned_to),
        due_date:      form.due_date,

        // ── visit-report fields ──
        customer_name: form.customer_name || null,
        meeting_date:  form.meeting_date || null,
        // input type="time" gives "HH:MM" — backend wants seconds too
        meeting_time:  form.meeting_time ? `${form.meeting_time}:00` : null,
        venue:         form.venue || null,
        order_no:      form.order_no || null,
        agenda:        form.agenda || null,
      };

      await axios.post(API.CREATE_TICKET, payload, { headers: authHeaders() });

      toast.success("Ticket created successfully!");
      navigate("/tickets/my");
    } catch (error) {
      console.error("Create failed:", error.response?.data || error);
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
        toast.error(detail || "Failed to create ticket.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "background.default" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Create Ticket</Typography>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, maxWidth: 800 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Ticket Details</Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Scope Of Work" fullWidth required multiline minRows={4}
              value={form.scope_of_work} onChange={handleChange("scope_of_work")}
              error={!!errors.scope_of_work} helperText={errors.scope_of_work}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select label="Priority" fullWidth required
              value={form.priority_id} onChange={handleChange("priority_id")}
              error={!!errors.priority_id} helperText={errors.priority_id}
            >
              {priorities.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.priority_name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select label="Assign To" fullWidth required
              value={form.assigned_to} onChange={handleChange("assigned_to")}
              error={!!errors.assigned_to} helperText={errors.assigned_to}
            >
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name || emailToName(u.email) || u.email}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Due Date" type="date" fullWidth required
              value={form.due_date} onChange={handleChange("due_date")}
              error={!!errors.due_date} helperText={errors.due_date}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}>
          <Button variant="outlined" onClick={() => navigate("/tickets/my")} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, maxWidth: 800, mt: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Visit Report Details</Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Customer Name" fullWidth
              value={form.customer_name} onChange={handleChange("customer_name")}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Meeting Date" type="date" fullWidth
              value={form.meeting_date} onChange={handleChange("meeting_date")}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Meeting Time" type="time" fullWidth
              value={form.meeting_time} onChange={handleChange("meeting_time")}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Venue" fullWidth
              value={form.venue} onChange={handleChange("venue")}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Order No" fullWidth
              value={form.order_no} onChange={handleChange("order_no")}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Agenda" fullWidth multiline minRows={2}
              value={form.agenda} onChange={handleChange("agenda")}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}