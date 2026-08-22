// ===============================
// File: src/pages/tasks/subpages/PendingTasks.jsx
// ===============================
import TaskList from "../components/TaskList";

export default function PendingTasks() {
  return <TaskList filter="pending" title="Pending Tasks" />;
}