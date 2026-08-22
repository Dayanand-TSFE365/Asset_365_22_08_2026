// ===============================
// File: src/components/layout/Layout.jsx
// ===============================

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import SessionTimer from "../../components/SessionTimer";
import { NotificationProvider } from "../../context/NotificationContext";

export default function Layout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NotificationProvider>
      <div className="flex h-screen overflow-hidden">

        {/* Sidebar */}
        <Sidebar
          isOpen={isOpen}
          toggleSidebar={() => setIsOpen(!isOpen)}
        />

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />

          {/*  ADD THIS */}
          <SessionTimer />

          {/* Content */}
          <div className="flex-1 overflow-hidden bg-zinc-100 dark:bg-black p-4">
            <Outlet />
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}