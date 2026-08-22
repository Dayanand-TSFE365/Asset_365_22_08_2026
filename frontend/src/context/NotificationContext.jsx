// ===============================
// File: src/context/NotificationContext.jsx
// ===============================

import { createContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API } from "../config/api";
import { useAuth } from "../auth/AuthContext";

export const NotificationContext = createContext();

function authHeaders() {
  const token = sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Builds ws://.../ws/notifications/{userId} off the same host/protocol the
// REST notifications API already uses — same pattern as TaskDetails'
// buildTaskSocketUrl, so it automatically matches http/ws or https/wss.
// Shared by BOTH task and ticket notifications — one global connection,
// resynced on any incoming push regardless of which domain it's for.
function buildNotificationSocketUrl(userId) {
  try {
    const restUrl = new URL(API.GET_TASK_NOTIFICATIONS);
    const wsProtocol = restUrl.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${restUrl.host}/ws/notifications/${userId}`;
  } catch {
    return null;
  }
}

// ── Toast gating for ticket pushes ─────────────────────────────────────────
// The ticket socket carries every ticket event (new_reply, status_changed,
// submitted, approved, ticket_assigned) so the bell/unread counts always
// resync correctly. But a toast popup for every new chat message is noisy —
// only "Submitted for approval" and "Approved" are important enough to
// interrupt with a toast. Everything else (including new_reply and plain
// status_changed) still updates the bell silently.
const TICKET_TOAST_TYPES = new Set([
  "new_reply",
  "submitted",
  "approved",
  "ticket_assigned",
  "status_changed",
]);

// A push is a "ticket event" if it carries a ticket_id (as opposed to a
// task_id for task notifications). Adjust this check if the backend ever
// sends an explicit `domain`/`entity` field instead.
function isTicketEvent(data) {
  return data?.ticket_id != null;
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const currentUserId = user?.user_id;

  // ── task notifications (unchanged) ──
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── ticket notifications (new) ──
  const [ticketNotifications, setTicketNotifications] = useState([]);
  const [ticketLoading, setTicketLoading] = useState(true);

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const ticketUnreadCount = ticketNotifications.filter((n) => !n.is_read).length;

  // ── fetch full task notification list ────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const res = await axios.get(API.GET_TASK_NOTIFICATIONS, { headers: authHeaders() });
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // ── fetch full ticket notification list ──────────────────────────────
  const fetchTicketNotifications = useCallback(async () => {
    if (!currentUserId) return;
    setTicketLoading(true);
    try {
      const res = await axios.get(API.GET_TICKET_NOTIFICATIONS, { headers: authHeaders() });
      setTicketNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch ticket notifications:", err);
    } finally {
      setTicketLoading(false);
    }
  }, [currentUserId]);

  // ── mark a single task notification read ─────────────────────────────
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await axios.patch(API.MARK_TASK_NOTIFICATION_READ(notificationId), null, { headers: authHeaders() });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  // ── mark every unread task notification read at once ─────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await axios.patch(API.MARK_ALL_TASK_NOTIFICATIONS_READ, null, { headers: authHeaders() });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: n.read_at || new Date().toISOString() })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }, []);

  // ── mark every unread task notification tied to a specific task read ──
  const markTaskNotificationsRead = useCallback(async (taskId) => {
    const headers = authHeaders();
    try {
      const res = await axios.get(API.GET_TASK_NOTIFICATIONS, { headers });
      const all = res.data || [];
      const unreadForTask = all.filter((n) => n.task_id === taskId && !n.is_read);
      if (unreadForTask.length === 0) return;

      await Promise.all(
        unreadForTask.map((n) => axios.patch(API.MARK_TASK_NOTIFICATION_READ(n.id), null, { headers }))
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n.task_id === taskId && !n.is_read
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (err) {
      console.error("Failed to mark task notifications as read:", err);
    }
  }, []);

  // ── mark a single ticket notification read ────────────────────────────
  const markTicketAsRead = useCallback(async (notificationId) => {
    try {
      await axios.patch(API.MARK_TICKET_NOTIFICATION_READ(notificationId), null, { headers: authHeaders() });
      setTicketNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark ticket notification as read:", err);
    }
  }, []);

  // ── mark every unread ticket notification read at once ────────────────
  const markAllTicketAsRead = useCallback(async () => {
    try {
      await axios.patch(API.MARK_ALL_TICKET_NOTIFICATIONS_READ, null, { headers: authHeaders() });
      setTicketNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all ticket notifications as read:", err);
    }
  }, []);

  // ── mark every unread ticket notification tied to a specific ticket
  // read — same pattern as markTaskNotificationsRead, used when a ticket
  // details page opens. ──────────────────────────────────────────────────
  const markTicketNotificationsRead = useCallback(async (ticketId) => {
    const headers = authHeaders();
    try {
      const res = await axios.get(API.GET_TICKET_NOTIFICATIONS, { headers });
      const all = res.data || [];
      const unreadForTicket = all.filter((n) => n.ticket_id === ticketId && !n.is_read);
      if (unreadForTicket.length === 0) return;

      await Promise.all(
        unreadForTicket.map((n) => axios.patch(API.MARK_TICKET_NOTIFICATION_READ(n.id), null, { headers }))
      );

      setTicketNotifications((prev) =>
        prev.map((n) =>
          n.ticket_id === ticketId && !n.is_read
            ? { ...n, is_read: true }
            : n
        )
      );
    } catch (err) {
      console.error("Failed to mark ticket notifications as read:", err);
    }
  }, []);

  // ── initial load — both domains ────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;
    fetchNotifications();
    fetchTicketNotifications();
  }, [currentUserId, fetchNotifications, fetchTicketNotifications]);

  // ── websocket — connects ONCE per session, at this Provider level,
  // shared by task AND ticket notifications. ─────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;

    const connect = () => {
      const url = buildNotificationSocketUrl(currentUserId);
      if (!url) return;

      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;
        console.log("Notification websocket connected");
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        // Re-sync both lists so unread counts / bell contents stay
        // accurate regardless of whether this push was a task or ticket
        // event, and regardless of the exact shape the backend sends.
        fetchNotifications();
        fetchTicketNotifications();

        // Toast gating: task notifications keep firing a toast for every
        // push (unchanged). Ticket notifications only toast for
        // "submitted" / "approved" — a new chat reply or a routine status
        // change updates the bell but doesn't pop a toast.
        const ticketEvent = isTicketEvent(data);
        const shouldToast = ticketEvent
          ? TICKET_TOAST_TYPES.has(data.notification_type)
          : true;

        const toastLabel = data.title || data.message;
        if (shouldToast && toastLabel) {
          toast(toastLabel, { icon: "🔔" });
        }
      };

      socket.onclose = () => {
        if (cancelled) return;
        console.log("Notification websocket disconnected");
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [currentUserId, fetchNotifications, fetchTicketNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        // task notifications
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        markTaskNotificationsRead,

        // ticket notifications
        ticketNotifications,
        ticketUnreadCount,
        ticketLoading,
        fetchTicketNotifications,
        markTicketAsRead,
        markAllTicketAsRead,
        markTicketNotificationsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}