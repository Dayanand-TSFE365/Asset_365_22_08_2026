// ===============================
// File: src/pages/tickets/components/TicketReplyBox.jsx
// ===============================

import { useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Box, TextField, Button, CircularProgress, IconButton, Chip, Stack, Tooltip } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { API } from "../../../config/api";

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
});

/**
 * Message composer for a ticket's reply thread.
 * Posts to POST /tickets/{ticketId}/reply as multipart/form-data
 * (message + files) — the backend route takes UploadFile params, so this
 * can't be sent as JSON. On success it hands the newly-created reply
 * object (including its `attachments` array) back via onReplySent so the
 * parent (usually TicketChat) can append it to the thread without a full
 * refetch.
 */
export default function TicketReplyBox({ ticketId, onReplySent, disabled = false }) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length) setFiles((prev) => [...prev, ...picked]);
    e.target.value = ""; // allow re-selecting the same file later
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed && files.length === 0) return;
    if (!ticketId) { toast.error("Missing ticket id."); return; }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("message", trimmed);
      files.forEach((file) => formData.append("files", file));

      const res = await axios.post(
        API.CREATE_TICKET_REPLY(ticketId),
        formData,
        { headers: authHeaders() } // axios sets multipart Content-Type/boundary itself
      );
      setMessage("");
      setFiles([]);
      if (typeof onReplySent === "function") onReplySent(res.data);
    } catch (error) {
      console.error("Failed to send reply:", error);
      toast.error(error.response?.data?.detail || "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    // Enter to send, Shift+Enter for a newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
      {files.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ px: 1.5, pt: 1 }}>
          {files.map((file, i) => (
            <Chip
              key={`${file.name}-${i}`}
              label={file.name}
              size="small"
              onDelete={() => removeFile(i)}
              disabled={sending}
            />
          ))}
        </Stack>
      )}

      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end", p: 1.5 }}>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <Tooltip title="Attach files">
          <span>
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || sending}
              sx={{ height: 40, width: 40 }}
            >
              <AttachFileIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={6}
          placeholder="Type a reply… (Enter to send, Shift+Enter for new line)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={disabled || sending || (!message.trim() && files.length === 0)}
          sx={{ minWidth: 44, height: 40, px: 1.5 }}
        >
          {sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon fontSize="small" />}
        </Button>
      </Box>
    </Box>
  );
}