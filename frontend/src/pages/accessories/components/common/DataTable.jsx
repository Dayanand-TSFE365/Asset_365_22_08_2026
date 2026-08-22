import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PermissionButton from "../../../../components/common/PermissionButton";

import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  useGridApiContext,
  useGridSelector,
  gridPageCountSelector,
  gridPageSelector,
  gridPageSizeSelector,
  gridRowCountSelector,
} from "@mui/x-data-grid";
import {
  Paper,
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import AddIcon from "@mui/icons-material/Add";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

// ─── Custom Pagination ────────────────────────────────────────────────────────
function CustomPagination() {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const pageSize = useGridSelector(apiRef, gridPageSizeSelector);
  const rowCount = useGridSelector(apiRef, gridRowCountSelector);

  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, rowCount);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.5 }}>
      <Box sx={{ mr: 2, color: "text.secondary", fontSize: "0.8rem" }}>
        {rowCount > 0 ? `${from}–${to} of ${rowCount}` : "0–0 of 0"}
      </Box>

      <Select
        size="small"
        value={pageSize}
        onChange={(e) => apiRef.current.setPageSize(Number(e.target.value))}
        sx={{ fontSize: "0.8rem", height: 30, mr: 1 }}
      >
        {[10, 20, 50, 100, 150, 500].map((n) => (
          <MenuItem key={n} value={n} sx={{ fontSize: "0.8rem" }}>{n}</MenuItem>
        ))}
      </Select>

      <Tooltip title="First page"><span>
        <IconButton size="small" onClick={() => apiRef.current.setPage(0)} disabled={page === 0}>
          <FirstPageIcon fontSize="small" />
        </IconButton>
      </span></Tooltip>

      <Tooltip title="Previous page"><span>
        <IconButton size="small" onClick={() => apiRef.current.setPage(page - 1)} disabled={page === 0}>
          <NavigateBeforeIcon fontSize="small" />
        </IconButton>
      </span></Tooltip>

      <Box sx={{ px: 1, fontSize: "0.8rem", color: "text.secondary" }}>
        {pageCount > 0 ? `${page + 1} / ${pageCount}` : "1 / 1"}
      </Box>

      <Tooltip title="Next page"><span>
        <IconButton size="small" onClick={() => apiRef.current.setPage(page + 1)} disabled={page >= pageCount - 1}>
          <NavigateNextIcon fontSize="small" />
        </IconButton>
      </span></Tooltip>

      <Tooltip title="Last page"><span>
        <IconButton size="small" onClick={() => apiRef.current.setPage(pageCount - 1)} disabled={page >= pageCount - 1}>
          <LastPageIcon fontSize="small" />
        </IconButton>
      </span></Tooltip>
    </Box>
  );
}

// ─── Accessory DataTable ──────────────────────────────────────────────────────
export default function AccessoryDataTable({
  columns,
  data,
  onRefresh,
  createPath = "/assets/action/create",
  createLabel = "Create",
}) {
  const [search, setSearch] = useState("");
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const navigate = useNavigate();

  // 🔍 Filter
  const filteredData = data.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  // Build MUI columns
  const muiColumns = [
    {
      field: "__rowNum",
      headerName: "ID",
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params) => params.row.__rowIndex,
    },
    ...columns.map((col) => {
      const field = col.accessor || col.header.replace(/\s+/g, "_");
      return {
        field,
        headerName: col.header,
        flex: 1,
        minWidth: 160,
        sortable: true,
        ...(col.render
          ? { renderCell: (params) => col.render(params.row), sortable: false, filterable: false }
          : {}),
      };
    }),
  ];

  const rows = filteredData.map((row, i) => ({
    ...row,
    id: row.id != null ? row.id : `__row_${i}`,
    __rowIndex: i + 1,
  }));

  const toggleFullscreen = () => {
    const elem = document.getElementById("accessory-datatable-container");
    if (!document.fullscreenElement) elem?.requestFullscreen();
    else document.exitFullscreen();
  };

  const handleRefresh = () => {
    setSearch("");
    setPaginationModel({ page: 0, pageSize: 20 });
    setRowSelectionModel([]);
    window.location.reload();
  };

  const exportExcel = () => {
    const cleanData = data.map((row) => {
      const obj = {};
      columns.forEach((col) => {
        const key = col.accessor;
        if (!key) return;
        let value = row[key];
        if (typeof value === "object") value = "";
        obj[col.header] = value ?? "";
      });
      return obj;
    });
    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accessories");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "accessories.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const visibleHeaders = columns
      .filter((c) => columnVisibilityModel[c.accessor || c.header] !== false)
      .map((c) => c.header);
    const tableRows = data.map((row) =>
      visibleHeaders.map((header) => {
        const col = columns.find((c) => c.header === header);
        return col ? row[col.accessor] ?? "" : "";
      })
    );
    autoTable(doc, { head: [visibleHeaders], body: tableRows });
    doc.save("accessories.pdf");
  };

  const CustomToolbar = () => (
    <GridToolbarContainer
      sx={{
        justifyContent: "space-between",
        px: 1.5,
        py: 1,
        flexWrap: "wrap",
        gap: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <TextField
        size="small"
        placeholder="Search Accessories..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPaginationModel((prev) => ({ ...prev, page: 0 }));
        }}
        sx={{ minWidth: 220 }}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <GridToolbarColumnsButton />

        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} size="small">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Fullscreen">
          <IconButton onClick={toggleFullscreen} size="small">
            <FullscreenIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <PermissionButton
          permission="create_licenses"
          onClick={() => navigate(createPath)}
        >
          <Button variant="contained" size="small" startIcon={<AddIcon />} sx={{ textTransform: "none" }}>
            + {createLabel}
          </Button>
        </PermissionButton>

        <Select
          size="small"
          value="Export"
          onChange={(e) => {
            const value = e.target.value;
            if (value === "Excel") exportExcel();
            if (value === "CSV") exportExcel();
            if (value === "PDF") exportPDF();
            if (value === "Print") window.print();
          }}
          sx={{ minWidth: 100 }}
        >
          <MenuItem value="Export" disabled>Export</MenuItem>
          <MenuItem value="Excel">Excel</MenuItem>
          <MenuItem value="CSV">CSV</MenuItem>
        </Select>
      </Box>
    </GridToolbarContainer>
  );

  return (
    <Paper
      id="accessory-datatable-container"
      sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", borderRadius: 2, overflow: "hidden" }}
      elevation={2}
    >
      <DataGrid
        rows={rows}
        columns={muiColumns}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 20, 50, 100, 150, 500]}
        checkboxSelection
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={setRowSelectionModel}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={setColumnVisibilityModel}
        disableRowSelectionOnClick
        slots={{ toolbar: CustomToolbar, pagination: CustomPagination }}
        slotProps={{ panel: { placement: "bottom-end" } }}
        sx={{
          border: 0,
          flex: 1,
          "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f4f4f5" },
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700, color: "#111827" },
          "& .MuiDataGrid-columnHeader": { color: "#111827" },
          "& .MuiDataGrid-cell": { overflow: "visible !important" },
          "& .MuiDataGrid-row": { overflow: "visible !important" },
        }}
      />
    </Paper>
  );
}