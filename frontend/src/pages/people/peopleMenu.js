import {
  Users,
  Trash2,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  UserCog,
  Activity,
  MessageCircle,
  Recycle,
} from "lucide-react";

export const peopleMenu = [
  {
    label: "List All",
    path: "/people",
    icon: Users,
  },

  {
    label: "Deleted Users",
    path: "/people/deleted",
    icon: Trash2,
  },

  {
    label: "Feedback",
    path: "/people/feedback",
    icon: MessageCircle,
  },

  {
    label: "Login Enabled",
    path: "/people/login-enabled",
    icon: ShieldCheck,
  },

  {
    label: "Login Disabled",
    path: "/people/login-disabled",
    icon: ShieldOff,
  },
  {
    label: "Activity Report",
    path: "/people/activity",
    icon: Activity,
  },

  {
    label: "User Permissions",
    path: "/people/permissions",
    icon: KeyRound,
  },
  {
    label: "Group Management",
    path: "/people/group-management",
    icon: UserCog,
  },
  {
    label: "Recycle Bin",
    path: "/people/recycle-bin",
    icon: Recycle,
  },
];