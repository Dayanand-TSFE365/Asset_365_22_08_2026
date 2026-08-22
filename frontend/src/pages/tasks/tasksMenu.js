import {
  LayoutDashboard,
  UserCheck,
  ClipboardList,
  Clock3,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  BarChart3,
  CheckCircle,
  Activity,
} from "lucide-react";

export const tasksMenu = [
  {
    label: "Task Analytics",
    path: "/tasks/analytics",
    icon: Activity,
  },
  {
    label: "Dashboard",
    path: "/tasks",
    icon: LayoutDashboard,
  },
  {
    label: "My Tasks",
    path: "/tasks/my",
    icon: ClipboardList,
  },
  {
    label: "Assigned By Me",
    path: "/tasks/assigned",
    icon: UserCheck,
  },
  {
    label: "Pending",
    path: "/tasks/pending",
    icon: Clock3,
  },
  {
    label: "In Progress",
    path: "/tasks/in-progress",
    icon: PlayCircle,
  },
  {
    label: "Waiting Approval",
    path: "/tasks/waiting-approval",
    icon: CheckCircle2,
  },
  {
    label: "Overdue",
    path: "/tasks/overdue",
    icon: AlertTriangle,
  },
  {
    label: "Completed",
    path: "/tasks/completed",
    icon: CheckCircle,
  },
  {
    label: "Calendar",
    path: "/tasks/calendar",
    icon: CalendarDays,
  },
  {
    label: "Reports",
    path: "/tasks/reports",
    icon: BarChart3,
  },
];