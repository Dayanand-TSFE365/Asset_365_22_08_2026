// ===============================
// File: src/pages/jobs/components/JobPermissionsDialog.jsx
// ===============================

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, IconButton, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Switch, CircularProgress, TextField, InputAdornment, Button, Tooltip,
} from "@mui/material";
import CloseIcon  from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ShieldIcon  from "@mui/icons-material/Shield";
import { API } from "../../../config/api";
import useJobPermission from "../../../hooks/useJobPermission";
import { extractArray } from "../../../utils/extractArray";

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

// field -> column label, in display order
const PERMISSION_COLUMNS = [
  { field: "can_view",          label: "View" },
  { field: "can_view_file",     label: "View File" },
  { field: "can_upload_file",   label: "Upload" },
  { field: "can_download_file", label: "Download" },
  { field: "can_delete_file",   label: "Delete File" },
];

export default function JobPermissionsDialog({ open, onClose, job }) {
  const jobId = job?.job_id;

  const {
    permissions, loading, savingUserId,
    fetchPermissions, findPermission, toggleField,
  } = useJobPermission(jobId);

  const [users,        setUsers]        = useState([]);
  const [usersLoading, setUsersLoading]  = useState(false);
  const [search,       setSearch]        = useState("");

  useEffect(() => {
    if (!open || !jobId) return;
    fetchPermissions();
    setUsersLoading(true);
    axios
      .get(API.GET_USERS, { headers: authHeaders() })
      .then((res) => setUsers(extractArray(res.data)))
      .catch((err) => {
        console.error("Failed to load users:", err);
        toast.error("Failed to load users.");
      })
      .finally(() => setUsersLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, jobId]);

  const filteredUsers = users.filter((u) =>
    (u.email || u.name || "").toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ShieldIcon color="primary" fontSize="small" />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Job Access Permissions
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {job?.job_no} · {job?.customer_name}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <TextField
            size="small" fullWidth placeholder="Search users by email…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              ),
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
            "View" controls whether this job is visible to the user at all — the other
            toggles only matter once View is on.
          </Typography>
        </Box>

        {(loading || usersLoading) ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={26} />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>User</TableCell>
                  {PERMISSION_COLUMNS.map((col) => (
                    <TableCell key={col.field} align="center" sx={{ fontWeight: 700, bgcolor: "#f8fafc", whiteSpace: "nowrap" }}>
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={PERMISSION_COLUMNS.length + 1} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const perm = findPermission(user.id) || {};
                    const isSaving = savingUserId === user.id;
                    return (
                      <TableRow key={user.id} hover>
                        <TableCell sx={{ fontSize: "0.82rem" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {user.email || user.name}
                            {isSaving && <CircularProgress size={13} />}
                          </Box>
                        </TableCell>
                        {PERMISSION_COLUMNS.map((col) => (
                          <TableCell key={col.field} align="center">
                            <Tooltip title={col.label} arrow>
                              <span>
                                <Switch
                                  size="small"
                                  checked={!!perm[col.field]}
                                  disabled={isSaving}
                                  onChange={(e) => toggleField(user.id, col.field, e.target.checked)}
                                />
                              </span>
                            </Tooltip>
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} size="small" variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  );
}