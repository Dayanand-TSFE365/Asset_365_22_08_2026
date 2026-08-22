import { Routes, Route } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Layout from "../components/layout/Layout";

//  AUTH PAGES (ADD THIS)
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ForgotPassword from "../pages/auth/ForgotPassword";

import Dashboard from "../pages/dashboard/Dashboard";
import Assets from "../pages/assets/Assets";
import Licenses from "../pages/licenses/Licenses";
// import Accessories from "../pages/accessories/Accessories";
// import Consumables from "../pages/consumables/Consumables";
// import Components from "../pages/components/Components";
// import Kits from "../pages/kits/Kits";
import People from "../pages/people/People";
import Import from "../pages/import/Import";
import Settings from "../pages/settings/Settings";
// import Reports from "../pages/reports/Reports";
// import RequestableItems from "../pages/requestable-items/RequestableItems";
import Jobs from "../pages/jobs/Jobs";
import Tickets from "../pages/tickets/Tickets";
import Tasks from "../pages/tasks/Tasks";
import Feedback from "../pages/feedback/Feedback";
import WebSocketTest from "../components/WebSocketTest";

//Assets Page Routes
import ListAll from "../pages/assets/subpages/ListAll";
import AssetAction from "../pages/assets/subpages/AssetAction";
// import Deployed from "../pages/assets/subpages/Deployed";
// import ReadyToDeploy from "../pages/assets/subpages/ReadyToDeploy";
// import Pending from "../pages/assets/subpages/Pending";
// import Undeployable from "../pages/assets/subpages/Un-deployable";
// import BYOD from "../pages/assets/subpages/BYOD";
// import Archived from "../pages/assets/subpages/Archived";
// import Requestable from "../pages/assets/subpages/Requestable";
// import Requested from "../pages/assets/subpages/Requested";
// import DueForAudit from "../pages/assets/subpages/DueforAudit";
// import DueForCheckin from "../pages/assets/subpages/DueforCheckin";
// import QuickScanCheckin from "../pages/assets/subpages/QuickScanCheckin";
// import BulkCheckout from "../pages/assets/subpages/BulkCheckout";
// import Deleted from "../pages/assets/subpages/Deleted";
// import Maintenances from "../pages/assets/subpages/Maintenances";
// import ImportHistory from "../pages/assets/subpages/ImportHistory";
// import BulkAudit from "../pages/assets/subpages/BulkAudit";
import ComputerAssets from "../pages/assets/subpages/ComputerAssets";
import ComputerAssetList from "../pages/assets/components/ComputerAssetList";
import ComputerAssetAction from "../pages/assets/subpages/ComputerAssetAction";

//License Page Route
import LicenseList from "../pages/licenses/components/LicenseList";

//ClientLicensePageRoute
import ClientLicenses from "../pages/client-licenses/ClientLicenses";

//People Page Route
import ListAllPeople from "../pages/people/subpages/ListAll";
import PeopleAction from "../pages/people/subpages/PeopleAction";
import DeletedUsers from "../pages/people/subpages/DeletedUsers";
import LoginEnabled from "../pages/people/subpages/LoginEnabled";
import LoginDisabled from "../pages/people/subpages/LoginDisabled";
import ActivityReport from "../pages/people/subpages/ActivityReport";
import UserPermissions from "../pages/people/subpages/UserPermissions";
import GroupManagement from "../pages/people/subpages/GroupManagement";
import FeedbackList from "../pages/people/subpages/FeedbackList";
import Recycle from "../pages/people/subpages/Recycle";
// Reports Page Route
// import ReportsListAll from "../pages/reports/subpages/ListAll";
// import ActivityReport from "../pages/reports/subpages/ActivityReport";
// import CustomAssetReport from "../pages/reports/subpages/CustomAssetReport";
// import AuditLog from "../pages/reports/subpages/AuditLog";
// import DepreciationReport from "../pages/reports/subpages/DepreciationReport";
// import LicenseReport from "../pages/reports/subpages/LicenseReport";
// import AssetMaintenanceReport from "../pages/reports/subpages/AssetMaintenanceReport";
// import UnacceptedItems from "../pages/reports/subpages/UnacceptedItems";
// import AccessoryReport from "../pages/reports/subpages/AccessoryReport";

