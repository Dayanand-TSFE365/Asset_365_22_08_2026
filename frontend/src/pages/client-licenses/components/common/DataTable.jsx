//Client-License DataTabel
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
import { exportStyledExcel } from "../../../../utils/exportExcel";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PermissionButton from "../../../../components/common/PermissionButton";
import { API } from "../../../../config/api";
import { hasPermission } from "../../../../utils/permissions";
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
  FormControl,
  InputLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import AddIcon from "@mui/icons-material/Add";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { FiEye } from "react-icons/fi";

// ─── auth header ──────────────────────────────────────────────────────────────
const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

// ─── which columns each license type shows ────────────────────────────────────
const TYPE_COLUMNS = {
  ALL: [
    "job_po_no", "client_name", "customer_po", "product_name", "description",
    "serial_number", "product_key", "email_id", "expired_on",
    "supplier", "order_number", "purchase_order_number", 
    "purchase_date", "purchase_cost", "contract", "remarks",
  ],
  ROCKWELL: [
    "job_po_no", "client_name", "customer_po", "product_name", "description",
    "serial_number", "product_key", "expired_on", "email_id",
    "supplier", "order_number", "purchase_order_number", 
    "purchase_date", "purchase_cost", "contract", "remarks",
  ],
  "MICROSOFT WINDOWS": [
    "job_po_no", "client_name", "customer_po", "product_name",
    "description", "product_key",
    "supplier", "order_number", "purchase_order_number", 
    "purchase_date", "purchase_cost", "contract", "remarks",
  ],
  "MICROSOFT EXCEL": [
    "job_po_no", "client_name", "customer_po", "product_name",
    "description", "product_key", "email_id", "password",
    "supplier", "order_number", "purchase_order_number", 
    "purchase_date", "purchase_cost", "contract", "remarks",
  ],
  "MICROSOFT SQL": [
    "job_po_no", "client_name", "customer_po", "product_name",
    "description", "product_key", "email_id", "password",
    "supplier", "order_number", "purchase_order_number", 
    "purchase_date", "purchase_cost", "contract", "remarks",
  ],
  OTHER: [
    "job_po_no", "client_name", "customer_po", "product_name",
    "description", "product_key", "note_1", "note_2",
    "supplier", "order_number", "purchase_order_number", 
    "purchase_date", "purchase_cost", "contract", "remarks",
  ],
};

// Column header labels
const COLUMN_LABELS = {
  job_po_no:             "Job / PO No",
  client_name:           "Client Name",
  product_name:          "Product Name",
  description:           "Description",
  serial_number:         "Serial Number",
  product_key:           "Product Key",
  email_id:              "Email",
  password:              "Password",
  note_1:                "Note 1",
  note_2:                "Note 2",
  expired_on:            "Expired On",
  supplier:              "Supplier",
  order_number:          "Order Number",
  purchase_order_number: "Purchase Order",
  customer_po:           "Customer PO",
  purchase_date:         "Purchase Date",
  purchase_cost:         "Purchase Cost",
  contract:              "Contract",
  remarks:               "Remarks",
};

// Reverse lookup: header label -> accessor key. Used so a custom `render`
// column (like "Product Key", which needs masking logic and therefore has
// no `accessor` of its own) can be matched back to the accessor it's meant
// to override, instead of being tacked on as a brand-new trailing column.
const LABEL_TO_ACCESSOR = Object.fromEntries(
  Object.entries(COLUMN_LABELS).map(([accessor, label]) => [label, accessor])
);

// ─── Per-column min widths (used for autosize floor) ─────────────────────────
const COLUMN_MIN_WIDTHS = {
  job_po_no:             140,
  client_name:           160,
  product_name:          180,
  description:           220,
  serial_number:         170,
  product_key:           200,
  email_id:              200,
  password:              150,
  note_1:                160,
  note_2:                160,
  expired_on:            130,
  supplier:              160,
  order_number:          150,
  purchase_order_number: 160,
  customer_po:           150,
  purchase_date:         130,
  purchase_cost:         130,
  contract:              140,
  remarks:               200,
};

