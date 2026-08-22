import { Routes, Route } from "react-router-dom";

import KitList from "./components/KitList";
import KitAction from "./components/KitAction";

export default function Kits() {
  return (
    <Routes>
      <Route index element={<KitList title="All Kits" />} />

      <Route
        path="checked-out"
        element={<KitList title="Checked Out Kits" filter="checked_out" />}
      />

      <Route path="action/:type" element={<KitAction />} />
    </Routes>
  );
}