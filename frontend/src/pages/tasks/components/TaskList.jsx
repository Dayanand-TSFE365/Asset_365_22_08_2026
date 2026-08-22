// ===============================
// File: src/pages/tasks/components/TaskList.jsx
// ===============================

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import { FiEye, FiEdit, FiTrash2, FiUserPlus } from "react-icons/fi";
import DataTable from "../common/DataTable";
import { API } from "../../../config/api"; // ⚠️ adjust path to wherever api.js lives
import { useAuth } from "../../../auth/AuthContext";
import { hasPermission } from "../../../utils/permissions"; // ⚠️ adjust path if needed
import useNotification from "../../../hooks/useNotification";

function authHeaders() {
  const token = sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function useTaskAuth() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  return { isSuperAdmin, currentUserId: user?.user_id };
}

// ─── Status filter presets for each subpage ───────────────────────────────────
// NOTE: "my" and "assigned_by_me" are intentionally NOT here — they need
// currentUserId, which a plain predicate map doesn't have access to, and
// they must apply for EVERY role (including superadmin), not just be a
// pass-through. Their scoping is handled directly in the `data` memo below.
const FILTER_MAP = {
  all:               () => true,
  pending:           (t) => t.status === "Pending",
  in_progress:       (t) => t.status === "In Progress",
  waiting_approval:  (t) => t.status === "Waiting Approval",
  completed:         (t) => t.status === "Completed",
  overdue:           (t) => t.status === "Overdue",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_STYLE = {
  High:   { bg: "#fef2f2", text: "#dc2626" },
  Medium: { bg: "#fffbeb", text: "#d97706" },
  Low:    { bg: "#f0fdf4", text: "#16a34a" },
};

const STATUS_STYLE = {
  "Pending":          { bg: "#f3f4f6", text: "#6b7280" },
  "In Progress":      { bg: "#eff6ff", text: "#2563eb" },
  "Waiting Approval": { bg: "#fdf4ff", text: "#9333ea" },
  "Completed":        { bg: "#f0fdf4", text: "#16a34a" },
  "Overdue":          { bg: "#fef2f2", text: "#dc2626" },
};

function PriorityBadge({ value }) {
  const s = PRIORITY_STYLE[value] || PRIORITY_STYLE.Low;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 99, backgroundColor: s.bg, color: s.text }}>
      {value || "—"}
    </span>
  );
}

function StatusBadge({ value }) {
  const s = STATUS_STYLE[value] || STATUS_STYLE["Pending"];
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 99, backgroundColor: s.bg, color: s.text }}>
      {value || "—"}
    </span>
  );
}

function ProgressCell({ value, loading }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
      <LinearProgress variant="determinate" value={value} sx={{ flex: 1, height: 6, borderRadius: 3, opacity: loading ? 0.4 : 1 }} />
      <Typography variant="caption" color="text.secondary" sx={{ width: 30 }}>
        {value}%
      </Typography>
    </Box>
  );
}

