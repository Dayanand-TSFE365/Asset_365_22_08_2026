// ===============================
// File: src/pages/tickets/visitReport/VisitReportPrintDialog.jsx
// ===============================
//
// Flow:
//   1. Open -> GET /visit-report. If it exists, pre-fill the members
//      form; if not (404), start blank.
//   2. "Save & Preview" -> POST (first time) or PUT (after) the members,
//      then GET /visit-report/pdf-data and hand that to the existing
//      generateVisitReportPdf() for a client-side PDF, shown in
//      FileViewerDialog.
//   3. "Submit for Approval" -> PATCH /visit-report/submit. The backend
//      itself moves the ticket to its "Submitted" status — we just
//      refetch the ticket afterward so the UI reflects it.
//   4. "Approve" (only the ticket's assignee sees this button) ->
//      generates/reuses the PDF, uploads it as multipart/form-data to
//      PATCH /visit-report/approve (backend now requires the file),
//      which saves it server-side and flips both the report and the
//      ticket to Approved.
//   5. Once approved, "Download Report" re-fetches pdf-data and opens
//      the same preview, now with the file ready to save.

import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, CircularProgress, Box, Chip,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import { API } from "../../../config/api";
import VisitReportMembers from "./VisitReportMembers";
import FileViewerDialog from "../../../components/common/FileViewerDialog";
import { generateVisitReportPdf } from "./generateVisitReportPdf";

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

const DEFAULT_MEMBER_GROUPS = [
  { company: "TSF", people: [{ name: "", online: false }] },
  { company: "FL Tecnics", people: [{ name: "", online: false }] },
  { company: "Sun Pharma", people: [{ name: "", online: false }] },
];

const STATUS_COLORS = {
  draft:     { bg: "#f1f5f9", fg: "#475569" },
  submitted: { bg: "#fef9c3", fg: "#854d0e" },
  approved:  { bg: "#dcfce7", fg: "#166534" },
};

function StatusChip({ status }) {
  if (!status) return null;
  const key = status.toLowerCase();
  const c = STATUS_COLORS[key] || STATUS_COLORS.draft;
  return (
    <Chip
      size="small"
      label={status.toUpperCase()}
      sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 700 }}
    />
  );
}

// ── shape converters ────────────────────────────────────────────────
// Backend members are flat: [{ company_name, member_name, is_online, display_order }]
// VisitReportMembers works in grouped form: [{ company, people:[{name, online}] }]

function membersToGroups(members) {
  if (!members || members.length === 0) return DEFAULT_MEMBER_GROUPS;
  const order = [];
  const byCompany = {};
  [...members]
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .forEach((m) => {
      const key = m.company_name || "Other";
      if (!byCompany[key]) { byCompany[key] = []; order.push(key); }
      byCompany[key].push({ name: m.member_name || "", online: !!m.is_online });
    });
  return order.map((company) => ({ company, people: byCompany[company] }));
}

function groupsToMembers(groups) {
  let display_order = 1;
  const out = [];
  (groups || []).forEach((g) => {
    (g.people || []).forEach((p) => {
      if (!p.name?.trim()) return;
      out.push({
        company_name: g.company || "",
        member_name: p.name.trim(),
        is_online: !!p.online,
        display_order: display_order++,
      });
    });
  });
  return out;
}

// GET /visit-report/pdf-data already returns everything flat and
// resolved (work_done, members). generateVisitReportPdf.js still
// expects { ticket, dailyTasks, memberGroups } — adapt here rather
// than touching that file.
function pdfDataToLegacyShape(data) {
  const ticket = {
    customer_name: data.customer_name,
    scope_of_work: data.scope_of_work,
    meeting_date: data.meeting_date,
    meeting_time: data.meeting_time,
    venue: data.venue,
    order_no: data.order_no,
    agenda: data.agenda,
  };
  const dailyTasks = (data.work_done || []).map((desc, i) => ({
    id: `wd-${i}`,
    task_description: desc,
    is_selected: true, // pdf-data already only sends the resolved work-done points
  }));
  const memberGroups = membersToGroups(data.members || []);
  return { ticket, dailyTasks, memberGroups };
}

