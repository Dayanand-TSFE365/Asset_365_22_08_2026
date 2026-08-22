import { Routes, Route } from "react-router-dom";
import LicenseList from "./components/LicenseList";
import LicenseAction from "./components/LicenseAction";

export default function ClientLicenses() {
  return (
    <Routes>
      <Route
        index
        element={<LicenseList title="Software Licenses" />}
      />

      <Route
        path="action/:type"
        element={<LicenseAction />}
      />
    </Routes>
  );
}