// ===============================
// File: src/pages/tasks/subpages/AssignedByMe.jsx
// ===============================
import TaskList from "../components/TaskList";

export default function AssignedByMe() {
  return <TaskList filter="assigned_by_me" title="Assigned By Me" showCreate />;
}