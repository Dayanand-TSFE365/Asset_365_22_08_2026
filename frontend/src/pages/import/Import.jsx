// Import.jsx — MUI version (all functionality preserved)
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { UploadCloud, FileWarning, RefreshCcw } from "lucide-react";
import { API } from "../../config/api";

import {
  Box, Typography, Paper, Button, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, IconButton, CircularProgress,
  Tooltip, Divider, Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import {
  CloudUploadOutlined as UploadIcon,
  RefreshOutlined as RefreshIcon,
  DownloadOutlined as DownloadIcon,
  WarningAmberOutlined as WarningIcon,
  CloseOutlined as CloseIcon,
  FileOpenOutlined as FileIcon,
} from "@mui/icons-material";

const MODULES = [
  // "assets",
  "computer-assets",
  // "licenses",
  "client-licenses",
  "jobs",
  "accessories",
  "consumables",
  "components"
];

const MODULE_COLORS = {
  assets:      { color: "#6366f1", bg: "#eef2ff" },
  "computer-assets": { color: "#2563eb", bg: "#eff6ff"},
  licenses:    { color: "#059669", bg: "#ecfdf5" },
  "client-licenses": { color: "#0f766e", bg: "#ecfeff", },
  jobs: { color: "#7c3aed", bg: "#f3e8ff", },
  accessories: { color: "#0891b2", bg: "#ecfeff" },
  consumables: { color: "#d97706", bg: "#fffbeb" },
  components:  { color: "#7c3aed", bg: "#f5f3ff" },
};

export default function Import() {
  const token = sessionStorage.getItem("access_token");

  const [module,         setModule]         = useState("computer-assets");
  const [file,           setFile]           = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [history,        setHistory]        = useState([]);
  const [selectedErrors, setSelectedErrors] = useState([]);
  const [showErrors,     setShowErrors]     = useState(false);
  const [dragging,       setDragging]       = useState(false);

  const importConfig = {
    // assets:      { upload: API.IMPORT_ASSETS,       template: API.IMPORT_ASSETS_TEMPLATE       },
    "computer-assets": {upload: API.IMPORT_COMPUTER_ASSETS, template: API.DOWNLOAD_COMPUTER_ASSET_TEMPLATE, history: API.GET_COMPUTER_ASSET_IMPORT_HISTORY, errors: API.GET_COMPUTER_ASSET_IMPORT_ERRORS,},
    // licenses:    { upload: API.IMPORT_LICENSES,     template: API.IMPORT_LICENSES_TEMPLATE     },
    "client-licenses": { upload: API.IMPORT_CLIENT_LICENSES, template: API.DOWNLOAD_CLIENT_LICENSE_TEMPLATE, history: API.GET_CLIENT_LICENSE_IMPORT_HISTORY, errors: API.GET_CLIENT_LICENSE_IMPORT_ERRORS,},
    jobs: { upload: API.IMPORT_JOBS_NEW, template: API.DOWNLOAD_JOB_NEW_TEMPLATE, history: API.GET_JOB_NEW_IMPORT_HISTORY, errors: API.GET_JOB_NEW_IMPORT_ERRORS },
    accessories: { upload: API.IMPORT_ACCESSORIES,  template: API.IMPORT_ACCESSORIES_TEMPLATE  },
    consumables: { upload: API.IMPORT_CONSUMABLES,  template: API.IMPORT_CONSUMABLES_TEMPLATE  },
    components:  { upload: API.IMPORT_COMPONENTS,   template: API.IMPORT_COMPONENTS_TEMPLATE   },
  };

  const downloadTemplate = async () => {
    try {
      const res = await axios.get(importConfig[module].template, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `${module}_template.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Failed to download template");
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Select a file");
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true);
      await axios.post(importConfig[module].upload, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      toast.success(`${module} imported successfully`);
      setFile(null);
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const url = module === "computer-assets"
        ? API.GET_COMPUTER_ASSET_IMPORT_HISTORY
        : module === "client-licenses"
        ? API.GET_CLIENT_LICENSE_IMPORT_HISTORY
        : module === "jobs"
        ? API.GET_JOB_NEW_IMPORT_HISTORY
        : API.IMPORT_HISTORY;

const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (
        module === "computer-assets" ||
        module === "client-licenses" ||
        module === "jobs"
      ) {
  setHistory(Array.isArray(res.data) ? res.data : []);
} else {
  const filtered = Array.isArray(res.data)
    ? res.data.filter((item) => item.module_name === module)
    : [];

  setHistory(filtered);
}
    } catch {
      setHistory([]);
      toast.error("Failed to load import history");
    }
  };

  const fetchErrors = async (id) => {
    try {
      const url =
      module === "computer-assets"
        ? API.GET_COMPUTER_ASSET_IMPORT_ERRORS(id)
        : module === "client-licenses"
        ? API.GET_CLIENT_LICENSE_IMPORT_ERRORS(id)
        : module === "jobs"
        ? API.GET_JOB_NEW_IMPORT_ERRORS(id)
        : API.IMPORT_ERRORS(id);

      const res = await axios.get(url, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setSelectedErrors(Array.isArray(res.data) ? res.data : []);
            setShowErrors(true);
          } catch {
            toast.error("Failed to fetch errors");
          }
        };

      const formatIST = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString + "Z");
        return date.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hour12: true,
        }) + " IST";
      };

  useEffect(() => {
    fetchHistory();
    setFile(null);
    setSelectedErrors([]);
    setShowErrors(false);
  }, [module]);

  const mc = MODULE_COLORS[module];

  // Drag-and-drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  return (
    <Box sx={{ height: "100%", overflowY: "auto", bgcolor: "#f8fafc", p: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>

        {/* ── MODULE TABS ─────────────────────────────────────────── */}
        <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <Tabs
            value={module}
            onChange={(_, val) => setModule(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTabs-indicator": { bgcolor: mc.color, height: 3 },
              "& .MuiTab-root": { textTransform: "capitalize", fontWeight: 600, fontSize: 13, minHeight: 48 },
              "& .Mui-selected": { color: `${mc.color} !important` },
              px: 1,
            }}
          >
            {MODULES.map((m) => (
              <Tab
                key={m}
                value={m}
                label={m.toUpperCase()}
                sx={{ color: "text.secondary" }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* ── UPLOAD CARD ─────────────────────────────────────────── */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", p: 3 }}>

          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: mc.bg }}>
              <UploadIcon sx={{ color: mc.color, fontSize: 28 }} />
            </Box>
            <Box>
              <Typography fontWeight={700} fontSize={20} color="#0f172a">
                Bulk {module.toUpperCase()} Upload
              </Typography>
              <Typography fontSize={13} color="text.secondary">Upload CSV or Excel file</Typography>
            </Box>
          </Box>

          {/* Drop zone */}
          <Box
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input-hidden").click()}
            sx={{
              border: `2px dashed ${dragging ? mc.color : "#cbd5e1"}`,
              borderRadius: 3,
              p: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              cursor: "pointer",
              bgcolor: dragging ? mc.bg : "#fafafa",
              transition: "all 0.2s",
              "&:hover": { borderColor: mc.color, bgcolor: mc.bg },
            }}
          >
            <UploadCloud size={40} color={dragging ? mc.color : "#94a3b8"} style={{ marginBottom: 12 }} />
            <Typography fontWeight={600} fontSize={15} color="#334155" mb={0.5}>
              Click to choose file or drag & drop
            </Typography>
            <Typography fontSize={13} color="text.secondary">CSV / XLSX supported</Typography>
            <input
              id="file-input-hidden"
              type="file"
              accept=".csv,.xlsx,.xls"
              hidden
              onChange={(e) => setFile(e.target.files[0])}
            />
          </Box>

          {/* Selected file indicator */}
          {file && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: "#f1f5f9", borderRadius: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
              <FileIcon sx={{ color: mc.color, fontSize: 20 }} />
              <Typography fontSize={13} color="#334155" flex={1}>
                <strong>Selected:</strong> {file.name}
              </Typography>
              <IconButton size="small" onClick={() => setFile(null)} sx={{ color: "text.secondary" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          {/* Action buttons */}
          <Box sx={{ display: "flex", gap: 1.5, mt: 2.5, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadTemplate}
              sx={{
                borderColor: mc.color, color: mc.color, fontWeight: 600, textTransform: "none",
                borderRadius: 2, "&:hover": { bgcolor: mc.bg, borderColor: mc.color },
              }}
            >
              Download Template
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <UploadIcon />}
              onClick={handleUpload}
              disabled={loading}
              sx={{
                bgcolor: mc.color, fontWeight: 600, textTransform: "none", borderRadius: 2,
                boxShadow: "none",
                "&:hover": { bgcolor: mc.color, opacity: 0.9, boxShadow: "none" },
                "&.Mui-disabled": { opacity: 0.6, color: "#fff" },
              }}
            >
              {loading ? "Uploading…" : `Import ${module}`}
            </Button>
          </Box>
        </Paper>

        {/* ── IMPORT HISTORY ──────────────────────────────────────── */}
        <Accordion  defaultExpanded={false}  elevation={0}
          sx={{ borderRadius: 3, border: "1px solid #e2e8f0", "&:before": { display: "none",},}}>

          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography fontWeight={700} fontSize={18} color="#0f172a">Import History</Typography>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={fetchHistory} sx={{ color: "text.secondary" }}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </AccordionSummary>

          {history.length === 0 ? (
            <Typography fontSize={13} color="text.secondary">No import history found</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, pb: 1.5, borderBottom: "2px solid #f1f5f9" } }}>
                    <TableCell>File</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Success</TableCell>
                    <TableCell>Failed</TableCell>
                    <TableCell>Uploaded Time</TableCell>
                    <TableCell>Errors</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow
                      key={item.id}
                      sx={{ "&:hover": { bgcolor: "#f8fafc" }, "& td": { fontSize: 13, color: "#334155", py: 1.25, borderBottom: "1px solid #f1f5f9" } }}
                    >
                      <TableCell>
                        <Typography fontSize={13} fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
                          {item.file_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          size="small"
                          sx={{
                            bgcolor: item.status === "completed" ? "#dcfce7" : "#fef9c3",
                            color:   item.status === "completed" ? "#15803d" : "#a16207",
                            fontWeight: 600,
                            fontSize: 11,
                            height: 22,
                          }}
                        />
                      </TableCell>
                      <TableCell>{item.total_rows   || 0}</TableCell>
                      <TableCell>
                        <Typography fontSize={13} color="#15803d" fontWeight={600}>{item.success_rows || 0}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13} color={item.failed_rows > 0 ? "#dc2626" : "inherit"} fontWeight={item.failed_rows > 0 ? 600 : 400}>
                          {item.failed_rows || 0}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{formatIST(item.created_at)}</TableCell>
                      <TableCell>
                        {item.failed_rows > 0 ? (
                          <Button
                            size="small"
                            startIcon={<FileWarning size={14} />}
                            onClick={() => fetchErrors(item.id)}
                            sx={{ color: "#dc2626", fontWeight: 600, textTransform: "none", fontSize: 12, p: 0, minWidth: 0, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}
                          >
                            View
                          </Button>
                        ) : (
                          <Typography fontSize={13} color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Accordion>

        {/* ── ERRORS PANEL ────────────────────────────────────────── */}
        {showErrors && (
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #fecaca", p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <WarningIcon sx={{ color: "#dc2626", fontSize: 22 }} />
                <Typography fontWeight={700} fontSize={18} color="#dc2626">Import Errors</Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setShowErrors(false)}
                startIcon={<CloseIcon fontSize="small" />}
                sx={{ textTransform: "none", borderRadius: 1.5, color: "text.secondary", borderColor: "#e2e8f0", fontSize: 12 }}
              >
                Close
              </Button>
            </Box>

            {selectedErrors.length === 0 ? (
              <Typography fontSize={13} color="text.secondary">No errors found</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { fontWeight: 700, color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, pb: 1.5, borderBottom: "2px solid #fee2e2" } }}>
                      <TableCell>Row</TableCell>
                      <TableCell>Asset Tag</TableCell>
                      <TableCell>Error</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedErrors.map((err) => (
                      <TableRow key={err.id} sx={{ "& td": { fontSize: 13, py: 1.25, borderBottom: "1px solid #fee2e2" } }}>
                        <TableCell>{err.row_number}</TableCell>
                        <TableCell>{err.asset_tag || "—"}</TableCell>
                        <TableCell>
                          <Typography fontSize={13} color="#dc2626" fontWeight={500}>{err.error_message}</Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{formatIST(err.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

      </Box>
    </Box>
  );
}