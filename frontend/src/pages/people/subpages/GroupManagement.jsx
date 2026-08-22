import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API } from "../../../config/api";
import toast from "react-hot-toast";
import { extractArray } from "../../../utils/extractArray"; // <-- adjust path to match this file's location

import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Grid,
  Chip,
  Divider,
  Collapse,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SearchIcon from "@mui/icons-material/Search";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import FolderSharedIcon from "@mui/icons-material/FolderShared";

// ─── Permission matrix ───────────────────────────────────────────────────────
const modulePermissions = {
  dashboard: ["view"],
  // assets: ["view", "create", "update", "maintenance", "delete", "Reveal Password", "export", "clone", "checkin", "checkout", "audit"],
  assets: ["view", "create", "update",  "delete", "Reveal Password", "export", "clone",],
  people: ["view", "create", "update", "delete", "clone"],
  // licenses: ["view", "create", "update", "delete", "clone", "checkin", "checkout"],
  clientlicenses: [ "view", "create", "reveal", "export", "update", "clone", "delete", "view_file", "download", "delete_attachment",],
  jobs: [ "view", "view_all",  "create", "update", "clone", "export", "delete", "upload_file", "view_file", "download", "delete_attachment",],
  // accessories: ["view", "create", "update", "delete", "clone", "checkout"],
  // consumables: ["view", "create", "update", "delete", "clone", "checkout"],
  // components: ["view", "create", "update", "delete", "clone", "checkout"],
  // kits: ["view", "create", "update", "delete", "checkout"],
  // reports: ["view"],
  settings: ["view"],
  import: ["view"],
  // requestable: ["view", "create", "update", "delete"],
};

// ─── Per-job file permission fields (JobPermission table) ───────────────────
// Same table JobPermissionsDialog edits per-job (job_id + user_id rows).
// There's no group-level JobPermission record — so for a group, toggling
// here fans out across every job AND every current member of the group.
const JOB_FILE_ACTIONS = [
  { field: "can_view",          label: "View (Specific Job)" },
  { field: "can_view_file",     label: "View File" },
  { field: "can_upload_file",   label: "Upload" },
  { field: "can_download_file", label: "Download" },
  { field: "can_delete_file",   label: "Delete File" },
];

// ─── Toast-based confirm helper ──────────────────────────────────────────────
function toastConfirm(message, onConfirm) {
  toast(
    (t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { toast.dismiss(t.id); onConfirm(); }}
            className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 text-xs bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded-lg font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    ),
    { duration: 8000 }
  );
}

