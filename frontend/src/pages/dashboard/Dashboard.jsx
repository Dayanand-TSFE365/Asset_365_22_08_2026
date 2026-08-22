// Dashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ReactECharts from "echarts-for-react";
import { API } from "../../config/api";
import { useAuth } from "../../auth/AuthContext";

import {
  Box, Card, CardContent, Chip, CircularProgress, Divider,
  Grid, LinearProgress, Paper, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Typography,
} from "@mui/material";

import MonitorIcon from "@mui/icons-material/Monitor";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LockIcon from "@mui/icons-material/Lock";
import InventoryIcon from "@mui/icons-material/Inventory";
import ArticleIcon from "@mui/icons-material/Article";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ComputerIcon from "@mui/icons-material/Computer";
import BarChartIcon from "@mui/icons-material/BarChart";
import PieChartIcon from "@mui/icons-material/PieChart";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  indigo:  "#6366f1",
  violet:  "#8b5cf6",
  cyan:    "#06b6d4",
  emerald: "#10b981",
  amber:   "#f59e0b",
  rose:    "#f43f5e",
  sky:     "#0ea5e9",
  fuchsia: "#d946ef",
};

// ── Permission hook ───────────────────────────────────────────────────────────
// Matches keys like "view_assets", "update_clientlicenses", "delete_jobs", etc.
function usePermissions() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const can = useCallback((action, module) => {
    if (isSuperAdmin) return true;
    const stored = sessionStorage.getItem("permissions");
    if (!stored) return false;
    try {
      const perms = JSON.parse(stored);
      return Array.isArray(perms) && perms.includes(`${action}_${module}`);
    } catch { return false; }
  }, [isSuperAdmin]);
  const canView = useCallback((module) => can("view", module), [can]);
  return { can, canView, isSuperAdmin };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseArray = (res) => {
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.data)) return res.data.data;
  if (Array.isArray(res.data?.items)) return res.data.items;
  return [];
};
const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString());
const fmtCurrency = (n) =>
  n == null || n === "" ? "—" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt) ? "—" : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ── Section Title ─────────────────────────────────────────────────────────────
function SectionTitle({ children, Icon, color = C.indigo }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
      {Icon && <Icon sx={{ fontSize: 16, color }} />}
      <Typography variant="caption" fontWeight={800} sx={{
        textTransform: "uppercase", letterSpacing: "0.12em", color: "text.secondary",
      }}>
        {children}
      </Typography>
    </Stack>
  );
}

