// ===============================
// File: src/components/common/FileViewerDialog.jsx
// ===============================
//
// A MUI dialog that previews a file INLINE instead of letting the browser
// try to render/download it natively. This is important for PDFs — letting
// the browser open a blob URL directly depends on the response's
// Content-Type header being exactly right, and if it isn't, the browser
// just shows raw PDF bytes as text.
//
// react-pdf sidesteps that entirely: it hands the raw PDF bytes to pdf.js,
// which parses and renders the document itself, regardless of what
// Content-Type the server sent. Images and text files are simple enough
// that we just render them directly from the fetched blob.
//
// Layout is modeled on Google Drive / Chrome's PDF viewer: a left sidebar
// of page thumbnails (click to jump, active page highlighted as you
// scroll), a toolbar with zoom %, Fit Width, rotate, print and download,
// and a large central scrollable viewer.

import { useState, useEffect, useCallback } from "react";
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, Typography,
  CircularProgress, Stack, Button, Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";

const TEXT_EXT  = ["txt", "csv", "log", "json", "md"];
const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];

// Decide how (or whether) a file can be previewed, based on its extension.
// Returns "pdf" | "image" | "text" | null (null = not previewable, no View
// button should be shown for it — only Download makes sense).
export function getPreviewKind(fileName) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (IMAGE_EXT.includes(ext)) return "image";
  if (TEXT_EXT.includes(ext)) return "text";
  return null;
}

export default function FileViewerDialog({
  open, onClose, fileName, kind, loading, error,
  pdfData, imageUrl, textContent, onDownload,
}) {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

  // Build a browser-viewer-friendly blob URL for PDFs so View looks like a
  // native print-preview style reader instead of the custom react-pdf canvas UI.
  useEffect(() => {
    if (!open || kind !== "pdf" || !pdfData?.data) {
      setPdfPreviewUrl(null);
      return;
    }

    const blob = new Blob([pdfData.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    setPdfPreviewUrl(url);

    return () => {
      window.URL.revokeObjectURL(url);
    };
  }, [open, kind, pdfData?.data]);

  // print via a hidden iframe loaded with a blob URL we create ourselves —
  // since we set the blob's MIME type explicitly to application/pdf here,
  // this always renders correctly in the print dialog regardless of what
  // Content-Type the original server response used.
  const handlePrint = useCallback(() => {
    if (!pdfPreviewUrl) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = pdfPreviewUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch {
        // ignore — user can still use Download
      }
    };
  }, [pdfPreviewUrl]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{ sx: { width: "95vw", height: "95vh", borderRadius: 2 } }}
    >
      {/* ── Toolbar ── */}
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1, py: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: 320 }}>
            {fileName}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.25} alignItems="center">
          {kind === "pdf" && (
            <Tooltip title="Print">
              <IconButton size="small" onClick={handlePrint} disabled={!pdfPreviewUrl}>
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Download">
            <IconButton size="small" onClick={onDownload}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ display: "flex", p: 0, overflow: "hidden", bgcolor: "#f4f4f5" }}
      >
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }} spacing={2}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">Loading preview…</Typography>
          </Stack>
        ) : error ? (
          <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }} spacing={1.5}>
            <Typography variant="body2" color="error.main">Failed to load preview.</Typography>
            <Button size="small" variant="outlined" onClick={onDownload} startIcon={<DownloadIcon fontSize="small" />}>
              Download instead
            </Button>
          </Stack>
        ) : kind === "pdf" ? (
          pdfPreviewUrl ? (
            <Box sx={{ flex: 1, bgcolor: "#fff" }}>
              <iframe
                title={fileName || "PDF Preview"}
                src={pdfPreviewUrl}
                style={{ width: "100%", height: "100%", border: 0 }}
              />
            </Box>
          ) : (
            <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }} spacing={2}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">Preparing PDF preview…</Typography>
            </Stack>
          )
        ) : kind === "image" ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
            <img
              src={imageUrl}
              alt={fileName}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}
            />
          </Box>
        ) : kind === "text" ? (
          <Box sx={{ flex: 1, p: 2, overflow: "auto" }}>
            <Box
              component="pre"
              sx={{
                width: "100%", m: 0, p: 2, bgcolor: "#fff", borderRadius: 2,
                border: "1px solid", borderColor: "divider",
                fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}
            >
              {textContent}
            </Box>
          </Box>
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }} spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              Preview not available for this file type.
            </Typography>
            <Button size="small" variant="outlined" onClick={onDownload} startIcon={<DownloadIcon fontSize="small" />}>
              Download instead
            </Button>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}