// ===============================
// ClientLicenseList.jsx
// ===============================

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FiCopy, FiEdit, FiTrash2, FiEye } from "react-icons/fi";
import DataTable from "../components/common/DataTable";
import toast from "react-hot-toast";
import { API } from "../../../config/api";
import PermissionButton from "../../../components/common/PermissionButton";
import { useAuth } from "../../../auth/AuthContext";
import { formatDateOnlyIST } from "../../../utils/exportExcel";
import {
  Box, Typography, Tooltip, Popover, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import FileViewerDialog, { getPreviewKind } from "../../../components/common/FileViewerDialog";

// ── formatters ────────────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}
// email → display name, e.g. adarsh.verma@tsfe365.com → Adarsh Verma
function emailToName(email) {
  if (!email) return null;
  const local = email.split("@")[0];
  return local.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

// ── Files cell — tick/cross, hover hint, click opens the file-details popover ─
function FilesCell({ licenseId, entry, fileCount, onHover, onOpen }) {
  // fileStatus API se aaya hua count
  const done = fileCount > 0;

  const hoverHint = done
    ? `${fileCount} file${fileCount === 1 ? "" : "s"} — click for details`
    : "No file uploaded";

  return (
    <Tooltip
      title={hoverHint}
      onOpen={() => {
        if (!entry) onHover(licenseId);
      }}
      arrow
    >
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => onOpen(e, licenseId)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 26,
          height: 26,
          borderRadius: 8,
          fontSize: "0.85rem",
          cursor: "pointer",
          background: done ? "#e7f7ee" : "#fdecec",
          color: done ? "#1f9d5c" : "#e0574c",
        }}
      >
        {done ? "✓" : "✕"}
      </span>
    </Tooltip>
  );
}