function formatDeadline(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

// ── Icon button that mirrors PermissionButton's UX ─────────────────────────
function IconBtn({ onClick, children, label, colorClass, permission, disabled }) {
  const allowed = permission ? hasPermission(permission) : true;
  const isDisabled = disabled || !allowed;

  const handleClick = () => {
    if (disabled) return;
    if (!allowed) {
      toast.error("You don't have permission");
      return;
    }
    onClick?.();
  };

  return (
    <div className="relative group" style={{ overflow: "visible" }}>
      <button
        type="button"
        onClick={handleClick}
        className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 ${colorClass} ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        {children}
      </button>
      <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
        {!allowed ? "No permission" : label}
      </span>
    </div>
  );
}

// ─── TaskList ─────────────────────────────────────────────────────────────────
export default function TaskList({
  filter = "all",
  title = "Tasks",
  showCreate = false,
}) {
  const navigate = useNavigate();
  const { isSuperAdmin, currentUserId } = useTaskAuth();
  // Notification handling now lives entirely in NotificationContext — this
  // is just borrowing the one function it needs, no local fetch/patch logic.
  const { markTaskNotificationsRead } = useNotification();

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // taskId -> latest progress % (derived from each task's own checklist via
  // GET_TASK, since GET_TASKS doesn't embed checklists per row).
  const [progressMap, setProgressMap] = useState({});
  const [progressLoading, setProgressLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    const headers = authHeaders();
    try {
      const [tasksRes, usersRes] = await Promise.all([
        axios.get(API.GET_TASKS, { headers }),
        axios.get(API.GET_USERS, { headers }),
      ]);
      setTasks(tasksRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── fetch real progress per task — ONLY for tasks this user can actually
  // see (role-scoped), to avoid firing extra requests for tasks that never
  // render. This is an N+1 pattern; if the task list grows large, ask the
  // backend to add checklist/progress directly on GET_TASKS to remove the
  // need for this entirely. ─────────────────────────────────────────────
  useEffect(() => {
    if (tasks.length === 0) {
      setProgressMap({});
      return;
    }

    // Superadmin: every task is potentially visible somewhere (All / status
    // tabs), so fetch progress for all of them. Everyone else: fetch for
    // tasks assigned TO them (My Tasks / status tabs) AND tasks they
    // created FOR someone else (Assigned By Me) — otherwise the progress
    // bar on the "Assigned By Me" tab always sits at 0%.
    const relevantTasks = isSuperAdmin
      ? tasks
      : tasks.filter(
          (t) => t.assigned_to === currentUserId || t.created_by === currentUserId
        );

    let cancelled = false;

    setProgressLoading(true);

    (async () => {
      const headers = authHeaders();

      const results = await Promise.all(
        relevantTasks.map((t) =>
          axios
            .get(API.GET_TASK(t.id), { headers })
            .then((res) => {
              const checklist = res.data?.checklists || [];

              const doneCount = checklist.filter(
                (item) => item.is_completed
              ).length;

              const progress =
                checklist.length > 0
                  ? Math.round((doneCount / checklist.length) * 100)
                  : 0;

              return {
                id: t.id,
                progress,
              };
            })
            .catch(() => ({
              id: t.id,
              progress: 0,
            }))
        )
      );

      if (cancelled) return;

      const map = {};

      results.forEach((r) => {
        map[r.id] = r.progress;
      });

      setProgressMap(map);
      setProgressLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [tasks, isSuperAdmin, currentUserId]);

  const userMap = useMemo(() => {
    const m = {};
    users.forEach((u) => { m[u.id] = u.name; });
    return m;
  }, [users]);

  // ── build display rows from raw task objects ────────────────────────
  const rows = useMemo(() => {
    return tasks.map((t) => ({
      id: t.id,
      task_no: `T${String(t.id).padStart(3, "0")}`,
      title: t.title,
      assigned_to_id: t.assigned_to,
      assigned_to: userMap[t.assigned_to] || `User #${t.assigned_to}`,
      created_by: t.created_by,
      department: t.department,
      priority: t.priority,
      status: t.status,
      due_date: formatDeadline(t.deadline),
      deadline_raw: t.deadline,
      progress: progressMap[t.id] ?? 0,
      raw: t,
    }));
  }, [tasks, userMap, progressMap]);

  // ── visibility + tab filter ─────────────────────────────────────────
  // "my" and "assigned_by_me" are scoped by the relevant person field for
  // EVERY role, including superadmin — "My Tasks" always means tasks
  // assigned to the logged-in user, "Assigned By Me" always means tasks
  // the logged-in user created/assigned to someone else. Superadmin only
  // gets the unrestricted "see everything" treatment on the general/status
  // tabs (all, pending, in_progress, ...), where everyone else is scoped
  // to just what's assigned to them.
  const data = useMemo(() => {
    if (filter === "my") {
      return rows.filter((r) => r.assigned_to_id === currentUserId);
    }
    if (filter === "assigned_by_me") {
      return rows.filter((r) => r.created_by === currentUserId);
    }

    const scoped = isSuperAdmin
      ? rows
      : rows.filter((r) => r.assigned_to_id === currentUserId);

    const fn = FILTER_MAP[filter] || FILTER_MAP.all;
    return scoped.filter(fn);
  }, [rows, filter, isSuperAdmin, currentUserId]);

  // ── delete ────────────────────────────────────────────────────────────
  const handleDelete = async (row) => {
    const confirmed = window.confirm(`Delete task "${row.title}"? This can't be undone.`);
    if (!confirmed) return;
    setDeletingId(row.id);
    try {
      await axios.delete(API.DELETE_TASK(row.id), { headers: authHeaders() });
      toast.success("Task deleted.");
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to delete task.");
    } finally {
      setDeletingId(null);
    }
  };

  const canCreate = hasPermission("create_tasks");
  const canExport = hasPermission("export_tasks");

  const columns = [
    {
      header: "Task No",
      accessor: "task_no",
      render: (row) => (
        <Typography
          variant="body2"
          sx={{
            color: "primary.main",
            cursor: "pointer",
            fontWeight: 600,
            textDecoration: "underline",
            "&:hover": {
              color: "primary.dark",
            },
          }}
          onClick={async () => {
            await markTaskNotificationsRead(row.id);
            navigate(`/tasks/details/${row.id}`, {
              state: { data: row.raw },
            });
          }}
        >
          {row.task_no}
        </Typography>
      ),
    },
    { header: "Title",     accessor: "title" },
    { header: "Assigned To", accessor: "assigned_to" },
    { header: "Department",  accessor: "department" },
    { header: "Priority", accessor: "priority", render: (row) => <PriorityBadge value={row.priority} /> },
    { header: "Status",   accessor: "status",   render: (row) => <StatusBadge value={row.status} /> },
    { header: "Due Date", accessor: "due_date" },
    { header: "Progress", accessor: "progress", render: (row) => <ProgressCell value={row.progress} loading={progressLoading} /> },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex gap-1" style={{ overflow: "visible", position: "relative" }}>
          <IconBtn
            label="View Details"
            colorClass="text-indigo-600"
            onClick={async () => {
              await markTaskNotificationsRead(row.id);
              navigate(`/tasks/details/${row.id}`, { state: { data: row.raw } });
            }}
          >
            <FiEye size={15} />
          </IconBtn>

          <IconBtn
            label="Update"
            colorClass="text-green-600"
            permission="update_tasks"
            onClick={() => navigate("/tasks/action/update", { state: { data: { ...row.raw, id: row.id } } })}
          >
            <FiEdit size={15} />
          </IconBtn>

          <IconBtn
            label="Reassign"
            colorClass="text-purple-600"
            permission="assign_tasks"
            onClick={() => navigate("/tasks/action/reassign", { state: { data: row.raw } })}
          >
            <FiUserPlus size={15} />
          </IconBtn>

          <IconBtn
            label="Delete"
            colorClass="text-red-600"
            permission="delete_tasks"
            disabled={deletingId === row.id}
            onClick={() => handleDelete(row)}
          >
            {deletingId === row.id ? <CircularProgress size={15} /> : <FiTrash2 size={15} />}
          </IconBtn>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-semibold mb-4">{title}</h1>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <div className="flex-1 min-h-0">
          <DataTable
            columns={columns}
            data={data}
            onRefresh={fetchTasks}
            showCreate={showCreate && canCreate}
            canExport={canExport}
            createLabel="Create Task"
            searchPlaceholder="Search tasks..."
          />
        </div>
      )}
    </div>
  );
}