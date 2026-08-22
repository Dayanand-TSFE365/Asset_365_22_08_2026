import { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "../components/common/DataTable";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API } from "../../../config/api";
import PermissionButton from "../../../components/common/PermissionButton";
import {
  FiCopy,
  FiEdit,
  FiTrash2,
  FiClipboard,
  FiTool,
} from "react-icons/fi";

export default function AssetList({ title, filter }) {
  const navigate = useNavigate();

  const [data, setData] = useState([]);

  const [models, setModels] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // ───────── FETCH MASTER DATA ─────────
  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    const headers = { Authorization: `Bearer ${token}` };
    axios.get(API.GET_COMPANIES, { headers }).then((r) => setCompanies(r.data));
    axios.get(API.GET_SUPPLIERS, { headers }).then((r) => setSuppliers(r.data));

    axios.get(API.GET_MODELS, { headers }).then((r) => setModels(r.data));
    axios.get(API.GET_STATUS, { headers }).then((r) => setStatuses(r.data));
    axios.get(API.GET_LOCATIONS, { headers }).then((r) => setLocations(r.data));
    axios.get(API.GET_USERS, { headers }).then((r) => setUsers(r.data));
  }, []);

  const findName = (list, id) =>
    list.find((i) => i.id === id)?.name || "-";

  // ───────── FETCH ASSETS ─────────
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const token = sessionStorage.getItem("access_token");

        const res = await axios.get(API.GET_ASSETS, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // const formatted = res.data.map((item) => ({
        //   id: item.asset_id,
        //   tag: item.asset_tag,
        //   name: item.asset_name,

        //   image: item.image_url
        //     ? item.image_url.startsWith("http")
        //       ? item.image_url
        //       : `${import.meta.env.VITE_AUTH_BASE}/${item.image_url.replace(/^\/+/, "")}`
        //     : "https://via.placeholder.com/40",

        //   serial: item.serial_number,
        //   order_number: item.order_number || "-",

        //   company: findName(companies, item.company_id),
        //   supplier: findName(suppliers, item.supplier_id),
        //   notes: item.notes || "-",
        //   warranty_months: item.warranty_months ?? "-",
        //   eol_date: item.eol_date || "-",
        //   purchase_date: item.purchase_date || "-",
        //   warranty_expires: item.warranty_expires || "-",
        //   condition: item.condition || "-",

        //   model: findName(models, item.model_id),
        //   category: "-",
        //   status: findName(statuses, item.status_id),
        //   user: findName(users, item.checked_out_to),
        //   location: findName(locations, item.location_id),

        //   cost: item.purchase_cost ? `₹${item.purchase_cost}` : "-",
        //   value: item.current_value ? `₹${item.current_value}` : "-",

        //   byod: item.byod,
        //   requestable: item.requestable,
        //   next_audit_date: item.next_audit_date,
        //   expected_checkin_date: item.expected_checkin_date,
        // }));

        const formatted = res.data.map((item) => ({
          id: item.asset_id,
          tag: item.asset_tag,
          name: item.asset_name,

          // ✅ KEEP IDS (CRITICAL)
          company_id: item.company_id,
          model_id: item.model_id,
          status_id: item.status_id,
          location_id: item.location_id,
          supplier_id: item.supplier_id,
          current_value: item.current_value,
          purchase_cost: item.purchase_cost,
          depreciation_months: item.depreciation_months ?? "-",

          // 👇 UI display fields
          image: item.image_url
            ? item.image_url.startsWith("http")
              ? item.image_url
              : `${import.meta.env.VITE_AUTH_BASE}/${item.image_url.replace(/^\/+/, "")}`
            : "https://via.placeholder.com/40",

          serial: item.serial_number,
          order_number: item.order_number || "-",

          company: findName(companies, item.company_id),
          supplier: findName(suppliers, item.supplier_id),

          notes: item.notes || "-",
          warranty_months: item.warranty_months ?? "-",
          eol_date: item.eol_date || "-",
          purchase_date: item.purchase_date || "-",
          warranty_expires: item.warranty_expires || "-",
          condition: item.condition || "-",

          model: findName(models, item.model_id),
          category: "-",
          status: findName(statuses, item.status_id),
          user: findName(users, item.checked_out_to),
          location: findName(locations, item.location_id),

          cost: item.purchase_cost ? `₹${item.purchase_cost}` : "-",
          value: item.current_value ? `₹${item.current_value}` : "-",

          byod: item.byod,
          requestable: item.requestable,
          next_audit_date: item.next_audit_date,
          expected_checkin_date: item.expected_checkin_date,
        }));

        // ───────── FILTER LOGIC ─────────
        let filtered = formatted;

        if (filter === "byod") {
          filtered = formatted.filter((i) => i.byod === true);
        } else if (filter === "requestable") {
          filtered = formatted.filter((i) => i.requestable === true);
        } else if (filter === "due_audit") {
          filtered = formatted.filter((i) => i.next_audit_date);
        } else if (filter === "due_checkin") {
          filtered = formatted.filter((i) => i.expected_checkin_date);
        } else {
          // status-based
          filtered = formatted.filter(
            (i) => i.status?.toLowerCase() === filter
          );
        }

        setData(filtered);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAssets();
  }, [models, statuses, locations, users, companies, suppliers, filter]);

  //Handle Delete
      const handleDelete = async (row) => {
  const assetId = row?.id || row?.asset_id;

  if (!assetId) {
    toast.error("Asset ID not found.");
    return;
  }

  // If asset is checked out, redirect to checkin first
  const isCheckedOut = row.user && row.user !== "-";

  if (isCheckedOut) {
    const proceed = window.confirm(
      `This asset is currently checked out to ${row.user}.\n\n` +
      `You must check it in before deleting.\n\n` +
      `Do you want to check it in now?`
    );

    if (proceed) {
      navigate("/assets/action/checkin", {
        state: {
          data: row,
          action: "checkin",
          redirectAfter: "delete",
        },
      });
    }

    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to delete asset ${row.tag}?`
  );

  if (!confirmed) return;

  try {
    const token = sessionStorage.getItem("access_token");

    await axios.delete(API.DELETE_ASSET(assetId), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    toast.success("Asset deleted successfully!");

    setData((prev) => prev.filter((item) => item.id !== assetId));

    // Optional: navigate to Deleted Assets page
    navigate("/assets/deleted");
  } catch (error) {
    console.error("Delete failed:", error.response?.data || error);
    toast.error(error.response?.data?.detail || "Failed to delete asset.");
  }
};

  // ───────── ACTION ─────────
  const handleAction = (type, row) => {
    if (type === "delete") {
      handleDelete(row);
      return;
    }

    if (type === "checkin" || type === "checkout") {
      navigate(`/assets/action/${type}`, {
        state: { data: row, action: type },
      });
      return;
    }

    navigate(`/assets/action/${type}`, {
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

  const columns = [
    { header: "Asset Tag", accessor: "tag" },
    { header: "Asset Name", accessor: "name" },

    {
      header: "Image",
      render: (row) => (
        <img src={row.image} alt="" className="w-10 h-10 rounded" />
      ),
    },

    { header: "Serial", accessor: "serial" },
    { header: "Model", accessor: "model" },
    { header: "Company", accessor: "company" },
    { header: "Supplier", accessor: "supplier" },
    { header: "Category", accessor: "category" },
    { header: "Condition", accessor: "condition" },
    { header: "Status", accessor: "status" },
    { header: "Checked Out To", accessor: "user" },
    { header: "Location", accessor: "location" },

    { header: "Purchase Date", accessor: "purchase_date" },
    { header: "Purchase Cost", accessor: "cost" },
    { header: "Depreciation (Months)", accessor: "depreciation_months" },
    { header: "Current Value", accessor: "value" },
    { header: "Warranty (Months)", accessor: "warranty_months" },
    { header: "Warranty Expires", accessor: "warranty_expires" },
    { header: "EOL Date", accessor: "eol_date" },

    {
      header: "Order Number",
      accessor: "order_number",
    },

    { header: "Notes", accessor: "notes" },

    {
      header: "BYOD",
      accessor: "byod",
      render: (row) => <span>{row.byod ? "✔️" : "❌"}</span>,
    },

    {
      header: "Requestable",
      accessor: "requestable",
      render: (row) => <span>{row.requestable ? "✔️" : "❌"}</span>,
    },

    {
      header: "Checkin/Checkout",
      render: (row) => {
        const isCheckedOut = row.user && row.user !== "-";

        return (
          <PermissionButton
            permission={
              isCheckedOut
                ? "checkin_assets"
                : "checkout_assets"
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
                ? "bg-orange-500"
                : "bg-blue-600"
            }`}
          >
            {isCheckedOut
              ? "Checkin"
              : "Checkout"}
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
              permission="clone_assets"
              onClick={() =>
                handleAction("clone", row)
              }
            >
            <IconBtn
              label="Clone Item"
              color="text-blue-600"
            >
              <FiCopy size={16} />
            </IconBtn>
          </PermissionButton>

          <PermissionButton
            permission="audit_assets"
            onClick={() =>
              handleAction("audit", row)
            }
          >
            <IconBtn
              label="Audit"
              color="text-yellow-500"
            >
              <FiClipboard size={16} />
            </IconBtn>
          </PermissionButton>

          <PermissionButton
            permission="update_assets"
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
            permission="maintenance_assets"
            onClick={() =>
              handleAction("maintenance", row)
            }
          >
            <IconBtn label="Maintenance" color="text-purple-600">
              <FiTool size={16} />
            </IconBtn>
          </PermissionButton>

          <PermissionButton
            permission="delete_assets"
            onClick={() => handleAction("delete", row)}
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
      <h1 className="text-xl font-semibold mb-2">{title}</h1>
      <div className="flex-1 min-h-0">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}