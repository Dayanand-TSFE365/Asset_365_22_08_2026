// ===============================
// File: src/pages/tasks/subpages/Completed.jsx
// ===============================
import TaskList from "../components/TaskList";

export default function Completed() {
  return <TaskList filter="completed" title="Completed Tasks" />;
}