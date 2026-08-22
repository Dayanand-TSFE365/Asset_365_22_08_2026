// ===============================
// File: src/pages/tasks/subpages/Overdue.jsx
// ===============================
import TaskList from "../components/TaskList";

export default function Overdue() {
  return <TaskList filter="overdue" title="Overdue Tasks" />;
}