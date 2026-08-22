// ===============================
// File: src/pages/tickets/forms/TicketUpdateForm.jsx
// ===============================

import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Paper, Box, TextField, Button, Typography, Grid, MenuItem, CircularProgress,
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

// backend gives "HH:MM:SS" (sometimes with fractional seconds) — the
// native time input only wants "HH:MM"
function toTimeInputValue(t) {
  if (!t) return "";
  return t.slice(0, 5);
}

function toFormState(ticket) {
  return {
    scope_of_work: ticket.scope_of_work || "",
    priority_id:   ticket.priority_id ?? "",
    assigned_to:   ticket.assigned_to ?? "",
    status_id:     ticket.status_id ?? "",
    due_date:      ticket.due_date || "",
    customer_name: ticket.customer_name || "",
    meeting_date:  ticket.meeting_date || "",
    meeting_time:  toTimeInputValue(ticket.meeting_time),
    venue:         ticket.venue || "",
    order_no:      ticket.order_no || "",
    agenda:        ticket.agenda || "",
  };
}

export default function TicketUpdateForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paramId } = useParams();

  const passedTicket = location.state?.data || null;
  const ticketId = passedTicket?.id ?? paramId;

  const [form, setForm]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses]     = useState([]);
  const [users, setUsers]           = useState([]);

  useEffect(() => {
    axios.get(API.GET_TICKET_PRIORITIES, { headers: authHeaders() })
      .then((res) => setPriorities(res.data || []))
      .catch(console.error);

    axios.get(API.GET_TICKET_STATUSES, { headers: authHeaders() })
      .then((res) => setStatuses(res.data || []))
      .catch(console.error);

    if (API.GET_USERS) {
      axios.get(API.GET_USERS, { headers: authHeaders() })
        .then((res) => setUsers(res.data || []))
        .catch(console.error);
    }
  }, []);

  // Always fetch the full ticket by id — never trust route state alone.
  // TicketList passes the list-endpoint row, which doesn't carry every
  // field (meeting_time, order_no, agenda were coming back blank because
  // of this). TicketDetails happens to pass a full record, but relying on
  // the caller to always do that is exactly what broke here.
  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    axios.get(API.GET_TICKET(ticketId), { headers: authHeaders() })
      .then((res) => setForm(toFormState(res.data)))
      .catch((err) => {
        console.error("Failed to load ticket:", err);
        toast.error(err.response?.data?.detail || "Failed to load ticket.");
      })
      .finally(() => setLoading(false));
  }, [ticketId]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.scope_of_work?.trim()) newErrors.scope_of_work = "Scope of Work is required";
    if (!form.priority_id)           newErrors.priority_id   = "Priority is required";
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
        assigned_to:   form.assigned_to ? Number(form.assigned_to) : null,
        status_id:     form.status_id ? Number(form.status_id) : null,
        due_date:      form.due_date,

        customer_name: form.customer_name || null,
        meeting_date:  form.meeting_date || null,
        meeting_time:  form.meeting_time ? `${form.meeting_time}:00` : null,
        venue:         form.venue || null,
        order_no:      form.order_no || null,
        agenda:        form.agenda || null,
      };

      await axios.put(API.UPDATE_TICKET(ticketId), payload, { headers: authHeaders() });

      toast.success("Ticket updated successfully!");
      navigate(`/tickets/details/${ticketId}`);
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
        toast.error(detail || "Failed to update ticket.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "background.default" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Update Ticket</Typography>

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
              select label="Status" fullWidth
              value={form.status_id} onChange={handleChange("status_id")}
            >
              {statuses.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select label="Assign To" fullWidth required
              value={form.assigned_to} onChange={handleChange("assigned_to")}
            >
              <MenuItem value=""><em>Unassigned</em></MenuItem>
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
          <Button variant="outlined" onClick={() => navigate(-1)} disabled={saving}>
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