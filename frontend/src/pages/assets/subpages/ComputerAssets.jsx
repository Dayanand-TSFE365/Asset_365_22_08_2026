import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ComputerAssets() {
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  // Sync URL → state
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get("search") || "");
  }, [location.search]);

  // Update URL when search changes
  const handleSearch = (value) => {
    setSearch(value);

    navigate({
      pathname: location.pathname,
      search: value ? `?search=${value}` : "",
    });
  };

  return (
    <div className="w-full h-full overflow-hidden">
      <Outlet
        context={{
          search,
          setSearch: handleSearch,
        }}
      />
    </div>
  );
}