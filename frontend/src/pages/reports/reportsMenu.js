// src/pages/reports/reportsMenu.js

import {
  FileText,
  Activity,
  PackageSearch,
  ClipboardList,
  BadgeDollarSign,
  KeySquare,
  Wrench,
  AlertTriangle,
  Package,
} from "lucide-react";

export const reportsMenu = [
  {
    label: "List All",
    path: "/reports",
    icon: FileText,
  },

  {
    label: "Activity Report",
    path: "/reports/activity",
    icon: Activity,
  },

  {
    label: "Custom Asset Report",
    path: "/reports/custom-assets",
    icon: PackageSearch,
  },

  {
    label: "Audit Log",
    path: "/reports/audit-log",
    icon: ClipboardList,
  },

  {
    label: "Depreciation Report",
    path: "/reports/depreciation",
    icon: BadgeDollarSign,
  },

  {
    label: "License Report",
    path: "/reports/licenses",
    icon: KeySquare,
  },

  {
    label: "Asset Maintenance",
    path: "/reports/maintenance",
    icon: Wrench,
  },

  // {
  //   label: "Unaccepted Items",
  //   path: "/reports/unaccepted",
  //   icon: AlertTriangle,
  // },

  {
    label: "Accessory Report",
    path: "/reports/accessories",
    icon: Package,
  },
];