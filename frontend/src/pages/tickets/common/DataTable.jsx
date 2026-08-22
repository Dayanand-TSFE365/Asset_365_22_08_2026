// pages/tickets/common/DataTable.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { exportStyledExcel } from "../../../utils/exportExcel";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PermissionButton from "../../../components/common/PermissionButton";

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
  Paper, Box, TextField, Button, Select, MenuItem, IconButton, Tooltip,
} from "@mui/material";
import RefreshIcon        from "@mui/icons-material/Refresh";
import FullscreenIcon     from "@mui/icons-material/Fullscreen";
import AddIcon            from "@mui/icons-material/Add";
import FirstPageIcon      from "@mui/icons-material/FirstPage";
import LastPageIcon       from "@mui/icons-material/LastPage";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon   from "@mui/icons-material/NavigateNext";
import { hasPermission } from "../../../utils/permissions";
import toast from "react-hot-toast";

// ─── Custom Pagination ────────────────────────────────────────────────────────
function CustomPagination({ containerRef }) {
  const apiRef    = useGridApiContext();
  const page      = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const pageSize  = useGridSelector(apiRef, gridPageSizeSelector);
  const rowCount  = useGridSelector(apiRef, gridRowCountSelector);

  const from = page * pageSize + 1;
  const to   = Math.min((page + 1) * pageSize, rowCount);

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

// ─── Toolbar ──────────────────────────────────────────────────────────────────
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
      {/* LEFT: optional extra (e.g. status filter) + Search */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {ctx.toolbarLeft}
        <TextField
          size="small"
          placeholder="Search Tickets..."
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

        {ctx.showCreate && (
          <PermissionButton
            permission="create_tickets"
            onClick={() => ctx.navigate(ctx.createRoute)}
          >
            <Button variant="contained" size="small" startIcon={<AddIcon />} sx={{ textTransform: "none" }}>
              {ctx.createLabel}
            </Button>
          </PermissionButton>
        )}

        {ctx.showExport && (() => {
          const canExport = hasPermission("export_tickets");
          return (
            <Select
              size="small"
              value="Export"
              disabled={!canExport}
              onChange={(e) => {
                if (!canExport) { toast.error("You don't have permission"); return; }
                const v = e.target.value;
                if (v === "Excel" || v === "CSV") ctx.exportExcel();
                if (v === "PDF") ctx.exportPDF();
                if (v === "Print") window.print();
              }}
              sx={{ minWidth: 100, ...(!canExport && { opacity: 0.5 }) }}
              MenuProps={{ container: portalContainer }}
            >
              <MenuItem value="Export" disabled>Export</MenuItem>
              <MenuItem value="Excel">Excel</MenuItem>
            </Select>
          );
        })()}
      </Box>
    </GridToolbarContainer>
  );
}

