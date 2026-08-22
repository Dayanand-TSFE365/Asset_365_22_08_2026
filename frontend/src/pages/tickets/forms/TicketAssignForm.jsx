// ===============================
// File: src/pages/tickets/forms/TicketAssignForm.jsx
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

/**
 * Assign / reassign a ticket. Works both for a ticket that already has
 * an assignee (reassign) and one created without an assignee that's
 * getting assigned later — "Unassigned" is always a valid selection so
 * it can also be un-assigned again.
 */
export default function TicketAssignForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paramId } = useParams();

  const passedTicket = location.state?.data || null;
  const ticketId = passedTicket?.id ?? paramId;

  const [ticket, setTicket]         = useState(passedTicket);
  const [loading, setLoading]       = useState(!passedTicket);
  const [assignedTo, setAssignedTo] = useState(passedTicket?.assigned_to ?? "");
  const [saving, setSaving]         = useState(false);
  const [users, setUsers]           = useState([]);

  useEffect(() => {
    if (API.GET_USERS) {
      axios.get(API.GET_USERS, { headers: authHeaders() })
        .then((res) => setUsers(res.data || []))
        .catch(console.error);
    }
  }, []);

  // if we weren't handed the ticket via route state, fetch it
  useEffect(() => {
    if (passedTicket || !ticketId) return;
    setLoading(true);
    axios.get(API.GET_TICKET(ticketId), { headers: authHeaders() })
      .then((res) => {
        setTicket(res.data);
        setAssignedTo(res.data.assigned_to ?? "");
      })
      .catch((err) => {
        console.error("Failed to load ticket:", err);
        toast.error(err.response?.data?.detail || "Failed to load ticket.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleSave = async () => {
    if (!ticketId) return;
    setSaving(true);
    try {
      // Assumption: PATCH /tickets/{id}/assign with { assigned_to } — mirrors
      // UPDATE_TICKET_STATUS's PATCH + single-field body pattern. Confirm
      // against your Swagger and adjust the payload key if it differs.
      await axios.patch(
        API.ASSIGN_TICKET(ticketId),
        { assigned_to: assignedTo ? Number(assignedTo) : null },
        { headers: authHeaders() }
      );
      toast.success("Ticket assignment updated!");
      navigate(`/tickets/details/${ticketId}`);
    } catch (error) {
      console.error("Assign failed:", error.response?.data || error);
      toast.error(error.response?.data?.detail || "Failed to update assignment.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !ticket) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "background.default" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Assign Ticket</Typography>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, maxWidth: 600 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          {ticket.ticket_no}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {ticket.scope_of_work || "—"}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              select label="Assign To" fullWidth
              value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
              helperText="Leave unassigned to assign later"
            >
              <MenuItem value=""><em>Unassigned</em></MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name || emailToName(u.email) || u.email}
                </MenuItem>
              ))}
            </TextField>
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
    </Box>
  );
}