// ── Details popover — file table for a license ───────────────────────────────
function LicenseFilesPopover({
  anchorEl, onClose, licenseLabel, entry, onDownload, onView,
  uploaderCache, onResolveUploader,
}) {
  const open = Boolean(anchorEl);
  const loading = !!entry?.loading;
  const error = !!entry?.error;
  const files = entry && !loading && !error
    ? (entry.files || []).filter((f) => !f.is_deleted)
    : [];

  // resolve uploader names for whatever files are showing
  useEffect(() => {
    if (!open || !files.length) return;
    const ids = [...new Set(files.map((f) => f.uploaded_by).filter((id) => id != null))];
    ids.forEach((id) => { if (!uploaderCache[id]) onResolveUploader(id); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, files]);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      slotProps={{ paper: { sx: { borderRadius: 3, boxShadow: "0 16px 48px rgba(15,23,42,0.14)", mt: 0.5 } } }}
    >
      <Box sx={{ width: 460, maxWidth: "90vw" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, pt: 1.75, pb: 1 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#1e293b" }}>License Files</Typography>
            <Typography variant="caption" color="text.secondary">{licenseLabel}</Typography>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : error ? (
          <Typography variant="body2" color="error.main" sx={{ px: 2, pb: 2 }}>
            Failed to load file details.
          </Typography>
        ) : files.length === 0 ? (
          <Box sx={{ px: 2, pb: 3, textAlign: "center" }}>
            <InsertDriveFileIcon sx={{ fontSize: 28, color: "text.disabled", mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary">No files uploaded yet.</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 280, borderTop: "1px solid", borderColor: "divider" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", color: "text.secondary", bgcolor: "#f8fafc" }}>File</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", color: "text.secondary", bgcolor: "#f8fafc" }}>Size</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", color: "text.secondary", bgcolor: "#f8fafc" }}>Uploaded</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", color: "text.secondary", bgcolor: "#f8fafc" }}>By</TableCell>
                  <TableCell align="right" sx={{ bgcolor: "#f8fafc" }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((f) => {
                  const uploader = f.uploaded_by != null ? uploaderCache[f.uploaded_by] : null;
                  const uploaderName = uploader?.loading
                    ? "…"
                    : (uploader?.name || (f.uploaded_by != null ? `#${f.uploaded_by}` : "—"));
                  const previewKind = getPreviewKind(f.original_file_name);
                  return (
                    <TableRow key={f.file_id} hover>
                      <TableCell sx={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.78rem" }}>
                        {f.original_file_name}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                        {formatSize(f.file_size)}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.76rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                        {formatDate(f.uploaded_at)}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                        {uploaderName}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {previewKind && (
                          <PermissionButton permission="view_file_clientlicenses" onClick={() => onView(f)}>
                            <IconButton size="small" title="View File">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </PermissionButton>
                        )}
                        <PermissionButton permission="download_clientlicenses" onClick={() => onDownload(f)}>
                          <IconButton size="small" title="Download">
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </PermissionButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Popover>
  );
}

export default function ClientLicenseList({ title, filter }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const canRevealKey =
  user?.role?.toLowerCase() === "superadmin" ||
  user?.permissions?.includes("reveal_clientlicenses");

  const [data, setData] = useState([]);
  const [revealedSerials, setRevealedSerials] = useState({});
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [suppliers, setSuppliers] = useState([]);

  // license_id -> { loading, files, error }
  const [fileCache, setFileCache] = useState({});
  const [fileStatus, setFileStatus] = useState({});
  // user_id -> { loading, name }
  const [uploaderCache, setUploaderCache] = useState({});
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [popoverLicense, setPopoverLicense] = useState(null); // { id, label }

  // file viewer dialog state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);      // raw file object (for download/retry)
  const [viewerKind, setViewerKind] = useState(null);       // "pdf" | "image" | "text" | null
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState(false);
  const [viewerPdfData, setViewerPdfData] = useState(null);
  const [viewerImageUrl, setViewerImageUrl] = useState(null);
  const [viewerTextContent, setViewerTextContent] = useState("");

  const token = sessionStorage.getItem("access_token");
  const headers = { Authorization: `Bearer ${token}` };
  const dashboardFilter = new URLSearchParams(location.search).get("dashboard");

  const findSupplier = (id) =>
  suppliers.find((item) => item.id === id)?.name || "-";

  useEffect(() => {
  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(API.GET_SUPPLIERS, { headers });
      setSuppliers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  fetchSuppliers();
  }, []);
  useEffect(() => {
    fetchLicenses();
    fetchFileStatus();
  }, [suppliers, dashboardFilter]);

  const fetchLicenses = async () => {
    try {
      const res = await axios.get(API.GET_CLIENT_LICENSES, { headers });
      console.log("📦 LICENSE API RESPONSE:", res.data);

      let formatted = (res.data || []).map((item) => ({
        id: item.license_id,

        license_type_id: item.license_type_id,

        job_po_no: item.job_po_no,

        client_name: item.client_name,

        customer_po: item.customer_po,

        product_name: item.product_name,

        description: item.description,

        serial_number: item.serial_number,

        product_key: item.product_key,

        email_id: item.email_id,

        password: item.password,

        note_1: item.note_1,

        note_2: item.note_2,

        remarks: item.remarks,

        expired_on: item.expired_on,

        supplier_id: item.supplier_id,

        supplier: findSupplier(item.supplier_id),

        order_number: item.order_number,

        purchase_order_number: item.purchase_order_number,

        purchase_date: item.purchase_date,

        purchase_cost: item.purchase_cost,

        contract: item.contract,

        created_at: item.created_at,

        updated_at: item.updated_at,
      }));

      const now = new Date();
      const requestedFilter = dashboardFilter || filter;

      if (requestedFilter === "expired") {
        formatted = formatted.filter((i) => {
          const d = new Date(i.expired_on);
          return (
            !i.expired_on ||    // null / "" / undefined
            isNaN(d) ||         // invalid date
            d < now             // past date
          );
        });
      }

      if (requestedFilter === "expiring") {
        formatted = formatted.filter((i) => {
          if (!i.expired_on) return false;

          const d = new Date(i.expired_on);
          if (isNaN(d)) return false;

          const diff = (d - now) / 86400000;
          return diff >= 0 && diff <= 30;
        });
      }

      setData(formatted);
      setFileCache({});
    } catch (error) {
      console.error("Failed to fetch licenses:", error);
    }
  };

  const fetchFileStatus = async () => {
    try {
      const res = await axios.get(API.GET_LICENSE_FILE_STATUS, {
        headers,
      });

      setFileStatus(res.data || {});
    } catch (err) {
      console.error("Failed to fetch file status:", err);
    }
  };

  // ── license files: fetch on hover/click, cache per license ─────────────────
  const fetchLicenseFiles = useCallback(async (licenseId) => {
    setFileCache((prev) => ({ ...prev, [licenseId]: { loading: true, files: prev[licenseId]?.files || [] } }));
    try {
      const res = await axios.get(API.GET_LICENSE_FILES(licenseId), { headers });
      setFileCache((prev) => ({ ...prev, [licenseId]: { loading: false, files: res.data || [] } }));
    } catch (err) {
      console.error("Failed to fetch license files:", err);
      setFileCache((prev) => ({ ...prev, [licenseId]: { loading: false, files: [], error: true } }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── eagerly warm the file cache for every visible row so the tick/cross
  // icon reflects the real state on first paint instead of only after the
  // user hovers/clicks (previously every row showed ✕ until interacted with,
  // then flipped to ✓ once the fetch resolved) ───────────────────────────────
  useEffect(() => {
    // data.forEach((row) => {
    //   if (!fileCache[row.id]) fetchLicenseFiles(row.id);
    // });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUploader = useCallback(async (userId) => {
    setUploaderCache((prev) => ({ ...prev, [userId]: { loading: true, name: null } }));
    try {
      const res = await axios.get(API.GET_MY_PROFILE(userId), { headers });
      const email = res.data?.email || "";
      setUploaderCache((prev) => ({ ...prev, [userId]: { loading: false, name: emailToName(email) || email || null } }));
    } catch {
      setUploaderCache((prev) => ({ ...prev, [userId]: { loading: false, name: null } }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownloadFile = useCallback(async (file) => {
    try {
      const res = await axios.get(API.DOWNLOAD_LICENSE_FILE(file.file_id), {
        headers, responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.original_file_name || "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download file.");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── view (fetches the file and hands it to FileViewerDialog to render
  // inline — PDFs go through react-pdf/pdf.js so rendering never depends
  // on the server's Content-Type header; images/text are shown directly) ──
  const handleViewFile = useCallback(async (file) => {
    const kind = getPreviewKind(file.original_file_name);
    if (!kind) return; // shouldn't happen — button is hidden for these

    setViewerFile(file);
    setViewerKind(kind);
    setViewerOpen(true);
    setViewerLoading(true);
    setViewerError(false);
    setViewerPdfData(null);
    setViewerImageUrl(null);
    setViewerTextContent("");

    try {
      const res = await axios.get(API.DOWNLOAD_LICENSE_FILE(file.file_id), {
        headers, responseType: "blob",
      });
      const blob = res.data;

      if (kind === "pdf") {
        const buffer = await blob.arrayBuffer();
        setViewerPdfData({ data: new Uint8Array(buffer) });
      } else if (kind === "image") {
        setViewerImageUrl(window.URL.createObjectURL(blob));
      } else if (kind === "text") {
        setViewerTextContent(await blob.text());
      }
    } catch (err) {
      console.error("Failed to load file preview:", err);
      setViewerError(true);
    } finally {
      setViewerLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCloseViewer = useCallback(() => {
    if (viewerImageUrl) window.URL.revokeObjectURL(viewerImageUrl);
    setViewerOpen(false);
    setViewerFile(null);
    setViewerKind(null);
    setViewerPdfData(null);
    setViewerImageUrl(null);
    setViewerTextContent("");
    setViewerError(false);
  }, [viewerImageUrl]);

  const handleOpenFilesPopover = useCallback((event, licenseId) => {
    setPopoverAnchor(event.currentTarget);
    const row = data.find((r) => r.id === licenseId);
    setPopoverLicense({ id: licenseId, label: row?.product_name || row?.client_name || `License ${licenseId}` });
    if (!fileCache[licenseId]) fetchLicenseFiles(licenseId);
  }, [data, fileCache, fetchLicenseFiles]);

  const handleClosePopover = useCallback(() => {
    setPopoverAnchor(null);
    setPopoverLicense(null);
  }, []);

  const handleBulkDelete = async (ids) => {
  if (!ids.length) {
    toast.error("Please select at least one license.");
    return;
  }

  const confirmed = window.confirm(
    `Delete ${ids.length} selected license(s)?`
  );

  if (!confirmed) return;

  try {
    await axios.delete(API.BULK_DELETE_CLIENT_LICENSES, {
      headers,
      data: {
        ids,
      },
    });

    toast.success(`${ids.length} license(s) deleted successfully.`);

    fetchLicenses();
  } catch (error) {
    console.error(error);
    toast.error(
      error.response?.data?.detail || "Bulk delete failed."
    );
  }
};

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
    //   `Are you sure you want to delete license \"${row.name}\"?`
    `Are you sure you want to delete "${row.product_name}"?`
    );

    if (!confirmed) return;

    try {
      await axios.delete(API.DELETE_CLIENT_LICENSE(row.id), {
        headers,
      });

      toast.success("License deleted successfully!");

      // Refresh the active list after soft delete
      fetchLicenses();
    } catch (error) {
      console.error("Delete failed:", error.response?.data || error);
      toast.error(error.response?.data?.detail || "Failed to delete license.");
    }
  };
  const handleBulkReveal = async (ids) => {
  if (!ids.length) {
    toast.error("Select at least one license");
    return;
  }

  try {
    const token = sessionStorage.getItem("access_token");

    const revealedKeys = {};
    const revealedSerials = {};
    const revealedPasswords = {};

    await Promise.all(
      ids.map(async (id) => {
        const res = await axios.get(
          API.REVEAL_PRODUCT_KEY(id),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        revealedKeys[id] = res.data.product_key;
        revealedSerials[id] = res.data.serial_number;
        revealedPasswords[id] = res.data.password;
      })
    );

    setData((prev) =>
      prev.map((item) => ({
        ...item,
        ...(revealedKeys[item.id]
          ? {
              product_key: revealedKeys[item.id],
              password: revealedPasswords[item.id],
            }
          : {}),
      }))
    );

    setRevealedSerials((prev) => ({
      ...prev,
      ...revealedSerials,
    }));

    setRevealedPasswords((prev) => ({
      ...prev,
      ...revealedPasswords,
    }));

    toast.success(`${ids.length} license(s) revealed`);
  } catch (err) {
    toast.error("Failed to reveal licenses");
  }
};

  const handleAction = (type, row) => {
    if (type === "delete") {
      handleDelete(row);
      return;
    }

    navigate(`/client-licenses/action/${type}`, {
      state: {
        data: {
          ...row,
          assignment_id: row.assignment_id || row.current_assignment_id || null
        },
        action: type,
      },
    });
  };

  const IconBtn = ({ onClick, children, label, color }) => (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 ${color}`}
      >
        {children}
      </button>

      <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
        {label}
      </span>
    </div>
  );
  const handleRevealKey = async (row) => {
  try {
    const res = await axios.get(
      API.REVEAL_PRODUCT_KEY(row.id),
      { headers }
    );

    setData((prev) =>
  prev.map((item) =>
    item.id === row.id
      ? {
          ...item,
          product_key: res.data.product_key,
          password: res.data.password,
        }
      : item
  )
);

setRevealedSerials((prev) => ({
  ...prev,
  [row.id]: res.data.serial_number,
}));

setRevealedPasswords((prev) => ({
  ...prev,
  [row.id]: res.data.password,
}));

    toast.success("Product key revealed successfully.");
  } catch (error) {
    console.error(error);

    toast.error(
      error.response?.data?.detail ||
      "Unable to reveal product key"
    );
  }
};

  const columns = [
    { header: "Job / PO No", accessor: "job_po_no" },

    { header: "Client Name", accessor: "client_name" },

    { header: "Customer PO", accessor: "customer_po" },

    { header: "Product Name", accessor: "product_name" },

    { header: "Description", accessor: "description" },

    {
  header: "Serial Number",
  render: (row) => {
    if (!row.serial_number) return "-";
    if (canRevealKey) return revealedSerials[row.id] || "********";
    return "********";
  },
  exportValue: (row) => {
    if (!row.serial_number) return "-";
    if (canRevealKey) return revealedSerials[row.id] || "********";
    return "********";
  },
},

    {
  header: "Product Key",
  render: (row) => {
    if (canRevealKey) return row.product_key || "-";
    if (!row.product_key) return "-";
    const key = row.product_key;
    const last4 = key.slice(-4);
    return `************${last4}`;
  },
  exportValue: (row) => {
    if (canRevealKey) return row.product_key || "-";
    if (!row.product_key) return "-";
    const last4 = row.product_key.slice(-4);
    return `************${last4}`;
  },
},

    { header: "Email", accessor: "email_id" },

{
  header: "Password",
  render: (row) => {
    if (!row.password) return "-";
    if (canRevealKey) return revealedPasswords[row.id] || "********";
    return "********";
  },
  exportValue: (row) => {
    if (!row.password) return "-";
    if (canRevealKey) return revealedPasswords[row.id] || "********";
    return "********";
  },
},

    { header: "Supplier", accessor: "supplier" },

    { header: "Purchase Order", accessor: "purchase_order_number" },

    { header: "Order Number", accessor: "order_number" },

    { header: "Purchase Date", accessor: "purchase_date" },

    { header: "Purchase Cost", accessor: "purchase_cost" },

    { header: "Contract", accessor: "contract"},

    { header: "Expired On", accessor: "expired_on" },

    { header: "Remarks", accessor: "remarks" },

    {
  header: "Files",
  render: (row) => (
    <FilesCell
      licenseId={row.id}
      entry={fileCache[row.id]}
      fileCount={fileStatus[row.id] || 0}
      onHover={fetchLicenseFiles}
      onOpen={handleOpenFilesPopover}
    />
  ),
  exportValue: (row) => {
    const entry = fileCache[row.id];
    const loaded = entry && !entry.loading && !entry.error;
    const count = loaded ? (entry.files || []).filter((f) => !f.is_deleted).length : null;
    return count != null && count > 0 ? "✅" : "❌";
  },
},

    {
        header: "Actions",
        render: (row) => (
            <div className="flex gap-2">

            <PermissionButton
                permission="reveal_clientlicenses"
                onClick={() => handleRevealKey(row)}
                >
                <IconBtn
                    label="Reveal Key"
                    color="text-purple-600"
                >
                    <FiEye size={16} />
                </IconBtn>
            </PermissionButton>

            <PermissionButton
                permission="clone_clientlicenses"
                onClick={() => handleAction("clone", row)}
            >
                <IconBtn
                label="Clone"
                color="text-blue-600"
                >
                <FiCopy size={16} />
                </IconBtn>
            </PermissionButton>

            <PermissionButton
                permission="update_clientlicenses"
                onClick={() => handleAction("update", row)}
            >
                <IconBtn
                label="Update"
                color="text-green-600"
                >
                <FiEdit size={16} />
                </IconBtn>
            </PermissionButton>

            <PermissionButton
                permission="delete_clientlicenses"
                onClick={() => handleAction("delete", row)}
            >
                <IconBtn
                label="Delete"
                color="text-red-600"
                >
                <FiTrash2 size={16} />
                </IconBtn>
            </PermissionButton>

            </div>
        ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-semibold mb-4">{title}</h1>

      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={data}
          onBulkDelete={handleBulkDelete}
          onBulkReveal={handleBulkReveal}
          resetKey={location.search}
        />
      </div>

      {popoverLicense && (
        <LicenseFilesPopover
          anchorEl={popoverAnchor}
          onClose={handleClosePopover}
          licenseLabel={popoverLicense.label}
          entry={fileCache[popoverLicense.id]}
          onDownload={handleDownloadFile}
          onView={handleViewFile}
          uploaderCache={uploaderCache}
          onResolveUploader={fetchUploader}
        />
      )}

      <FileViewerDialog
        open={viewerOpen}
        onClose={handleCloseViewer}
        fileName={viewerFile?.original_file_name}
        kind={viewerKind}
        loading={viewerLoading}
        error={viewerError}
        pdfData={viewerPdfData}
        imageUrl={viewerImageUrl}
        textContent={viewerTextContent}
        onDownload={() => viewerFile && handleDownloadFile(viewerFile)}
      />
    </div>
  );
}