// ─── Main DataTable ───────────────────────────────────────────────────────────
export default function DataTable({
  columns,
  data,
  onRefresh,
  onSearch,
  createRoute  = "action/create",
  createLabel  = "Create Ticket",
  toolbarLeft,          // optional JSX rendered left of the search box (e.g. status/priority filter)
  showCreate   = true,  // set false on filtered subpages (My Tickets, Open, etc.) if you don't want Create there
  showExport   = true,
}) {
  const navigate = useNavigate();

  const [search,               setSearch]               = useState("");
  const [paginationModel,      setPaginationModel]      = useState({ page: 0, pageSize: 100 });
  const [rowSelectionModel,    setRowSelectionModel]    = useState([]);
  const [columnVisibilityModel,setColumnVisibilityModel]= useState({});

  const containerRef  = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const searchDebounceRef = useRef(null);
  const handleSearchChange = useCallback((val) => {
    setSearch(val);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    if (onSearch) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => onSearch(val), 400);
    }
  }, [onSearch]);

  useEffect(() => () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  }, []);

  const filteredData = onSearch
    ? data
    : data.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? "").toLowerCase().includes(search.toLowerCase())
        )
      );

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
      const field      = col.accessor || col.header.replace(/\s+/g, "_");
      const isActions  = col.header === "Actions";
      const isCompact  = !!col.compact;
      return {
        field,
        headerName: col.header,
        ...(isCompact
          ? { width: 100, flex: 0 }
          : { flex: 1, minWidth: isActions ? 180 : 150 }),
        sortable:    !isActions && !isCompact,
        filterable:  !isActions && !isCompact,
        align:       isCompact ? "center" : undefined,
        headerAlign: isCompact ? "center" : undefined,
        ...(isActions ? { cellClassName: "actions-cell" } : {}),
        ...(col.render ? { renderCell: (params) => col.render(params.row) } : {}),
      };
    }),
  ];

  const rows = filteredData.map((row, i) => ({
    ...row,
    id: row.id != null ? row.id : `__row_${i}`,
    __rowIndex: i + 1,
  }));

  const currentPageRowIds = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    return new Set(rows.slice(start, end).map((r) => r.id));
  }, [rows, paginationModel.page, paginationModel.pageSize]);

  const handleRowSelectionChange = useCallback((newSelectionModel) => {
    const ids = Array.isArray(newSelectionModel)
      ? newSelectionModel
      : Array.from(newSelectionModel?.ids || []);

    setRowSelectionModel(ids.filter((id) => currentPageRowIds.has(id)));
  }, [currentPageRowIds]);

  const exportExcel = useCallback(() => {
    const exportableCols = columns.filter((c) => c.accessor || c.exportValue);
    const headers = exportableCols.map((c) => c.header);

    const cleanData = filteredData.map((row) => {
      const obj = {};
      exportableCols.forEach((col) => {
        if (col.exportValue) {
          obj[col.header] = col.exportValue(row) ?? "";
          return;
        }
        let value = row[col.accessor];
        if (typeof value === "object") value = "";
        obj[col.header] = value ?? "";
      });
      return obj;
    });

    exportStyledExcel(headers, cleanData, "Tickets", "tickets.xlsx");
  }, [filteredData, columns]);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    const visibleHeaders = columns
      .filter((c) => columnVisibilityModel[c.accessor || c.header] !== false)
      .map((c) => c.header);
    const tableRows = filteredData.map((row) =>
      visibleHeaders.map((header) => {
        const col = columns.find((c) => c.header === header);
        return col ? row[col.accessor] ?? "" : "";
      })
    );
    autoTable(doc, { head: [visibleHeaders], body: tableRows });
    doc.save("tickets.pdf");
  }, [filteredData, columns, columnVisibilityModel]);

  const toggleFullscreen = useCallback(() => {
    const elem = containerRef.current;
    if (!document.fullscreenElement) elem?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  const handleRefresh = useCallback(() => {
    setSearch("");
    setPaginationModel({ page: 0, pageSize: 100 });
    setRowSelectionModel([]);
    if (onRefresh) onRefresh();
    else window.location.reload();
  }, [onRefresh]);

  const ctxRef = useRef({});
  ctxRef.current = {
    search,
    onSearchChange: handleSearchChange,
    navigate,
    createRoute,
    createLabel,
    exportExcel,
    exportPDF,
    onRefresh:    handleRefresh,
    onFullscreen: toggleFullscreen,
    containerRef,
    toolbarLeft,
    showCreate,
    showExport,
  };

  const ToolbarSlot    = useCallback(() => <CustomToolbar ctxRef={ctxRef} />, []);
  const PaginationSlot = useCallback(() => <CustomPagination containerRef={containerRef} />, []);

  return (
    <Paper
      id="ticket-datatable-container"
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
        onPaginationModelChange={(model) => {
          setPaginationModel(model);
          setRowSelectionModel([]);
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        checkboxSelection
        checkboxSelectionVisibleOnly
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={handleRowSelectionChange}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={setColumnVisibilityModel}
        disableRowSelectionOnClick
        autosizeOnMount
        autosizeOptions={{ includeHeaders: true, includeOutliers: true, outliersFactor: 1.5, expand: true }}
        slots={{ toolbar: ToolbarSlot, pagination: PaginationSlot }}
        slotProps={{ panel: { disablePortal: isFullscreen } }}
        sx={{
          border: 0,
          flex: 1,
          "& .MuiDataGrid-columnHeaders":      { backgroundColor: "#f4f4f5" },
          "& .MuiDataGrid-columnHeaderTitle":  { fontWeight: 700, color: "#111827" },
          "& .MuiDataGrid-columnHeader":       { color: "#111827" },
          "& .MuiDataGrid-cell":               { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
          "& .actions-cell":                   { overflow: "visible !important" },
          "& .MuiDataGrid-row":                { overflow: "visible !important" },
        }}
      />
    </Paper>
  );
}