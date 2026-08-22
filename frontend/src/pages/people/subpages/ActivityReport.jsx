
import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../../../config/api";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";

import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material";

import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";

export default function ActivityReport() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;

  console.log("USER ROLE =", user?.role);

  if (user?.role?.toLowerCase() !== "superadmin") {
    return <Navigate to="/people" replace />;
  }

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const [days, setDays] = useState("all"); // Changed to "all" by default
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [goToPage, setGoToPage] = useState("");

  useEffect(() => {
    fetchActivity();
  }, [page, rowsPerPage, days]);

  const fetchActivity = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      // Calculate actual days value - "all" sends null/undefined or a very large number
      const daysParam = days === "all" ? undefined : days;

      const [res, userRes] = await Promise.all([
        axios.get(API.GET_ACTIVITY_REPORT, {
          headers,
          params: {
            page: page + 1,
            page_size: rowsPerPage,
            days: daysParam, // undefined means no filter (all)
          },
        }),
        axios.get(API.GET_USERS, { headers }),
      ]);

      setUsers(userRes.data || []);
      setActivities(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error("ACTIVITY API ERROR =>", err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (id) => {
    const foundUser = users.find((u) => u.user_id === id || u.id === id);
    return (
      foundUser?.full_name ||
      foundUser?.name ||
      foundUser?.email ||
      `User ${id}`
    );
  };

  const paginatedActivities = activities;

  // Calculate total pages
  const totalPages = Math.ceil(total / rowsPerPage);

  // Handle Go to Page
  const handleGoToPage = () => {
    const pageNum = parseInt(goToPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setPage(pageNum - 1);
      setGoToPage("");
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: "100vh", bgcolor: "background.default" }}>
      {/* HEADER */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          Activity Report
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          System activity logs and actions
        </Typography>
        <FormControl size="small" sx={{ mt: 2, width: 150 }}>
          <InputLabel>Duration</InputLabel>
          <Select
            value={days}
            label="Duration"
            onChange={(e) => {
              setDays(e.target.value);
              setPage(0); // Reset to first page when duration changes
            }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value={5}>Last 5 Days</MenuItem>
            <MenuItem value={7}>Last 7 Days</MenuItem>
            <MenuItem value={15}>Last 15 Days</MenuItem>
            <MenuItem value={30}>Last 30 Days</MenuItem>
            <MenuItem value={90}>Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* STATES */}
      {loading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading activity...</Typography>
        </Box>
      ) : activities.length === 0 ? (
        <Paper
          elevation={2}
          sx={{ borderRadius: 2, p: 5, textAlign: "center" }}
        >
          <Typography color="text.secondary">No activity records found</Typography>
        </Paper>
      ) : (
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
          <TableContainer
            sx={{
              maxHeight: "65vh",
              overflowY: "auto",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f4f4f5" }}>
                  {["Module", "Action", "Item", "Notes", "User", "Created At"].map((h) => (
                    <TableCell
                      key={h}
                      sx={{ fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedActivities.map((item, index) => (
                  <TableRow
                    key={index}
                    hover
                    sx={{ "&:last-child td": { borderBottom: 0 } }}
                  >
                    <TableCell>{item.item_type}</TableCell>

                    <TableCell>
                      <Chip
                        label={item.action || "-"}
                        size="small"
                        sx={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          bgcolor: "action.selected",
                          color: "text.primary",
                        }}
                      />
                    </TableCell>

                    <TableCell>{item.item_name}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{item.notes || "-"}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{getUserName(item.created_by)}</TableCell>

                    <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                      {new Date(item.created_at + "Z").toLocaleString("en-GB", {
                        timeZone: "Asia/Kolkata",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* CUSTOM PAGINATION WITH FIRST/LAST/GOTO */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            {/* Left: Total count */}
            <Typography variant="body2" color="text.secondary">
              {total} records
            </Typography>

            {/* Center: Navigation buttons */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* First Page */}
              <Button
                size="small"
                variant="outlined"
                disabled={page === 0}
                onClick={() => setPage(0)}
                sx={{ minWidth: 36 }}
              >
                <FirstPageIcon fontSize="small" />
              </Button>

              {/* Previous Page */}
              <Button
                size="small"
                variant="outlined"
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                sx={{ minWidth: 36 }}
              >
                ‹
              </Button>

              {/* Page info */}
              <Typography variant="body2" sx={{ minWidth: 100, textAlign: "center" }}>
                Page {page + 1} of {totalPages || 1}
              </Typography>

              {/* Next Page */}
              <Button
                size="small"
                variant="outlined"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                sx={{ minWidth: 36 }}
              >
                ›
              </Button>

              {/* Last Page */}
              <Button
                size="small"
                variant="outlined"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(totalPages - 1)}
                sx={{ minWidth: 36 }}
              >
                <LastPageIcon fontSize="small" />
              </Button>
            </Box>

            {/* Right: Rows per page + Go to page */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* Rows per page */}
              <FormControl size="small">
                <InputLabel>Rows</InputLabel>
                <Select
                  value={rowsPerPage}
                  label="Rows"
                  onChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  sx={{ width: 80 }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>

              {/* Go to page */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  size="small"
                  type="number"
                  value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleGoToPage();
                    }
                  }}
                  placeholder="Page #"
                  sx={{ width: 80 }}
                  InputProps={{
                    inputProps: {
                      min: 1,
                      max: totalPages,
                    },
                  }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleGoToPage}
                  disabled={!goToPage || totalPages === 0}
                >
                  Go
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