// ─── Custom (non-accessor) render columns — width/placement defaults ─────────
// Any column object passed in `columns` that has NO `accessor` and DOES have
// a `render` fn lands here automatically (Files, Actions, or anything else
// you add later). Actions always pinned last with its historical width.
const CUSTOM_COLUMN_DEFAULTS = {
  Actions: { width: 170, cellClassName: "actions-cell", align: "center" },
  Files:   { width: 90,  cellClassName: "files-cell",   align: "center" },
};

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

      {/* rows-per-page select — portal into fullscreen container */}
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

// ─── Toolbar — outside parent, reads state via ref ───────────────────────────
function CustomToolbar({ ctxRef }) {
  const ctx = ctxRef.current;

  // portal target: fullscreen element if active, else document.body
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
      {/* LEFT: Search + License Type filter */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <TextField
          size="small"
          placeholder="Search Licenses..."
          value={ctx.search}
          onChange={(e) => ctx.onSearchChange(e.target.value)}
          sx={{ minWidth: 220 }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>License Type</InputLabel>
          <Select
            value={ctx.licenseFilter}
            label="License Type"
            onChange={(e) => ctx.onFilterChange(e.target.value)}
            // ← portal into the fullscreen container so it's visible in fullscreen
            MenuProps={{ container: portalContainer }}
          >
            <MenuItem value="ALL">All Types</MenuItem>
            {ctx.licenseTypes.map((t) => (
              <MenuItem key={t.license_type_id} value={t.name}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* RIGHT: Actions */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/*
          GridToolbarColumnsButton opens a panel managed by DataGrid itself —
          it already respects the DataGrid's panel placement, no portal fix needed.
        */}
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

        <PermissionButton permission="create_clientlicenses" onClick={() => ctx.navigate(ctx.createPath)}>
          <Button variant="contained" size="small" startIcon={<AddIcon />} sx={{ textTransform: "none" }}>
            {ctx.createLabel}
          </Button>
        </PermissionButton>
        <PermissionButton
          permission="delete_clientlicenses"
          onClick={() => ctx.onBulkDelete(ctx.selectedRows)}
      >
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            disabled={ctx.selectedRows.length === 0}
            sx={{ textTransform: "none" }}
        >
            Delete ({ctx.selectedRows.length})
          </Button>
        </PermissionButton>
        <PermissionButton
          permission="reveal_clientlicenses"
          onClick={() => ctx.onBulkReveal(ctx.selectedRows)}
        >
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<FiEye />}
            disabled={ctx.selectedRows.length === 0}
            sx={{ textTransform: "none" }}
          >
            Reveal ({ctx.selectedRows.length})
          </Button>
        </PermissionButton>

        {(() => {
          const canExport = hasPermission("export_clientlicenses");
          return (
            <Select
              size="small"
              value="Export"
              disabled={!canExport}
              onChange={(e) => {
                if (!canExport) { toast.error("You don't have permission"); return; }
                if (e.target.value === "Excel") ctx.exportExcel();
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

// ─── Main LicenseDataTable ────────────────────────────────────────────────────
export default function LicenseDataTable({
  columns,
  data,
  createPath = "action/create",
  createLabel = "Create License",
  onBulkDelete,
  onBulkReveal,
  resetKey,
}) {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 100 });
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [licenseFilter, setLicenseFilter] = useState("ALL");
  const [licenseTypes, setLicenseTypes] = useState([]);

  // ref to the Paper wrapper — used as portal target in fullscreen mode
  const containerRef = useRef(null);

  // track fullscreen so panel (Columns button) uses disablePortal when fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    setSearch("");
    setLicenseFilter("ALL");
    setPaginationModel({ page: 0, pageSize: 100 });
    setRowSelectionModel([]);
  }, [resetKey]);

  useEffect(() => {
    axios
      .get(API.GET_CLIENT_LICENSE_TYPES, { headers: authHeaders() })
      .then((res) => {
        const d = res?.data;
        setLicenseTypes(Array.isArray(d) ? d : []);
      })
      .catch(console.error);
  }, []);

  const handleSearchChange = useCallback((val) => {
    setSearch(val);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const handleFilterChange = useCallback((val) => {
    setLicenseFilter(val);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const filteredData = data.filter((row) => {
    if (licenseFilter !== "ALL") {
      const matched = licenseTypes.find((t) => t.name === licenseFilter);
      if (matched && row.license_type_id !== matched.license_type_id) return false;
    }
    if (search) {
      return Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(search.toLowerCase())
      );
    }
    return true;
  });

  const activeAccessors = TYPE_COLUMNS[licenseFilter] ?? TYPE_COLUMNS.ALL;

  // ── Any column WITHOUT an `accessor` that DOES have a `render` fn is a
  // "custom" column. These fall into two buckets:
  //
  // 1. OVERRIDES — the column's header matches the label of an existing
  //    accessor column (e.g. "Product Key", which needs masking logic and
  //    so is defined with only a `render`, no `accessor`). These must
  //    render IN PLACE of that accessor column, not as a separate one —
  //    otherwise the field shows up twice: once plain via TYPE_COLUMNS,
  //    once masked via the trailing custom column.
  //
  // 2. TRUE ADDITIONS — no matching accessor (Files, Actions, or anything
  //    else added later). These still get appended at the end, in the
  //    order they appear in `columns`, with Actions conventionally last.
  const customColumns = columns.filter(
    (c) => !c.accessor && typeof c.render === "function"
  );

  const overrideByAccessor = {};
  const trailingCustomColumns = [];
  customColumns.forEach((c) => {
    const matchedAccessor = LABEL_TO_ACCESSOR[c.header];
    if (matchedAccessor && activeAccessors.includes(matchedAccessor)) {
      overrideByAccessor[matchedAccessor] = c;
    } else {
      trailingCustomColumns.push(c);
    }
  });

  const muiColumns = [
    {
      field: "__rowNum",
      headerName: "ID",
      width: 55,
      sortable: false,
      filterable: false,
      renderCell: (params) => params.row.__rowIndex,
    },
    // Dynamic columns — each has a sensible minWidth so content never overlaps.
    // If a custom render column overrides this accessor (e.g. Product Key
    // masking), use its renderCell instead of the default plain-value cell.
    ...activeAccessors.map((accessor) => {
      const override = overrideByAccessor[accessor];
      return {
        field: accessor,
        headerName: COLUMN_LABELS[accessor] ?? accessor,
        minWidth: COLUMN_MIN_WIDTHS[accessor] ?? 140,
        flex: 1,           // still grows to fill space, but never shrinks below minWidth
        sortable: !override, // masked/custom-rendered values aren't meaningfully sortable
        ...(override ? { renderCell: (params) => override.render(params.row) } : {}),
      };
    }),
    // True additional custom render columns (Files, Actions, ...) — order
    // preserved from `columns`, appended after all data columns.
    ...trailingCustomColumns.map((c) => {
      const defaults = CUSTOM_COLUMN_DEFAULTS[c.header] ?? {};
      return {
        field: `__${c.header.replace(/\s+/g, "_").toLowerCase()}`,
        headerName: c.header,
        width: c.width ?? defaults.width ?? 120,
        sortable: false,
        filterable: false,
        align: c.align ?? defaults.align,
        headerAlign: c.align ?? defaults.align,
        cellClassName: defaults.cellClassName,
        renderCell: (params) => c.render(params.row),
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

    // Keep selection scoped to the currently visible page only.
    setRowSelectionModel(ids.filter((id) => currentPageRowIds.has(id)));
  }, [currentPageRowIds]);
  
// custom columns that also define exportValue get appended to the export
// (Actions never will; Files will, once you add it below)
const exportableTrailing = trailingCustomColumns.filter((c) => c.exportValue);
  // ── export helpers ──────────────────────────────────────────────────────
  const exportExcel = useCallback(() => {
  const headers = [
    ...activeAccessors.map((acc) => COLUMN_LABELS[acc] ?? acc),
    ...exportableTrailing.map((c) => c.header),
  ];

  const cleanData = filteredData.map((row) => {
    const obj = {};
    activeAccessors.forEach((acc) => {
      const override = overrideByAccessor[acc];
      if (override) {
        // masked columns (Serial/Key/Password) — use their exportValue if
        // defined, otherwise mask by default so nothing leaks unintentionally
        obj[COLUMN_LABELS[acc] ?? acc] = override.exportValue
          ? override.exportValue(row)
          : "********";
        return;
      }
      let value = row[acc];
      if (typeof value === "object") value = "";
      obj[COLUMN_LABELS[acc] ?? acc] = value ?? "";
    });
    exportableTrailing.forEach((c) => {
      obj[c.header] = c.exportValue(row) ?? "";
    });
    return obj;
  });

  exportStyledExcel(headers, cleanData, "Licenses", "licenses.xlsx");
}, [filteredData, activeAccessors, overrideByAccessor, exportableTrailing]);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    const headers = activeAccessors.map((a) => COLUMN_LABELS[a] ?? a);
    const tableRows = filteredData.map((row) => activeAccessors.map((a) => row[a] ?? ""));
    autoTable(doc, { head: [headers], body: tableRows });
    doc.save("licenses.pdf");
  }, [filteredData, activeAccessors]);

  const toggleFullscreen = useCallback(() => {
    const elem = containerRef.current;
    if (!document.fullscreenElement) elem?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  const handleRefresh = useCallback(() => {
    setSearch("");
    setPaginationModel({ page: 0, pageSize: 100 });
    setRowSelectionModel([]);
    window.location.reload();
  }, []);

  // ── ctx ref ────────────────────────────────────────────────────────────
  const ctxRef = useRef({});
  ctxRef.current = {
    search,
    onSearchChange: handleSearchChange,
    licenseFilter,
    onFilterChange: handleFilterChange,
    licenseTypes,
    navigate,
    createPath,
    createLabel,
    exportExcel,
    exportPDF,
    onRefresh: handleRefresh,
    onFullscreen: toggleFullscreen,
    containerRef,          // ← passed so toolbar can use it as portal target
    selectedRows: rowSelectionModel,
    onBulkDelete,
    onBulkReveal,
  };

  const ToolbarSlot = useCallback(
    () => <CustomToolbar ctxRef={ctxRef} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Stable pagination slot — passes containerRef for portal fix
  const PaginationSlot = useCallback(
    () => <CustomPagination containerRef={containerRef} />,
    []
  );

  return (
    <Paper
      id="license-datatable-container"
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
        // ── auto-size columns on mount and whenever rows/columns change ──
        autosizeOnMount
        autosizeOptions={{
          includeHeaders: true,
          includeOutliers: true,
          outliersFactor: 1.5,
          expand: true,          // fill remaining width after sizing
        }}
        slots={{
          toolbar: ToolbarSlot,
          pagination: PaginationSlot,
        }}
        // disablePortal when fullscreen so the Columns panel isn't clipped
        slotProps={{
          panel: {
            disablePortal: isFullscreen,
          },
        }}
        sx={{
          border: 0,
          flex: 1,
          "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f4f4f5" },
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700, color: "#111827" },
          "& .MuiDataGrid-columnHeader": { color: "#111827" },
          "& .MuiDataGrid-cell": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
          "& .actions-cell": { overflow: "visible !important" },
          "& .files-cell": { overflow: "visible !important" },
          "& .MuiDataGrid-row": { overflow: "visible !important" },
        }}
      />
    </Paper>
  );
}