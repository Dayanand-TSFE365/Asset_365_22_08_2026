//ListAll.jsx
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useAuth } from "../../../auth/AuthContext";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import BarChartIcon from "@mui/icons-material/BarChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PieChartIcon from "@mui/icons-material/PieChart";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssignmentIcon from "@mui/icons-material/Assignment";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import BuildIcon from "@mui/icons-material/Build";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import StackedBarChartIcon from "@mui/icons-material/StackedBarChart";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LockIcon from "@mui/icons-material/Lock";

// =====================================
// DATA
// =====================================

const reports = [
  {
    title: "Activity Report",
    path: "/reports/activity",
    icon: DirectionsRunIcon,
    category: "asset",
    description: "Track all asset changes and history over time",
  },
  {
    title: "Custom Assets Report",
    path: "/reports/custom-assets",
    icon: InventoryIcon,
    category: "asset",
    description: "Build dynamic reports with custom filters and columns",
  },
  {
    title: "Audit Log Report",
    path: "/reports/audit-log",
    icon: AssignmentIcon,
    category: "asset",
    description: "Full history of asset audits and verifications",
  },
  {
    title: "Depreciation Report",
    path: "/reports/depreciation",
    icon: CurrencyRupeeIcon,
    category: "finance",
    description: "Calculated and manual current value of all assets",
  },
  {
    title: "Licenses Report",
    path: "/reports/licenses",
    icon: VerifiedUserIcon,
    category: "finance",
    description: "License seat usage, costs, and depreciation breakdown",
  },
  {
    title: "Maintenance Report",
    path: "/reports/maintenance",
    icon: BuildIcon,
    category: "operations",
    description: "View and manage all asset maintenance activities",
  },
  {
    title: "Unaccepted Report",
    path: "/reports/unaccepted",
    icon: LocalShippingIcon,
    category: "operations",
    description: "Assets pending acceptance by assigned users",
  },
  {
    title: "Accessories Report",
    path: "/reports/accessories",
    icon: StackedBarChartIcon,
    category: "asset",
    description: "Summary of accessory assignments and availability",
  },
];

const categoryMeta = {
  asset: {
    label: "Asset",
    color: "#85B7EB",
    chipColor: "primary",
    gradient: "linear-gradient(135deg, #85B7EB, #3b82f6)",
  },
  finance: {
    label: "Finance",
    color: "#97C459",
    chipColor: "success",
    gradient: "linear-gradient(135deg, #97C459, #22c55e)",
  },
  operations: {
    label: "Operations",
    color: "#EF9F27",
    chipColor: "warning",
    gradient: "linear-gradient(135deg, #EF9F27, #f59e0b)",
  },
};

const stats = [
  {
    label: "Total Reports",
    value: reports.length,
    icon: BarChartIcon,
    trend: "+2",
    iconColor: "#3b82f6",
    iconBg: "linear-gradient(135deg, #3b82f680, #3b82f620)",
    valueColor: "primary.main",
  },
  {
    label: "Asset Reports",
    value: reports.filter((r) => r.category === "asset").length,
    icon: InventoryIcon,
    trend: "+1",
    iconColor: "#60a5fa",
    iconBg: "linear-gradient(135deg, #60a5fa80, #60a5fa20)",
    valueColor: "#60a5fa",
  },
  {
    label: "Finance Reports",
    value: reports.filter((r) => r.category === "finance").length,
    icon: CurrencyRupeeIcon,
    trend: "0",
    iconColor: "#22c55e",
    iconBg: "linear-gradient(135deg, #22c55e80, #22c55e20)",
    valueColor: "success.main",
  },
  {
    label: "Operations Reports",
    value: reports.filter((r) => r.category === "operations").length,
    icon: BuildIcon,
    trend: "+1",
    iconColor: "#f59e0b",
    iconBg: "linear-gradient(135deg, #f59e0b80, #f59e0b20)",
    valueColor: "warning.main",
  },
];

// =====================================
// COMPONENT
// =====================================

