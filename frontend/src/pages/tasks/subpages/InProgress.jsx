// ===============================
// File: src/pages/tasks/subpages/InProgress.jsx
// ===============================
import TaskList from "../components/TaskList";

export default function InProgress() {
  return <TaskList filter="in_progress" title="In Progress" />;
}