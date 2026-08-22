//LicenseReport.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API } from "../../../config/api";

import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import TableChartIcon from "@mui/icons-material/TableChart";

export default function LicenseReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReport(); }, []);

  const fetchReport = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      const res = await axios.get(API.GET_LICENSE_DEPRECIATION_REPORT, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = (res.data || []).map((item) => ({
        id: item.license_id,
        name: item.software_name || "-",
        key: item.product_key || "-",
        total_seats: item.total_seats ?? 0,
        available_seats: item.available_seats ?? 0,
        used_seats: item.used_seats ?? 0,
        purchase_cost: item.purchase_cost ?? 0,
        purchase_date: item.purchase_date || "-",
        depreciation_months: item.depreciation_months ?? 0,
        months_used: item.months_used ?? 0,
        monthly_depreciation: item.monthly_depreciation ?? 0,
        depreciation_used: item.depreciation_used ?? 0,
        current_value: item.current_value ?? 0,
        expiration_date: item.expiration_date || "-",
        termination_date: item.termination_date || "-",
      }));

      setData(formatted);
    } catch (error) {
      console.error("Failed to fetch license depreciation report:", error);
    } finally {
      setLoading(false);
    }
  };

  // ================= EXPORT CSV =================
  const exportToCSV = () => {
    const csvData = data.map((item) => ({
      "Software Name": item.name,
      "Product Key": item.key,
      "Total Seats": item.total_seats,
      "Available Seats": item.available_seats,
      "Used Seats": item.used_seats,
      "Purchase Cost": item.purchase_cost,
      "Purchase Date": item.purchase_date,
      "Depreciation Months": item.depreciation_months,
      "Months Used": item.months_used,
      "Monthly Depreciation": item.monthly_depreciation,
      "Depreciation Used": item.depreciation_used,
      "Current Value": item.current_value,
      "Expiration Date": item.expiration_date,
      "Termination Date": item.termination_date,
    }));

    const headers = Object.keys(csvData[0] || {});
    let csvContent = headers.join(",") + "\n";
    csvData.forEach((row) => { csvContent += headers.map((h) => `"${row[h]}"`).join(",") + "\n"; });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "license_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully!");
  };

  // ================= EXPORT EXCEL =================
  const exportToExcel = () => {
    const xlsxData = data.map((item) => ({
      "Software Name": item.name,
      "Product Key": item.key,
      "Total Seats": item.total_seats,
      "Available Seats": item.available_seats,
      "Used Seats": item.used_seats,
      "Purchase Cost": item.purchase_cost,
      "Purchase Date": item.purchase_date,
      "Depreciation Months": item.depreciation_months,
      "Months Used": item.months_used,
      "Monthly Depreciation": item.monthly_depreciation,
      "Depreciation Used": item.depreciation_used,
      "Current Value": item.current_value,
      "Expiration Date": item.expiration_date,
      "Termination Date": item.termination_date,
    }));

    const headers = Object.keys(xlsxData[0] || {});
    let xlsxContent = headers.join("\t") + "\n";
    xlsxData.forEach((row) => { xlsxContent += headers.map((h) => row[h]).join("\t") + "\n"; });

    const blob = new Blob([xlsxContent], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "license_report.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel exported successfully!");
  };

  const columns = [
    { header: "Software Name", accessor: "name" },
    { header: "Product Key", accessor: "key" },
    { header: "Total Seats", accessor: "total_seats" },
    { header: "Available", accessor: "available_seats" },
    { header: "Used", accessor: "used_seats" },
    { header: "Purchase Cost", accessor: "purchase_cost" },
    { header: "Purchase Date", accessor: "purchase_date" },
    { header: "Depreciation Months", accessor: "depreciation_months" },
    { header: "Months Used", accessor: "months_used" },
    { header: "Monthly Depreciation", accessor: "monthly_depreciation" },
    { header: "Depreciation Used", accessor: "depreciation_used" },
    { header: "Current Value", accessor: "current_value" },
    { header: "Expiration Date", accessor: "expiration_date" },
    { header: "Termination Date", accessor: "termination_date" },
  ];

  const currencySet = new Set([
    "purchase_cost", "monthly_depreciation", "depreciation_used",
  ]);

  const renderCell = (accessor, row) => {
    const value = row[accessor];
    if (accessor === "current_value") {
      return (
        <Typography variant="body2" fontWeight={700} color="success.main">
          ₹ {value.toLocaleString()}
        </Typography>
      );
    }
    if (currencySet.has(accessor)) return `₹ ${typeof value === "number" ? value.toLocaleString() : value}`;
    if (accessor === "key") {
      return (
        <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
          {value}
        </Typography>
      );
    }
    if (accessor === "name") return <Typography variant="body2" fontWeight={500}>{value}</Typography>;
    return value;
  };

  return (
    <Box sx={{ p: 3, minHeight: "100vh", bgcolor: "background.default" }}>
      {/* HEADER */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                p: 1.2, borderRadius: 2,
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                display: "flex", alignItems: "center",
              }}
            >
              <VerifiedUserIcon sx={{ color: "#fff", fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                License Depreciation Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Seat usage and depreciation details for all software licenses
              </Typography>
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
            <Button variant="contained" size="small" startIcon={<RefreshIcon />} onClick={() => { setLoading(true); fetchReport(); }}
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
                  {columns.map((col) => (
                    <TableCell key={col.accessor} sx={{ fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>
                      {col.header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No license data found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => (
                    <TableRow key={row.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      {columns.map((col) => (
                        <TableCell key={col.accessor} sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>
                          {renderCell(col.accessor, row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Paper>
    </Box>
  );
}