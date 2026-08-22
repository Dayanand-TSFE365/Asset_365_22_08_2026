//ticketsMenu.js
import {
  LayoutDashboard,
  Ticket,
  Clock3,
  PlayCircle,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  BarChart3,
  UserPlus,
} from "lucide-react";

export const ticketsMenu = [
  {
    label: "Dashboard",
    path: "/tickets",
    icon: LayoutDashboard,
  },
  
  {
    label: "My Tickets",
    path: "/tickets/my",
    icon: Ticket,
  },
  {
    label: "Assigned By Me",
    path: "/tickets/assigned-by-me",
    icon: UserPlus,
  },
  {
    label: "Open",
    path: "/tickets/open",
    icon: Clock3,
  },
  {
    label: "In Progress",
    path: "/tickets/in-progress",
    icon: PlayCircle,
  },
  {
    label: "Waiting Review",
    path: "/tickets/waiting-review",
    icon: ClipboardCheck,
  },
  {
    label: "Resolved",
    path: "/tickets/resolved",
    icon: CheckCircle2,
  },
  {
    label: "Closed",
    path: "/tickets/closed",
    icon: XCircle,
  },
  {
    label: "Reports",
    path: "/tickets/reports",
    icon: BarChart3,
  },
];