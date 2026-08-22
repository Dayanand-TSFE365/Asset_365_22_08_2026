import { Routes, Route } from "react-router-dom";
import AccessoryList from "./components/AccessoryList";
import AccessoryAction from "./components/AccessoryAction";

export default function Accessories() {
  return (
    <Routes>
      <Route index element={<AccessoryList title="All Accessories" />} />
      <Route
        path="checked-out"
        element={<AccessoryList title="Checked Out Accessories" filter="checked_out" />}
      />
      <Route
        path="low-stock"
        element={<AccessoryList title="Low Stock Accessories" filter="low_stock" />}
      />
      <Route
        path="deleted"
        element={<AccessoryList title="Deleted Accessories" filter="deleted" />}
      />
      <Route path="action/:type" element={<AccessoryAction />} />
    </Routes>
  );
}