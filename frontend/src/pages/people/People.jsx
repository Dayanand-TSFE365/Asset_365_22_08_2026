import { Outlet } from "react-router-dom";

export default function People() {
  return (
    <div className="w-full h-full overflow-hidden">
      <Outlet />
    </div>
  );
}