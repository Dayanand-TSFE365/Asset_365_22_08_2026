import { Routes, Route } from "react-router-dom";
import LicenseList from "./components/LicenseList";
import LicenseAction from "./components/LicenseAction";

export default function Licenses() {
  return (
    <Routes>
      <Route index element={<LicenseList title="All Licenses" />} />

      <Route
        path="available"
        element={<LicenseList title="Available Licenses" filter="available" />}
      />
      <Route
        path="low-stock"
        element={<LicenseList title="Low Stock Licenses" filter="low_stock" />}
      />
      <Route
        path="expired"
        element={<LicenseList title="Expired Licenses" filter="expired" />}
      />
      <Route
        path="expiring"
        element={<LicenseList title="Expiring Soon" filter="expiring" />}
      />

      <Route path="action/:type" element={<LicenseAction />} />
    </Routes>
  );
}