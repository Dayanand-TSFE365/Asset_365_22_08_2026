import { Routes, Route } from "react-router-dom";
import ComponentList from "./components/ComponentList";
import ComponentAction from "./components/ComponentAction";

export default function Components() {
  return (
    <Routes>
      <Route index element={<ComponentList title="All Components" />} />

      <Route
        path="low-stock"
        element={
          <ComponentList
            title="Low Stock Components"
            filter="low_stock"
          />
        }
      />

      <Route
        path="deleted"
        element={
          <ComponentList
            title="Deleted Components"
            filter="deleted"
          />
        }
      />

      <Route path="action/:type" element={<ComponentAction />} />
    </Routes>
  );
}