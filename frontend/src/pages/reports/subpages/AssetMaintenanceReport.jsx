//AssetMaintenanceReport.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API } from "../../../config/api";

import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import BuildIcon from "@mui/icons-material/Build";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import TableChartIcon from "@mui/icons-material/TableChart";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

const STATUS_COLORS = {
  completed: { bgcolor: "success.100", color: "success.dark" },
  pending:   { bgcolor: "warning.100", color: "warning.dark" },
  cancelled: { bgcolor: "error.100",   color: "error.dark"   },
  in_progress: { bgcolor: "info.100", color: "info.dark"     },
};

export default function AssetMaintenanceReport() {
  const [loading, setLoading] = useState(false);
  const [maintenance, setMaintenance] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => { fetchMaintenance(); }, []);

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("access_token");
      const res = await axios.get(API.GET_ASSET_MAINTENANCE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMaintenance(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch maintenance records");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => { setEditData({ ...item }); setShowEditModal(true); };

  const handleUpdate = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      await axios.put(
        API.UPDATE_ASSET_MAINTENANCE(editData.maintenance_id),
        {
          title: editData.title,
          maintenance_type: editData.maintenance_type,
          status: editData.status,
          start_date: editData.start_date,
          expected_completion_date: editData.expected_completion_date,
          completion_date: editData.completion_date,
          cost: Number(editData.cost || 0),
          warranty: editData.warranty,
          vendor: editData.vendor,
          ticket_url: editData.ticket_url,
          notes: editData.notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Maintenance updated successfully!");
      setShowEditModal(false);
      fetchMaintenance();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update maintenance");
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = sessionStorage.getItem("access_token");
      await axios.delete(API.DELETE_ASSET_MAINTENANCE(id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Maintenance deleted successfully!");
      fetchMaintenance();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete maintenance");
    }
  };

  // ================= EXPORT CSV =================
  const exportToCSV = () => {
    const csvData = maintenance.map((item) => ({
      "Maintenance ID": item.maintenance_id, "Asset ID": item.asset_id,
      Title: item.title, Type: item.maintenance_type, Status: item.status,
      "Start Date": item.start_date, "Completion Date": item.completion_date,
      Cost: item.cost, Vendor: item.vendor || "-",
      Warranty: item.warranty ? "Yes" : "No", Notes: item.notes || "-",
    }));
    const headers = Object.keys(csvData[0] || {});
    let csvContent = headers.join(",") + "\n";
    csvData.forEach((row) => { csvContent += headers.map((h) => `"${row[h]}"`).join(",") + "\n"; });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.setAttribute("download", "maintenance_report.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("CSV exported successfully!");
  };

  // ================= EXPORT EXCEL =================
  const exportToExcel = () => {
    const xlsxData = maintenance.map((item) => ({
      "Maintenance ID": item.maintenance_id, "Asset ID": item.asset_id,
      Title: item.title, Type: item.maintenance_type, Status: item.status,
      "Start Date": item.start_date, "Completion Date": item.completion_date,
      Cost: item.cost, Vendor: item.vendor || "-",
      Warranty: item.warranty ? "Yes" : "No", Notes: item.notes || "-",
    }));
    const headers = Object.keys(xlsxData[0] || {});
    let xlsxContent = headers.join("\t") + "\n";
    xlsxData.forEach((row) => { xlsxContent += headers.map((h) => row[h]).join("\t") + "\n"; });
    const blob = new Blob([xlsxContent], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.setAttribute("download", "maintenance_report.xlsx");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("Excel exported successfully!");
  };

  const headers = ["ID", "Asset ID", "Title", "Type", "Status", "Start Date", "Completion", "Cost", "Vendor", "Warranty", "Actions"];

  return (
    <Box sx={{ p: 3, minHeight: "100vh", bgcolor: "background.default" }}>
      {/* HEADER */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 1.2, borderRadius: 2, background: "linear-gradient(135deg, #fb923c, #ef4444)", display: "flex", alignItems: "center" }}>
              <BuildIcon sx={{ color: "#fff", fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">Asset Maintenance Report</Typography>
              <Typography variant="body2" color="text.secondary">View all maintenance activities</Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button variant="contained" size="small" startIcon={<TableChartIcon />} onClick={exportToExcel}
              sx={{ textTransform: "none", background: "linear-gradient(135deg, #22c55e, #10b981)", "&:hover": { background: "linear-gradient(135deg, #16a34a, #059669)" } }}>
              Excel
            </Button>
            <Button variant="contained" size="small" startIcon={<DownloadIcon />} onClick={exportToCSV}
              sx={{ textTransform: "none", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", "&:hover": { background: "linear-gradient(135deg, #2563eb, #0891b2)" } }}>
              CSV
            </Button>
            <Button variant="contained" size="small" startIcon={<RefreshIcon />}
              onClick={() => { setLoading(true); fetchMaintenance(); }}
              sx={{ textTransform: "none", background: "linear-gradient(135deg, #64748b, #475569)", "&:hover": { background: "linear-gradient(135deg, #475569, #334155)" } }}>
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* TABLE */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          {loading ? (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Loading data...</Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f4f4f5" }}>
                  {headers.map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {maintenance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No maintenance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  maintenance.map((item) => {
                    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.in_progress;
                    return (
                      <TableRow key={item.maintenance_id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell sx={{ color: "text.secondary" }}>{item.maintenance_id}</TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>{item.asset_id}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{item.title}</TableCell>
                        <TableCell sx={{ textTransform: "capitalize", color: "text.secondary" }}>{item.maintenance_type}</TableCell>
                        <TableCell>
                          <Chip label={item.status} size="small"
                            sx={{ fontWeight: 600, fontSize: "0.7rem", bgcolor: statusColor.bgcolor, color: statusColor.color }} />
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{item.start_date || "-"}</TableCell>
                        <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{item.completion_date || "-"}</TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>₹ {item.cost}</TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>{item.vendor || "-"}</TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>{item.warranty ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEdit(item)}
                                sx={{ bgcolor: "primary.50", color: "primary.main", "&:hover": { bgcolor: "primary.100" } }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleDelete(item.maintenance_id)}
                                sx={{ bgcolor: "error.50", color: "error.main", "&:hover": { bgcolor: "error.100" } }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Paper>

      {/* EDIT MODAL */}
      <Dialog
        open={showEditModal && !!editData}
        onClose={() => setShowEditModal(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6" fontWeight={700}>Update Maintenance</Typography>
          <IconButton size="small" onClick={() => setShowEditModal(false)}
            sx={{ bgcolor: "error.main", color: "#fff", "&:hover": { bgcolor: "error.dark" } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {editData && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  size="small" 
                  label="Title" 
                  value={editData.title || ""}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  sx={{ mt: 1.5 }}  // ← Add this to push the TextField down
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Maintenance Type</InputLabel>
                  <Select value={editData.maintenance_type || ""} label="Maintenance Type"
                    onChange={(e) => setEditData({ ...editData, maintenance_type: e.target.value })}>
                    {["repair", "inspection", "upgrade", "cleaning", "replacement"].map((v) => (
                      <MenuItem key={v} value={v} sx={{ textTransform: "capitalize" }}>{v}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={editData.status || ""} label="Status"
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                    {[
                      { value: "pending", label: "Pending" },
                      { value: "in_progress", label: "In Progress" },
                      { value: "completed", label: "Completed" },
                      { value: "cancelled", label: "Cancelled" },
                    ].map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField fullWidth size="small" type="date" label="Start Date"
                  value={editData.start_date || ""} InputLabelProps={{ shrink: true }}
                  onChange={(e) => setEditData({ ...editData, start_date: e.target.value })} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField fullWidth size="small" type="date" label="Completion Date"
                  value={editData.completion_date || ""} InputLabelProps={{ shrink: true }}
                  onChange={(e) => setEditData({ ...editData, completion_date: e.target.value })} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField fullWidth size="small" type="number" label="Cost"
                  value={editData.cost || ""} onChange={(e) => setEditData({ ...editData, cost: e.target.value })} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField fullWidth size="small" label="Vendor"
                  value={editData.vendor || ""} onChange={(e) => setEditData({ ...editData, vendor: e.target.value })} />
              </Grid>

              <Grid item xs={12}>
                <TextField fullWidth size="small" multiline rows={3} label="Notes"
                  value={editData.notes || ""} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox checked={editData.warranty || false}
                      onChange={(e) => setEditData({ ...editData, warranty: e.target.checked })} />
                  }
                  label="Under Warranty"
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
                  <Button variant="outlined" color="inherit" onClick={() => setShowEditModal(false)}
                    sx={{ textTransform: "none" }}>
                    Cancel
                  </Button>
                  <Button variant="contained" onClick={handleUpdate} sx={{ textTransform: "none" }}>
                    Update
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}