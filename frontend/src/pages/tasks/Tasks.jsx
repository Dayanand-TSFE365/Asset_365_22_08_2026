// src/pages/tasks/Tasks.jsx

import { Routes, Route } from "react-router-dom";

import TaskDashboard from "./components/TaskDashboard";
import TaskAction from "./components/TaskAction";
import TaskDetails from "./components/TaskDetails";
import TaskProgressLog from "./components/TaskProgressLog";
import TaskAnalytics from "./components/TaskAnalytics";

import MyTasks from "./subpages/MyTasks";
import AssignedByMe from "./subpages/AssignedByMe";
import PendingTasks from "./subpages/PendingTasks";
import InProgress from "./subpages/InProgress";
import WaitingApproval from "./subpages/WaitingApproval";
import Completed from "./subpages/Completed";
import Overdue from "./subpages/Overdue";
import CalendarView from "./subpages/CalendarView";
import Reports from "./subpages/Reports";

export default function Tasks() {
  return (
    <Routes>

      <Route
        path="analytics"
        element={<TaskAnalytics />}
      />

      <Route
        index
        element={<TaskDashboard />}
      />

      <Route
        path="my"
        element={<MyTasks />}
      />

      <Route
        path="assigned"
        element={<AssignedByMe />}
      />

      <Route
        path="pending"
        element={<PendingTasks />}
      />

      <Route
        path="in-progress"
        element={<InProgress />}
      />

      <Route
        path="waiting-approval"
        element={<WaitingApproval />}
      />

      <Route
        path="completed"
        element={<Completed />}
      />

      <Route
        path="overdue"
        element={<Overdue />}
      />

      <Route
        path="calendar"
        element={<CalendarView />}
      />

      <Route
        path="reports"
        element={<Reports />}
      />

      <Route
        path="details/:id"
        element={<TaskDetails />}
      />

      <Route
        path="details/:id/log"
        element={<TaskProgressLog />}
      />

      <Route
        path="action/:type"
        element={<TaskAction />}
      />

    </Routes>
  );
}