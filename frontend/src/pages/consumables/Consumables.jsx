import { Routes, Route } from "react-router-dom";
import ConsumableList from "./components/ConsumableList";
import ConsumableAction from "./components/ConsumableAction";

export default function Consumables() {
  return (
    <Routes>
      <Route index element={<ConsumableList title="All Consumables" />} />
      <Route
        path="low-stock"
        element={<ConsumableList title="Low Stock Consumables" filter="low_stock" />}
      />
      <Route
        path="deleted"
        element={<ConsumableList title="Deleted Consumables" filter="deleted" />}
      />
      <Route path="action/:type" element={<ConsumableAction />} />
    </Routes>
  );
}