export default function ListAll() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const barRef = useRef(null);
  const donutRef = useRef(null);
  const barInstance = useRef(null);
  const donutInstance = useRef(null);

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const axisColor  = isDark ? "#6b7280" : "#9ca3af";
    const labelColor = isDark ? "#d1d5db" : "#374151";
    const bgColor    = isDark ? "#1e293b"  : "#ffffff";
    const gridColor  = isDark ? "#334155"  : "#e5e7eb";

    const reportUsage = [
      { name: "Activity",      usage: 45, trend: 12 },
      { name: "Custom Assets", usage: 38, trend: -5 },
      { name: "Audit Log",     usage: 52, trend:  8 },
      { name: "Depreciation",  usage: 25, trend:  3 },
      { name: "Licenses",      usage: 31, trend:  7 },
      { name: "Maintenance",   usage: 42, trend: -2 },
      { name: "Unaccepted",    usage: 28, trend:  5 },
      { name: "Accessories",   usage: 35, trend: 10 },
    ];

    // ── BAR CHART ──
    if (barRef.current) {
      barInstance.current = echarts.init(barRef.current);
      barInstance.current.setOption({
        grid: { top: 20, bottom: 40, left: 50, right: 20, containLabel: true },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (params) => {
            if (!params.length) return "";
            const d = params[0];
            const t = reportUsage[d.dataIndex].trend;
            const tStr = t > 0 ? `+${t}%` : `${t}%`;
            return `<div style="padding:4px"><strong>${d.name}</strong><br/>Usage: ${d.value}<br/><span style="color:${t > 0 ? "#10b981" : "#ef4444"}">${tStr}</span></div>`;
          },
          backgroundColor: isDark ? "rgba(15,23,42,0.8)" : "rgba(255,255,255,0.9)",
          borderColor: gridColor,
          textStyle: { color: labelColor },
        },
        xAxis: {
          type: "category",
          data: reportUsage.map((r) => r.name),
          axisLine: { lineStyle: { color: gridColor } },
          axisTick: { show: false },
          axisLabel: { color: axisColor, fontSize: 11, interval: 0, rotate: 25 },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: axisColor, fontSize: 10 },
          splitLine: { lineStyle: { color: gridColor } },
        },
        series: [{
          type: "bar",
          barMaxWidth: 32,
          data: reportUsage.map((r, idx) => ({
            value: r.usage,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: categoryMeta[reports[idx].category].color },
                { offset: 1, color: categoryMeta[reports[idx].category].color + "66" },
              ]),
              borderRadius: [6, 6, 0, 0],
            },
          })),
          emphasis: { itemStyle: { opacity: 0.8 } },
        }],
      });
    }

    // ── DONUT CHART ──
    if (donutRef.current) {
      donutInstance.current = echarts.init(donutRef.current);
      const grouped = Object.entries(categoryMeta).map(([key, meta]) => ({
        name: meta.label,
        value: reports.filter((r) => r.category === key).length,
        itemStyle: { color: meta.color },
      }));

      donutInstance.current.setOption({
        tooltip: {
          trigger: "item",
          formatter: "{b}<br/>Reports: {c}<br/>Percentage: {d}%",
          backgroundColor: isDark ? "rgba(15,23,42,0.8)" : "rgba(255,255,255,0.9)",
          borderColor: gridColor,
          textStyle: { color: labelColor },
        },
        series: [{
          type: "pie",
          radius: ["45%", "70%"],
          center: ["50%", "50%"],
          data: grouped,
          label: { formatter: "{b}\n{d}%", fontSize: 12, color: labelColor, fontWeight: "bold" },
          labelLine: { length: 10, length2: 8, lineStyle: { color: gridColor } },
          emphasis: { scale: true, scaleSize: 6 },
          itemStyle: { borderColor: bgColor, borderWidth: 2 },
        }],
      });
    }

    const handleResize = () => {
      barInstance.current?.resize();
      donutInstance.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      barInstance.current?.dispose();
      donutInstance.current?.dispose();
    };
  }, []);

  return (
    <Box sx={{ p: 3, minHeight: "100vh", bgcolor: "background.default" }}>

      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <BarChartIcon sx={{ fontSize: 32, color: "primary.main" }} />
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Reports Dashboard
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ ml: "48px" }}>
          Access analytics, audits, and operational insights across your asset management system
        </Typography>
      </Box>

      {/* STAT CARDS */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Grid item xs={12} sm={6} lg={3} key={s.label}>
              <Paper
                elevation={2}
                sx={{
                  borderRadius: 3,
                  p: 2.5,
                  transition: "all 0.25s",
                  "&:hover": { boxShadow: 6, transform: "translateY(-4px)" },
                }}
              >
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      background: s.iconBg,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Icon sx={{ fontSize: 20, color: s.iconColor }} />
                  </Box>
                  <Chip
                    label={s.trend}
                    size="small"
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      bgcolor: "success.50",
                      color: "success.dark",
                      height: 24,
                    }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {s.label}
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ color: s.valueColor, mt: 0.5 }}>
                  {s.value}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* CHARTS ROW */}
      <Grid container spacing={2} sx={{ mb: 4 }}>

        {/* BAR CHART */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={2} sx={{ borderRadius: 3, p: 3, height: "100%" }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TrendingUpIcon sx={{ fontSize: 20, color: "primary.main" }} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Report Usage Statistics
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Based on last 30 days activity
                </Typography>
              </Box>

              {/* LEGEND */}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {Object.entries(categoryMeta).map(([key, meta]) => (
                  <Stack key={key} direction="row" alignItems="center" spacing={0.5}
                    sx={{ px: 1.2, py: 0.5, borderRadius: 1.5, bgcolor: "action.hover" }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: meta.color }} />
                    <Typography variant="caption" color="text.secondary">{meta.label}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
            <Box ref={barRef} sx={{ height: 250, width: "100%" }} />
          </Paper>
        </Grid>

        {/* DONUT CHART */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ borderRadius: 3, p: 3, height: "100%" }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <PieChartIcon sx={{ fontSize: 20, color: "success.main" }} />
              <Typography variant="subtitle1" fontWeight={600}>Distribution</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
              Report types breakdown
            </Typography>
            <Box ref={donutRef} sx={{ height: 250, width: "100%" }} />
          </Paper>
        </Grid>
      </Grid>

      {/* REPORT CARDS */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
          <DirectionsRunIcon sx={{ fontSize: 24, color: "text.primary" }} />
          <Typography variant="h6" fontWeight={700}>Available Reports</Typography>
        </Stack>

        <Grid container spacing={2}>
          {reports.map((report, index) => {
            const Icon = report.icon;
            const meta = categoryMeta[report.category];
            const isActivityReport = report.path === "/reports/activity";
            const isRestricted = isActivityReport && user?.role?.toLowerCase() !== "superadmin";

            return (
              <Grid item xs={12} sm={6} lg={3} key={index}>
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 3,
                    height: "100%",
                    position: "relative",
                    transition: "all 0.25s",
                    ...(!isRestricted && {
                      "&:hover": {
                        boxShadow: 8,
                        transform: "translateY(-6px)",
                      },
                      "&:hover .report-arrow": { opacity: 1 },
                      "&:hover .report-chip": { opacity: 1 },
                    }),
                    ...(isRestricted && { cursor: "not-allowed" }),
                  }}
                >
                  {/* RESTRICTED OVERLAY */}
                  {isRestricted && (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        borderRadius: 3,
                        bgcolor: "rgba(0,0,0,0.35)",
                        backdropFilter: "blur(2px)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                      }}
                    >
                      <LockIcon sx={{ color: "#fff", fontSize: 28 }} />
                      <Typography variant="caption" fontWeight={700} sx={{ color: "#fff" }}>
                        Restricted
                      </Typography>
                    </Box>
                  )}

                  <CardActionArea
                    disabled={isRestricted}
                    onClick={() => !isRestricted && navigate(report.path)}
                    sx={{ height: "100%", alignItems: "flex-start", p: 0 }}
                  >
                    <CardContent sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>

                      {/* TOP ROW — icon + badge/arrow */}
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                        <Box
                          sx={{
                            p: 1.2,
                            borderRadius: 2,
                            background: meta.gradient,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Icon sx={{ fontSize: 20, color: "#fff" }} />
                        </Box>

                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                          className="report-chip report-arrow"
                          sx={{ opacity: 0, transition: "opacity 0.2s" }}
                        >
                          <Chip
                            label={meta.label}
                            size="small"
                            color={meta.chipColor}
                            sx={{ fontSize: "0.68rem", fontWeight: 600, height: 22 }}
                          />
                          <ArrowForwardIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                        </Stack>
                      </Stack>

                      {/* TITLE + DESCRIPTION */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.4 }}>
                          {report.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block", lineHeight: 1.6 }}>
                          {report.description}
                        </Typography>
                      </Box>

                      {/* FOOTER */}
                      <Box sx={{ pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                        <Typography variant="caption" color="text.disabled"
                          sx={{ transition: "color 0.2s", ".MuiCardActionArea-root:hover &": { color: "text.secondary" } }}>
                          {isRestricted ? "Restricted access" : "Click to open →"}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
}