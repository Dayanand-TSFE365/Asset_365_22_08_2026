//ComponentList.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiCopy, FiEdit, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import DataTable from "./common/DataTable";
import { API } from "../../../config/api";
import PermissionButton from "../../../components/common/PermissionButton";
export default function ComponentList({ title = "All Components", filter }) {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);

  const token = sessionStorage.getItem("access_token");
  const headers = { Authorization: `Bearer ${token}` };

  const findName = (list, id) =>
    list.find((item) => item.id === id)?.name || "-";

  // ✅ Load master data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [cat, comp, manu, supp, loc] = await Promise.all([
          axios.get(API.GET_CATEGORIES, { headers }),
          axios.get(API.GET_COMPANIES, { headers }),
          axios.get(API.GET_MANUFACTURERS, { headers }),
          axios.get(API.GET_SUPPLIERS, { headers }),
          axios.get(API.GET_LOCATIONS, { headers }),
        ]);

        setCategories(cat.data || []);
        setCompanies(comp.data || []);
        setManufacturers(manu.data || []);
        setSuppliers(supp.data || []);
        setLocations(loc.data || []);
      } catch (error) {
        console.error("Failed to load master data:", error);
      }
    };

    fetchMasterData();
  }, []);

  useEffect(() => {
    if (
      !categories.length &&
      !companies.length &&
      !manufacturers.length &&
      !suppliers.length &&
      !locations.length
    ) return;

    fetchComponents();
  }, [categories, companies, manufacturers, suppliers, locations, filter]);

  // ✅ Fetch components
  const fetchComponents = async () => {
    try {
      const res = await axios.get(API.GET_COMPONENTS, { headers });

      const rawData = Array.isArray(res.data)
        ? res.data
        : res.data
        ? [res.data]
        : [];

      let formatted = rawData.map((item) => ({
        id: item.id,
        name: item.name,
        image_url: item.image_url || null,

        serial_no: item.serial_no || "-",
        model_no: item.model_no || "-",
        order_number: item.order_number || "-",

        total_qty: item.total_qty ?? 0,
        remaining_qty: item.remaining_qty ?? 0,
        min_qty: item.min_qty ?? 0,

        unit_cost: item.unit_cost ? `₹${item.unit_cost}` : "-",
        total_cost: item.total_cost ? `₹${item.total_cost}` : "-",
        purchase_date: item.purchase_date || "-",
        notes: item.notes || "-",

        category: findName(categories, item.category_id),
        company: findName(companies, item.company_id),
        manufacturer: findName(manufacturers, item.manufacturer_id),
        supplier: findName(suppliers, item.supplier_id),
        location: findName(locations, item.location_id),
      }));

      if (filter === "low_stock") {
        formatted = formatted.filter(
          (item) => item.remaining_qty <= item.min_qty
        );
      }

      setData(formatted);
    } catch (error) {
      console.error("Failed to fetch components:", error);
    }
  };

  // ✅ Delete
  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Delete component "${row.name}"?`
    );
    if (!confirmed) return;

    try {
      await axios.delete(API.DELETE_COMPONENT(row.id), { headers });
      toast.success("Component deleted successfully!");
      fetchComponents();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Delete failed");
    }
  };

  // ✅ Actions
  const handleAction = (type, row) => {
    if (type === "delete") return handleDelete(row);

    navigate(`/components/action/${type}`, {
      state: { data: row, action: type },
    });
  };

  const IconBtn = ({ onClick, children, label, color }) => (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 ${color}`}
      >
        {children}
      </button>
      <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100">
        {label}
      </span>
    </div>
  );

  // ✅ Columns
  const columns = [
    { header: "Name", accessor: "name" },

    {
      header: "Image",
      render: (row) =>
        row.image_url ? (
          <img
            src={`${import.meta.env.VITE_AUTH_BASE}/${row.image_url.replace(/\\/g, "/")}`}
            alt={row.name}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          "-"
        ),
    },

    { header: "Category", accessor: "category" },
    { header: "Company", accessor: "company" },
    { header: "Manufacturer", accessor: "manufacturer" },
    { header: "Supplier", accessor: "supplier" },
    { header: "Location", accessor: "location" },

    { header: "Serial No", accessor: "serial_no" },
    { header: "Model No", accessor: "model_no" },
    { header: "Order No", accessor: "order_number" },

    { header: "Total Qty", accessor: "total_qty" },
    { header: "Remaining", accessor: "remaining_qty" },
    { header: "Min Qty", accessor: "min_qty" },

    { header: "Unit Cost", accessor: "unit_cost" },
    { header: "Total Cost", accessor: "total_cost" },
    { header: "Purchase Date", accessor: "purchase_date" },
    { header: "Notes", accessor: "notes" },

    {
      header: "Check In / Check Out",
      render: (row) => (
        <PermissionButton
          permission="checkout_accessories"
          onClick={() =>
            handleAction("checkout", row)
          }
        >
          <button className="px-3 py-2 -my-1 text-xs bg-indigo-600 text-white rounded">
            Manage
          </button>
        </PermissionButton>
      ),
    },

    {
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">

          <PermissionButton
            permission="clone_accessories"
            onClick={() =>
              handleAction("clone", row)
            }
          >
            <IconBtn
              label="Clone"
              color="text-blue-600"
            >
              <FiCopy size={16} />
            </IconBtn>
          </PermissionButton>

          <PermissionButton
            permission="update_accessories"
            onClick={() =>
              handleAction("update", row)
            }
          >
            <IconBtn
              label="Update"
              color="text-green-600"
            >
              <FiEdit size={16} />
            </IconBtn>
          </PermissionButton>

          <PermissionButton
            permission="delete_accessories"
            onClick={() =>
              handleAction("delete", row)
            }
          >
            <IconBtn
              label="Delete"
              color="text-red-600"
            >
              <FiTrash2 size={16} />
            </IconBtn>
          </PermissionButton>

        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-semibold mb-4">{title}</h1>

      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={data}
          createPath="/components/action/create"
          createLabel="Create Component"
        />
      </div>
    </div>
  );
}