// ===============================
// File: src/pages/feedback/Feedback.jsx
// ===============================

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Rating,
  CircularProgress,
} from "@mui/material";
import { API } from "../../config/api";

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

const INITIAL_FEEDBACK = {
  rating: "5",
  category: "Bug",
  subject: "",
  message: "",
};

const CATEGORY_OPTIONS = [
  "Bug",
  "Suggestion",
  "Feature",
  "Complaint",
  "Other",
];

const STATUS_COLORS = {
  pending:  { bg: "#fef3c7", fg: "#92400e" },
  reviewed: { bg: "#dbeafe", fg: "#1e40af" },
  resolved: { bg: "#dcfce7", fg: "#166534" },
};

function StatusChip({ status }) {
  const key = (status || "pending").toLowerCase();
  const c = STATUS_COLORS[key] || STATUS_COLORS.pending;
  return (
    <Chip size="small" label={status || "Pending"} sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 700 }} />
  );
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export default function Feedback() {
  const [form, setForm] = useState(INITIAL_FEEDBACK);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.subject.trim()) nextErrors.subject = "Subject is required";
    if (!form.message.trim()) nextErrors.message = "Message is required";
    if (!form.rating) nextErrors.rating = "Rating is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const fetchMyFeedback = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(API.GET_MY_FEEDBACKS, { headers: authHeaders() });
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to load your feedback.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchMyFeedback();
  }, []);

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const payload = {
        rating: Number(form.rating),
        category: form.category,
        subject: form.subject,
        message: form.message,
      };

      await axios.post(API.CREATE_FEEDBACK, payload, { headers: authHeaders() });
      toast.success("Feedback submitted successfully.");
      setForm(INITIAL_FEEDBACK);
      fetchMyFeedback();
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(detail || "Failed to submit feedback.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3, bgcolor: "background.default" }}>
      <Box sx={{ maxWidth: 900, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Feedback
        </Typography>

        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Share your feedback
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Rating"
                fullWidth
                value={form.rating}
                onChange={handleChange("rating")}
                error={!!errors.rating}
                helperText={errors.rating}
              >
                {["1", "2", "3", "4", "5"].map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField
                select
                label="Category"
                fullWidth
                value={form.category}
                onChange={handleChange("category")}
              >
                {CATEGORY_OPTIONS.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Subject"
                fullWidth
                value={form.subject}
                onChange={handleChange("subject")}
                error={!!errors.subject}
                helperText={errors.subject}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Message"
                fullWidth
                multiline
                minRows={5}
                value={form.message}
                onChange={handleChange("message")}
                error={!!errors.message}
                helperText={errors.message}
              />
            </Grid>

          </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Submitting..." : "Submit Feedback"}
            </Button>
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            My Submitted Feedback
          </Typography>

          {loadingHistory ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : history.length === 0 ? (
            <Typography color="text.secondary">No feedback has been submitted yet.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Admin Response</TableCell>
                    <TableCell>Submitted At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.subject}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <Rating value={item.rating || 0} readOnly size="small" />
                      </TableCell>
                      <TableCell>
                        <StatusChip status={item.status} />
                      </TableCell>
                      <TableCell>{item.admin_response || "—"}</TableCell>
                      <TableCell>{formatDateTime(item.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );
}