// //Requestable Items Route
// import RequestableListAll from "../pages/requestable-items/subpages/ListAll";
// import RequestableRequested from "../pages/requestable-items/subpages/Requested";

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null; // or loader

  return (
    <Routes>

      {/* AUTH */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/*  DEFAULT ROUTE FIX */}
      <Route
        path="/"
        element={user ? <Layout /> : <Login />}
      >
        {/* nested routes only if logged in */}
        {user && (
          <>
            <Route index element={<Dashboard />} />

            <Route path="assets" element={<Assets />}>
              <Route index element={<ListAll />} />
              <Route path="action/:type" element={<AssetAction />} />
              
              {/* NEW Computer Assets */}
              <Route path="computer-assets" element={<ComputerAssets />}>
                <Route
                  index
                  element={
                    <ComputerAssetList
                      title="Computer Assets"
                    />
                  }
                />

                <Route
                  path="action/:type"
                  element={<ComputerAssetAction />}
                />
              </Route>

              {/* <Route path="deployed" element={<Deployed />} />
              <Route path="ready" element={<ReadyToDeploy />} />
              <Route path="pending" element={<Pending />} />
              <Route path="undeployable" element={<Undeployable />} />
              <Route path="byod" element={<BYOD />} />
              <Route path="archived" element={<Archived />} />
              <Route path="requestable" element={<Requestable />} />
              <Route path="requested" element={<Requested />} />
              <Route path="audit" element={<DueForAudit />} />
              <Route path="checkin" element={<DueForCheckin />} />
              <Route path="quick-checkin" element={<QuickScanCheckin />} />
              <Route path="bulk-checkout" element={<BulkCheckout />} />
              <Route path="deleted" element={<Deleted />} />
              <Route path="maintenance" element={<Maintenances />} />
              <Route path="import-history" element={<ImportHistory />} />
              <Route path="bulk-audit" element={<BulkAudit />} /> */}
            </Route>

            <Route path="licenses/*" element={<Licenses />} />
            <Route path="client-licenses/*" element={<ClientLicenses />} />
            <Route path="jobs/*" element={<Jobs />} />
            <Route path="tickets/*" element={<Tickets />} />
            <Route path="tasks/*" element={<Tasks />} />
            {/* <Route path="accessories/*" element={<Accessories />} />
            <Route path="consumables/*" element={<Consumables />} />
            <Route path="components/*" element={<Components />} />
            <Route path="kits/*" element={<Kits />} /> */}
            <Route path="people" element={<People />}>
              <Route index element={<ListAllPeople />} />

              <Route
                path="action/:type"
                element={<PeopleAction />}
              />

              <Route
                path="deleted"
                element={<DeletedUsers />}
              />

              <Route
                path="login-enabled"
                element={<LoginEnabled />}
              />

              <Route
                path="login-disabled"
                element={<LoginDisabled />}
              />
              <Route
                path="activity"
                element={<ActivityReport />}
              />

              <Route
                path="permissions"
                element={<UserPermissions />}
              />
              <Route
                path="group-management"
                element={<GroupManagement />}
               />
              <Route path="feedback" element={<FeedbackList />} />
              <Route path="recycle-bin" element={<Recycle />} />
            </Route>
            <Route path="import" element={<Import />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="settings" element={<Settings />} />
            <Route path="websocket-test" element={<WebSocketTest />} />
            {/* <Route path="reports" element={<Reports />}>
              <Route index element={<ReportsListAll />} />

              <Route
                path="activity"
                element={<ActivityReport />}
              />

              <Route
                path="custom-assets"
                element={<CustomAssetReport />}
              />

              <Route
                path="audit-log"
                element={<AuditLog />}
              />

              <Route
                path="depreciation"
                element={<DepreciationReport />}
              />

              <Route
                path="licenses"
                element={<LicenseReport />}
              />

              <Route
                path="maintenance"
                element={<AssetMaintenanceReport />}
              />

              <Route
                path="unaccepted"
                element={<UnacceptedItems />}
              />

              <Route
                path="accessories"
                element={<AccessoryReport />}
              />
            </Route> */}
            {/* <Route path="requestable-items" element={<RequestableItems />}> */}
            {/* <Route index element={<RequestableListAll />} /> */}
            
            {/* <Route
              path="requested"
              element={<RequestableRequested />}
            /> */}
          {/* </Route> */}
          </>
        )}
      </Route>

    </Routes>
  );
}