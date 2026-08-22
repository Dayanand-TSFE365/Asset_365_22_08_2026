// ===============================
// File: src/pages/licenses/components/LicenseList.jsx
// ===============================

import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiCopy, FiEdit, FiTrash2, FiLogOut, FiEye, } from "react-icons/fi";
import DataTable from "../components/common/DataTable";
import toast from "react-hot-toast";
import { API } from "../../../config/api";
import PermissionButton from "../../../components/common/PermissionButton";
import { useAuth } from "../../../auth/AuthContext";

export default function LicenseList({ title, filter }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const token = sessionStorage.getItem("access_token");
  const headers = { Authorization: `Bearer ${token}` };

  const findName = (list, id) =>
    list.find((item) => item.id === id)?.name || "-";

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [cat, comp, manu, supp] = await Promise.all([
          axios.get(API.GET_CATEGORIES, { headers }),
          axios.get(API.GET_COMPANIES, { headers }),
          axios.get(API.GET_MANUFACTURERS, { headers }),
          axios.get(API.GET_SUPPLIERS, { headers }),
        ]);

        setCategories(cat.data || []);
        setCompanies(comp.data || []);
        setManufacturers(manu.data || []);
        setSuppliers(supp.data || []);
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
      !suppliers.length
    ) {
      return;
    }

    fetchLicenses();
  }, [categories, companies, manufacturers, suppliers, filter]);

  const fetchLicenses = async () => {
    try {
      const res = await axios.get(API.GET_LICENSES, { headers });
      console.log("📦 LICENSE API RESPONSE:", res.data);

      let formatted = (res.data || []).map((item) => ({
        id: item.license_id,
        Software_name: item.Software_name,
        product_key: item.product_key,
        total: item.total,
        available: item.available,
        min_qty: item.min_qty,

        assignment_id: item.assignment_id || item.current_assignment_id || null,
        current_assignment_id: item.current_assignment_id || null,

        category_id: item.category_id,
        company_id: item.company_id,
        manufacturer_id: item.manufacturer_id,
        supplier_id: item.supplier_id,

        category: findName(categories, item.category_id),
        company: findName(companies, item.company_id),
        manufacturer: findName(manufacturers, item.manufacturer_id),
        supplier: findName(suppliers, item.supplier_id),

        licensed_to: item.licensed_to || "-",
        licensed_to_email: item.licensed_to_email || "-",

        reassignable: item.reassignable,
        maintained: item.maintained,

        order_number: item.order_number || "-",
        purchase_order_number: item.purchase_order_number || "-",
        purchase_cost: item.purchase_cost
          ? `₹${item.purchase_cost}`
          : "-",
        depreciation: item.depreciation || "-",

        purchase_date: item.purchase_date || "-",
        expiration_date: item.expiration_date || "-",
        termination_date: item.termination_date || "-",

        notes: item.notes || "-",
      }));

      if (filter === "available") {
        formatted = formatted.filter((i) => i.available > 0);
      } else if (filter === "low_stock") {
        formatted = formatted.filter((i) => i.available <= i.min_qty);
      } else if (filter === "expired") {
        const today = new Date();
        formatted = formatted.filter(
          (i) => i.expiration_date !== "-" && new Date(i.expiration_date) < today
        );
      } else if (filter === "expiring") {
        const today = new Date();
        const next30 = new Date();
        next30.setDate(today.getDate() + 30);

        formatted = formatted.filter((i) => {
          if (i.expiration_date === "-") return false;
          const exp = new Date(i.expiration_date);
          return exp >= today && exp <= next30;
        });
      }

      setData(formatted);
    } catch (error) {
      console.error("Failed to fetch licenses:", error);
    }
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete license \"${row.name}\"?`
    );

    if (!confirmed) return;

    try {
      await axios.delete(API.DELETE_LICENSE(row.id), { headers });

      toast.success("License deleted successfully!");

      // Refresh the active list after soft delete
      fetchLicenses();
    } catch (error) {
      console.error("Delete failed:", error.response?.data || error);
      toast.error(error.response?.data?.detail || "Failed to delete license.");
    }
  };

  const handleAction = (type, row) => {
    if (type === "delete") {
      handleDelete(row);
      return;
    }

    navigate(`/licenses/action/${type}`, {
      state: {
        data: {
          ...row,
          assignment_id: row.assignment_id || row.current_assignment_id || null
        },
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
  const handleRevealKey = async (row) => {
    try {
      const res = await axios.get(
        API.REVEAL_LICENSE_KEY(row.id),
        { headers }
      );

      toast.success(
        `Product Key: ${res.data.product_key}`,
        {
          duration: 8000,
        }
      );
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.detail ||
        "Unable to reveal product key"
      );
    }
  };

  const columns = [
    { header: "Software Name", accessor: "Software_name" },
    { header: "Product Key", accessor: "product_key" },
    { header: "Category", accessor: "category" },
    { header: "Company", accessor: "company" },
    { header: "Manufacturer", accessor: "manufacturer" },
    { header: "Supplier", accessor: "supplier" },
    { header: "Total", accessor: "total" },
    { header: "Available", accessor: "available" },
    { header: "Min Qty", accessor: "min_qty" },
    { header: "Licensed To", accessor: "licensed_to" },
    { header: "Email", accessor: "licensed_to_email" },
    { header: "Purchase Cost", accessor: "purchase_cost" },
    { header: "Depreciation", accessor: "depreciation" },
    { header: "Purchase Date", accessor: "purchase_date" },
    { header: "Expiration Date", accessor: "expiration_date" },

    {
      header: "Reassignable",
      render: (row) => <span>{row.reassignable ? "✔️" : "❌"}</span>,
    },
    {
      header: "Maintained",
      render: (row) => <span>{row.maintained ? "✔️" : "❌"}</span>,
    },
    {
        header: "Check In / Check Out",
        render: (row) => {
            const isCheckedOut =
            row.licensed_to_email && row.licensed_to_email !== "-";

            return (
            <PermissionButton
              permission={
                isCheckedOut
                  ? "checkin_licenses"
                  : "checkout_licenses"
              }
              onClick={() =>
                handleAction(
                  isCheckedOut
                    ? "checkin"
                    : "checkout",
                  row
                )
              }
            >
              <button
                className={`px-3 py-1 rounded text-white text-sm ${
                  isCheckedOut
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isCheckedOut
                  ? "Check In"
                  : "Check Out"}
              </button>
            </PermissionButton>
            );
        },
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          {user?.role?.toLowerCase() === "superadmin" && (
            <IconBtn
              label="Reveal Key"
              color="text-purple-600"
              onClick={() => handleRevealKey(row)}
            >
              <FiEye size={16} />
            </IconBtn>
          )}
          <PermissionButton
            permission="clone_licenses"
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
            permission="update_licenses"
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
            permission="delete_licenses"
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
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}