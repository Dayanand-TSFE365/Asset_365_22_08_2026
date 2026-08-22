// ===============================
// File: src/pages/tasks/common/DataTable.jsx
// ===============================

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

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
function CustomPagination({ containerRef }) {
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
        MenuProps={{ container: () => containerRef?.current ?? document.body }}
      >
        {[10, 20, 50, 100].map((n) => (
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

// ─── Toolbar — defined outside parent to prevent remount on every render ──────
function CustomToolbar({ ctxRef }) {
  const ctx = ctxRef.current;
  const portalContainer = () => ctx.containerRef?.current ?? document.body;

  return (
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
      {/* LEFT: Search */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <TextField
          size="small"
          placeholder={ctx.searchPlaceholder || "Search..."}
          value={ctx.search}
          onChange={(e) => ctx.onSearchChange(e.target.value)}
          sx={{ minWidth: 220 }}
        />
      </Box>

      {/* RIGHT: Actions */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <GridToolbarColumnsButton />

        <Tooltip title="Refresh">
          <IconButton onClick={ctx.onRefresh} size="small">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Fullscreen">
          <IconButton onClick={ctx.onFullscreen} size="small">
            <FullscreenIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Hidden entirely if the caller can't create — same "hide, don't
            disable" pattern as the view-only Delete button used to be. */}
        {ctx.showCreate && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => ctx.navigate("/tasks/action/create")}
            sx={{ textTransform: "none" }}
          >
            {ctx.createLabel}
          </Button>
        )}

        <Select
          size="small"
          value="Export"
          disabled={!ctx.canExport}
          onChange={(e) => {
            if (!ctx.canExport) { toast.error("You don't have permission to export tasks."); return; }
            const v = e.target.value;
            if (v === "Excel" || v === "CSV") ctx.exportExcel();
            if (v === "PDF") ctx.exportPDF();
            if (v === "Print") window.print();
          }}
          sx={{ minWidth: 100, ...(!ctx.canExport && { opacity: 0.5 }) }}
          MenuProps={{ container: portalContainer }}
        >
          <MenuItem value="Export" disabled>Export</MenuItem>
          <MenuItem value="Excel">Excel</MenuItem>
          {/* <MenuItem value="CSV">CSV</MenuItem>
          <MenuItem value="PDF">PDF</MenuItem> */}
        </Select>
      </Box>
    </GridToolbarContainer>
  );
}

// ─── Main DataTable ───────────────────────────────────────────────────────────
export default function DataTable({
  columns,
  data,
  onRefresh,
  showCreate = false,
  createLabel = "Create Task",
  searchPlaceholder = "Search tasks...",
  canExport = true, // pass can("export") from TaskList
}) {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});

  const containerRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleSearchChange = useCallback((val) => {
    setSearch(val);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  // local filter — swap for server-side when API is ready
  const filteredData = data.filter((row) =>
    Object.values(row).some((val) =>
      String(val ?? "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const muiColumns = [
    {
      field: "__rowNum",
      headerName: "ID",
      width: 55,
      sortable: false,
      filterable: false,
      renderCell: (params) => params.row.__rowIndex,
    },
    ...columns.map((col) => {
      const field = col.accessor || col.header.replace(/\s+/g, "_");
      const isActions = col.header === "Actions";
      const isCompact = !!col.compact;
      return {
        field,
        headerName: col.header,
        ...(isCompact
          ? { width: 110, flex: 0 }
          : { flex: 1, minWidth: isActions ? 180 : 140 }),
        sortable: !isActions && !isCompact,
        filterable: !isActions && !isCompact,
        align: isCompact ? "center" : undefined,
        headerAlign: isCompact ? "center" : undefined,
        ...(isActions ? { cellClassName: "actions-cell" } : {}),
        ...(col.render
          ? { renderCell: (params) => col.render(params.row) }
          : {}),
      };
    }),
  ];

  const rows = filteredData.map((row, i) => ({
    ...row,
    id: row.id != null ? row.id : `__row_${i}`,
    __rowIndex: i + 1,
  }));

  const exportExcel = useCallback(() => {
    const cleanData = filteredData.map((row) => {
      const obj = {};
      columns.forEach((col) => {
        if (!col.accessor) return;
        obj[col.header] = row[col.accessor] ?? "";
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/octet-stream",
      }),
      "tasks.xlsx"
    );
  }, [filteredData, columns]);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    const headers = columns
      .filter((c) => c.accessor && columnVisibilityModel[c.accessor] !== false)
      .map((c) => c.header);
    const tableRows = filteredData.map((row) =>
      headers.map((h) => {
        const col = columns.find((c) => c.header === h);
        return col ? row[col.accessor] ?? "" : "";
      })
    );
    autoTable(doc, { head: [headers], body: tableRows });
    doc.save("tasks.pdf");
  }, [filteredData, columns, columnVisibilityModel]);

  const toggleFullscreen = useCallback(() => {
    const elem = containerRef.current;
    if (!document.fullscreenElement) elem?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  const handleRefresh = useCallback(() => {
    setSearch("");
    setPaginationModel({ page: 0, pageSize: 20 });
    setRowSelectionModel([]);
    if (onRefresh) onRefresh();
    else window.location.reload();
  }, [onRefresh]);

  const ctxRef = useRef({});
  ctxRef.current = {
    search,
    onSearchChange: handleSearchChange,
    navigate,
    showCreate,
    createLabel,
    searchPlaceholder,
    canExport,
    exportExcel,
    exportPDF,
    onRefresh: handleRefresh,
    onFullscreen: toggleFullscreen,
    containerRef,
  };

  const ToolbarSlot = useCallback(
    () => <CustomToolbar ctxRef={ctxRef} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const PaginationSlot = useCallback(
    () => <CustomPagination containerRef={containerRef} />,
    []
  );

  return (
    <Paper
      ref={containerRef}
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        overflow: "hidden",
      }}
      elevation={2}
    >
      <DataGrid
        rows={rows}
        columns={muiColumns}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 20, 50, 100]}
        checkboxSelection
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={setRowSelectionModel}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={setColumnVisibilityModel}
        disableRowSelectionOnClick
        autosizeOnMount
        autosizeOptions={{ includeHeaders: true, includeOutliers: true, expand: true }}
        slots={{ toolbar: ToolbarSlot, pagination: PaginationSlot }}
        slotProps={{ panel: { disablePortal: isFullscreen } }}
        sx={{
          border: 0,
          flex: 1,
          "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f4f4f5" },
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700, color: "#111827" },
          "& .MuiDataGrid-columnHeader": { color: "#111827" },
          "& .MuiDataGrid-cell": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
          "& .actions-cell": { overflow: "visible !important" },
          "& .MuiDataGrid-row": { overflow: "visible !important" },
        }}
      />
    </Paper>
  );
}