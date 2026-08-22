//AccessoryReport.jsx
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

import BarChartIcon from "@mui/icons-material/BarChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import TableChartIcon from "@mui/icons-material/TableChart";

export default function AccessoryReport() {
  const [data, setData] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);

  // ================= EXPORT CSV =================
  const exportToCSV = () => {
    const csvData = data.map((item) => ({
      Company: item.company, "Accessory Name": item.name,
      "Model No.": item.model, Total: item.total, Available: item.available,
    }));
    const headers = Object.keys(csvData[0] || {});
    let csvContent = headers.join(",") + "\n";
    csvData.forEach((row) => { csvContent += headers.map((h) => `"${row[h]}"`).join(",") + "\n"; });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.setAttribute("download", "accessories_report.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("CSV exported successfully!");
  };

  // ================= EXPORT EXCEL =================
  const exportToExcel = () => {
    const xlsxData = data.map((item) => ({
      Company: item.company, "Accessory Name": item.name,
      "Model No.": item.model, Total: item.total, Available: item.available,
    }));
    const headers = Object.keys(xlsxData[0] || {});
    let xlsxContent = headers.join("\t") + "\n";
    xlsxData.forEach((row) => { xlsxContent += headers.map((h) => row[h]).join("\t") + "\n"; });
    const blob = new Blob([xlsxContent], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.setAttribute("download", "accessories_report.xlsx");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("Excel exported successfully!");
  };

  // ================= MASTER DATA =================
  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    const headers = { Authorization: `Bearer ${token}` };

    axios.get(API.GET_COMPANIES, { headers })
      .then((res) => setCompanies(res.data || []))
      .catch(() => toast.error("Failed to load companies"));

    axios.get(API.GET_MODELS, { headers })
      .then((res) => setModels(res.data || []))
      .catch(() => toast.error("Failed to load models"));
  }, []);

  const getName = (list, id) => list.find((item) => item.id === id)?.name || "-";

  // ================= ACCESSORIES =================
  useEffect(() => {
    const fetchAccessories = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("access_token");
        const res = await axios.get(API.GET_ACCESSORIES, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const items = res.data?.items || [];
        setData(items.map((item) => ({
          id: item.accessory_id,
          company: getName(companies, item.company_id),
          name: item.name,
          model: item.model_no,
          total: item.total_qty,
          available: item.available_qty,
        })));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load accessories");
      } finally {
        setLoading(false);
      }
    };
    fetchAccessories();
  }, [companies]);

  const columns = [
    { header: "Company", accessor: "company" },
    { header: "Accessory Name", accessor: "name" },
    { header: "Model No.", accessor: "model" },
    { header: "Total", accessor: "total" },
    { header: "Available", accessor: "available" },
  ];

  const renderCell = (accessor, row) => {
    const value = row[accessor];
    if (accessor === "available") {
      return <Typography variant="body2" fontWeight={700} color="success.main">{value}</Typography>;
    }
    if (accessor === "name") return <Typography variant="body2" fontWeight={500}>{value}</Typography>;
    if (accessor === "model") {
      return <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{value}</Typography>;
    }
    return value;
  };

  return (
    <Box sx={{ p: 3, minHeight: "100vh", bgcolor: "background.default" }}>
      {/* HEADER */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 1.2, borderRadius: 2, background: "linear-gradient(135deg, #a855f7, #6366f1)", display: "flex", alignItems: "center" }}>
              <BarChartIcon sx={{ color: "#fff", fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">Accessory Report</Typography>
              <Typography variant="body2" color="text.secondary">Inventory and availability of all accessories</Typography>
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
              onClick={() => { setLoading(true); setData([]); }}
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
                      No accessory data found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => (
                    <TableRow key={row.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      {columns.map((col) => (
                        <TableCell key={col.accessor} sx={{ color: "text.secondary" }}>
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