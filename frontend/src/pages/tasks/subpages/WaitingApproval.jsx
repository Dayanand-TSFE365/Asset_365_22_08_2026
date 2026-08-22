// ===============================
// File: src/pages/tasks/subpages/WaitingApproval.jsx
// ===============================
import TaskList from "../components/TaskList";

export default function WaitingApproval() {
  return <TaskList filter="waiting_approval" title="Waiting Approval" />;
}