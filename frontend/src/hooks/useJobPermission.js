// ===============================
// File: src/hooks/useJobPermission.js
// ===============================

import { useState, useCallback, useMemo, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API } from "../config/api";
import { extractArray } from "../utils/extractArray";
import { hasPermission } from "../utils/permissions";
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


export function useIsSuperAdmin() {
  return useMemo(() => {
    const user = getStoredUser();
    const role = (user?.role || sessionStorage.getItem("role") || "").toLowerCase();
    return role === "superadmin" || role === "super_admin" || role === "super admin";
  }, []);
}

/**
 * CRUD for per-job, per-user permissions. Used by JobPermissionsDialog.
 */
export default function useJobPermission(jobId) {
  const [permissions,  setPermissions]  = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);

  const fetchPermissions = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await axios.get(API.GET_JOB_PERMISSIONS(jobId), { headers: authHeaders() });
      setPermissions(extractArray(res.data));
    } catch (error) {
      console.error("Failed to load job permissions:", error);
      toast.error(error.response?.data?.detail || "Failed to load job permissions.");
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const findPermission = useCallback(
    (userId) => permissions.find((p) => String(p.user_id) === String(userId)) || null,
    [permissions]
  );

  const setUserPermission = useCallback(
    async (userId, patch) => {
      setSavingUserId(userId);
      try {
        const existing = findPermission(userId);

        if (existing) {
          const payload = {
            can_view:          patch.can_view          ?? existing.can_view,
            can_upload_file:   patch.can_upload_file    ?? existing.can_upload_file,
            can_view_file:     patch.can_view_file      ?? existing.can_view_file,
            can_download_file: patch.can_download_file  ?? existing.can_download_file,
            can_delete_file:   patch.can_delete_file    ?? existing.can_delete_file,
          };
          const res = await axios.put(
            API.UPDATE_JOB_PERMISSION(existing.permission_id),
            payload,
            { headers: authHeaders() }
          );
          setPermissions((prev) =>
            prev.map((p) => (p.permission_id === existing.permission_id ? res.data : p))
          );
          return res.data;
        }

        const payload = {
          job_id: jobId,
          user_id: userId,
          can_view: false,
          can_upload_file: false,
          can_view_file: false,
          can_download_file: false,
          can_delete_file: false,
          ...patch,
        };
        const res = await axios.post(API.CREATE_JOB_PERMISSION, payload, { headers: authHeaders() });
        setPermissions((prev) => [...prev, res.data]);
        return res.data;
      } catch (error) {
        console.error("Failed to save permission:", error);
        toast.error(error.response?.data?.detail || "Failed to save permission.");
        throw error;
      } finally {
        setSavingUserId(null);
      }
    },
    [findPermission, jobId]
  );

  const toggleField = useCallback(
    (userId, field, value) => setUserPermission(userId, { [field]: value }),
    [setUserPermission]
  );

  const removePermission = useCallback(
    async (userId) => {
      const existing = findPermission(userId);
      if (!existing) return;
      setSavingUserId(userId);
      try {
        await axios.delete(API.DELETE_JOB_PERMISSION(existing.permission_id), { headers: authHeaders() });
        setPermissions((prev) => prev.filter((p) => p.permission_id !== existing.permission_id));
        toast.success("Permission removed.");
      } catch (error) {
        console.error("Failed to remove permission:", error);
        toast.error(error.response?.data?.detail || "Failed to remove permission.");
      } finally {
        setSavingUserId(null);
      }
    },
    [findPermission]
  );

  return {
    permissions, loading, savingUserId,
    fetchPermissions, findPermission, setUserPermission, toggleField, removePermission,
  };
}

/**
 * Per-job permission check for the CURRENTLY LOGGED-IN user. Auto-fetches
 * whenever jobId changes. Superadmins bypass entirely (can() always true).
 *
 * const { can, loading } = useMyJobPermission(jobId);
 * can("can_upload_file") -> boolean
 */
export function useMyJobPermission(jobId) {
  const isSuperAdmin = useIsSuperAdmin();

  const [myPermission, setMyPermission] = useState(null);
  const [loading, setLoading] = useState(false);

  const GLOBAL_PERMISSION_MAP = {
  can_view: "view_all_jobs",
  can_view_file: "view_file_jobs",
  can_upload_file: "upload_file_jobs",
  can_download_file: "download_jobs",
  can_delete_file: "delete_attachment_jobs",
};

  const fetchMine = useCallback(async () => {
    if (!jobId || isSuperAdmin) return;

    setLoading(true);

    try {
      const res = await axios.get(
        API.GET_JOB_PERMISSIONS(jobId),
        {
          headers: authHeaders(),
        }
      );

      const rows = extractArray(res.data);

      const user = getStoredUser();
      const myId = user?.user_id ?? user?.id;

      setMyPermission(
        rows.find(
          (p) => String(p.user_id) === String(myId)
        ) || null
      );
    } catch (error) {
      console.error("Failed to load my job permission:", error);
      setMyPermission(null);
    } finally {
      setLoading(false);
    }
  }, [jobId, isSuperAdmin]);

  useEffect(() => {
  if (!jobId || isSuperAdmin) return;

  // If the user already has global view permission,
  // no need to fetch job-specific permissions.
  if (hasPermission("view_all_jobs")) {
  return;
}

  fetchMine();
}, [jobId, isSuperAdmin, fetchMine]);

  const can = useCallback(
    (field) => {
      if (isSuperAdmin) return true;

      const globalPermission = GLOBAL_PERMISSION_MAP[field];

      // If user has global permission, allow immediately
      if (
        globalPermission &&
        hasPermission(globalPermission)
      ) {
        return true;
      }

      // Otherwise use JobUserPermission
      return !!myPermission?.[field];
    },
    [isSuperAdmin, myPermission]
  );

  return {
    myPermission,
    loading,
    fetchMine,
    can,
    isSuperAdmin,
  };
}