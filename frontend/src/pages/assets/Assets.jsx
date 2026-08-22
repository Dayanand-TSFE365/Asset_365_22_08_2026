import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Assets() {
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  // sync URL → state
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get("search") || "");
  }, [location.search]);

  // update URL when search changes
  const handleSearch = (value) => {
    setSearch(value);

    navigate({
      pathname: location.pathname,
      search: value ? `?search=${value}` : "",
    });
  };

  return (
    <div className="w-full h-full overflow-hidden">
      {/* OPTIONAL: you can pass search UI here later */}
      <Outlet context={{ search, setSearch: handleSearch }} />
    </div>
  );
}