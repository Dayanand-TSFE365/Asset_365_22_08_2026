// ===============================
// File: src/pages/recycle/Recycle.jsx
// ===============================

import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiRotateCcw,
  FiTrash2,
  FiArchive,
  FiRefreshCw,
  FiClock,
  FiSearch,
  FiChevronsLeft,
  FiChevronsRight,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { API } from "../../../config/api";
import PermissionButton from "../../../components/common/PermissionButton";

// Page size choices for the pagination bar. 100 is the default view.
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 500];
const DEFAULT_PAGE_SIZE = 100;

// ─────────────────────────────────────────────────────────────
// 1. MODULE REGISTRY — add/enable modules here, nothing else
//    in this file needs to change.
// ─────────────────────────────────────────────────────────────
const RECYCLE_MODULES = [
  {
    id: "computer_assets",
    label: "Computer Assets",
    available: true,
    idField: "computer_detail_id",
    api: {
      list: API.GET_DELETED_COMPUTER_ASSETS,
      restore: API.RESTORE_COMPUTER_ASSET,
      permanentDelete: API.PERMANENT_DELETE_COMPUTER_ASSET,
    },
    permissions: {
      restore: "restore_assets",
      permanentDelete: "permanent_delete_assets",
    },
    columns: [
      { header: "Asset No", accessor: "asset_no" },
      { header: "Asset Type", accessor: "asset_type" },
      { header: "PC Name", accessor: "pc_name" },
      { header: "Administrator", accessor: "administrator_name" },
      { header: "Assigned To", accessor: "assigned_to" },
    ],
    filter: {
      field: "asset_type",
      label: "Asset Type",
      staticOptions: [
        { value: "COMPANY", label: "Company" },
        { value: "CLIENT", label: "Client" },
      ],
    },
  },
  {
    id: "client_licenses",
    label: "Software Licenses",
    available: true,
    idField: "license_id",
    api: {
      list: API.GET_DELETED_CLIENT_LICENSES,
      restore: API.RESTORE_CLIENT_LICENSE,
      permanentDelete: API.PERMANENT_DELETE_CLIENT_LICENSE,
    },
    permissions: {
      restore: "restore_clientlicenses",
      permanentDelete: "permanent_delete_clientlicenses",
    },
    lookups: [
      {
        id: "license_type",
        api: API.GET_CLIENT_LICENSE_TYPES,
        rowField: "license_type_id",
        valueField: "license_type_id",
        labelField: "name",
        resultField: "license_type_label",
      },
      {
        id: "supplier",
        api: API.GET_SUPPLIERS,
        rowField: "supplier_id",
        valueField: "id",
        labelField: "name",
        resultField: "supplier_label",
      },
    ],
    columns: [
      { header: "Job / PO No", accessor: "job_po_no" },
      { header: "Client Name", accessor: "client_name" },
      { header: "Customer PO", accessor: "customer_po" },
      { header: "Product Name", accessor: "product_name" },
      { header: "License Type", accessor: "license_type_label" },
      { header: "Supplier", accessor: "supplier_label" },
      { header: "Expired On", accessor: "expired_on" },
    ],
    // dropdown filter — points at one of the `lookups` above by id, so it
    // reuses that lookup's fetched options and row field automatically.
    filter: { lookupId: "license_type", label: "License Type" },
  },
  {
    id: "license_files",
    label: "Software Licenses Files",
    available: true,
    idField: "file_id",
    api: {
      list: API.GET_DELETED_LICENSE_FILES,
      restore: API.RESTORE_LICENSE_FILE,
      permanentDelete: API.PERMANENT_DELETE_LICENSE_FILE,
    },
    // permission strings — adjust to match whatever you name them
    permissions: {
      restore: "restore_license_files",
      permanentDelete: "permanent_delete_license_files",
    },
    userFields: ["uploaded_by"],
    columns: [
      { header: "License ID", accessor: "license_id" },
      { header: "File Name", accessor: "original_file_name" },   
      { header: "File Size", render: (row) => formatFileSize(row.file_size) },
      { header: "Uploaded By", accessor: "uploaded_by_name" },
      { header: "Uploaded At", render: (row) => formatDateTimeIST(row.uploaded_at) },
    ],
  },
  {
    id: "jobs",
    label: "Panel Jobs",
    available: true,
    idField: "job_id",
    api: {
      list: API.GET_DELETED_JOBS_NEW,
      restore: API.RESTORE_JOB_NEW,
      permanentDelete: API.PERMANENT_DELETE_JOB_NEW,
    },
    permissions: {
      restore: "restore_jobs",
      permanentDelete: "permanent_delete_jobs",
    },
    lookups: [
      {
        id: "job_status",
        api: API.GET_JOB_STATUS,
        rowField: "job_status_id",
        valueField: "status_id",
        labelField: "status_name",
        resultField: "job_status_label",
      },
    ],
    columns: [
      { header: "Job No", accessor: "job_no" },
      { header: "Customer", accessor: "customer_name" },
      { header: "End User", accessor: "end_user" },
      { header: "SO No", accessor: "so_no" },
      { header: "Job Date", accessor: "job_date" },
      { header: "Job Status", accessor: "job_status_label" },
    ],
    filter: { lookupId: "job_status", label: "Job Status" },
  },
  {
    id: "sub_jobs",
    label: "Panel Sub Jobs",
    available: true,
    idField: "sub_job_id",
    api: {
      list: API.GET_DELETED_SUB_JOBS,
      restore: API.RESTORE_SUB_JOB,
      permanentDelete: API.PERMANENT_DELETE_SUB_JOB,
    },
    permissions: {
      restore: "restore_sub_jobs",
      permanentDelete: "permanent_delete_sub_jobs",
    },
    columns: [
      { header: "Sub Job No", accessor: "sub_job_no" },
      { header: "Panel Description", accessor: "panel_description" },
      { header: "Qty", accessor: "panel_quantity" },
      { header: "Remarks", accessor: "remarks" },
      {
        // same boolean doc-fields JobList's Panels dialog tracks (as_build,
        // soft_copy, ..., backup_file) — shown here as a quick X/Y count
        // instead of one column per flag, so the table stays readable.
        header: "Docs Complete",
        render: (row) => {
          const DOC_KEYS = [
            "as_build", "soft_copy", "hard_copy", "factory_test_report",
            "bom_excel", "bom_pdf", "bom_updated_on_erp", "bom_updated_on_tally",
            "photos", "notes_and_tech_note", "additional_data", "mom_uploaded",
            "backup_file",
          ];
          const done = DOC_KEYS.filter((k) => !!row[k]).length;
          return `${done}/${DOC_KEYS.length}`;
        },
      },
    ],
  },
  {
    id: "job_files",
    label: "Panel Job Files",
    available: true,
    idField: "file_id",
    api: {
      list: API.GET_DELETED_JOB_FILES_NEW,
      restore: API.RESTORE_JOB_FILE_NEW,
      permanentDelete: API.PERMANENT_DELETE_JOB_FILE_NEW,
    },
    // permission strings — adjust to match whatever you name them
    permissions: {
      restore: "restore_job_files",
      permanentDelete: "permanent_delete_job_files",
    },
    userFields: ["uploaded_by"],
    columns: [
      { header: "Sub Job ID", accessor: "sub_job_id" },
      { header: "File Type", accessor: "file_type" },
      { header: "File Name", accessor: "original_file_name" },
      { header: "File Size", render: (row) => formatFileSize(row.file_size) },
      { header: "Uploaded By", accessor: "uploaded_by_name" },
      { header: "Uploaded At", render: (row) => formatDateTimeIST(row.uploaded_at) },
    ],
    // file_type is an enum-like string (AS_BUILD, SOFT_COPY, PLC_BACKUP, ...)
    // — no lookup endpoint needed, just filter on whatever values actually
    // show up in the deleted set.
    filter: { field: "file_type", label: "File Type", deriveFromData: true },
  },
  {
    id: "tickets",
    label: "Tickets",
    available: true,
    idField: "id", // the API returns the primary key as plain `id`, not `ticket_id`
    api: {
      list: API.GET_DELETED_TICKETS,
      restore: API.RESTORE_TICKET,
      permanentDelete: API.PERMANENT_DELETE_TICKET,
    },
    permissions: {
      restore: "restore_tickets",
      permanentDelete: "permanent_delete_tickets",
    },
    userFields: ["assigned_to", "created_by"],
    lookups: [
      {
        id: "priority",
        api: API.GET_TICKET_PRIORITIES,
        rowField: "priority_id",
        valueField: "priority_id",
        labelField: "name",
        resultField: "priority_label",
      },
      {
        id: "status",
        api: API.GET_TICKET_STATUS,
        rowField: "status_id",
        valueField: "status_id",
        labelField: "name",
        resultField: "status_label",
      },
    ],
    columns: [
      { header: "Ticket No", accessor: "ticket_no" },
      { header: "Customer", accessor: "customer_name" },
      { header: "Agenda", accessor: "agenda" },
      { header: "Priority", accessor: "priority_label" },
      { header: "Status", accessor: "status_label" },
      { header: "Assigned To", accessor: "assigned_to_name" },
      { header: "Due Date", accessor: "due_date" },
      { header: "Venue", accessor: "venue" },
    ],
    filter: { lookupId: "status", label: "Status" },
  },
  {
    id: "tasks",
    label: "Tasks",
    available: true,
    idField: "id", // API returns the primary key as plain `id`, not `task_id`
    api: {
      list: API.GET_DELETED_TASKS,
      restore: API.RESTORE_TASK,
      permanentDelete: API.PERMANENT_DELETE_TASK,
    },
    permissions: {
      restore: "restore_tasks",
      permanentDelete: "permanent_delete_tasks",
    },
    userFields: ["assigned_to", "created_by"],
    columns: [
      { header: "Title", accessor: "title" },
      { header: "Priority", accessor: "priority" },
      { header: "Status", accessor: "status" },
      { header: "Department", accessor: "department" },
      { header: "Assigned To", accessor: "assigned_to_name" },
      { header: "Deadline", accessor: "deadline" },
    ],
    filter: { field: "status", label: "Status", deriveFromData: true },
  },
];