// ── Pill / Status Chip ────────────────────────────────────────────────────────
const PILL_COLORS = {
  green:  { bgcolor: "#d1fae5", color: "#065f46" },
  red:    { bgcolor: "#fee2e2", color: "#991b1b" },
  amber:  { bgcolor: "#fef3c7", color: "#92400e" },
  blue:   { bgcolor: "#dbeafe", color: "#1e40af" },
  violet: { bgcolor: "#ede9fe", color: "#5b21b6" },
  gray:   { bgcolor: "#f3f4f6", color: "#4b5563" },
};
function Pill({ label, color = "gray" }) {
  const c = PILL_COLORS[color] || PILL_COLORS.gray;
  return (
    <Chip label={label} size="small" sx={{
      ...c, fontWeight: 700, fontSize: "0.68rem", height: 22, borderRadius: "999px",
    }} />
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
const BAR_COLORS = {
  red: C.rose, amber: C.amber, green: C.emerald, blue: C.indigo, gray: "#9ca3af",
};
function ProgressBar({ value, max, color = "blue" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <LinearProgress variant="determinate" value={pct}
      sx={{
        height: 6, borderRadius: 3,
        bgcolor: "action.hover",
        "& .MuiLinearProgress-bar": { bgcolor: BAR_COLORS[color] || BAR_COLORS.blue, borderRadius: 3 },
      }}
    />
  );
}

// ── Lock Overlay ──────────────────────────────────────────────────────────────
function LockOverlay() {
  return (
    <Box sx={{
      position: "absolute", inset: 0, borderRadius: "inherit", zIndex: 2,
      bgcolor: "rgba(255,255,255,0.7)", backdropFilter: "blur(3px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5,
    }}>
      <LockIcon sx={{ fontSize: 22, color: "text.disabled" }} />
      <Typography variant="caption" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.1em", color: "text.disabled" }}>
        No Access
      </Typography>
    </Box>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, Icon, accent, to, module }) {
  const navigate = useNavigate();
  const { canView } = usePermissions();
  const hasAccess = !module || canView(module);
  const isClickable = to && hasAccess;

  return (
    <Card elevation={0} onClick={() => isClickable && navigate(to)} sx={{
      borderRadius: 3, position: "relative", overflow: "hidden",
      border: "1px solid", borderColor: "divider",
      borderLeft: `4px solid ${hasAccess ? accent : "#cbd5e1"}`,
      transition: "all 0.22s",
      cursor: isClickable ? "pointer" : (to && !hasAccess ? "not-allowed" : "default"),
      "&:hover": isClickable ? {
        boxShadow: `0 8px 30px ${accent}33`,
        transform: "translateY(-3px)",
      } : {},
    }}>
      {!hasAccess && to && <LockOverlay />}

      <Box sx={{
        position: "absolute", top: -20, right: -20, width: 80, height: 80,
        borderRadius: "50%", bgcolor: accent, opacity: 0.08,
      }} />

      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="caption" fontWeight={800} sx={{
            textTransform: "uppercase", letterSpacing: "0.1em", color: "text.secondary",
          }}>
            {title}
          </Typography>
          <Box sx={{
            p: 1, borderRadius: 2,
            background: `linear-gradient(135deg, ${accent}30, ${accent}10)`,
          }}>
            <Icon sx={{ fontSize: 18, color: accent }} />
          </Box>
        </Stack>

        <Typography variant="h4" fontWeight={900} sx={{
          color: hasAccess ? "text.primary" : "text.disabled",
          letterSpacing: "-0.02em", lineHeight: 1,
        }}>
          {hasAccess ? value : "—"}
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
          {sub && (
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
              {hasAccess ? sub : "Permission required"}
            </Typography>
          )}
          {isClickable && (
            <ArrowForwardIcon sx={{ fontSize: 14, color: accent, ml: "auto", opacity: 0.7 }} />
          )}
        </Stack>

        {to && (
          <Box sx={{
            position: "absolute", top: 12, right: 12, width: 8, height: 8,
            borderRadius: "50%",
            bgcolor: hasAccess ? C.emerald : "#cbd5e1",
            boxShadow: hasAccess ? `0 0 0 3px ${C.emerald}33` : "none",
          }} />
        )}
      </CardContent>
    </Card>
  );
}

// ── AlertCard ─────────────────────────────────────────────────────────────────
const ALERT_COLORS = {
  red:   { bg: "#fff1f2", border: "#fecdd3", iconBg: "#fee2e2", text: "#be123c" },
  amber: { bg: "#fffbeb", border: "#fde68a", iconBg: "#fef3c7", text: "#b45309" },
  green: { bg: "#f0fdf4", border: "#bbf7d0", iconBg: "#dcfce7", text: "#15803d" },
};

function AlertCard({ title, value, Icon, description, severity, to, module }) {
  const navigate = useNavigate();
  const { canView } = usePermissions();
  const hasAccess = !module || canView(module);
  const isOk = value === 0;
  const c = isOk ? ALERT_COLORS.green : (ALERT_COLORS[severity] || ALERT_COLORS.red);
  const isClickable = to && !isOk && hasAccess;

  return (
    <Card elevation={0} onClick={() => isClickable && navigate(to)} sx={{
      borderRadius: 3,
      border: `1px solid ${c.border}`,
      bgcolor: c.bg,
      transition: "all 0.2s",
      cursor: isClickable ? "pointer" : "default",
      "&:hover": isClickable ? { boxShadow: 4, transform: "translateY(-2px)" } : {},
    }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2.5,
            bgcolor: c.iconBg,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {!hasAccess
              ? <LockIcon sx={{ fontSize: 18, color: "text.disabled" }} />
              : <Icon sx={{ fontSize: 20, color: c.text }} />
            }
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight={900} sx={{ color: hasAccess ? c.text : "text.disabled", lineHeight: 1 }}>
              {hasAccess ? value : "—"}
            </Typography>
            <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>{title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {hasAccess ? description : "No view permission"}
            </Typography>
          </Box>
          {isOk && hasAccess && <CheckCircleOutlineIcon sx={{ color: C.emerald, flexShrink: 0 }} />}
          {isClickable && <ArrowForwardIcon sx={{ fontSize: 14, color: "text.disabled", flexShrink: 0 }} />}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── AssetStatusCard ───────────────────────────────────────────────────────────
const STATUS_GRADIENTS = {
  blue:   `linear-gradient(135deg, ${C.indigo}22, ${C.sky}11)`,
  green:  `linear-gradient(135deg, ${C.emerald}22, ${C.cyan}11)`,
  violet: `linear-gradient(135deg, ${C.violet}22, ${C.fuchsia}11)`,
  amber:  `linear-gradient(135deg, ${C.amber}22, ${C.rose}11)`,
};
const STATUS_ICON_COLORS = {
  blue: C.indigo, green: C.emerald, violet: C.violet, amber: C.amber,
};

function AssetStatusCard({ label, value, total, color, Icon, to, module }) {
  const navigate = useNavigate();
  const { canView } = usePermissions();
  const hasAccess = !module || canView(module);
  const iconColor = STATUS_ICON_COLORS[color] || C.indigo;

  return (
    <Card elevation={0} onClick={() => hasAccess && navigate(to)} sx={{
      borderRadius: 3, position: "relative", overflow: "hidden",
      border: "1px solid", borderColor: "divider",
      background: STATUS_GRADIENTS[color] || STATUS_GRADIENTS.blue,
      transition: "all 0.22s",
      cursor: hasAccess ? "pointer" : "not-allowed",
      "&:hover": hasAccess ? { boxShadow: 5, transform: "translateY(-3px)" } : {},
    }}>
      {!hasAccess && <LockOverlay />}
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="caption" fontWeight={800} sx={{
            textTransform: "uppercase", letterSpacing: "0.1em", color: "text.secondary",
          }}>
            {label}
          </Typography>
          <Icon sx={{ fontSize: 16, color: hasAccess ? iconColor : "text.disabled" }} />
        </Stack>
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h4" fontWeight={900} sx={{ color: hasAccess ? "text.primary" : "text.disabled", lineHeight: 1 }}>
            {hasAccess ? value : "—"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {hasAccess && total > 0 ? `${Math.round((value / total) * 100)}%` : "—"}
          </Typography>
        </Stack>
        <ProgressBar value={hasAccess ? value : 0} max={total} color={hasAccess ? color : "gray"} />
      </CardContent>
    </Card>
  );
}

// ── ChartCard ─────────────────────────────────────────────────────────────────
function ChartCard({ title, Icon, children, sx = {} }) {
  return (
    <Paper elevation={0} sx={{
      borderRadius: 3, border: "1px solid", borderColor: "divider",
      p: 2.5, ...sx,
    }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        {Icon && <Icon sx={{ fontSize: 16, color: "text.secondary" }} />}
        <Typography variant="body2" fontWeight={700} color="text.secondary">{title}</Typography>
      </Stack>
      {children}
    </Paper>
  );
}

// ── LockedChart ───────────────────────────────────────────────────────────────
function LockedChart() {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ height: 144, color: "text.disabled" }}>
      <LockIcon />
      <Typography variant="caption">No view permission</Typography>
    </Stack>
  );
}

// ── Table helpers ─────────────────────────────────────────────────────────────
function THead({ cols }) {
  return (
    <TableHead>
      <TableRow sx={{ bgcolor: "#f8fafc" }}>
        {cols.map((c) => (
          <TableCell key={c} sx={{
            fontWeight: 800, fontSize: "0.68rem", textTransform: "uppercase",
            letterSpacing: "0.08em", color: "text.secondary", whiteSpace: "nowrap",
            py: 1.5, borderBottom: "2px solid", borderColor: "divider",
          }}>
            {c}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function LockedSection({ colCount, module }) {
  return (
    <TableRow>
      <TableCell colSpan={colCount} sx={{ py: 6, textAlign: "center" }}>
        <Stack alignItems="center" spacing={1}>
          <Box sx={{
            width: 40, height: 40, borderRadius: "50%",
            bgcolor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <LockIcon sx={{ fontSize: 18, color: "text.disabled" }} />
          </Box>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            No permission to view {module}
          </Typography>
          <Typography variant="caption" color="text.disabled">Contact your administrator</Typography>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

// ── Job document fields — these now live on the PANEL (sub_job), not the
// job itself. Backup is one boolean covering all three backup sub-types
// (PLC/SCADA/Other), same as JobList/JobDocumentsDashboard. ──────────────
const JOB_DOC_FIELDS = [
  "as_build", "soft_copy", "hard_copy", "factory_test_report",
  "bom_excel", "bom_pdf", "bom_updated_on_erp", "bom_updated_on_tally",
  "photos", "backup_file", "notes_and_tech_note", "additional_data", "mom_uploaded",
];

// Sum of completed fields across all of a job's panels.
function jobFieldsDone(job) {
  const subJobs = Array.isArray(job.sub_jobs) ? job.sub_jobs : [];
  return subJobs.reduce((sum, panel) => sum + JOB_DOC_FIELDS.filter((f) => !!panel[f]).length, 0);
}
// Total possible fields across all of a job's panels (fields × panel count).
function jobFieldsTotal(job) {
  const subJobs = Array.isArray(job.sub_jobs) ? job.sub_jobs : [];
  return subJobs.length * JOB_DOC_FIELDS.length;
}
// A job is "complete" only if it has at least one panel and every panel
// has every field marked.
function jobIsComplete(job) {
  const subJobs = Array.isArray(job.sub_jobs) ? job.sub_jobs : [];
  return subJobs.length > 0 && subJobs.every((panel) => JOB_DOC_FIELDS.every((f) => !!panel[f]));
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { canView } = usePermissions();

  const [computerAssets, setComputerAssets] = useState([]);
  const [manufacturers, setManufacturers]   = useState([]);
  const [suppliers, setSuppliers]           = useState([]);
  const [clientLicenses, setClientLicenses] = useState([]);
  const [licenseTypes, setLicenseTypes]     = useState([]);
  const [jobs, setJobs]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [lastRefresh, setLastRefresh]       = useState(null);

  const token   = sessionStorage.getItem("access_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [assetsRes, manRes, supRes, licRes, licTypeRes, jobsRes] = await Promise.all([
        canView("assets")         ? axios.get(API.GET_COMPUTER_ASSETS,     { headers }) : Promise.resolve({ data: [] }),
        canView("assets")         ? axios.get(API.GET_MANUFACTURERS,       { headers }) : Promise.resolve({ data: [] }),
        canView("assets")         ? axios.get(API.GET_SUPPLIERS,           { headers }) : Promise.resolve({ data: [] }),
        canView("clientlicenses") ? axios.get(API.GET_CLIENT_LICENSES,     { headers }) : Promise.resolve({ data: [] }),
        canView("clientlicenses") ? axios.get(API.GET_CLIENT_LICENSE_TYPES,{ headers }) : Promise.resolve({ data: [] }),
        // Jobs docs now live on sub_jobs — GET_JOBS (old, job-level only)
        // doesn't carry them, so this pulls from GET_JOBS_NEW instead.
        canView("jobs")           ? axios.get(API.GET_JOBS_NEW,            { headers }) : Promise.resolve({ data: [] }),
      ]);
      setComputerAssets(parseArray(assetsRes));
      setManufacturers(parseArray(manRes));
      setSuppliers(parseArray(supRes));
      setClientLicenses(parseArray(licRes));
      setLicenseTypes(parseArray(licTypeRes));
      setJobs(parseArray(jobsRes));
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const manufacturerMap = Object.fromEntries(manufacturers.map((m) => [m.id, m.name]));
  const supplierMap     = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));
  const licenseTypeMap  = Object.fromEntries(licenseTypes.map((t) => [t.license_type_id, t.name]));

  const safeComputerAssets = Array.isArray(computerAssets) ? computerAssets : [];
  const safeLicenses       = Array.isArray(clientLicenses) ? clientLicenses : [];
  const safeJobs           = Array.isArray(jobs)           ? jobs           : [];
  const now = new Date();

  const grandTotal = safeComputerAssets.length + safeLicenses.length + safeJobs.length;

  // ── Computer Assets stats ──
  const totalComputerAssets = safeComputerAssets.length;
  const companyAssets = safeComputerAssets.filter((a) => a.asset_type === "COMPANY").length;
  const clientAssets  = safeComputerAssets.filter((a) => a.asset_type === "CLIENT").length;
  const warrantyExpired = safeComputerAssets.filter((a) => {
    const d = new Date(a.warranty_expire);
    return !isNaN(d) && d < now;
  }).length;
  const warrantyExpiring = safeComputerAssets.filter((a) => {
    const d = new Date(a.warranty_expire);
    const diff = (d - now) / 86400000;
    return !isNaN(d) && diff >= 0 && diff <= 60;
  }).length;
  const warrantyValid = totalComputerAssets - warrantyExpired;
  const totalAssetPurchaseCost = safeComputerAssets.reduce((s, a) => s + (Number(a.purchase_cost) || 0), 0);

  // ── Client License stats ──
  const totalLicenses = safeLicenses.length;
  const expiredLicenses = safeLicenses.filter((l) => {
  if (!l.expired_on) return true;   // null / "" / undefined => Expired

  const d = new Date(l.expired_on);
  return isNaN(d) || d < now;       // invalid date OR past date => Expired
}).length;
  const expiringLicenses = safeLicenses.filter((l) => {
  if (!l.expired_on) return false; // already treated as expired

  const d = new Date(l.expired_on);
  if (isNaN(d)) return false;

  const diff = (d - now) / 86400000;
  return diff >= 0 && diff <= 30;
}).length;
  const activeLicenses = totalLicenses - expiredLicenses;
  const totalLicensePurchaseCost = safeLicenses.reduce((s, l) => s + (Number(l.purchase_cost) || 0), 0);

  const licenseTypeCount = {};
  safeLicenses.forEach((l) => {
    const name = licenseTypeMap[l.license_type_id] || `Type #${l.license_type_id ?? "?"}`;
    licenseTypeCount[name] = (licenseTypeCount[name] || 0) + 1;
  });

  // ── Jobs stats — aggregated from each job's panels ──
  const totalJobs = safeJobs.length;
  const completeJobs = safeJobs.filter(jobIsComplete).length;
  const pendingDocJobs = totalJobs - completeJobs;

  const PALETTE = Object.values(C);

  // ── Chart options ──
  const overviewPieOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, textStyle: { color: "#94a3b8" }, itemWidth: 10, itemHeight: 10 },
    series: [{
      type: "pie", radius: ["38%", "65%"],
      itemStyle: { borderRadius: 6, borderWidth: 2, borderColor: "transparent" },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: "bold", color: "#e2e8f0" } },
      data: [
        { value: canView("assets")         ? totalComputerAssets : 0, name: "Computer Assets", itemStyle: { color: C.indigo  } },
        { value: canView("clientlicenses") ? totalLicenses       : 0, name: "Client Licenses",  itemStyle: { color: C.emerald } },
        { value: canView("jobs")           ? totalJobs           : 0, name: "Jobs",             itemStyle: { color: C.violet  } },
      ],
    }],
  };

  const assetTypeBarOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { top: 8, bottom: 30, left: 36, right: 12 },
    xAxis: { type: "category", data: ["Company", "Client"], axisLabel: { color: "#94a3b8", fontSize: 11 }, axisLine: { lineStyle: { color: "#e2e8f0" } } },
    yAxis: { type: "value", axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#f1f5f9" } } },
    series: [{
      type: "bar", barMaxWidth: 48, itemStyle: { borderRadius: [4, 4, 0, 0] },
      data: [
        { value: companyAssets, itemStyle: { color: C.indigo } },
        { value: clientAssets,  itemStyle: { color: C.sky } },
      ],
    }],
  };

  const licenseTypeBarOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { top: 8, bottom: 50, left: 36, right: 12 },
    xAxis: {
      type: "category", data: Object.keys(licenseTypeCount),
      axisLabel: { color: "#94a3b8", fontSize: 10, rotate: 20, interval: 0 },
      axisLine: { lineStyle: { color: "#e2e8f0" } },
    },
    yAxis: { type: "value", axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#f1f5f9" } } },
    series: [{
      type: "bar", barMaxWidth: 38, itemStyle: { borderRadius: [4, 4, 0, 0] },
      data: Object.entries(licenseTypeCount).map(([, v], i) => ({ value: v, itemStyle: { color: PALETTE[i % PALETTE.length] } })),
    }],
  };

  const licGaugeOption = {
    backgroundColor: "transparent",
    series: [{
      type: "gauge", radius: "85%", startAngle: 200, endAngle: -20, min: 0, max: totalLicenses || 1,
      axisLine: { lineStyle: { width: 14, color: [[activeLicenses / (totalLicenses || 1), C.emerald], [1, C.rose]] } },
      pointer: { length: "58%", width: 4, itemStyle: { color: "#475569" } },
      axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      detail: { valueAnimation: true, formatter: (v) => `${Math.round(v)}\nactive`, color: "#475569", fontSize: 12, offsetCenter: [0, "65%"] },
      title: { color: "#94a3b8", fontSize: 10, offsetCenter: [0, "88%"] },
      data: [{ value: activeLicenses, name: "Licenses" }],
    }],
  };

  const jobsDocPieOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, textStyle: { color: "#94a3b8" }, itemWidth: 10, itemHeight: 10 },
    series: [{
      type: "pie", radius: ["38%", "65%"],
      itemStyle: { borderRadius: 6, borderWidth: 2, borderColor: "transparent" },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: "bold", color: "#e2e8f0" } },
      data: [
        { value: completeJobs,   name: "Complete",  itemStyle: { color: C.emerald } },
        { value: pendingDocJobs, name: "Pending",   itemStyle: { color: C.amber } },
      ],
    }],
  };

  // ── Loading ──
  if (loading) {
    return (
      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={40} thickness={4} sx={{ color: C.indigo }} />
          <Typography variant="body2" color="text.secondary" fontWeight={500}>Loading dashboard…</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#f8fafc" }}>

      {/* ── HEADER ── */}
      <Paper elevation={0} sx={{
        px: 3, py: 2, flexShrink: 0,
        borderBottom: "1px solid", borderColor: "divider",
        background: "linear-gradient(135deg, #fff 60%, #eef2ff 100%)",
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{
                p: 1, borderRadius: 2,
                background: `linear-gradient(135deg, ${C.indigo}, ${C.violet})`,
                display: "flex", alignItems: "center",
              }}>
                <BarChartIcon sx={{ color: "#fff", fontSize: 20 }} />
              </Box>
              <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: "-0.01em" }}>
                Operations Dashboard
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ ml: "48px", mt: 0.25, display: "block" }}>
              {grandTotal.toLocaleString()} total records
              {lastRefresh && (
                <Box component="span" sx={{ opacity: 0.6, ml: 1 }}>
                  · refreshed {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </Box>
              )}
            </Typography>
          </Box>

          <Tooltip title="Refresh data">
            <Box component="button" onClick={fetchAll} sx={{
              display: "flex", alignItems: "center", gap: 0.75,
              px: 2, py: 1, borderRadius: 2, border: `1px solid ${C.indigo}44`,
              bgcolor: `${C.indigo}0d`, color: C.indigo,
              fontWeight: 700, fontSize: "0.75rem", cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": { bgcolor: `${C.indigo}1a`, boxShadow: `0 0 0 3px ${C.indigo}22` },
            }}>
              <RefreshIcon sx={{ fontSize: 14 }} />
              Refresh
            </Box>
          </Tooltip>
        </Stack>
      </Paper>

      {/* ── BODY ── */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 3 }}>
        <Stack spacing={4}>

          {/* KPI */}
          <Box>
            <SectionTitle Icon={TrendingUpIcon} color={C.indigo}>Overview</SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} lg={4}>
                <StatCard title="Computer Assets" value={fmt(totalComputerAssets)} Icon={ComputerIcon} accent={C.indigo} module="assets"
                  sub={`${companyAssets} company · ${clientAssets} client`} to="/assets/computer-assets" />
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <StatCard title="Client Licenses" value={fmt(totalLicenses)} Icon={ArticleIcon} accent={C.emerald} module="clientlicenses"
                  sub={`${activeLicenses} active · ${expiredLicenses} expired`} to="/client-licenses" />
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <StatCard title="Jobs" value={fmt(totalJobs)} Icon={AssignmentIcon} accent={C.violet} module="jobs"
                  sub={`${completeJobs} complete · ${pendingDocJobs} pending docs`} to="/jobs" />
              </Grid>
            </Grid>
          </Box>

          {/* Financial */}
          <Box>
            <SectionTitle Icon={CurrencyRupeeIcon} color={C.amber}>Financial Snapshot</SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} lg={4}>
                <StatCard title="Asset Purchase Cost" value={fmtCurrency(totalAssetPurchaseCost)} Icon={CurrencyRupeeIcon} accent={C.amber} module="assets" />
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <StatCard title="License Purchase Cost" value={fmtCurrency(totalLicensePurchaseCost)} Icon={CurrencyRupeeIcon} accent={C.sky} module="clientlicenses" />
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <StatCard title="Combined Investment"
                  value={canView("assets") && canView("clientlicenses") ? fmtCurrency(totalAssetPurchaseCost + totalLicensePurchaseCost) : "—"}
                  Icon={InventoryIcon} accent={C.rose} module="assets" />
              </Grid>
            </Grid>
          </Box>

          {/* Asset Status */}
          <Box>
            <SectionTitle Icon={MonitorIcon} color={C.sky}>Computer Asset Status</SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} lg={3}>
                <AssetStatusCard label="Company Assets" value={companyAssets} total={totalComputerAssets} color="blue"   Icon={BusinessIcon}           to="/assets/computer-assets?dashboard=company" module="assets" />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <AssetStatusCard label="Client Assets"  value={clientAssets}  total={totalComputerAssets} color="violet" Icon={PeopleAltIcon}          to="/assets/computer-assets?dashboard=client" module="assets" />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <AssetStatusCard label="Warranty Valid" value={warrantyValid} total={totalComputerAssets} color="green"  Icon={CheckCircleOutlineIcon} to="/assets/computer-assets?dashboard=warranty_valid" module="assets" />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <AssetStatusCard label="Warranty Expiring(Within 60 days)" value={warrantyExpiring}  total={totalComputerAssets} color="amber" Icon={AccessTimeIcon}   to="/assets/computer-assets?dashboard=warranty_expiring" module="assets" />
              </Grid>
            </Grid>
          </Box>

          {/* Alerts */}
          <Box>
            <SectionTitle Icon={WarningAmberIcon} color={C.rose}>Alerts &amp; Warnings</SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} lg={3}>
                <AlertCard title="Warranty Expiring" value={warrantyExpiring} Icon={AccessTimeIcon} description="warranty within 60 days" severity="amber" to="/assets/computer-assets?dashboard=warranty_expiring" module="assets" />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <AlertCard title="Warranty Expired"  value={warrantyExpired}  Icon={CancelIcon}     description="past warranty_expire"     severity="red"   to="/assets/computer-assets?dashboard=warranty_expired" module="assets" />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <AlertCard title="Licenses Expiring" value={expiringLicenses} Icon={AccessTimeIcon} description="expiry within 30 days"     severity="amber" to="/client-licenses?dashboard=expiring" module="clientlicenses" />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <AlertCard title="Licenses Expired"  value={expiredLicenses}  Icon={CancelIcon}     description="past expired_on"          severity="red"   to="/client-licenses?dashboard=expired" module="clientlicenses" />
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <AlertCard title="Jobs Pending Documents" value={pendingDocJobs} Icon={AssignmentIcon} description="one or more required documents missing" severity="amber" to="/jobs" module="jobs" />
              </Grid>
            </Grid>
          </Box>

          {/* Charts row 1 */}
          <Box>
            <SectionTitle Icon={PieChartIcon} color={C.violet}>Distribution</SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <ChartCard title="Records Distribution" Icon={InventoryIcon}>
                  <ReactECharts option={overviewPieOption} style={{ height: 240 }} />
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <ChartCard title="Computer Assets — Company vs Client" Icon={ComputerIcon}>
                  {!canView("assets") ? <LockedChart /> : <ReactECharts option={assetTypeBarOption} style={{ height: 240 }} />}
                </ChartCard>
              </Grid>
            </Grid>
          </Box>

          {/* Charts row 2 */}
          <Box>
            <SectionTitle Icon={ArticleIcon} color={C.emerald}>Licenses &amp; Jobs</SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <ChartCard title="Licenses by Type" Icon={ArticleIcon}>
                  {!canView("clientlicenses") ? <LockedChart /> :
                   Object.keys(licenseTypeCount).length > 0
                    ? <ReactECharts option={licenseTypeBarOption} style={{ height: 220 }} />
                    : <Stack alignItems="center" justifyContent="center" sx={{ height: 144, color: "text.disabled" }}>
                        <Typography variant="body2">No license data</Typography>
                      </Stack>
                  }
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <ChartCard title="License Health" Icon={ArticleIcon}>
                  {!canView("clientlicenses") ? <LockedChart /> : (
                    <>
                      <ReactECharts option={licGaugeOption} style={{ height: 145 }} />
                      <Grid container spacing={1} sx={{ mt: 1, textAlign: "center" }}>
                        {[
                          { label: "Active",  value: activeLicenses,   color: "green" },
                          { label: "Soon",    value: expiringLicenses, color: "amber" },
                          { label: "Expired", value: expiredLicenses,  color: "red"   },
                        ].map(({ label, value, color }) => (
                          <Grid item xs={4} key={label}>
                            <Stack alignItems="center" spacing={0.5}>
                              <Pill label={label} color={color} />
                              <Typography variant="h6" fontWeight={900} color="text.primary">{value}</Typography>
                            </Stack>
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={3}>
                <ChartCard title="Jobs — Docs Complete" Icon={AssignmentIcon}>
                  {!canView("jobs") ? <LockedChart /> : <ReactECharts option={jobsDocPieOption} style={{ height: 220 }} />}
                </ChartCard>
              </Grid>
            </Grid>
          </Box>

          {/* Computer Assets table */}
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <SectionTitle Icon={ComputerIcon} color={C.indigo}>Recent Computer Assets</SectionTitle>
              {canView("assets") && (
                <Box component="button" onClick={() => navigate("/assets/computer-assets")} sx={{
                  display: "flex", alignItems: "center", gap: 0.5,
                  color: C.indigo, fontWeight: 700, fontSize: "0.75rem",
                  cursor: "pointer", bgcolor: "transparent", border: "none",
                  "&:hover": { textDecoration: "underline" },
                }}>
                  View all <ArrowForwardIcon sx={{ fontSize: 13 }} />
                </Box>
              )}
            </Stack>
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
              <TableContainer>
                <Table size="small">
                  <THead cols={["Asset No", "Type", "PC Name", "Assigned To", "Manufacturer", "Supplier", "Warranty Exp.", "Purchase Cost", "Created"]} />
                  <TableBody>
                    {!canView("assets") ? <LockedSection colCount={9} module="assets" /> :
                     safeComputerAssets.length === 0
                      ? <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: "text.secondary" }}>No computer assets found</TableCell></TableRow>
                      : safeComputerAssets.slice(0, 8).map((a) => {
                          const expiry = new Date(a.warranty_expire);
                          const isExpired = !isNaN(expiry) && expiry < now;
                          return (
                            <TableRow key={a.computer_detail_id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                              <TableCell sx={{ fontFamily: "monospace", fontSize: "0.78rem", color: "text.secondary" }}>{a.asset_no || "—"}</TableCell>
                              <TableCell><Pill label={a.asset_type || "—"} color={a.asset_type === "CLIENT" ? "violet" : "blue"} /></TableCell>
                              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>{a.pc_name || "—"}</TableCell>
                              <TableCell sx={{ color: "text.secondary" }}>{a.assigned_to || "—"}</TableCell>
                              <TableCell sx={{ color: "text.secondary" }}>{manufacturerMap[a.manufacturer_id] || "—"}</TableCell>
                              <TableCell sx={{ color: "text.secondary" }}>{supplierMap[a.supplier_id] || "—"}</TableCell>
                              <TableCell>
                                <Pill label={fmtDate(a.warranty_expire)} color={isExpired ? "red" : "green"} />
                              </TableCell>
                              <TableCell>{fmtCurrency(a.purchase_cost)}</TableCell>
                              <TableCell sx={{ color: "text.secondary" }}>{fmtDate(a.created_at)}</TableCell>
                            </TableRow>
                          );
                        })
                    }
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>

          {/* Client Licenses table */}
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <SectionTitle Icon={ArticleIcon} color={C.emerald}>Recent Client Licenses</SectionTitle>
              {canView("clientlicenses") && (
                <Box component="button" onClick={() => navigate("/client-licenses")} sx={{
                  display: "flex", alignItems: "center", gap: 0.5,
                  color: C.emerald, fontWeight: 700, fontSize: "0.75rem",
                  cursor: "pointer", bgcolor: "transparent", border: "none",
                  "&:hover": { textDecoration: "underline" },
                }}>
                  View all <ArrowForwardIcon sx={{ fontSize: 13 }} />
                </Box>
              )}
            </Stack>
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
              <TableContainer>
                <Table size="small">
                  <THead cols={["Product", "Client", "License Type", "Email", "Purchase Cost", "Expiry", "Status"]} />
                  <TableBody>
                    {!canView("clientlicenses") ? <LockedSection colCount={7} module="clientlicenses" /> :
                     safeLicenses.length === 0
                      ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary" }}>No licenses found</TableCell></TableRow>
                      : safeLicenses.slice(0, 8).map((l) => {
                          const exp = new Date(l.expired_on);
                          const isExpired  = !isNaN(exp) && exp < now;
                          const diffDays   = (exp - now) / 86400000;
                          const isExpiring = !isExpired && !isNaN(exp) && diffDays <= 30;
                          const statusColor = isExpired ? "red" : isExpiring ? "amber" : "green";
                          const statusLabel = isExpired ? "Expired" : isExpiring ? "Expiring" : "Active";
                          return (
                            <TableRow key={l.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>{l.product_name || "—"}</TableCell>
                              <TableCell sx={{ color: "text.secondary" }}>{l.client_name || "—"}</TableCell>
                              <TableCell sx={{ color: "text.secondary" }}>{licenseTypeMap[l.license_type_id] || "—"}</TableCell>
                              <TableCell sx={{ fontFamily: "monospace", fontSize: "0.72rem", color: "text.secondary" }}>{l.email_id || "—"}</TableCell>
                              <TableCell>{fmtCurrency(l.purchase_cost)}</TableCell>
                              <TableCell sx={{ color: "text.secondary" }}>{fmtDate(l.expired_on)}</TableCell>
                              <TableCell><Pill label={statusLabel} color={statusColor} /></TableCell>
                            </TableRow>
                          );
                        })
                    }
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>

          {/* Jobs table */}
          <Box sx={{ pb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <SectionTitle Icon={AssignmentIcon} color={C.violet}>Recent Jobs</SectionTitle>
              {canView("jobs") && (
                <Box component="button" onClick={() => navigate("/jobs")} sx={{
                  display: "flex", alignItems: "center", gap: 0.5,
                  color: C.violet, fontWeight: 700, fontSize: "0.75rem",
                  cursor: "pointer", bgcolor: "transparent", border: "none",
                  "&:hover": { textDecoration: "underline" },
                }}>
                  View all <ArrowForwardIcon sx={{ fontSize: 13 }} />
                </Box>
              )}
            </Stack>
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
              <TableContainer>
                <Table size="small">
                  <THead cols={["Job No", "Customer", "Job Date", "Quantity", "Tested By", "Docs", "Status"]} />
                  <TableBody>
                    {!canView("jobs") ? <LockedSection colCount={7} module="jobs" /> :
                     safeJobs.length === 0
                      ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary" }}>No jobs found</TableCell></TableRow>
                      : safeJobs.slice(0, 8).map((j) => {
                          const done = jobFieldsDone(j);
                          const total = jobFieldsTotal(j) || JOB_DOC_FIELDS.length;
                          const isComplete = jobIsComplete(j);
                          return (
                            <TableRow key={j.job_id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>{j.job_no || "—"}</TableCell>
                              <TableCell sx={{ color: "text.secondary" }}>{j.customer_name || "—"}</TableCell>
                              <TableCell sx={{ color: "text.secondary" }}>{fmtDate(j.job_date)}</TableCell>
                              <TableCell>{fmt(j.panel_quantity)}</TableCell>
                              <TableCell sx={{ color: "text.secondary" }}>{j.tested_by || "—"}</TableCell>
                              <TableCell>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="caption">{done} / {total}</Typography>
                                  <Box sx={{ width: 60 }}><ProgressBar value={done} max={total} color={isComplete ? "green" : "amber"} /></Box>
                                </Stack>
                              </TableCell>
                              <TableCell><Pill label={isComplete ? "Complete" : "Pending"} color={isComplete ? "green" : "amber"} /></TableCell>
                            </TableRow>
                          );
                        })
                    }
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>

        </Stack>
      </Box>
    </Box>
  );
}