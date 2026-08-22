import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Box, Typography, TextField, MenuItem, Button, Stack, CircularProgress } from "@mui/material";
import { API } from "../../../config/api";

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

export default function TicketStatusForm() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const ticket = state?.data;  

  const [statuses, setStatuses] = useState([]);
  const [statusId, setStatusId] = useState(ticket?.status_id || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(API.GET_TICKET_STATUSES, { headers: authHeaders() })
      .then((res) => setStatuses(res.data || []))
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!ticket?.id || !statusId) return;
    setSaving(true);
    try {
      await axios.patch(
        API.UPDATE_TICKET_STATUS(ticket.id),
        { status_id: statusId },
        { headers: authHeaders() }
      );
      toast.success("Ticket status updated.");
      navigate(`/tickets/details/${ticket.id}`);
    } catch (error) {
      console.error("Failed to update ticket status:", error);
      toast.error(error.response?.data?.detail || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  if (!ticket) {
    return <Typography color="text.secondary">No ticket selected.</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 400 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>Update Ticket Status</Typography>
      <Stack spacing={2}>
        <TextField
          select label="Status" value={statusId}
          onChange={(e) => setStatusId(e.target.value)}
        >
          {statuses.map((s) => (
            <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>
          ))}
        </TextField>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : "Save"}
          </Button>
          <Button onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
        </Stack>
      </Stack>
    </Box>
  );
}