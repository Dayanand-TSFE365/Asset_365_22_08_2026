// sidebarMenu.js
import {
  LayoutDashboard,
  Boxes,
  Key,
  Package,
  Archive,
  Cpu,
  Layers,
  Users,
  Upload,
  Settings,
  BarChart3,
  ClipboardList,
  Briefcase,
  Ticket,
  SquareCheckBig,
} from "lucide-react";

export const sidebarMenu = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
    permission: "view_dashboard",
  },

  {
    name: "Assets",
    icon: Boxes,
    path: "/assets/computer-assets",
    permission: "view_assets",
  },

  // {
  //   name: "Licenses",
  //   icon: Key,
  //   path: "/licenses",
  //   permission: "view_licenses",
  // },
  {
    name: "Software Licenses",
    icon: Key,
    path: "/client-licenses",
    permission: "view_clientlicenses",
  },
  {
    name: "Panel Jobs",
    icon: Briefcase,
    path: "/jobs",
    permission: "view_jobs",
  },
  {
    name: "Service Tickets",
    icon: Ticket,
    path: "/tickets",
    permission: "view_tickets",
  },
  {
    name: "Tasks",
    icon: SquareCheckBig,
    path: "/tasks",
    permission: "view_tasks",
  },

  // {
  //   name: "Accessories",
  //   icon: Package,
  //   path: "/accessories",
  //   permission: "view_accessories",
  // },

  // {
  //   name: "Consumables",
  //   icon: Archive,
  //   path: "/consumables",
  //   permission: "view_consumables",
  // },

  // {
  //   name: "Components",
  //   icon: Cpu,
  //   path: "/components",
  //   permission: "view_components",
  // },

  // {
  //   name: "Predefined Kits",
  //   icon: Layers,
  //   path: "/kits",
  //   permission: "view_kits",
  // },

  {
    name: "People",
    icon: Users,
    path: "/people",
    permission: "view_people",
  },

  {
    name: "Import",
    icon: Upload,
    path: "/import",
    permission: "view_import",
  },

  {
    name: "Settings",
    icon: Settings,
    path: "/settings",
    permission: "view_settings",
  },

  // {
  //   name: "Reports",
  //   icon: BarChart3,
  //   path: "/reports",
  //   permission: "view_reports",
  // },

  // {
  //   name: "Requestable Items",
  //   icon: ClipboardList,
  //   path: "/requestable-items",
  //   permission: "view_requestable",
  // },
];