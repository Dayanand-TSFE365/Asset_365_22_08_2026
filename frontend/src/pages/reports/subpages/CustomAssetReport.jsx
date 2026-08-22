//CustomAssetReport.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { API } from "../../../config/api";

import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Chip,
  Stack,
} from "@mui/material";

import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import TableChartIcon from "@mui/icons-material/TableChart";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import DeselectIcon from "@mui/icons-material/Deselect";

export default function CustomAssetReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [masters, setMasters] = useState({
    companies: [],
    models: [],
    statuses: [],
    suppliers: [],
    locations: [],
  });

  const [showModal, setShowModal] = useState(false);

  // =====================================
  // AVAILABLE COLUMNS
  // =====================================

  const availableColumns = useMemo(
    () => [
      "asset_tag",
      "asset_name",
      "serial_number",
      "company_name",
      "model_name",
      "status_name",
      "location_name",
      "supplier_name",
      "purchase_cost",
      "current_value",
      "purchase_date",
      "warranty_expires",
      "next_audit_date",
      "order_number",
      "condition",
      "requestable",
      "byod",
      "created_at",
    ],
    []
  );

  // =====================================
  // FORM STATE
  // =====================================

  const [filters, setFilters] = useState({
    columns: [
      "asset_tag",
      "asset_name",
      "serial_number",
      "status_name",
      "location_name",
    ],
    company_id: "",
    model_id: "",
    status_id: "",
    location_id: "",
    supplier_id: "",
    asset_tag: "",
    asset_name: "",
    serial_number: "",
    order_number: "",
    condition: "",
    purchase_date_from: "",
    purchase_date_to: "",
    warranty_expires_from: "",
    warranty_expires_to: "",
    next_audit_date_from: "",
    next_audit_date_to: "",
    created_at_from: "",
    created_at_to: "",
    assigned: "",
    deleted: "",
    requestable: "",
    byod: "",
  });

  // =====================================
  // FETCH MASTER DATA
  // =====================================

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    if (page > 0) {
      generateReport();
    }
  }, [page, pageSize]);

  const fetchMasters = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [companies, models, statuses, suppliers, locations] =
        await Promise.all([
          axios.get(API.GET_COMPANIES, { headers }),
          axios.get(API.GET_MODELS, { headers }),
          axios.get(API.GET_STATUS, { headers }),
          axios.get(API.GET_SUPPLIERS, { headers }),
          axios.get(API.GET_LOCATIONS, { headers }),
        ]);

      setMasters({
        companies: companies.data || [],
        models: models.data || [],
        statuses: statuses.data || [],
        suppliers: suppliers.data || [],
        locations: locations.data || [],
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load filter data");
    }
  };

  // =====================================
  // HANDLE CHANGE
  // =====================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // =====================================
  // HANDLE COLUMN TOGGLE
  // =====================================

  const handleColumnToggle = (column) => {
    setFilters((prev) => {
      const exists = prev.columns.includes(column);
      return {
        ...prev,
        columns: exists
          ? prev.columns.filter((c) => c !== column)
          : [...prev.columns, column],
      };
    });
  };

  // =====================================
  // BUILD PAYLOAD HELPER
  // =====================================

  const buildPayload = (extraFields = {}) => {
    const payload = {
      ...filters,
      page,
      page_size: pageSize,
      sort_by: "created_at",
      sort_order: "desc",

      company_id: Number(filters.company_id) || null,
      model_id: Number(filters.model_id) || null,
      status_id: Number(filters.status_id) || null,
      location_id: Number(filters.location_id) || null,
      supplier_id: Number(filters.supplier_id) || null,

      assigned: filters.assigned === "" ? null : filters.assigned === "true",
      deleted: filters.deleted === "" ? null : filters.deleted === "true",
      requestable:
        filters.requestable === "" ? null : filters.requestable === "true",
      byod: filters.byod === "" ? null : filters.byod === "true",

      ...extraFields,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === "") payload[key] = null;
    });

    return payload;
  };

  // =====================================
  // GENERATE REPORT
  // =====================================

  const generateReport = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const payload = buildPayload();

      console.log("REPORT PAYLOAD =>", payload);

      const res = await axios.post(API.CUSTOM_ASSET_REPORT, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("REPORT DATA =>", res.data);

      setReportData(res.data?.data || []);
      setTotalRecords(res.data?.total_records || 0);
      toast.success("Report generated successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // EXPORT CSV
  // =====================================

  const exportCSV = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const payload = buildPayload({ export: "csv" });

      const response = await axios.post(API.EXPORT_ASSET_REPORT, payload, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "asset_report.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("CSV exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export CSV");
    }
  };

  // =====================================
  // EXPORT XLSX (client-side)
  // =====================================

  const exportXLSX = () => {
    try {
      if (reportData.length === 0) {
        toast.error("No data to export. Generate a report first.");
        return;
      }

      const rows = reportData.map((row) => {
        const obj = {};
        filters.columns.forEach((col) => {
          obj[col.replaceAll("_", " ")] = formatValue(row[col]);
        });
        return obj;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Asset Report");

      const colWidths = filters.columns.map((col) => ({
        wch: Math.max(
          col.length + 2,
          ...rows.map((r) => String(r[col.replaceAll("_", " ")] ?? "").length)
        ),
      }));
      worksheet["!cols"] = colWidths;

      XLSX.writeFile(workbook, "asset_report.xlsx");
      toast.success("XLSX exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export XLSX");
    }
  };

  // =====================================
  // RESET
  // =====================================

  const resetFilters = () => {
    setFilters({
      columns: ["asset_tag", "asset_name", "serial_number"],
      company_id: "",
      model_id: "",
      status_id: "",
      location_id: "",
      supplier_id: "",
      asset_tag: "",
      asset_name: "",
      serial_number: "",
      order_number: "",
      condition: "",
      purchase_date_from: "",
      purchase_date_to: "",
      warranty_expires_from: "",
      warranty_expires_to: "",
      next_audit_date_from: "",
      next_audit_date_to: "",
      created_at_from: "",
      created_at_to: "",
      assigned: "",
      deleted: "",
      requestable: "",
      byod: "",
    });
    setReportData([]);
  };

  // =====================================
  // FORMAT VALUE
  // =====================================

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString("en-GB", { timeZone: "Asia/Kolkata" });
      }
    }
    return value;
  };

  // =====================================
  // PAGINATION HELPERS
  // =====================================

  const totalPages = Math.ceil(totalRecords / pageSize);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  };

  // =====================================
  // RENDER TABLE (reused in page + modal)
  // =====================================

  const ReportTable = ({ stickyHeader = false }) => (
    <Table stickyHeader={stickyHeader} size="small">
      <TableHead>
        <TableRow sx={{ backgroundColor: "#f4f4f5" }}>
          {filters.columns.map((column) => (
            <TableCell
              key={column}
              sx={{
                fontWeight: 700,
                whiteSpace: "nowrap",
                textTransform: "capitalize",
                backgroundColor: "#f4f4f5",
                color: "#111827",
              }}
            >
              {column.replaceAll("_", " ")}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>

      <TableBody>
        {reportData.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={filters.columns.length}
              align="center"
              sx={{ py: 8, color: "text.secondary" }}
            >
              No report data found
            </TableCell>
          </TableRow>
        ) : (
          reportData.map((row, index) => (
            <TableRow
              key={index}
              hover
              sx={{ "&:last-child td": { borderBottom: 0 } }}
            >
              {filters.columns.map((column) => (
                <TableCell key={column} sx={{ whiteSpace: "nowrap" }}>
                  {formatValue(row[column])}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  // =====================================
  // RENDER
  // =====================================

  return (
    <Box sx={{ p: 3, minHeight: "100vh", bgcolor: "background.default" }}>
      {/* HEADER */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          Custom Asset Report
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Generate dynamic asset reports with filters and selected columns
        </Typography>
      </Box>

      {/* FILTER CARD */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        {/* SECTION TITLE */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <FilterListIcon fontSize="small" color="action" />
          <Typography variant="subtitle1" fontWeight={600}>
            Filters &amp; Columns
          </Typography>
        </Stack>

        {/* COLUMN SELECT */}
        <Box sx={{ mb: 4 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
          >
            <Typography variant="body2" fontWeight={600} color="text.primary">
              Select Columns
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<SelectAllIcon />}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, columns: availableColumns }))
                }
                sx={{ textTransform: "none", fontSize: "0.75rem" }}
              >
                Select All
              </Button>

              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeselectIcon />}
                onClick={() => setFilters((prev) => ({ ...prev, columns: [] }))}
                sx={{ textTransform: "none", fontSize: "0.75rem" }}
              >
                Clear All
              </Button>
            </Stack>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
            {filters.columns.length} column{filters.columns.length !== 1 ? "s" : ""} selected
          </Typography>

          <Grid container spacing={1.5}>
            {availableColumns.map((column) => {
              const checked = filters.columns.includes(column);
              return (
                <Grid item xs={6} sm={4} md={3} key={column}>
                  <Paper
                    variant="outlined"
                    onClick={() => handleColumnToggle(column)}
                    sx={{
                      px: 1.5,
                      py: 1,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      borderColor: checked ? "primary.main" : "divider",
                      bgcolor: checked ? "primary.50" : "background.paper",
                      transition: "all 0.15s",
                      "&:hover": {
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={checked}
                      onChange={() => handleColumnToggle(column)}
                      onClick={(e) => e.stopPropagation()}
                      sx={{ p: 0 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        textTransform: "capitalize",
                        fontWeight: checked ? 600 : 400,
                        color: checked ? "primary.main" : "text.primary",
                        wordBreak: "break-word",
                        lineHeight: 1.3,
                      }}
                    >
                      {column.replaceAll("_", " ")}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* TEXT FILTERS */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Asset Tag"
              name="asset_tag"
              value={filters.asset_tag}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Asset Name"
              name="asset_name"
              value={filters.asset_name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Serial Number"
              name="serial_number"
              value={filters.serial_number}
              onChange={handleChange}
            />
          </Grid>

          {/* SELECT FILTERS */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Company</InputLabel>
              <Select
                name="company_id"
                value={filters.company_id}
                label="Company"
                onChange={handleChange}
              >
                <MenuItem value="">All Companies</MenuItem>
                {masters.companies.map((item) => (
                  <MenuItem key={item.company_id || item.id} value={item.company_id || item.id}>
                    {item.company_name || item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Model</InputLabel>
              <Select
                name="model_id"
                value={filters.model_id}
                label="Model"
                onChange={handleChange}
              >
                <MenuItem value="">All Models</MenuItem>
                {masters.models.map((item) => (
                  <MenuItem key={item.model_id || item.id} value={item.model_id || item.id}>
                    {item.model_name || item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                name="status_id"
                value={filters.status_id}
                label="Status"
                onChange={handleChange}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {masters.statuses.map((item) => (
                  <MenuItem key={item.status_id || item.id} value={item.status_id || item.id}>
                    {item.status_name || item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Location</InputLabel>
              <Select
                name="location_id"
                value={filters.location_id}
                label="Location"
                onChange={handleChange}
              >
                <MenuItem value="">All Locations</MenuItem>
                {masters.locations.map((item) => (
                  <MenuItem key={item.location_id || item.id} value={item.location_id || item.id}>
                    {item.location_name || item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Supplier</InputLabel>
              <Select
                name="supplier_id"
                value={filters.supplier_id}
                label="Supplier"
                onChange={handleChange}
              >
                <MenuItem value="">All Suppliers</MenuItem>
                {masters.suppliers.map((item) => (
                  <MenuItem key={item.supplier_id || item.id} value={item.supplier_id || item.id}>
                    {item.supplier_name || item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Condition"
              name="condition"
              value={filters.condition}
              onChange={handleChange}
            />
          </Grid>
        </Grid>

        {/* DATE FILTERS */}
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {/* Purchase Date */}
            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                Purchase Date
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="From"
                    name="purchase_date_from"
                    value={filters.purchase_date_from}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="To"
                    name="purchase_date_to"
                    value={filters.purchase_date_to}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Warranty Expires */}
            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                Warranty Expires
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="From"
                    name="warranty_expires_from"
                    value={filters.warranty_expires_from}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="To"
                    name="warranty_expires_to"
                    value={filters.warranty_expires_to}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>

        {/* BOOLEAN FILTERS */}
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            {[
              { label: "Assigned", name: "assigned" },
              { label: "Deleted", name: "deleted" },
              { label: "Requestable", name: "requestable" },
              { label: "BYOD", name: "byod" },
            ].map(({ label, name }) => (
              <Grid item xs={6} md={3} key={name}>
                <FormControl fullWidth size="small">
                  <InputLabel>{label}</InputLabel>
                  <Select
                    name={name}
                    value={filters[name]}
                    label={label}
                    onChange={handleChange}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Yes</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ACTIONS */}
        <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mt: 4 }}>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={generateReport}
            disabled={loading}
            sx={{ textTransform: "none" }}
          >
            {loading ? "Generating..." : "Generate Report"}
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={resetFilters}
            sx={{ textTransform: "none" }}
          >
            Reset
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<DownloadIcon />}
            onClick={exportCSV}
            sx={{ textTransform: "none" }}
          >
            Export CSV
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<TableChartIcon />}
            onClick={exportXLSX}
            sx={{ textTransform: "none" }}
          >
            Export XLSX
          </Button>
        </Stack>
      </Paper>

      {/* TABLE CARD */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        {/* TOP BAR */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Asset Report Table
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Showing dynamic report data
            </Typography>
          </Box>

          <Tooltip title="Expand Report">
            <Button
              variant="contained"
              size="small"
              startIcon={<FullscreenIcon />}
              onClick={() => setShowModal(true)}
              sx={{ textTransform: "none" }}
            >
              Expand Report
            </Button>
          </Tooltip>
        </Box>

        {/* TABLE */}
        <TableContainer>
          <ReportTable />
        </TableContainer>

        {/* PAGINATION */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", xl: "row" },
            alignItems: { xl: "center" },
            justifyContent: "space-between",
            gap: 2,
            px: 2.5,
            py: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          {/* LEFT */}
          <Stack direction="row" alignItems="center" spacing={3} flexWrap="wrap">
            <Typography variant="body2" color="text.secondary">
              Total Records:{" "}
              <Typography component="span" fontWeight={600}>
                {totalRecords}
              </Typography>
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Rows Per Page
              </Typography>
              <Select
                size="small"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                sx={{ fontSize: "0.8rem", height: 34 }}
              >
                {[10, 25, 50, 100].map((n) => (
                  <MenuItem key={n} value={n} sx={{ fontSize: "0.8rem" }}>
                    {n}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>

          {/* RIGHT */}
          <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
            <Button
              size="small"
              variant="outlined"
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              sx={{ textTransform: "none", minWidth: 60 }}
            >
              Prev
            </Button>

            {getPageNumbers()
              .slice(Math.max(page - 3, 0), Math.max(page + 2, 5))
              .map((num) => (
                <Button
                  key={num}
                  size="small"
                  variant={page === num ? "contained" : "outlined"}
                  onClick={() => setPage(num)}
                  sx={{ minWidth: 36, px: 1, textTransform: "none" }}
                >
                  {num}
                </Button>
              ))}

            <Button
              size="small"
              variant="outlined"
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage((prev) => prev + 1)}
              sx={{ textTransform: "none", minWidth: 60 }}
            >
              Next
            </Button>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Go To
              </Typography>
              <TextField
                type="number"
                size="small"
                value={page}
                inputProps={{ min: 1, max: totalPages }}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 1 && value <= totalPages) setPage(value);
                }}
                sx={{ width: 72 }}
              />
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {/* FULL REPORT MODAL */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: "95vw",
            height: "95vh",
            borderRadius: 3,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* MODAL HEADER */}
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
            py: 2,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Expanded Asset Report
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Full screen report view
            </Typography>
          </Box>

          <IconButton
            onClick={() => setShowModal(false)}
            size="small"
            sx={{ bgcolor: "error.main", color: "#fff", "&:hover": { bgcolor: "error.dark" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        {/* MODAL TABLE */}
        <DialogContent sx={{ p: 0, flex: 1, overflow: "auto" }}>
          <TableContainer sx={{ height: "100%" }}>
            <ReportTable stickyHeader />
          </TableContainer>
        </DialogContent>
      </Dialog>
    </Box>
  );
}