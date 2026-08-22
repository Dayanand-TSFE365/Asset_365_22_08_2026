// src/pages/reports/Reports.jsx

import { Outlet } from "react-router-dom";

export default function Reports() {
  return (
    <div className="h-full p-4 overflow-auto">
      <Outlet />
    </div>
  );
}