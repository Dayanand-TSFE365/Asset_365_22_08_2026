// ===============================
// File: src/pages/tickets/components/TicketList.jsx
// ===============================

import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEdit, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { Box, Chip } from "@mui/material";
import toast from "react-hot-toast";
import DataTable from "../common/DataTable";
import { API } from "../../../config/api";
import PermissionButton from "../../../components/common/PermissionButton";
const EMPTY_FILTERS = {};
const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

// email -> display name, e.g. adarsh.verma@tsfe365.com -> Adarsh Verma
function emailToName(email) {
  if (!email) return null;
  const local = email.split("@")[0];
  return local.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function truncate(text, max = 60) {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// display order comes from the API — lower display_order first, keeps
// chip colours predictable even as new statuses/priorities get added
const PRIORITY_COLORS = {
  low:      { bg: "#e0f2fe", fg: "#075985" },
  medium:   { bg: "#fef9c3", fg: "#854d0e" },
  high:     { bg: "#ffedd5", fg: "#9a3412" },
  critical: { bg: "#fee2e2", fg: "#991b1b" },
};

const STATUS_COLORS = {
  open:            { bg: "#e0f2fe", fg: "#075985" },
  "in progress":   { bg: "#fef9c3", fg: "#854d0e" },
  draft:           { bg: "#f1f5f9", fg: "#475569" },
  submitted:       { bg: "#fef3c7", fg: "#92400e" },
  approved:        { bg: "#dcfce7", fg: "#166534" },
  resolved:        { bg: "#dcfce7", fg: "#166534" },
  closed:          { bg: "#f1f5f9", fg: "#475569" },
};

function ColorChip({ label, palette }) {
  const key = (label || "").toLowerCase().trim();
  const colors = palette[key] || { bg: "#f1f5f9", fg: "#334155" };
  return (
    <Chip
      label={label || "—"}
      size="small"
      sx={{
        bgcolor: colors.bg,
        color: colors.fg,
        fontWeight: 600,
        fontSize: "0.72rem",
      }}
    />
  );
}

function IconBtn({ onClick, children, label, color }) {
  return (
    <div className="relative group" style={{ overflow: "visible" }}>
      <button onClick={onClick} className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 ${color}`}>
        {children}
      </button>
      <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
        {label}
      </span>
    </div>
  );
}

/**
 * Reusable ticket list, filtered server-side. Powers Dashboard-adjacent
 * subpages (My Tickets, Open, In Progress, Waiting Review, Resolved,
 * Closed) by passing different `filters`.
 *
 * filters supports the same query params GET /tickets accepts:
 *   { assigned_to, created_by, status_id, priority_id }
 * Pass `assignedToMe` instead of `assigned_to` to auto-resolve the
 * current logged-in user's id.
 * Pass `statusName` / `priorityName` instead of the *_id if you only
 * know the label — TicketList resolves it once master data loads.
 */
export default function TicketList({
  title = "Tickets",
  filters = EMPTY_FILTERS,
  statusName,
  priorityName,
  assignedToMe = false,
  createdByMe = false,  
  showCreate = true,
  showExport = true,
}) {
  const navigate = useNavigate();

  const [rawData, setRawData]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses]     = useState([]);
  const [users, setUsers]           = useState([]);

  // ── master data: priorities, statuses, users (for name resolution) ──────
  useEffect(() => {
    axios.get(API.GET_TICKET_PRIORITIES, { headers: authHeaders() })
      .then((res) => setPriorities(res.data || []))
      .catch(console.error);

    axios.get(API.GET_TICKET_STATUSES, { headers: authHeaders() })
      .then((res) => setStatuses(res.data || []))
      .catch(console.error);

    if (API.GET_USERS) {
      axios.get(API.GET_USERS, { headers: authHeaders() })
        .then((res) => setUsers(res.data || []))
        .catch(console.error);
    }
  }, []);

  const priorityMap = useMemo(() => {
    const map = {};
    priorities.forEach((p) => { map[p.id] = p.priority_name; });
    return map;
  }, [priorities]);

  const statusMap = useMemo(() => {
    const map = {};
    statuses.forEach((s) => { map[s.id] = s.status_name; });
    return map;
  }, [statuses]);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.id] = u.name || emailToName(u.email) || u.email || `#${u.id}`;
    });
    return map;
  }, [users]);

  // resolve statusName/priorityName -> id once master data is loaded
  const resolvedStatusId = useMemo(() => {
    if (!statusName) return null;
    const match = statuses.find(
      (s) => (s.status_name || "").toLowerCase() === statusName.toLowerCase()
    );
    return match?.id ?? null;
  }, [statusName, statuses]);

  const resolvedPriorityId = useMemo(() => {
    if (!priorityName) return null;
    const match = priorities.find(
      (p) => (p.priority_name || "").toLowerCase() === priorityName.toLowerCase()
    );
    return match?.id ?? null;
  }, [priorityName, priorities]);

  const currentUserId = useMemo(() => {
    const user = getStoredUser();
    return user?.user_id ?? user?.id ?? null;
  }, []);

  // ── fetch tickets ─────────────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    // wait until any name-based filters have had a chance to resolve
    if (statusName && !resolvedStatusId) return;
    if (priorityName && !resolvedPriorityId) return;
    if ((assignedToMe || createdByMe) && !currentUserId) return;

    setLoading(true);
    try {
      const params = { ...filters };
      if (resolvedStatusId)   params.status_id   = resolvedStatusId;
      if (resolvedPriorityId) params.priority_id = resolvedPriorityId;
      if (assignedToMe)       params.assigned_to = currentUserId;
      if (createdByMe)        params.created_by  = currentUserId;

      const res = await axios.get(API.GET_TICKETS, { headers: authHeaders(), params });
      setRawData(res.data || []);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      toast.error(error.response?.data?.detail || "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }, [filters, resolvedStatusId, resolvedPriorityId, assignedToMe, createdByMe, currentUserId, statusName, priorityName]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleAction = (type, row) => {
    if (type === "view") { navigate(`/tickets/details/${row.id}`); return; }
    navigate(`/tickets/action/${type}`, { state: { data: row, action: type } });
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete ticket ${row.ticket_no}? This can't be undone.`)) return;
    try {
      await axios.delete(API.DELETE_TICKET(row.id), { headers: authHeaders() });
      toast.success("Ticket deleted.");
      fetchTickets();
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      toast.error(error.response?.data?.detail || "Failed to delete ticket.");
    }
  };

  const columns = [
    { header: "Ticket No", accessor: "ticket_no" },
    {
      header: "Scope Of Work",
      render: (row) => truncate(row.scope_of_work),
      exportValue: (row) => row.scope_of_work || "-",
    },
    {
      header: "Customer",
      render: (row) => row.customer_name || "—",
      exportValue: (row) => row.customer_name || "-",
    },
    {
      header: "Priority",
      render: (row) => <ColorChip label={priorityMap[row.priority_id]} palette={PRIORITY_COLORS} />,
      exportValue: (row) => priorityMap[row.priority_id] || "-",
    },
    {
      header: "Status",
      render: (row) => <ColorChip label={statusMap[row.status_id]} palette={STATUS_COLORS} />,
      exportValue: (row) => statusMap[row.status_id] || "-",
    },
    {
      header: "Assigned To",
      render: (row) => userMap[row.assigned_to] || "—",
      exportValue: (row) => userMap[row.assigned_to] || "-",
    },
    {
      header: "Created By",
      render: (row) => userMap[row.created_by] || "—",
      exportValue: (row) => userMap[row.created_by] || "-",
    },
    {
      header: "Due Date",
      render: (row) => formatDate(row.due_date),
      exportValue: (row) => formatDate(row.due_date),
    },
    {
      header: "Created At",
      render: (row) => formatDate(row.created_at),
      exportValue: (row) => formatDate(row.created_at),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex gap-1" style={{ overflow: "visible", position: "relative" }}>
          <IconBtn label="View" color="text-blue-600" onClick={() => handleAction("view", row)}>
            <FiEye size={16} />
          </IconBtn>

          <PermissionButton permission="update_tickets" onClick={() => handleAction("update", row)}>
            <IconBtn label="Edit" color="text-green-600"><FiEdit size={16} /></IconBtn>
          </PermissionButton>

          <PermissionButton permission="status_tickets" onClick={() => handleAction("status", row)}>
            <IconBtn label="Change Status" color="text-amber-600"><FiRefreshCw size={16} /></IconBtn>
          </PermissionButton>

          <PermissionButton permission="delete_tickets" onClick={() => handleDelete(row)}>
            <IconBtn label="Delete" color="text-red-600"><FiTrash2 size={16} /></IconBtn>
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
            data={rawData}
            onRefresh={fetchTickets}
            createRoute="/tickets/action/create"
            createLabel="Create Ticket"
            showCreate={showCreate}
            showExport={showExport}
            onSearch={(searchText) => {
                // Optional:
                // Agar backend search API hai to yaha call karna.
                // Agar nahi hai to is prop ko hata bhi sakte ho.
            }}
        />
      </div>
    </div>
  );
}