//AuditLog.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API } from "../../../config/api";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import TableChartIcon from "@mui/icons-material/TableChart";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export default function AuditLog() {
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalRecords, setTotalRecords] = useState(0);

  // ================= EXPORT CSV =================
  const exportToCSV = () => {
    const data = auditLogs.map((log) => ({
      "Audit ID": log.audit_id,
      "Asset ID": log.asset_id,
      "Audited By": getUserName(log.audited_by),
      "Audit Date": formatValue(log.audit_date),
      Status: log.status,
      Remarks: log.remarks || "-",
      "Next Audit": formatValue(log.next_audit_date),
    }));

    const header = Object.keys(data[0] || {}).join(",");
    const rows = data.map((row) =>
      Object.values(row).map((val) => `"${val}"`).join(",")
    );

    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "audit_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully!");
  };

  // ================= EXPORT EXCEL =================
  const exportToExcel = () => {
    const data = auditLogs.map((log) => ({
      "Audit ID": log.audit_id,
      "Asset ID": log.asset_id,
      "Audited By": getUserName(log.audited_by),
      "Audit Date": formatValue(log.audit_date),
      Status: log.status,
      Remarks: log.remarks || "-",
      "Next Audit": formatValue(log.next_audit_date),
    }));

    const headers = Object.keys(data[0] || {});
    let xlsxContent = headers.join("\t") + "\n";
    data.forEach((row) => { xlsxContent += headers.map((h) => row[h]).join("\t") + "\n"; });

    const blob = new Blob([xlsxContent], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "audit_logs.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel exported successfully!");
  };

  // ================= USERS =================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = sessionStorage.getItem("access_token");
        const res = await axios.get(API.GET_USERS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, []);

  const getUserName = (id) =>
    users.find((u) => u.id === id)?.name ||
    users.find((u) => u.id === id)?.email ||
    "Unknown";

  // ================= LOGS =================
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("access_token");
      const response = await axios.get(API.GET_ALL_ASSET_AUDITS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const logs = response.data || [];
      setAuditLogs(logs);
      setTotalRecords(logs.length);
      toast.success("Audit logs fetched");
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAuditLogs(); }, []);

  // ================= PAGINATION =================
  const totalPages = Math.ceil(totalRecords / pageSize);
  const paginatedLogs = auditLogs.slice((page - 1) * pageSize, page * pageSize);

  const formatValue = (value) => {
    if (!value) return "-";
    if (typeof value === "string" && value.includes("T")) {
      return new Date(value).toLocaleString("en-GB");
    }
    return value;
  };

  return (
    <Box sx={{ p: 3, minHeight: "100vh", bgcolor: "background.default" }}>
      {/* HEADER */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          {/* LEFT */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                p: 1.2,
                borderRadius: 2,
                background: "linear-gradient(135deg, #60a5fa, #06b6d4)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <HistoryIcon sx={{ color: "#fff", fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                Audit Logs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track all asset audits and verifications
              </Typography>
            </Box>
          </Stack>

          {/* RIGHT — Export + Refresh */}
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              startIcon={<TableChartIcon />}
              onClick={exportToExcel}
              sx={{
                textTransform: "none",
                background: "linear-gradient(135deg, #22c55e, #10b981)",
                "&:hover": { background: "linear-gradient(135deg, #16a34a, #059669)" },
              }}
            >
              Excel
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={exportToCSV}
              sx={{
                textTransform: "none",
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                "&:hover": { background: "linear-gradient(135deg, #2563eb, #0891b2)" },
              }}
            >
              CSV
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchAuditLogs}
              sx={{
                textTransform: "none",
                background: "linear-gradient(135deg, #64748b, #475569)",
                "&:hover": { background: "linear-gradient(135deg, #475569, #334155)" },
              }}
            >
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
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                Loading data...
              </Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f4f4f5" }}>
                  {["Audit ID", "Asset ID", "Audited By", "Audit Date", "Status", "Remarks", "Next Audit"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log, i) => (
                    <TableRow key={i} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                        {log.audit_id}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                        {log.asset_id}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{getUserName(log.audited_by)}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>
                        {formatValue(log.audit_date)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            bgcolor:
                              log.status === "verified"
                                ? "success.100"
                                : "warning.100",
                            color:
                              log.status === "verified"
                                ? "success.dark"
                                : "warning.dark",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                          {log.remarks || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>
                        {formatValue(log.next_audit_date)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* PAGINATION */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Total:{" "}
            <Typography component="span" fontWeight={700} color="text.primary">
              {totalRecords}
            </Typography>
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title="Previous page">
              <span>
                <IconButton size="small" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
              {page} / {totalPages || 1}
            </Typography>

            <Tooltip title="Next page">
              <span>
                <IconButton size="small" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}