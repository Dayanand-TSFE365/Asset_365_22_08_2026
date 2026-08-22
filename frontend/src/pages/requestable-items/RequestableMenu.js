import { ListChecks, Inbox } from "lucide-react";

export const requestableMenu = [
  {
    label: "List All",
    path: "/requestable-items",
    icon: ListChecks,
  },
  {
    label: "Requested Items",
    path: "/requestable-items/requested",
    icon: Inbox,
  },
];