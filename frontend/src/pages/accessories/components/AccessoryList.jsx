// AccessoryList.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiCopy, FiEdit, FiTrash2, FiLogOut } from "react-icons/fi";
import DataTable from "../components/common/DataTable";
import toast from "react-hot-toast";
import { API } from "../../../config/api";
import PermissionButton from "../../../components/common/PermissionButton";

export default function AccessoryList({ title = "All Accessories", filter }) {
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
    ) {
      return;
    }

    fetchAccessories();
  }, [categories, companies, manufacturers, suppliers, locations, filter]);

  const fetchAccessories = async () => {
  try {
    const res = await axios.get(API.GET_ACCESSORIES, { headers });

    console.log("API Data:", res.data);

    // ✅ NORMALIZE RESPONSE
    const rawData = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.items)
      ? res.data.items
      : res.data
      ? [res.data]
      : [];

    let formatted = rawData.map((item) => ({
      id: item.accessory_id,
      name: item.name,
      image_url: item.image_url || null,

      model_no: item.model_no || "-",
      item_no: item.item_no || "-",
      order_number: item.order_number || "-",

      quantity: item.total_qty ?? 0,
      total_qty: item.total_qty ?? 0,
      available_qty: item.available_qty ?? 0,
      checked_out_qty: item.checked_out_qty ?? 0,

      min_qty: item.min_qty || 0,
      unit_cost: item.unit_cost ? `₹${item.unit_cost}` : "-",
      purchase_date: item.purchase_date || "-",
      notes: item.notes || "-",

      category_id: item.category_id,
      company_id: item.company_id,
      manufacturer_id: item.manufacturer_id,
      supplier_id: item.supplier_id,
      location_id: item.location_id,

      category: findName(categories, item.category_id),
      company: findName(companies, item.company_id),
      manufacturer: findName(manufacturers, item.manufacturer_id),
      supplier: findName(suppliers, item.supplier_id),
      location: findName(locations, item.location_id),
    }));

    if (filter === "low_stock") {
      formatted = formatted.filter(
        (item) => item.available_qty <= item.min_qty
      );
    }

    setData(formatted);
  } catch (error) {
    console.error("Failed to fetch accessories:", error);
  }
};

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete accessory "${row.name}"?`
    );

    if (!confirmed) return;

    try {
      await axios.delete(API.DELETE_ACCESSORY(row.id), { headers });
      toast.success("Accessory deleted successfully!");
      fetchAccessories();
    } catch (error) {
      console.error("Delete failed:", error.response?.data || error);
      toast.error(error.response?.data?.detail || "Failed to delete accessory.");
    }
  };

  const handleAction = (type, row) => {
    if (type === "delete") {
      handleDelete(row);
      return;
    }

    navigate(`/accessories/action/${type}`, {
      state: {
        data: row,
        action: type,
      },
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
      <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
        {label}
      </span>
    </div>
  );

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
            <span>-</span>
            ),
    },
    { header: "Category", accessor: "category" },
    { header: "Company", accessor: "company" },
    { header: "Manufacturer", accessor: "manufacturer" },
    { header: "Supplier", accessor: "supplier" },
    { header: "Location", accessor: "location" },
    { header: "Model No", accessor: "model_no" },
    // { header: "Item No", accessor: "item_no" },
    { header: "Order No", accessor: "order_number" },
    { header: "Total Qty", accessor: "total_qty" },
    { header: "Available", accessor: "available_qty" },
    { header: "Checked Out", accessor: "checked_out_qty" },
    { header: "Min Qty", accessor: "min_qty" },
    { header: "Unit Cost", accessor: "unit_cost" },
    { header: "Purchase Date", accessor: "purchase_date" },
    { header: "Notes", accessor: "notes" },
    {
      header: "Check In / Check Out",
      render: (row) => {
        return (
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
        );
      },
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
          createPath="/accessories/action/create"
          createLabel="Create Accessory"
        />
      </div>
    </div>
  );
}
