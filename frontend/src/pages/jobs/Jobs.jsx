import { Routes, Route } from "react-router-dom";

import JobDashboard from "./components/JobDashboard";
import JobList from "./components/JobList";
import JobAction from "./components/JobAction";

export default function Jobs() {
  return (
    <Routes>

      {/* Dashboard */}
      <Route
        index
        element={<JobDashboard />}
      />

      {/* All Jobs */}
      <Route
        path="list"
        element={<JobList title="Panel Jobs" />}
      />

      {/* Create / Update / Clone */}
      <Route
        path="action/:type"
        element={<JobAction />}
      />

    </Routes>
  );
}