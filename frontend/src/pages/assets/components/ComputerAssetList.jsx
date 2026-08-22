import { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "../components/common/DataTable";
import { API } from "../../../config/api";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import PermissionButton from "../../../components/common/PermissionButton";
import { formatDateOnlyIST } from "../../../utils/exportExcel";
import {
  FiCopy,
  FiEdit,
  FiTrash2,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

export default function ComputerAssetList({ title, assetType,}) {
  const [filterType, setFilterType] = useState("COMPANY");
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [manufacturers, setManufacturers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [revealedEmailPasswords, setRevealedEmailPasswords] = useState({});

  const dashboardFilter = new URLSearchParams(location.search).get("dashboard");


  const findManufacturer = (id) =>  manufacturers.find((m) => m.id === id)?.name || "-";

  const findSupplier = (id) =>  suppliers.find((s) => s.id === id)?.name || "-";


  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const token = sessionStorage.getItem("access_token");

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [manufacturerRes, supplierRes] = await Promise.all([
          axios.get(API.GET_MANUFACTURERS, { headers }),
          axios.get(API.GET_SUPPLIERS, { headers }),
        ]);

        setManufacturers(manufacturerRes.data || []);
        setSuppliers(supplierRes.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMasters();
  }, []);

  // ─────────────────────────────
  // FETCH COMPUTER ASSETS
  // ─────────────────────────────
  useEffect(() => {
    if (dashboardFilter === "company") {
      setFilterType("COMPANY");
      return;
    }
    if (dashboardFilter === "client") {
      setFilterType("CLIENT");
      return;
    }
    if (dashboardFilter) {
      setFilterType("ALL");
    }
  }, [dashboardFilter]);

  useEffect(() => {
    if (!manufacturers.length || !suppliers.length) return;

    const fetchComputerAssets = async () => {
      try {
      const token = sessionStorage.getItem("access_token");

      const res = await axios.get(API.GET_COMPUTER_ASSETS, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
      });

      let filteredAssets = Array.isArray(res.data) ? res.data : [];

      const now = new Date();
      if (dashboardFilter === "warranty_expired") {
        filteredAssets = filteredAssets.filter((item) => {
          const d = new Date(item.warranty_expire);
          return !isNaN(d) && d < now;
        });
      } else if (dashboardFilter === "warranty_expiring") {
        filteredAssets = filteredAssets.filter((item) => {
          const d = new Date(item.warranty_expire);
          const diff = (d - now) / 86400000;
          return !isNaN(d) && diff >= 0 && diff <= 60;
        });
      } else if (dashboardFilter === "warranty_valid") {
        filteredAssets = filteredAssets.filter((item) => {
          const d = new Date(item.warranty_expire);
          return !isNaN(d) && d >= now;
        });
      } else if (dashboardFilter === "company") {
        filteredAssets = filteredAssets.filter((item) => item.asset_type === "COMPANY");
      } else if (dashboardFilter === "client") {
        filteredAssets = filteredAssets.filter((item) => item.asset_type === "CLIENT");
      } else if (filterType !== "ALL") {
        filteredAssets = filteredAssets.filter((item) => item.asset_type === filterType);
      }

      setData(
        filteredAssets.map((item) => ({
            id: item.computer_detail_id,
            asset_no: item.asset_no || "-",
            asset_type: item.asset_type || "-",
            assigned_to: item.assigned_to || "-",
            client_name: item.client_name || "-",
            job_po_no: item.job_po_no || "-",
            pc_name: item.pc_name || "-",
            administrator_name: item.administrator_name || "-",
            administrator_password: item.administrator_password,
            email_id: item.email_id || "-",
            email_password: item.email_password,
            operating_system: item.operating_system || "-",
            office_version: item.office_version || "-",
            rockwell_software: item.rockwell_software || "-",
            other_software: item.other_software || "-",
            item_description: item.item_description || "-",
            year_of_mfg: item.year_of_mfg || "-",
            warranty_expire: item.warranty_expire || "-",
            manufacturer: findManufacturer(item.manufacturer_id),   // for displaying
            manufacturer_id: item.manufacturer_id,  
            serial_no: item.serial_no || "-",
            system_configuration: item.system_configuration || "-",
            supplier: findSupplier(item.supplier_id),               // for displaying
            supplier_id: item.supplier_id,
            order_number: item.order_number || "-",
            purchase_order_number: item.purchase_order_number || "-",
            purchase_date: item.purchase_date || "-",
            configure_date: item.configure_date || "-",
            purchase_cost: item.purchase_cost
                ? `₹${item.purchase_cost}`
                : "-",

            created_at: item.created_at
                ? new Date(item.created_at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                })
                : "-",

            updated_at: item.updated_at
                ? new Date(item.updated_at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                })
                : "-",
        }))
      );
      } catch (err) {
        toast.error("Failed to load Computer Assets");
      }
    };
    fetchComputerAssets();
  }, [filterType, manufacturers, suppliers, dashboardFilter]);

  const handleRevealPassword = async (row) => {
  try {
    const token = sessionStorage.getItem("access_token");

    const res = await axios.get(
      API.REVEAL_COMPUTER_PASSWORD(row.id),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const adminPassword = res.data?.administrator_password;
const emailPassword = res.data?.email_password;

if (!adminPassword && !emailPassword) {
  toast.error("Passwords not found");
  return;
}

setRevealedPasswords((prev) => ({
  ...prev,
  [row.id]: adminPassword,
}));

setRevealedEmailPasswords((prev) => ({
  ...prev,
  [row.id]: emailPassword,
}));

toast.success("Passwords revealed");
  } catch (err) {
    toast.error(
      err.response?.data?.detail || "Failed to reveal password"
    );
  }
};
const handleBulkReveal = async (ids) => {
  if (!ids.length) {
    toast.error("Select at least one asset");
    return;
  }

  try {
    const token = sessionStorage.getItem("access_token");

    const adminPasswords = {};
    const emailPasswords = {};

    await Promise.all(
      ids.map(async (id) => {
        const res = await axios.get(
          API.REVEAL_COMPUTER_PASSWORD(id),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        adminPasswords[id] = res.data?.administrator_password;
        emailPasswords[id] = res.data?.email_password;
      })
    );

    setRevealedPasswords((prev) => ({
      ...prev,
      ...adminPasswords,
    }));

    setRevealedEmailPasswords((prev) => ({
      ...prev,
      ...emailPasswords,
    }));

    toast.success(`${ids.length} passwords revealed`);
  } catch (err) {
    toast.error("Failed to reveal passwords");
  }
};

    // ─────────────────────────────
  // DELETE
  // ─────────────────────────────
  const handleBulkDelete = async (ids) => {
  if (!ids.length) {
    toast.error("Select at least one asset");
    return;
  }

  const confirmed = window.confirm(
    `Delete ${ids.length} selected assets?`
  );

  if (!confirmed) return;

  try {
    const token = sessionStorage.getItem("access_token");

    await axios.delete(API.BULK_DELETE_COMPUTER_ASSETS, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        ids,
      },
    });

    toast.success("Assets deleted successfully");

    setData((prev) =>
      prev.filter((item) => !ids.includes(item.id))
    );

  } catch (err) {
    toast.error(
      err.response?.data?.detail ||
      "Bulk delete failed"
    );
  }
};

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Asset ${row.asset_no}?`
    );

    if (!confirmed) return;

    try {
      const token = sessionStorage.getItem("access_token");

      await axios.delete(API.DELETE_COMPUTER_ASSET(row.id), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Computer Asset deleted successfully.");

      // Remove deleted row from table
      setData((prev) => prev.filter((item) => item.id !== row.id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete Computer Asset");
    }
  };

  // ─────────────────────────────
  // ACTION HANDLER
  // ─────────────────────────────
  const handleAction = (type, row) => {
    if (type === "delete") {
        handleDelete(row);
        return;
    }

    navigate(`/assets/computer-assets/action/${type}`, {
        state: { data: row },
    });
    };

  // Small Icon Button
  const IconBtn = ({
    onClick,
    children,
    label,
    color,
  }) => (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 ${color}`}
      >
        {children}
      </button>

      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
        {label}
      </span>
    </div>
  );

  // ─────────────────────────────
  // TABLE COLUMNS
  // ─────────────────────────────
  const isClient = filterType === "CLIENT";
  const columns = [
    {
      header: "Asset No",
      accessor: "asset_no",
    },
    {
      header: "Asset Type",
      accessor: "asset_type",
    },
    {
      header: "Assigned To",
      accessor: "assigned_to",
    },
    ...(isClient ? [
      {
        header: "Client",
        accessor: "client_name",
      },
      {
        header: "Job / PO",
        accessor: "job_po_no",
      },
    ]
    : []),
    {
      header: "PC Name",
      accessor: "pc_name",
    },
    {
      header: "Administrator",
      accessor: "administrator_name",
    },
    {
  header: "Administrator Password",
  render: (row) => {
    if (revealedPasswords[row.id]) return revealedPasswords[row.id];
    if (!row.administrator_password) return "-";
    return "••••••••";
  },
  exportValue: (row) => {
    // only show the real value if THIS row has actually been revealed
    // this session — never leak the raw password into the export by default
    if (revealedPasswords[row.id]) return revealedPasswords[row.id];
    if (!row.administrator_password) return "-";
    return "********";
  },
},
    {
      header: "Email ID",
      accessor: "email_id",
    },
    {
  header: "Email Password",
  render: (row) => {
    if (revealedEmailPasswords[row.id]) return revealedEmailPasswords[row.id];
    if (!row.email_password) return "-";
    return "••••••••";
  },
  exportValue: (row) => {
    if (revealedEmailPasswords[row.id]) return revealedEmailPasswords[row.id];
    if (!row.email_password) return "-";
    return "********";
  },
},
    {
      header: "Operating System",
      accessor: "operating_system",
    },
    {
      header: "Office Version",
      accessor: "office_version",
    },
    {
      header: "Rockwell Software",
      accessor: "rockwell_software",
    },
    {
      header: "Other Software",
      accessor: "other_software",
    },
    {
      header: "Description",
      accessor: "item_description",
    },
    {
      header: "Year",
      accessor: "year_of_mfg",
    },
    {
      header: "Warranty",
      accessor: "warranty_expire",
    },
    {
      header: "Manufacturer",
      accessor: "manufacturer",
    },
    {
      header: "Serial No",
      accessor: "serial_no",
    },
    {
      header: "Configuration",
      accessor: "system_configuration",
    },
    {
      header: "Supplier",
      accessor: "supplier",
    },
    {
      header: "Order No",
      accessor: "order_number",
    },
    {
      header: "Purchase Order",
      accessor: "purchase_order_number",
    },
    {
      header: "Purchase Date",
      accessor: "purchase_date",
    },
    {
      header: "Configure Date",
      accessor: "configure_date",
    },
    {
      header: "Purchase Cost",
      accessor: "purchase_cost",
    },
    {
      header: "Created",
      accessor: "created_at",
    },
    {
      header: "Updated",
      accessor: "updated_at",
    },

    {
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <PermissionButton
            permission="Reveal Password_assets"
            onClick={() => handleRevealPassword(row)}
          >
            <IconBtn
              color="text-indigo-600"
              label="Reveal Password"
            >
              <FiEye size={16} />
            </IconBtn>
          </PermissionButton>

          <PermissionButton
            permission="clone_assets"
            onClick={() =>
              handleAction("clone", row)
            }
          >
            <IconBtn
              color="text-blue-600"
              label="Clone"
            >
              <FiCopy size={16} />
            </IconBtn>
          </PermissionButton>

          <PermissionButton
            permission="update_assets"
            onClick={() =>
              handleAction("update", row)
            }
          >
            <IconBtn
              color="text-green-600"
              label="Update"
            >
              <FiEdit size={16} />
            </IconBtn>
          </PermissionButton>

          <PermissionButton
            permission="delete_assets"
            onClick={() =>
              handleAction("delete", row)
            }
          >
            <IconBtn
              color="text-red-600"
              label="Delete"
            >
              <FiTrash2 size={16} />
            </IconBtn>
          </PermissionButton>

        </div>
      ),
    },
  ];

  // ─────────────────────────────
  // RETURN
  // ─────────────────────────────
  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-semibold mb-2">
        {title}
      </h1>

      <div className="flex-1 min-h-0">
        <DataTable
    columns={columns}
    data={data}
    createRoute="/assets/computer-assets/action/create"
    filterType={filterType}
    setFilterType={setFilterType}
    showAssetFilter={true}

    onBulkDelete={handleBulkDelete}
    deletePermission="delete_assets"
    onBulkReveal={handleBulkReveal}
    revealPermission="Reveal Password_assets"
/>
      </div>
    </div>
  );
}