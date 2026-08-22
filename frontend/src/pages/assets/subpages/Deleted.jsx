import { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "../components/common/DataTable";
import { API } from "../../../config/api";

export default function Deleted() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeletedAssets();
  }, []);

  const fetchDeletedAssets = async () => {
    try {
      const token = sessionStorage.getItem("access_token");

      const res = await axios.get(API.GET_DELETED_ASSETS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const formatted = (res.data || []).map((item) => ({
        id: item.asset_id,
        tag: item.asset_tag,
        name: item.asset_name,
        serial: item.serial_number,
        condition: item.condition || "-",
        purchase_date: item.purchase_date || "-",
        depreciation: item.depreciation_months ?? "-",
        deleted_at: item.updated_at
          ? new Date(item.updated_at).toLocaleString()
          : "-",
        image: item.image_url
          ? item.image_url.startsWith("http")
            ? item.image_url
            : `${import.meta.env.VITE_AUTH_BASE}/${item.image_url.replace(/^\/+/, "")}`
          : "https://via.placeholder.com/40",
      }));

      setData(formatted);
    } catch (error) {
      console.error("Failed to fetch deleted assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: "Asset Tag", accessor: "tag" },
    { header: "Asset Name", accessor: "name" },
    {
      header: "Image",
      render: (row) => (
        <img src={row.image} alt="" className="w-10 h-10 rounded" />
      ),
    },
    { header: "Serial Number", accessor: "serial" },
    { header: "Condition", accessor: "condition" },
    { header: "Purchase Date", accessor: "purchase_date" },
    { header: "Depreciation", accessor: "depreciation" },
    { header: "Deleted On", accessor: "deleted_at" },
  ];

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-semibold mb-4">Deleted Assets</h1>

      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
        />
      </div>
    </div>
  );
}