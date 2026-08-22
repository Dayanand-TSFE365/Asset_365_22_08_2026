import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../../../config/api";
import toast from "react-hot-toast";
import { extractArray } from "../../../utils/extractArray"; // <-- adjust path to match this file's location

import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Grid,
  Switch,
  FormControlLabel,
  Collapse,
  CircularProgress,
  TextField,
  Stack,
  Tab,
  Tabs,
} from "@mui/material";

import ShieldIcon from "@mui/icons-material/Shield";
import GroupIcon from "@mui/icons-material/Group";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckIcon from "@mui/icons-material/Check";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderSharedIcon from "@mui/icons-material/FolderShared";

const modulePermissions = {
  dashboard: ["view"],
  // assets: ["view", "create", "update", "maintenance", "delete", "Reveal Password", "export", "clone", "checkin", "checkout", "audit"],
  assets: ["view", "create", "update",  "delete", "Reveal Password", "export", "clone",],
  people: ["view", "create", "update", "delete", "clone"],
  // licenses: ["view", "create", "update", "delete", "clone", "checkin", "checkout"],
  clientlicenses: [ "view", "create", "reveal", "export", "update", "clone", "delete", "view_file", "download", "delete_attachment",],
  jobs: [ "view", "view_all",  "create", "update", "clone", "export", "delete", "upload_file", "view_file", "download", "delete_attachment",],
  tickets: ["view", "create", "update", "delete", "status"],
  tasks: ["view", "create", "update", "assign", "delete", "export"],
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
// These are NOT part of the generic permission_code catalog above — they
// live on a separate row per (job_id, user_id). This section lets an admin
// flip one of these for a user across EVERY job in one click, instead of
// opening JobPermissionsDialog on each job individually.
// const JOB_FILE_ACTIONS = [
//   { field: "can_view",          label: "View (Specific Job)" },
//   { field: "can_view_file",     label: "View File" },
//   { field: "can_upload_file",   label: "Upload" },
//   { field: "can_download_file", label: "Download" },
//   { field: "can_delete_file",   label: "Delete File" },
// ];

const JOB_FILE_ACTIONS = [
  { field: "can_view", label: "View (Specific Job)" },
  { field: "can_view_file", label: "View File" },
  { field: "can_upload_file", label: "Upload" },
  { field: "can_download_file", label: "Download" },
  { field: "can_delete_file", label: "Delete File" },
];

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

// ─── Role Permissions Tab ────────────────────────────────────────────────────

function RolePermissionsTab({ roles, allPermissions, fetchPermissions, onRolesRefresh }) {
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [rolePermissionIds, setRolePermissionIds] = useState([]);
  const [loadingRole, setLoadingRole] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const [newRoleName, setNewRoleName] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);

  useEffect(() => {
    if (allPermissions.length === 0) fetchPermissions();
  }, []);

  const fetchRolePermissions = async (roleId) => {
    if (!roleId) { setRolePermissionIds([]); return; }
    setLoadingRole(true);
    try {
      const token = sessionStorage.getItem("access_token");
      const res = await axios.get(API.GET_ROLE_PERMISSIONS(roleId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ids = Array.isArray(res.data) ? res.data.map((p) => p.id) : [];
      setRolePermissionIds(ids);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load role permissions");
    } finally {
      setLoadingRole(false);
    }
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRoleId(roleId);
    fetchRolePermissions(roleId);
  };

  const getPermissionId = (permissionCode) => {
    const p = allPermissions.find((p) => p.permission_code === permissionCode);
    return p?.id ?? null;
  };

  const hasRolePermission = (permissionCode) => {
    const id = getPermissionId(permissionCode);
    return id !== null && rolePermissionIds.includes(id);
  };

  const togglePermission = (permissionCode) => {
    const id = getPermissionId(permissionCode);
    if (id === null) return;
    setRolePermissionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleModule = (module, enableAll) => {
    const ids = (modulePermissions[module] || [])
      .map((action) => getPermissionId(`${action}_${module}`))
      .filter(Boolean);
    setRolePermissionIds((prev) => {
      const set = new Set(prev);
      if (enableAll) ids.forEach((id) => set.add(id));
      else ids.forEach((id) => set.delete(id));
      return [...set];
    });
  };

  const moduleAllSelected = (module) =>
    (modulePermissions[module] || []).every((action) =>
      hasRolePermission(`${action}_${module}`)
    );

  const toggleModuleExpand = (module) =>
    setExpandedModules((prev) => ({ ...prev, [module]: !prev[module] }));

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) { toast.error("Enter role name"); return; }
    setCreatingRole(true);
    try {
      const token = sessionStorage.getItem("access_token");
      await axios.post(
        API.CREATE_ROLE,
        { role_name: newRoleName, description: `${newRoleName} role` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Role created");
      setNewRoleName("");
      fetchPermissions();
      if (typeof onRolesRefresh === "function") onRolesRefresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create role");
    } finally {
      setCreatingRole(false);
    }
  };

  const handleSave = async () => {
    if (!selectedRoleId) { toast.error("Select a role first"); return; }
    setSaving(true);
    try {
      const token = sessionStorage.getItem("access_token");
      await axios.put(
        API.UPDATE_ROLE_PERMISSIONS(selectedRoleId),
        { permission_ids: rolePermissionIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Role permissions saved");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((r) => String(r.id) === String(selectedRoleId));
  const enabledCount = rolePermissionIds.length;
  const totalCount = allPermissions.length;

  return (
    <Stack spacing={3}>
      {/* Role selector card */}
      <Paper elevation={2} sx={{ borderRadius: 2, p: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-end" }}>
          <FormControl sx={{ minWidth: 320 }} size="small">
            <InputLabel>Select Role</InputLabel>
            <Select
              value={selectedRoleId}
              label="Select Role"
              onChange={(e) => handleRoleSelect(e.target.value)}
            >
              <MenuItem value=""><em>Choose a role…</em></MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>{role.role_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedRoleId && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                <Box component="span" fontWeight={700} color="text.primary">{enabledCount}</Box>
                {" / "}{totalCount} permissions enabled
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{ textTransform: "none" }}
              >
                Save Changes
              </Button>
            </Stack>
          )}
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        {/* Create new role */}
        <Typography variant="body2" fontWeight={600} mb={1}>Create New Role</Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            placeholder="Role name…"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateRole()}
            sx={{ width: 220 }}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={creatingRole ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
            onClick={handleCreateRole}
            disabled={creatingRole}
            sx={{ textTransform: "none" }}
          >
            Create Role
          </Button>
        </Stack>
      </Paper>

      {/* Permissions editor */}
      {selectedRoleId && (
        loadingRole ? (
          <Box display="flex" alignItems="center" justifyContent="center" py={10} gap={2} color="text.secondary">
            <CircularProgress size={28} />
            <Typography>Loading permissions…</Typography>
          </Box>
        ) : (
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
            {/* Header */}
            <Box
              sx={{
                px: 3, py: 2.5,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700} display="flex" alignItems="center" gap={1}>
                  <ShieldIcon color="primary" fontSize="small" />
                  {selectedRole?.role_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Toggle permissions for this role. Changes apply to all users with this role.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  sx={{ textTransform: "none", fontSize: "0.75rem" }}
                  onClick={() => setRolePermissionIds(allPermissions.map((p) => p.id))}
                >
                  Select All
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  sx={{ textTransform: "none", fontSize: "0.75rem" }}
                  onClick={() => setRolePermissionIds([])}
                >
                  Remove All
                </Button>
              </Stack>
            </Box>

            {/* Module rows */}
            {Object.keys(modulePermissions).map((module, idx) => {
              const actions = modulePermissions[module] || [];
              const isExpanded = expandedModules[module] !== false;
              const enabledInModule = actions.filter((action) =>
                hasRolePermission(`${action}_${module}`)
              ).length;

              return (
                <Box
                  key={module}
                  sx={{
                    borderBottom: idx < Object.keys(modulePermissions).length - 1
                      ? "1px solid"
                      : "none",
                    borderColor: "divider",
                  }}
                >
                  {/* Module header */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 3, py: 1.5,
                      bgcolor: "grey.50",
                    }}
                  >
                    <Box
                      onClick={() => toggleModuleExpand(module)}
                      sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", flex: 1 }}
                    >
                      <Typography variant="body2" fontWeight={700} sx={{ textTransform: "capitalize" }}>
                        {module}
                      </Typography>
                      <Chip
                        label={`${enabledInModule}/${actions.length}`}
                        size="small"
                        sx={{ fontSize: "0.7rem", height: 20 }}
                      />
                      {isExpanded ? <ExpandLessIcon fontSize="small" color="action" /> : <ExpandMoreIcon fontSize="small" color="action" />}
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        sx={{ textTransform: "none", fontSize: "0.7rem", py: 0.3, minWidth: 48 }}
                        onClick={() => toggleModule(module, true)}
                      >
                        All
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        sx={{ textTransform: "none", fontSize: "0.7rem", py: 0.3, minWidth: 52 }}
                        onClick={() => toggleModule(module, false)}
                      >
                        None
                      </Button>
                    </Stack>
                  </Box>

                  {/* Permission toggles */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ p: 3 }}>
                      <Grid container spacing={2}>
                        {actions.map((action) => {
                          const permissionCode = `${action}_${module}`;
                          const enabled = hasRolePermission(permissionCode);
                          return (
                            <Grid item xs={12} sm={6} md={3} key={permissionCode}>
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
                                    {permissionCode}
                                  </Typography>
                                </Box>
                                <Switch
                                  size="small"
                                  checked={enabled}
                                  onChange={() => togglePermission(permissionCode)}
                                  color="success"
                                />
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  </Collapse>
                </Box>
              );
            })}

            {/* Sticky save footer */}
            <Box
              sx={{
                position: "sticky",
                bottom: 0,
                px: 3, py: 2,
                borderTop: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{ textTransform: "none" }}
              >
                Save Changes
              </Button>
            </Box>
          </Paper>
        )
      )}
    </Stack>
  );
}

// ─── Bulk "Job File Access" block (User Permissions tab only) ───────────────
// Operates on the JobPermission table (job_id + user_id rows), same records
// JobPermissionsDialog edits per-job. Toggling a switch here loops over every
// job and creates/updates that user's row so it lands exactly as if you'd
// opened each job's Permissions dialog and flipped the switch by hand.
// function JobFileAccessCard({ selectedUser, jobs, jobsLoading, onRetryJobs }) {
//   const [status, setStatus] = useState({});      // field -> boolean (true only if set on EVERY job)
//   const [loadingStatus, setLoadingStatus] = useState(false);
//   const [savingField, setSavingField] = useState(null);

//   const loadStatus = async () => {
//     if (!selectedUser || jobs.length === 0) { setStatus({}); return; }
//     setLoadingStatus(true);
//     try {
//       const results = await Promise.all(
//         jobs.map((job) =>
//           axios
//             .get(API.GET_JOB_PERMISSIONS(job.job_id), { headers: authHeaders() })
//             .then((res) => extractArray(res.data).find((p) => String(p.user_id) === String(selectedUser)) || null)
//             .catch(() => null)
//         )
//       );
//       const next = {};
//       JOB_FILE_ACTIONS.forEach(({ field }) => {
//         next[field] = results.every((r) => !!r?.[field]);
//       });
//       setStatus(next);
//     } catch (err) {
//       console.error("Failed to load bulk job file status:", err);
//     } finally {
//       setLoadingStatus(false);
//     }
//   };

//   useEffect(() => {
//     loadStatus();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedUser, jobs.length]);

//   const handleToggle = async (field, value) => {
//     if (!selectedUser) { toast.error("Select a user first"); return; }
//     if (jobs.length === 0) { toast.error("No jobs found"); return; }
//     setSavingField(field);
//     try {
//       await Promise.all(
//         jobs.map(async (job) => {
//           const res = await axios.get(API.GET_JOB_PERMISSIONS(job.job_id), { headers: authHeaders() });
//           const existing = extractArray(res.data).find((p) => String(p.user_id) === String(selectedUser));

//           if (existing) {
//             await axios.put(
//               API.UPDATE_JOB_PERMISSION(existing.permission_id),
//               {
//                 can_view:          existing.can_view,
//                 can_upload_file:   existing.can_upload_file,
//                 can_view_file:     existing.can_view_file,
//                 can_download_file: existing.can_download_file,
//                 can_delete_file:   existing.can_delete_file,
//                 [field]: value,
//               },
//               { headers: authHeaders() }
//             );
//           } else {
//             await axios.post(
//               API.CREATE_JOB_PERMISSION,
//               {
//                 job_id: job.job_id,
//                 user_id: selectedUser,
//                 can_view: false,
//                 can_upload_file: false,
//                 can_view_file: false,
//                 can_download_file: false,
//                 can_delete_file: false,
//                 [field]: value,
//               },
//               { headers: authHeaders() }
//             );
//           }
//         })
//       );
//       setStatus((prev) => ({ ...prev, [field]: value }));
//       const label = JOB_FILE_ACTIONS.find((a) => a.field === field)?.label || field;
//       toast.success(`${label} ${value ? "granted" : "removed"} on all jobs`);
//     } catch (err) {
//       console.error("Bulk job file permission update failed:", err);
//       toast.error("Failed to update on some jobs — refreshing actual status.");
//       loadStatus();
//     } finally {
//       setSavingField(null);
//     }
//   };

//   return (
//     <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", borderColor: "divider" }}>
//       <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
//         <Typography variant="subtitle2" fontWeight={700} display="flex" alignItems="center" gap={1}>
//           <FolderSharedIcon color="primary" fontSize="small" />
//           Job File Access
//         </Typography>
//         <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
//           Applies to <strong>every job</strong> at once — same effect as opening each job's
//           Permissions dialog and flipping the switch there. Use this instead of granting
//           per-job access one job at a time.
//         </Typography>
//       </Box>

//       <Box p={2.5}>
//         {jobsLoading || loadingStatus ? (
//           <Box display="flex" alignItems="center" justifyContent="center" py={4} gap={2} color="text.secondary">
//             <CircularProgress size={22} />
//             <Typography variant="body2">
//               {jobsLoading ? "Loading jobs…" : "Checking current access…"}
//             </Typography>
//           </Box>
//         ) : jobs.length === 0 ? (
//           <Box textAlign="center" py={3}>
//             <Typography variant="body2" color="text.secondary" mb={1.5}>
//               No jobs came back from the jobs list — the switches above can't
//               apply to anything until this resolves. Check the browser console
//               for the raw response, then retry.
//             </Typography>
//             <Button size="small" variant="outlined" onClick={onRetryJobs}>
//               Retry loading jobs
//             </Button>
//           </Box>
//         ) : (
//           <Grid container spacing={2}>
//             {JOB_FILE_ACTIONS.map(({ field, label }) => {
//               const enabled = !!status[field];
//               const saving = savingField === field;
//               return (
//                 <Grid item xs={12} sm={6} md={4} key={field}>
//                   <Box
//                     sx={{
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "space-between",
//                       p: 1.5,
//                       borderRadius: 2,
//                       border: "1px solid",
//                       borderColor: enabled ? "success.light" : "divider",
//                       bgcolor: enabled ? "success.50" : "grey.50",
//                       transition: "all 0.15s",
//                     }}
//                   >
//                     <Box>
//                       <Typography variant="body2" fontWeight={600}>{label}</Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         {jobs.length} job{jobs.length === 1 ? "" : "s"}
//                       </Typography>
//                     </Box>
//                     {saving ? (
//                       <CircularProgress size={18} />
//                     ) : (
//                       <Switch
//                         size="small"
//                         checked={enabled}
//                         onChange={(e) => handleToggle(field, e.target.checked)}
//                         color="success"
//                       />
//                     )}
//                   </Box>
//                 </Grid>
//               );
//             })}
//           </Grid>
//         )}
//       </Box>
//     </Paper>
//   );
// }

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UserPermissions() {
  const [activeTab, setActiveTab] = useState(0); // 0 = user, 1 = role

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedUserData, setSelectedUserData] = useState(null);

  // all jobs, needed by JobFileAccessCard to loop over
  const [allJobs, setAllJobs] = useState([]);
  const [allJobsLoading, setAllJobsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchPermissions();
}, []);

  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      const res = await axios.get(API.GET_USERS, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchRoles = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      const res = await axios.get(API.GET_ROLES, { headers: { Authorization: `Bearer ${token}` } });
      setRoles(res.data || []);
    } catch (err) { console.error(err); toast.error("Failed to fetch roles"); }
  };

  const fetchPermissions = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      const res = await axios.get(API.GET_PERMISSIONS, { headers: { Authorization: `Bearer ${token}` } });
      setAllPermissions(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  // const fetchAllJobs = async () => {
  //   setAllJobsLoading(true);
  //   try {
  //     const res = await axios.get(API.GET_JOBS_NEW, { headers: authHeaders() });
  //     // jobs-new returns a bare array with an embedded sub_jobs list per job —
  //     // extractArray still handles the bare-array case fine, kept for safety
  //     // in case the shape ever gets wrapped.
  //     const jobs = extractArray(res.data, ["data", "results", "items", "jobs"]);
  //     if (jobs.length === 0) {
  //       console.warn("GET_JOBS_NEW returned no jobs. Raw response:", res.data);
  //     }
  //     setAllJobs(jobs);
  //   } catch (err) {
  //     console.error("Failed to fetch jobs for bulk permissions:", err.response || err);
  //     toast.error(err.response?.data?.detail || "Failed to load jobs list for bulk permissions.");
  //     setAllJobs([]);
  //   } finally {
  //     setAllJobsLoading(false);
  //   }
  // };

  const fetchSelectedUserPermissions = async (userId) => {
    try {
      const token = sessionStorage.getItem("access_token");
      const res = await axios.get(API.GET_ALL_USERS_PERMISSIONS, { headers: { Authorization: `Bearer ${token}` } });
      const foundUser = res.data.find((u) => String(u.user_id) === String(userId));
      setSelectedUserData(foundUser || null);
      if (foundUser?.role) {
        const matchedRole = roles.find((r) => r.role_name === foundUser.role);
        if (matchedRole) setSelectedRole(matchedRole.id);
      }
    } catch (err) { console.error(err); }
  };

  const handleUserChange = (e) => {
    const userId = e.target.value;
    setSelectedUser(userId);
    if (userId) fetchSelectedUserPermissions(userId);
    else { setSelectedUserData(null); setSelectedRole(""); }
  };

  const handleRoleChange = async (roleId) => {
    setSelectedRole(roleId);
    if (!selectedUser) { toast.error("Select user first"); return; }
    try {
      const token = sessionStorage.getItem("access_token");
      let currentRole = null;
      try {
        const roleRes = await axios.get(`${API.GET_USER_ROLE}/${selectedUser}`, { headers: { Authorization: `Bearer ${token}` } });
        currentRole = roleRes.data;
      } catch { console.log("No existing role"); }

      if (currentRole) {
        await axios.delete(API.REMOVE_USER_ROLE, { headers: { Authorization: `Bearer ${token}` }, data: { user_id: selectedUser } });
      }

      await axios.put(API.UPDATE_USER_ROLE, { user_id: selectedUser, role_id: roleId }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(currentRole ? "Role updated successfully" : "Role assigned successfully");
      fetchSelectedUserPermissions(selectedUser);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update role");
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedUser || !selectedRole) { toast.error("Select user and role first"); return; }
    if (!window.confirm("Are you sure you want to remove this role from user?")) return;
    try {
      const token = sessionStorage.getItem("access_token");
      await axios.delete(API.REMOVE_USER_ROLE, { headers: { Authorization: `Bearer ${token}` }, data: { user_id: selectedUser } });
      toast.success("Role removed from user");
      setSelectedRole("");
      fetchSelectedUserPermissions(selectedUser);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to remove role");
    }
  };

  const handlePermissionToggle = async (permissionCode, enabled) => {
    try {
      const token = sessionStorage.getItem("access_token");
      let permission = allPermissions.find((p) => p.permission_code === permissionCode);
      if (!permission) {
        const createRes = await axios.post(API.CREATE_PERMISSION, { permission_code: permissionCode, module_name: permissionCode.split("_")[1] }, { headers: { Authorization: `Bearer ${token}` } });
        permission = createRes.data;
      }
      if (enabled) {
        await axios.post(API.ASSIGN_USER_PERMISSION, { user_id: selectedUser, permission_id: permission.id }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(`${permissionCode} enabled`);
      } else {
        await axios.delete(API.REMOVE_USER_PERMISSION, { headers: { Authorization: `Bearer ${token}` }, data: { user_id: selectedUser, permission_id: permission.id } });
        toast.success(`${permissionCode} removed`);
      }
      fetchSelectedUserPermissions(selectedUser);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update permission");
    }
  };

  const hasPermission = (permission) => selectedUserData?.permissions?.includes(permission) || false;

  const handleModuleToggle = async (module, enableAll) => {
    try {
      const token = sessionStorage.getItem("access_token");
      for (const action of modulePermissions[module] || []) {
        const permissionCode = `${action}_${module}`;
        let permission = allPermissions.find((p) => p.permission_code === permissionCode);
        if (!permission) {
          try {
            const createRes = await axios.post(API.CREATE_PERMISSION, { permission_code: permissionCode, module_name: module }, { headers: { Authorization: `Bearer ${token}` } });
            permission = createRes.data;
          } catch (err) { console.log(err); }
        }
        if (!permission) continue;
        if (enableAll) {
          try { await axios.post(API.ASSIGN_USER_PERMISSION, { user_id: selectedUser, permission_id: permission.id }, { headers: { Authorization: `Bearer ${token}` } }); }
          catch { console.log("Already assigned"); }
        } else {
          try { await axios.delete(API.REMOVE_USER_PERMISSION, { headers: { Authorization: `Bearer ${token}` }, data: { user_id: selectedUser, permission_id: permission.id } }); }
          catch { console.log("Already removed"); }
        }
      }
      toast.success(enableAll ? `${module} permissions enabled` : `${module} permissions removed`);
      fetchSelectedUserPermissions(selectedUser);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update permissions");
    }
  };

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 2, bgcolor: "grey.50" }}>
      <Box sx={{ maxWidth: 1600, mx: "auto" }}>
        {/* PAGE HEADER */}
        <Box mb={3}>
          <Typography variant="h5" fontWeight={700}>Permissions</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage user and role-based permissions
          </Typography>
        </Box>

        {/* TABS */}
        <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", display: "inline-flex" }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              minHeight: 44,
              "& .MuiTab-root": { textTransform: "none", minHeight: 44, fontWeight: 500, px: 2.5 },
            }}
          >
            <Tab icon={<GroupIcon fontSize="small" />} iconPosition="start" label="User Permissions" />
            <Tab icon={<ShieldIcon fontSize="small" />} iconPosition="start" label="Role Permissions" />
          </Tabs>
        </Paper>

        {/* ─── USER PERMISSIONS TAB ─── */}
        {activeTab === 0 && (
          <Stack spacing={3}>
            {/* HEADER CARD */}
            <Paper elevation={2} sx={{ borderRadius: 2, p: 3 }}>
              {/* USER SELECT */}
              <FormControl size="small" sx={{ minWidth: 320 }}>
                <InputLabel>Select User</InputLabel>
                <Select value={selectedUser} label="Select User" onChange={handleUserChange} MenuProps={{ disablePortal: true }}>
                  <MenuItem value=""><em>Select User</em></MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>{user.name || user.email}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* ROLE SELECT */}
              {selectedUser && (
                <Box mt={3}>
                  <Typography variant="body2" fontWeight={600} mb={1}>Select Role</Typography>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                    <FormControl size="small" sx={{ minWidth: 280 }}>
                      <InputLabel>Select Role</InputLabel>
                      <Select
                        value={selectedRole}
                        label="Select Role"
                        onChange={(e) => handleRoleChange(e.target.value)}
                        MenuProps={{ disablePortal: true }}
                      >
                        <MenuItem value=""><em>Select Role</em></MenuItem>
                        {roles.map((role) => (
                          <MenuItem key={role.id} value={role.id}>{role.role_name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteRole}
                      sx={{ textTransform: "none" }}
                    >
                      Remove Role
                    </Button>
                  </Stack>
                </Box>
              )}
            </Paper>

            {/* USER DETAILS + PERMISSIONS */}
            {selectedUserData && (
              <>
                <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
                  <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography variant="h6" fontWeight={700}>Users & Permissions</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      Manage selected user permissions
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      px: 3, py: 2,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">User</Typography>
                      <Typography variant="body1" fontWeight={600}>{selectedUserData.email}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Role</Typography>
                      <Box mt={0.5}>
                        <Chip
                          label={selectedUserData.role || "No Role"}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Box p={3}>
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
                            {(modulePermissions[module] || []).map((action) => {
                              const permissionCode = `${action}_${module}`;
                              const enabled = hasPermission(permissionCode);
                              return (
                                <Grid item xs={12} sm={6} md={3} key={permissionCode}>
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
                                        {permissionCode}
                                      </Typography>
                                    </Box>
                                    <Switch
                                      size="small"
                                      checked={enabled}
                                      onChange={() => handlePermissionToggle(permissionCode, !enabled)}
                                      color="success"
                                    />
                                  </Box>
                                </Grid>
                              );
                            })}
                          </Grid>

                          {/* {module === "jobs" && (
                            <Box mt={2}>
                              <JobFileAccessCard
                                selectedUser={selectedUser}
                                jobs={allJobs}
                                jobsLoading={allJobsLoading}
                                onRetryJobs={fetchAllJobs}
                              />
                            </Box>
                          )} */}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Paper>
              </>
            )}
          </Stack>
        )}

        {/* ─── ROLE PERMISSIONS TAB ─── */}
        {activeTab === 1 && (
          <RolePermissionsTab
            roles={roles}
            allPermissions={allPermissions}
            fetchPermissions={fetchPermissions}
            onRolesRefresh={fetchRoles}
          />
        )}
      </Box>
    </Box>
  );
}