// ─────────────────────────────────────────────────────────────
// 2. Helpers
// ─────────────────────────────────────────────────────────────
function formatDateTimeIST(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d)) return "-";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatFileSize(bytes) {
  if (bytes == null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAuthHeaders() {
  const token = sessionStorage.getItem("access_token");
  return { Authorization: `Bearer ${token}` };
}

// user_id -> display name, e.g. adarsh.verma@tsfe365.com -> "Adarsh Verma"
// (same convention used elsewhere in the app for uploaded_by/assigned_to)
function emailToName(email) {
  if (!email) return null;
  const local = email.split("@")[0];
  return local
    .split(".")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function IconBtn({ onClick, children, label, color, disabled }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
      >
        {children}
      </button>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none">
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. Main component
// ─────────────────────────────────────────────────────────────
export default function Recycle() {
  const [activeModuleId, setActiveModuleId] = useState(
    RECYCLE_MODULES.find((m) => m.available)?.id || RECYCLE_MODULES[0].id
  );
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // search / filter
  const [search, setSearch] = useState("");
  const [filterValue, setFilterValue] = useState("ALL");

  // pagination
  const [page, setPage] = useState(1); // 1-indexed for a friendlier "Go to page" UX
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [goToInput, setGoToInput] = useState("");

  const activeModule = useMemo(
    () => RECYCLE_MODULES.find((m) => m.id === activeModuleId),
    [activeModuleId]
  );

  const getRowId = useCallback(
    (row) => row[activeModule.idField] ?? row.id,
    [activeModule]
  );

  const fetchDeleted = useCallback(async () => {
    if (!activeModule.available || !activeModule.api.list) return;
    setLoading(true);
    try {
      const res = await axios.get(activeModule.api.list, {
        headers: getAuthHeaders(),
      });
      setData(Array.isArray(res.data) ? res.data : res.data?.items || []);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to load deleted ${activeModule.label}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeModule]);

  // reset everything when switching module tabs
  useEffect(() => {
    setSelectedIds([]);
    setSearch("");
    setFilterValue("ALL");
    setPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
    setGoToInput("");
    fetchDeleted();
  }, [activeModuleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [lookupResults, setLookupResults] = useState({});
  useEffect(() => {
    const lookups = activeModule.lookups || [];
    if (!lookups.length) { setLookupResults({}); return; }
    setLookupResults({}); // clear stale data from the previous module first
    lookups.forEach((lk) => {
      axios
        .get(lk.api, { headers: getAuthHeaders() })
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : [];
          const options = list.map((item) => ({
            value: item[lk.valueField],
            label: item[lk.labelField],
          }));
          setLookupResults((prev) => ({ ...prev, [lk.id]: options }));
        })
        .catch(() => setLookupResults((prev) => ({ ...prev, [lk.id]: [] })));
    });
  }, [activeModule]);

  const [userCache, setUserCache] = useState({});
  useEffect(() => {
    const fields = activeModule.userFields || [];
    if (!fields.length || !data.length) return;
    const idsNeeded = new Set();
    data.forEach((row) => {
      fields.forEach((f) => {
        const v = row[f];
        if (v != null && !(v in userCache)) idsNeeded.add(v);
      });
    });
    idsNeeded.forEach((id) => {
      axios
        .get(API.GET_MY_PROFILE(id), { headers: getAuthHeaders() })
        .then((res) => {
          const email = res.data?.email || "";
          const name = emailToName(email) || email || `#${id}`;
          setUserCache((prev) => ({ ...prev, [id]: name }));
        })
        .catch(() => setUserCache((prev) => ({ ...prev, [id]: `#${id}` })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, activeModule]);

  const enrichedData = useMemo(() => {
    const lookups = activeModule.lookups || [];
    const userFields = activeModule.userFields || [];
    if (!lookups.length && !userFields.length) return data;
    return data.map((row) => {
      const extra = {};
      lookups.forEach((lk) => {
        const options = lookupResults[lk.id];
        if (!options) return; // not resolved yet — leave field unset
        const map = new Map(options.map((o) => [String(o.value), o.label]));
        extra[lk.resultField] = map.get(String(row[lk.rowField])) ?? "-";
      });
      userFields.forEach((f) => {
        const uid = row[f];
        extra[`${f}_name`] = uid != null ? userCache[uid] ?? "…" : "-";
      });
      return { ...row, ...extra };
    });
  }, [data, activeModule, lookupResults, userCache]);

  const resolvedFilter = useMemo(() => {
    const f = activeModule.filter;
    if (!f) return null;
    if (f.staticOptions) {
      return { field: f.field, label: f.label, options: f.staticOptions };
    }
    if (f.lookupId) {
      const lk = (activeModule.lookups || []).find((l) => l.id === f.lookupId);
      if (!lk) return null;
      return { field: lk.rowField, label: f.label, options: lookupResults[lk.id] || [] };
    }
    if (f.deriveFromData) {
      const values = [
        ...new Set(
          enrichedData
            .map((row) => row[f.field])
            .filter((v) => v !== null && v !== undefined && v !== "")
        ),
      ].sort();
      return {
        field: f.field,
        label: f.label,
        options: values.map((v) => ({ value: v, label: String(v) })),
      };
    }
    return null;
  }, [activeModule, lookupResults, enrichedData]);

  // ── search + filter (client-side, over the fetched deleted set) ─────────
  const filteredData = useMemo(() => {
    let rows = enrichedData;
    if (resolvedFilter && filterValue !== "ALL") {
      rows = rows.filter((row) => String(row[resolvedFilter.field]) === String(filterValue));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q))
      );
    }
    return rows;
  }, [enrichedData, search, filterValue, resolvedFilter]);

  // ── pagination derived from filteredData ─────────────────────────────────
  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  useEffect(() => {
    // clamp page whenever the filtered set or page size shrinks it out of range
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]); // eslint-disable-line react-hooks/exhaustive-deps

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const fromRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, totalRows);

  const handleGoToPage = () => {
    const n = parseInt(goToInput, 10);
    if (!n || n < 1 || n > totalPages) {
      toast.error(`Enter a page between 1 and ${totalPages}`);
      return;
    }
    setPage(n);
    setGoToInput("");
  };

  // ── selection — scoped to the CURRENT PAGE only, matching how the
  // shared DataTable's checkboxSelectionVisibleOnly behaves ───────────────
  const toggleRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const pageRowIds = useMemo(() => pageRows.map(getRowId), [pageRows, getRowId]);
  const toggleAll = () => {
    const allOnPageSelected = pageRowIds.every((id) => selectedIds.includes(id)) && pageRowIds.length > 0;
    setSelectedIds((prev) =>
      allOnPageSelected
        ? prev.filter((id) => !pageRowIds.includes(id))
        : [...new Set([...prev, ...pageRowIds])]
    );
  };

  // ── restore ────────────────────────────────────────────────
  const restoreOne = async (id) => {
    try {
      await axios.patch(activeModule.api.restore(id), null, {
        headers: getAuthHeaders(),
      });
      toast.success("Item restored successfully");
      setData((prev) => prev.filter((row) => getRowId(row) !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to restore item");
    }
  };

  const restoreSelected = async () => {
    if (!selectedIds.length) {
      toast.error("Select at least one item");
      return;
    }
    try {
      await Promise.all(
        selectedIds.map((id) =>
          axios.patch(activeModule.api.restore(id), null, {
            headers: getAuthHeaders(),
          })
        )
      );
      toast.success(`${selectedIds.length} item(s) restored`);
      setData((prev) => prev.filter((row) => !selectedIds.includes(getRowId(row))));
      setSelectedIds([]);
    } catch (err) {
      toast.error("Some items failed to restore");
    }
  };

  // ── permanent delete ──────────────────────────────────────
  const permanentDeleteOne = async (id) => {
    const confirmed = window.confirm(
      "This will permanently delete this item. This action cannot be undone. Continue?"
    );
    if (!confirmed) return;
    try {
      await axios.delete(activeModule.api.permanentDelete(id), {
        headers: getAuthHeaders(),
      });
      toast.success("Item permanently deleted");
      setData((prev) => prev.filter((row) => getRowId(row) !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete item");
    }
  };

  const permanentDeleteSelected = async () => {
    if (!selectedIds.length) {
      toast.error("Select at least one item");
      return;
    }
    const confirmed = window.confirm(
      `Permanently delete ${selectedIds.length} selected item(s)? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await Promise.all(
        selectedIds.map((id) =>
          axios.delete(activeModule.api.permanentDelete(id), {
            headers: getAuthHeaders(),
          })
        )
      );
      toast.success(`${selectedIds.length} item(s) permanently deleted`);
      setData((prev) => prev.filter((row) => !selectedIds.includes(getRowId(row))));
      setSelectedIds([]);
    } catch (err) {
      toast.error("Some items failed to delete");
    }
  };

  const allSelected =
    pageRowIds.length > 0 && pageRowIds.every((id) => selectedIds.includes(id));

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <FiArchive size={20} />
        <h1 className="text-xl font-semibold">Recycle Bin</h1>
      </div>

      {/* ── Module tabs ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
        {RECYCLE_MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => m.available && setActiveModuleId(m.id)}
            disabled={!m.available}
            className={`px-3 py-1.5 rounded-t text-sm font-medium transition-colors
              ${
                activeModuleId === m.id
                  ? "bg-indigo-600 text-white"
                  : m.available
                  ? "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  : "bg-zinc-50 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed"
              }`}
          >
            {m.label}
            {!m.available && (
              <span className="ml-2 text-[10px] uppercase tracking-wide opacity-70">
                Coming soon
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      {activeModule.available && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <FiSearch
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={`Search ${activeModule.label}...`}
                className="pl-8 pr-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 min-w-[220px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {resolvedFilter && (
              <select
                value={filterValue}
                onChange={(e) => {
                  setFilterValue(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All {resolvedFilter.label}</option>
                {resolvedFilter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1.5 text-sm text-zinc-500">
              <FiClock size={14} />
              {loading ? "Loading…" : `${totalRows} deleted item(s)`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IconBtn
              onClick={fetchDeleted}
              label="Refresh"
              color="text-zinc-600"
            >
              <FiRefreshCw size={16} />
            </IconBtn>

            <PermissionButton
              permission={activeModule.permissions?.restore}
              onClick={restoreSelected}
            >
              <button
                disabled={!selectedIds.length}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-700"
              >
                <FiRotateCcw size={14} />
                Restore Selected
              </button>
            </PermissionButton>

            <PermissionButton
              permission={activeModule.permissions?.permanentDelete}
              onClick={permanentDeleteSelected}
            >
              <button
                disabled={!selectedIds.length}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-600 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700"
              >
                <FiTrash2 size={14} />
                Delete Permanently
              </button>
            </PermissionButton>
          </div>
        </div>
      )}

      {/* ── Table / states ──────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto border border-zinc-200 dark:border-zinc-700 rounded">
        {!activeModule.available ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-2 py-16">
            <FiArchive size={28} />
            <p className="text-sm">
              Recycle bin for <strong>{activeModule.label}</strong> isn't
              wired up yet — add the deleted/restore/permanent endpoints and
              flip <code>available: true</code> in the module registry.
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full py-16 text-zinc-400 text-sm">
            Loading deleted items…
          </div>
        ) : totalRows === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-2 py-16">
            <FiArchive size={28} />
            <p className="text-sm">
              {search || filterValue !== "ALL"
                ? "No deleted items match your search/filter."
                : `Recycle bin is empty for ${activeModule.label}.`}
            </p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800 sticky top-0">
              <tr>
                <th className="p-2 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </th>
                {activeModule.columns.map((col) => (
                  <th
                    key={col.header}
                    className="p-2 text-left font-semibold whitespace-nowrap"
                  >
                    {col.header}
                  </th>
                ))}
                <th className="p-2 text-left font-semibold whitespace-nowrap">
                  Deleted At
                </th>
                <th className="p-2 text-left font-semibold whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const id = getRowId(row);
                return (
                  <tr
                    key={id}
                    className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(id)}
                        onChange={() => toggleRow(id)}
                      />
                    </td>
                    {activeModule.columns.map((col) => (
                      <td key={col.header} className="p-2 whitespace-nowrap">
                        {col.render ? col.render(row) : row[col.accessor] ?? "-"}
                      </td>
                    ))}
                    <td className="p-2 whitespace-nowrap text-zinc-500">
                      {formatDateTimeIST(row.deleted_at ?? row.updated_at)}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <PermissionButton
                          permission={activeModule.permissions?.restore}
                          onClick={() => restoreOne(id)}
                        >
                          <IconBtn
                            color="text-emerald-600"
                            label="Restore"
                          >
                            <FiRotateCcw size={16} />
                          </IconBtn>
                        </PermissionButton>

                        <PermissionButton
                          permission={activeModule.permissions?.permanentDelete}
                          onClick={() => permanentDeleteOne(id)}
                        >
                          <IconBtn color="text-red-600" label="Delete Permanently">
                            <FiTrash2 size={16} />
                          </IconBtn>
                        </PermissionButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination bar ──────────────────────────────────── */}
      {activeModule.available && totalRows > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <span>
              Showing {fromRow}–{toRow} of {totalRows}
            </span>

            <div className="flex items-center gap-1 ml-3">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <IconBtn
              onClick={() => setPage(1)}
              disabled={page === 1}
              label="First page"
              color="text-zinc-600"
            >
              <FiChevronsLeft size={16} />
            </IconBtn>
            <IconBtn
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              label="Previous page"
              color="text-zinc-600"
            >
              <FiChevronLeft size={16} />
            </IconBtn>

            <span className="px-2 text-zinc-600">
              Page {page} / {totalPages}
            </span>

            <IconBtn
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              label="Next page"
              color="text-zinc-600"
            >
              <FiChevronRight size={16} />
            </IconBtn>
            <IconBtn
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              label="Last page"
              color="text-zinc-600"
            >
              <FiChevronsRight size={16} />
            </IconBtn>

            <div className="flex items-center gap-1 ml-3">
              <span className="text-zinc-500">Go to:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={goToInput}
                onChange={(e) => setGoToInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGoToPage()}
                placeholder={String(page)}
                className="w-16 px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleGoToPage}
                className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
              >
                Go
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}