// normalize whatever the backend sends so button logic isn't at the
// mercy of exact casing ("Draft" vs "draft" vs null). Backend field is
// `status_name` on every visit-report endpoint response.
function normalizeStatus(raw) {
  if (!raw) return "draft";
  return String(raw).toLowerCase();
}

export default function VisitReportPrintDialog({ open, onClose, ticket, onTicketUpdated }) {
  const ticketId = ticket?.id;

  const currentUserId = useMemo(() => {
    const user = getStoredUser();
    return user?.user_id ?? user?.id ?? null;
  }, []);
  const isAssigner = !!ticket?.created_by && ticket.created_by === currentUserId;

  const [loading, setLoading]       = useState(false);
  const [reportExists, setReportExists] = useState(false);
  const [status, setStatus]         = useState(null); // null (no report yet) | "draft" | "submitted" | "approved"

  const [memberGroups, setMemberGroups] = useState(DEFAULT_MEMBER_GROUPS);

  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving]   = useState(false);

  const [docInstance, setDocInstance]       = useState(null);
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState(null);
  const [previewOpen, setPreviewOpen]       = useState(false);

  const fileName = `Visit_Report_${ticket?.ticket_no || ticket?.id}.pdf`;

  const fetchReport = useCallback(() => {
    if (!ticketId) return;
    setLoading(true);
    axios
      .get(API.GET_VISIT_REPORT(ticketId), { headers: authHeaders() })
      .then((res) => {
        setReportExists(true);
        setStatus(normalizeStatus(res.data?.status_name));
        setMemberGroups(membersToGroups(res.data?.members));
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setReportExists(false);
          setStatus(null);
          setMemberGroups(DEFAULT_MEMBER_GROUPS);
        } else {
          console.error("Failed to load visit report:", err);
          toast.error(err.response?.data?.detail || "Failed to load visit report.");
        }
      })
      .finally(() => setLoading(false));
  }, [ticketId]);

  const pdfDataForViewer = useMemo(
    () => (pdfArrayBuffer ? { data: pdfArrayBuffer } : null),
    [pdfArrayBuffer]
  );

  useEffect(() => {
    if (open) {
      fetchReport();
    } else {
      setPreviewOpen(false);
      setPdfArrayBuffer(null);
      setDocInstance(null);
    }
  }, [open, fetchReport]);

  // ── derived, normalized states drive every button below ──────────────
  const isSubmitted = status === "submitted";
  const isApproved  = status === "approved";
  const readOnly    = isSubmitted || isApproved;      // members locked
  const canSubmit    = reportExists && !readOnly;      // report saved, not yet sent/approved

  const saveMembers = async () => {
    const payload = { members: groupsToMembers(memberGroups) };
    if (!reportExists) {
      const res = await axios.post(API.CREATE_VISIT_REPORT(ticketId), payload, { headers: authHeaders() });
      setReportExists(true);
      setStatus(normalizeStatus(res.data?.status_name));
    } else {
      const res = await axios.put(API.UPDATE_VISIT_REPORT(ticketId), payload, { headers: authHeaders() });
      setStatus(normalizeStatus(res.data?.status_name));
    }
  };

  // Builds the PDF from /pdf-data and stores it in state (used by both
  // preview-only flows and, now, as the file Approve uploads).
  const buildPdf = async () => {
    const res = await axios.get(API.GET_VISIT_REPORT_PDF_DATA(ticketId), { headers: authHeaders() });
    const doc = await generateVisitReportPdf(pdfDataToLegacyShape(res.data));
    const buffer = doc.output("arraybuffer");
    setDocInstance(doc);
    setPdfArrayBuffer(buffer);
    return { doc, buffer };
  };

  const buildAndPreview = async () => {
    await buildPdf();
    setPreviewOpen(true);
  };

  // Editable draft: save members, then preview.
  const handleSaveAndPreview = async () => {
    setGenerating(true);
    try {
      await saveMembers();
      await buildAndPreview();
    } catch (error) {
      console.error("Failed to save/preview visit report:", error);
      toast.error(error.response?.data?.detail || "Failed to save or preview the report.");
    } finally {
      setGenerating(false);
    }
  };

  // Locked (submitted/approved): just re-render the PDF, nothing to save.
  const handlePreviewOnly = async () => {
    setGenerating(true);
    try {
      await buildAndPreview();
    } catch (error) {
      console.error("Failed to preview visit report:", error);
      toast.error(error.response?.data?.detail || "Failed to load the report.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await axios.patch(API.SUBMIT_VISIT_REPORT(ticketId), {}, { headers: authHeaders() });
      setStatus(normalizeStatus(res.data?.status_name));
      await onTicketUpdated?.(); // backend already moved the ticket's status — just refresh it
      toast.success("Sent for approval.");
    } catch (error) {
      console.error("Failed to submit visit report:", error);
      toast.error(error.response?.data?.detail || "Failed to submit for approval.");
    } finally {
      setSubmitting(false);
    }
  };

  // Approve now requires uploading the generated PDF as multipart/form-data.
  // Reuse the already-built PDF if the assignee just previewed it; otherwise
  // build one fresh so Approve always has a file to send.
  const handleApprove = async () => {
    setApproving(true);
    try {
      let buffer = pdfArrayBuffer;
      if (!buffer) {
        ({ buffer } = await buildPdf());
      }

      const blob = new Blob([buffer], { type: "application/pdf" });
      const formData = new FormData();
      formData.append("file", blob, fileName);

      const res = await axios.patch(
        API.APPROVE_VISIT_REPORT(ticketId),
        formData,
        { headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } }
      );
      setStatus(normalizeStatus(res.data?.status_name));
      await onTicketUpdated?.(); // backend already moved the ticket's status — just refresh it
      toast.success("Visit report approved.");
    } catch (error) {
      console.error("Failed to approve visit report:", error);
      toast.error(error.response?.data?.detail || "Failed to approve the report.");
    } finally {
      setApproving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Present Members — Visit Report</span>
          <StatusChip status={status} />
        </DialogTitle>

        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                {readOnly
                  ? "This report has been submitted, so members are locked. You can still preview or, once approved, download it."
                  : "These are saved to this ticket's visit report. Everything else (customer, agenda, work done) comes from the ticket automatically."}
              </Typography>
              <VisitReportMembers
                groups={memberGroups}
                onChange={readOnly ? () => {} : setMemberGroups}
              />
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, flexWrap: "wrap", gap: 1 }}>
          <Button onClick={onClose} disabled={generating || submitting || approving}>
            Close
          </Button>

          {/* Not locked yet — either no report, or still draft: can (re)save + preview */}
          {!readOnly && (
            <Button
              variant="contained"
              startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <PrintIcon fontSize="small" />}
              onClick={handleSaveAndPreview}
              disabled={loading || generating}
            >
              {generating ? "Working..." : "Save & Preview"}
            </Button>
          )}

          {/* Locked but not yet approved — read-only preview */}
          {readOnly && !isApproved && (
            <Button
              variant="outlined"
              startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <PrintIcon fontSize="small" />}
              onClick={handlePreviewOnly}
              disabled={loading || generating}
            >
              {generating ? "Loading..." : "Preview"}
            </Button>
          )}

          {/* Report saved, not yet submitted or approved */}
          {canSubmit && (
            <Button variant="outlined" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          )}

          {/* Submitted, awaiting approval — only the ticket's assignee can approve */}
          {/* Submitted, awaiting approval — only the ticket's assigner (created_by) can approve */}
        {isSubmitted && isAssigner && (
        <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={approving || generating}
        >
            {approving ? "Approving..." : "Approve"}
        </Button>
        )}

        {/* Submitted, but this user isn't the assigner — just say so */}
        {isSubmitted && !isAssigner && (
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
            Waiting for the assigner to approve.
        </Typography>
        )}

          {/* Approved — ready to download */}
          {isApproved && (
            <Button
              variant="contained"
              startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon fontSize="small" />}
              onClick={handlePreviewOnly}
              disabled={generating}
            >
              {generating ? "Loading..." : "Download Report"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <FileViewerDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fileName={fileName}
        kind="pdf"
        loading={false}
        error={null}
        pdfData={pdfDataForViewer}
        onDownload={() => docInstance?.save(fileName)}
      />
    </>
  );
}