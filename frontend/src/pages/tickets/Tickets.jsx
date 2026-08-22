//Tickets.jsx
import { Routes, Route } from "react-router-dom";

import TicketDashboard from "./components/TicketDashboard";
import TicketAction from "./components/TicketAction";

import MyTickets from "./subpages/MyTickets";
import AssignedByMe from "./subpages/AssignedByMe";
import TicketDetails from "./components/TicketDetails";
import OpenTickets from "./subpages/OpenTickets";
import InProgress from "./subpages/InProgress";
import WaitingReview from "./subpages/WaitingReview";
import Resolved from "./subpages/Resolved";
import Closed from "./subpages/Closed";
// import VisitReportForm from "./visitReport/VisitReportForm";
import Reports from "./subpages/Reports";

export default function Tickets() {
  return (
    <Routes>

      <Route
        index
        element={<TicketDashboard />}
      />
      

      <Route
        path="my"
        element={<MyTickets />}
      />

      <Route
        path="assigned-by-me"
        element={<AssignedByMe />}
      />

      <Route
        path="open"
        element={<OpenTickets />}
      />

      <Route
        path="in-progress"
        element={<InProgress />}
      />

      <Route
        path="waiting-review"
        element={<WaitingReview />}
      />

      <Route
        path="resolved"
        element={<Resolved />}
      />

      <Route
        path="closed"
        element={<Closed />}
      />

      <Route
        path="reports"
        element={<Reports />}
      />

      <Route
        path="details/:id"
        element={<TicketDetails />}
      />

      {/* <Route
        path="visit-report/:ticketId"
        element={<VisitReportForm />}
      /> */}

      <Route
        path="action/:type"
        element={<TicketAction />}
      />

    </Routes>
  );
}