// ─── Multi-select dropdown with checkboxes ───────────────────────────────────
function UserDropdown({ users, groupMembers, selectedUsers, onToggle }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  // Close only when clicking truly outside the container
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isMember = (id) =>
    groupMembers.some((gm) => gm.id === id || gm.user_id === id);

  const filtered = users.filter((u) =>
    (u.name || u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = selectedUsers.length;

  return (
    <Box ref={containerRef} sx={{ position: "relative", width: { xs: "100%", md: 360 } }}>
      <Button
        variant="outlined"
        fullWidth
        onClick={() => setOpen((v) => !v)}
        endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{
          justifyContent: "space-between",
          textTransform: "none",
          color: pendingCount > 0 ? "text.primary" : "text.secondary",
          borderColor: "divider",
          py: 1.2,
        }}
      >
        {pendingCount > 0
          ? `${pendingCount} user${pendingCount > 1 ? "s" : ""} selected to add`
          : "Select users to add…"}
      </Button>

      {open && (
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            width: "100%",
            zIndex: 1300,
            borderRadius: 2,
          }}
        >
          <Box sx={{ p: 1, borderBottom: "1px solid", borderColor: "divider" }}>
            <TextField
              autoFocus
              size="small"
              fullWidth
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ maxHeight: 240, overflowY: "auto", borderRadius: "0 0 8px 8px" }}>
            {filtered.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                No users found
              </Typography>
            )}
            {filtered.map((user) => {
              const member = isMember(user.id);
              const checked = selectedUsers.includes(user.id);
              return (
                <Box
                  key={user.id}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent losing focus / closing
                    if (!member) onToggle(user.id);
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1.5,
                    py: 1,
                    cursor: member ? "not-allowed" : "pointer",
                    opacity: member ? 0.6 : 1,
                    "&:hover": { bgcolor: member ? "transparent" : "action.hover" },
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    userSelect: "none",
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Checkbox
                      size="small"
                      disabled={member}
                      checked={member ? true : checked}
                      readOnly
                      color="primary"
                    />
                    <Typography variant="body2">{user.name || user.email}</Typography>
                  </Box>
                  {member && (
                    <Chip label="In group" size="small" color="success" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
}

// ─── Bulk "Job File Access" block for a GROUP ────────────────────────────────
// No GroupJobPermission table exists on the backend, so this fans out to the
// per-user JobPermission table: for every job x every current member of the
// group, create/update that member's row for the toggled field. It reads
// back the same way — a switch shows ON only if every (job, member) pair
// already has that field set.
function GroupJobFileAccessCard({ groupId, members, jobs, jobsLoading }) {
  const [status, setStatus] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [savingField, setSavingField] = useState(null);

  const authHeader = () => ({ Authorization: `Bearer ${sessionStorage.getItem("access_token")}` });

  const memberIds = members.map((m) => m.id ?? m.user_id).filter((id) => id != null);

  const loadStatus = async () => {
    if (!groupId || jobs.length === 0 || memberIds.length === 0) { setStatus({}); return; }
    setLoadingStatus(true);
    try {
      const perJobRows = await Promise.all(
        jobs.map((job) =>
          axios
            .get(API.GET_JOB_PERMISSIONS(job.job_id), { headers: authHeader() })
            .then((res) => extractArray(res.data))
            .catch(() => [])
        )
      );
      const next = {};
      JOB_FILE_ACTIONS.forEach(({ field }) => {
        next[field] = perJobRows.every((rows) =>
          memberIds.every((uid) => {
            const row = rows.find((r) => String(r.user_id) === String(uid));
            return !!row?.[field];
          })
        );
      });
      setStatus(next);
    } catch (err) {
      console.error("Failed to load group job file status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, jobs.length, memberIds.join(",")]);

  const handleToggle = async (field, value) => {
    if (!groupId) return toast.error("Select a group first");
    if (jobs.length === 0) return toast.error("No jobs found");
    if (memberIds.length === 0) return toast.error("This group has no members yet");

    setSavingField(field);
    try {
      // One GET per job (to know existing rows), then PUT/POST per (job, member).
      await Promise.all(
        jobs.map(async (job) => {
          const res = await axios.get(API.GET_JOB_PERMISSIONS(job.job_id), { headers: authHeader() });
          const rows = extractArray(res.data);

          await Promise.all(
            memberIds.map(async (uid) => {
              const existing = rows.find((r) => String(r.user_id) === String(uid));
              if (existing) {
                await axios.put(
                  API.UPDATE_JOB_PERMISSION(existing.permission_id),
                  {
                    can_view:          existing.can_view,
                    can_upload_file:   existing.can_upload_file,
                    can_view_file:     existing.can_view_file,
                    can_download_file: existing.can_download_file,
                    can_delete_file:   existing.can_delete_file,
                    [field]: value,
                  },
                  { headers: authHeader() }
                );
              } else {
                await axios.post(
                  API.CREATE_JOB_PERMISSION,
                  {
                    job_id: job.job_id,
                    user_id: uid,
                    can_view: false,
                    can_upload_file: false,
                    can_view_file: false,
                    can_download_file: false,
                    can_delete_file: false,
                    [field]: value,
                  },
                  { headers: authHeader() }
                );
              }
            })
          );
        })
      );
      setStatus((prev) => ({ ...prev, [field]: value }));
      const label = JOB_FILE_ACTIONS.find((a) => a.field === field)?.label || field;
      toast.success(`${label} ${value ? "granted" : "removed"} on all jobs for all group members`);
    } catch (err) {
      console.error("Bulk group job file permission update failed:", err);
      toast.error("Failed to update on some jobs/members — refreshing actual status.");
      loadStatus();
    } finally {
      setSavingField(null);
    }
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", borderColor: "divider" }}>
      <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
        <Typography variant="subtitle2" fontWeight={700} display="flex" alignItems="center" gap={1}>
          <FolderSharedIcon color="primary" fontSize="small" />
          Job File Access
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          Applies to <strong>every job</strong>, for <strong>every current member</strong> of this
          group, at once — same effect as opening each job's Permissions dialog and flipping
          the switch there for each member. Use this instead of granting per-job access one
          member at a time. New members added later won't retroactively get these — re-toggle
          after adding members if needed.
        </Typography>
      </Box>

      <Box p={2.5}>
        {jobsLoading || loadingStatus ? (
          <Box display="flex" alignItems="center" justifyContent="center" py={3} gap={2} color="text.secondary">
            <CircularProgress size={20} />
            <Typography variant="body2">
              {jobsLoading ? "Loading jobs…" : "Checking current access…"}
            </Typography>
          </Box>
        ) : memberIds.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
            Add members to this group first.
          </Typography>
        ) : jobs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
            No jobs found.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {JOB_FILE_ACTIONS.map(({ field, label }) => {
              const enabled = !!status[field];
              const saving = savingField === field;
              return (
                <Grid item xs={12} sm={6} md={4} key={field}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: enabled ? "success.light" : "divider",
                      bgcolor: enabled ? "success.50" : "grey.50",
                      transition: "all 0.15s",
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {jobs.length} job{jobs.length === 1 ? "" : "s"} · {memberIds.length} member{memberIds.length === 1 ? "" : "s"}
                      </Typography>
                    </Box>
                    {saving ? (
                      <CircularProgress size={18} />
                    ) : (
                      <Switch
                        size="small"
                        checked={enabled}
                        onChange={(e) => handleToggle(field, e.target.checked)}
                        color="success"
                      />
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Paper>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function GroupManagement() {
  const token = sessionStorage.getItem("access_token");

  const [groups, setGroups]                     = useState([]);
  const [users, setUsers]                       = useState([]);
  const [allPermissions, setAllPermissions]     = useState([]);
  const [selectedGroup, setSelectedGroup]       = useState("");
  const [selectedUsers, setSelectedUsers]       = useState([]);
  const [groupMembers, setGroupMembers]         = useState([]);
  const [groupPermissions, setGroupPermissions] = useState([]);
  const [newGroupName, setNewGroupName]         = useState("");
  const [membersCollapsed, setMembersCollapsed] = useState(false);

  // all jobs, needed by GroupJobFileAccessCard to loop over
  const [allJobs, setAllJobs]               = useState([]);
  const [allJobsLoading, setAllJobsLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchUsers();
    fetchPermissions();
    fetchAllJobs();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupUsers(selectedGroup);
      fetchGroupPermissions(selectedGroup);
      setSelectedUsers([]);
      setMembersCollapsed(false);
    } else {
      setGroupMembers([]);
      setGroupPermissions([]);
    }
  }, [selectedGroup]);

  const authHeader = () => ({ Authorization: `Bearer ${token}` });

  const fetchGroups = async () => {
    try {
      const res = await axios.get(API.GET_GROUPS, { headers: authHeader() });
      setGroups(res.data || []);
    } catch { /* silent */ }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API.GET_USERS, { headers: authHeader() });
      setUsers(res.data || []);
    } catch { /* silent */ }
  };

  const fetchPermissions = async () => {
    try {
      const res = await axios.get(API.GET_PERMISSIONS, { headers: authHeader() });
      setAllPermissions(Array.isArray(res.data) ? res.data : []);
    } catch { /* silent */ }
  };

  const fetchAllJobs = async () => {
    setAllJobsLoading(true);
    try {
      const res = await axios.get(API.GET_JOBS_NEW, { headers: authHeader() });
      const jobs = extractArray(res.data, ["data", "results", "items", "jobs"]);
      if (jobs.length === 0) {
        console.warn("GET_JOBS_NEW returned no jobs. Raw response:", res.data);
      }
      setAllJobs(jobs);
    } catch (err) {
      console.error("Failed to fetch jobs for bulk permissions:", err.response || err);
      setAllJobs([]);
    } finally {
      setAllJobsLoading(false);
    }
  };

  const fetchGroupUsers = async (groupId) => {
    try {
      const res = await axios.get(API.GET_GROUP_USERS(groupId), { headers: authHeader() });
      setGroupMembers(res.data || []);
    } catch { /* silent */ }
  };

  const fetchGroupPermissions = async (groupId) => {
    try {
      const res = await axios.get(API.GET_GROUP_PERMISSIONS(groupId), { headers: authHeader() });
      setGroupPermissions((res.data || []).map((p) => p.permission_id || p.id));
    } catch { /* silent */ }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return toast.error("Enter group name");
    try {
      await axios.post(API.CREATE_GROUP, { group_name: newGroupName }, { headers: authHeader() });
      toast.success("Group created");
      setNewGroupName("");
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || "Failed to create group");
    }
  };

  const handleDeleteGroup = () => {
    if (!selectedGroup) return;
    const groupName = groups.find((g) => String(g.id) === String(selectedGroup))?.group_name || "this group";
    toastConfirm(`Delete "${groupName}"? This cannot be undone.`, async () => {
      try {
        await axios.delete(API.DELETE_GROUP(selectedGroup), { headers: authHeader() });
        toast.success("Group deleted");
        setSelectedGroup("");
        fetchGroups();
      } catch {
        toast.error("Failed to delete group");
      }
    });
  };

  const toggleUserSelection = (id) =>
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );

  const assignUsers = async () => {
    if (!selectedGroup) return toast.error("Select a group first");
    if (selectedUsers.length === 0) return toast.error("Select at least one user");
    try {
      await Promise.all(
        selectedUsers.map((user_id) =>
          axios.post(API.ASSIGN_USER_GROUP, { group_id: selectedGroup, user_id }, { headers: authHeader() })
        )
      );
      toast.success("Users added to group");
      setSelectedUsers([]);
      fetchGroupUsers(selectedGroup);
    } catch {
      toast.error("Failed to add users");
    }
  };

  const removeUserFromGroup = (userId) => {
    toastConfirm("Remove this user from the group?", async () => {
      try {
        await axios.delete(API.REMOVE_USER_GROUP, {
          headers: authHeader(),
          data: { group_id: selectedGroup, user_id: userId },
        });
        toast.success("User removed");
        fetchGroupUsers(selectedGroup);
      } catch {
        toast.error("Failed to remove user");
      }
    });
  };

  const removeAllUsersFromGroup = () => {
    if (!groupMembers.length) return;
    toastConfirm(
      `Remove all ${groupMembers.length} members from this group?`,
      async () => {
        try {
          await Promise.all(
            groupMembers.map((member) =>
              axios.delete(API.REMOVE_USER_GROUP, {
                headers: authHeader(),
                data: { group_id: selectedGroup, user_id: member.id || member.user_id },
              })
            )
          );
          toast.success("All members removed");
          fetchGroupUsers(selectedGroup);
        } catch {
          toast.error("Failed to remove all users");
        }
      }
    );
  };

  const resolveOrCreatePermission = async (permissionCode, moduleName) => {
    let perm = allPermissions.find((p) => p.permission_code === permissionCode);
    if (!perm) {
      try {
        const res = await axios.post(
          API.CREATE_PERMISSION,
          { permission_code: permissionCode, module_name: moduleName },
          { headers: authHeader() }
        );
        perm = res.data;
        setAllPermissions((prev) => [...prev, perm]);
      } catch { /* silent */ }
    }
    return perm;
  };

  const togglePermission = async (permId, enable) => {
    if (!selectedGroup) return toast.error("Select a group first");
    try {
      if (enable) {
        await axios.post(
          API.ASSIGN_GROUP_PERMISSION,
          { group_id: selectedGroup, permission_id: permId },
          { headers: authHeader() }
        );
      } else {
        await axios.delete(API.REMOVE_GROUP_PERMISSION, {
          headers: authHeader(),
          data: { group_id: selectedGroup, permission_id: permId },
        });
      }
      fetchGroupPermissions(selectedGroup);
    } catch {
      toast.error("Permission update failed");
    }
  };

  const handleModuleToggle = async (module, enableAll) => {
    if (!selectedGroup) return toast.error("Select a group first");
    const actions = modulePermissions[module] || [];
    for (const action of actions) {
      const code = `${action}_${module}`;
      const perm = await resolveOrCreatePermission(code, module);
      if (!perm) continue;
      try {
        if (enableAll) {
          await axios.post(
            API.ASSIGN_GROUP_PERMISSION,
            { group_id: selectedGroup, permission_id: perm.id },
            { headers: authHeader() }
          );
        } else {
          await axios.delete(API.REMOVE_GROUP_PERMISSION, {
            headers: authHeader(),
            data: { group_id: selectedGroup, permission_id: perm.id },
          });
        }
      } catch { /* already set */ }
    }
    toast.success(enableAll ? `${module} enabled` : `${module} disabled`);
    fetchGroupPermissions(selectedGroup);
  };

  const getPermId = (action, module) => {
    const perm = allPermissions.find((p) => p.permission_code === `${action}_${module}`);
    return perm?.id ?? null;
  };

  const isPermEnabled = (action, module) => {
    const id = getPermId(action, module);
    return id !== null && groupPermissions.includes(id);
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 2, bgcolor: "grey.50" }}>
      <Box sx={{ maxWidth: 1600, mx: "auto" }}>
        <Stack spacing={3}>

          {/* ── Top bar ── */}
          <Paper elevation={2} sx={{ borderRadius: 2, p: 3 }}>
            <Typography variant="h5" fontWeight={700}>Group Management</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Create groups, manage members and permissions
            </Typography>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              mt={3}
              flexWrap="wrap"
              alignItems={{ md: "center" }}
            >
              {/* Create */}
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  placeholder="New group name…"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                  sx={{ width: 220 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleCreateGroup}
                  sx={{ textTransform: "none" }}
                >
                  Create Group
                </Button>
              </Stack>

              {/* Select + Delete */}
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 240 }}>
                  <InputLabel>Select Group</InputLabel>
                  <Select
                    value={selectedGroup}
                    label="Select Group"
                    onChange={(e) => setSelectedGroup(e.target.value)}
                  >
                    <MenuItem value=""><em>Select Group</em></MenuItem>
                    {groups.map((g) => (
                      <MenuItem key={g.id} value={g.id}>{g.group_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedGroup && (
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteGroup}
                    sx={{ textTransform: "none" }}
                  >
                    Delete Group
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>

          {/* ── Members section ── */}
          {selectedGroup && (
            <Paper elevation={2} sx={{ borderRadius: 2 }}>
              <Box
                sx={{
                  px: 3, py: 2.5,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>Members</Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {groupMembers.length} member{groupMembers.length !== 1 ? "s" : ""} in this group
                  </Typography>
                </Box>

                {groupMembers.length > 0 && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      startIcon={<PersonRemoveIcon />}
                      onClick={removeAllUsersFromGroup}
                      sx={{ textTransform: "none", fontSize: "0.75rem" }}
                    >
                      Remove All
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setMembersCollapsed((v) => !v)}
                      endIcon={membersCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                      sx={{ textTransform: "none", fontSize: "0.75rem" }}
                    >
                      {membersCollapsed ? "Show members" : "Hide members"}
                    </Button>
                  </Stack>
                )}
              </Box>

              <Box sx={{ p: 3 }}>
                {/* Add users row */}
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
                  <UserDropdown
                    users={users}
                    groupMembers={groupMembers}
                    selectedUsers={selectedUsers}
                    onToggle={toggleUserSelection}
                  />
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<GroupAddIcon />}
                    onClick={assignUsers}
                    disabled={selectedUsers.length === 0}
                    sx={{ textTransform: "none" }}
                  >
                    Add Selected ({selectedUsers.length})
                  </Button>
                </Stack>

                {/* Members table */}
                {groupMembers.length > 0 && (
                  <Collapse in={!membersCollapsed}>
                    <Box
                      mt={3}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <Table size="small">
                        <TableHead sx={{ bgcolor: "grey.50" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", color: "text.secondary" }}>
                              User
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", color: "text.secondary" }}>
                              Email
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", color: "text.secondary" }}>
                              Action
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {groupMembers.map((m) => (
                            <TableRow
                              key={m.id || m.user_id}
                              hover
                              sx={{ "&:last-child td": { border: 0 } }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>{m.name || "—"}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">{m.email || "—"}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => removeUserFromGroup(m.id || m.user_id)}
                                  sx={{ textTransform: "none", fontSize: "0.75rem" }}
                                >
                                  Remove
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  </Collapse>
                )}
              </Box>
            </Paper>
          )}

          {/* ── Permissions section ── */}
          {selectedGroup && (
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
              <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="h6" fontWeight={700}>Permissions</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Manage module-level permissions for this group
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                <Stack spacing={4}>
                  {Object.keys(modulePermissions).map((module) => (
                    <Box key={module}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="body1" fontWeight={700} sx={{ textTransform: "capitalize" }}>
                          {module}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            sx={{ textTransform: "none", fontSize: "0.75rem" }}
                            onClick={() => handleModuleToggle(module, true)}
                          >
                            Select All
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            sx={{ textTransform: "none", fontSize: "0.75rem" }}
                            onClick={() => handleModuleToggle(module, false)}
                          >
                            Remove All
                          </Button>
                        </Stack>
                      </Box>

                      <Grid container spacing={2}>
                        {modulePermissions[module].map((action) => {
                          const code    = `${action}_${module}`;
                          const permId  = getPermId(action, module);
                          const enabled = isPermEnabled(action, module);

                          return (
                            <Grid item xs={12} sm={6} md={3} key={code}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  p: 1.5,
                                  borderRadius: 2,
                                  border: "1px solid",
                                  borderColor: enabled ? "success.light" : "divider",
                                  bgcolor: enabled ? "success.50" : "grey.50",
                                  transition: "all 0.15s",
                                }}
                              >
                                <Box>
                                  <Typography variant="body2" fontWeight={600} sx={{ textTransform: "capitalize" }}>
                                    {action}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {code}
                                  </Typography>
                                </Box>
                                <Switch
                                  size="small"
                                  checked={enabled}
                                  color="success"
                                  onChange={async () => {
                                    if (!permId) {
                                      const perm = await resolveOrCreatePermission(code, module);
                                      if (perm) await togglePermission(perm.id, true);
                                    } else {
                                      await togglePermission(permId, !enabled);
                                    }
                                  }}
                                />
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>

                      {/* {module === "jobs" && (
                        <Box mt={2}>
                          <GroupJobFileAccessCard
                            groupId={selectedGroup}
                            members={groupMembers}
                            jobs={allJobs}
                            jobsLoading={allJobsLoading}
                          />
                        </Box>
                      )} */}
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Paper>
          )}

        </Stack>
      </Box>
    </Box>
  );
}