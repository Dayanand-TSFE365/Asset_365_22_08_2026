import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PermissionButton from "../../../components/common/PermissionButton";
import {
  FiEdit,
  FiTrash2,
  FiPackage,
  FiLogOut,
} from "react-icons/fi";

import DataTable from "./common/DataTable";
import { API } from "../../../config/api";

export default function KitList({
  title = "All Kits",
  filter,
}) {
  const navigate = useNavigate();

  const [data, setData] = useState([]);

  const token = sessionStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchKits();
  }, [filter]);

  const fetchKits = async () => {
    try {
      const res = await axios.get(API.GET_KITS, {
        headers,
      });

      console.log("Kits API:", res.data);

      const rawData = Array.isArray(res.data)
        ? res.data
        : [];

      let formatted = rawData.map((item) => ({
  _id: item.id, // internal only

  name: item.name,
  created_by: item.created_by ?? "-",
  created_at: item.created_at,
  updated_at: item.updated_at,
}));

      if (filter === "checked_out") {
        formatted = formatted.filter(
          (item) => item.checked_out === true
        );
      }

      setData(formatted);
    } catch (error) {
      console.error("Failed to fetch kits:", error);
    }
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete kit "${row.name}"?`
    );

    if (!confirmed) return;

    try {
      await axios.delete(API.DELETE_KIT(row._id), {
        headers,
      });

      toast.success("Kit deleted successfully!");

      fetchKits();
    } catch (error) {
      console.error(
        "Delete failed:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to delete kit."
      );
    }
  };

  const handleAction = (type, row) => {
    if (type === "delete") {
      handleDelete(row);
      return;
    }

    navigate(`/kits/action/${type}`, {
      state: {
        data: row,
        action: type,
      },
    });
  };

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

      <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
        {label}
      </span>
    </div>
  );

  const columns = [
    // {
    //   header: "ID",
    //   accessor: "id",
    // },

    {
      header: "Kit Name",
      accessor: "name",
    },

    // {
    //   header: "Created By",
    //   accessor: "created_by",
    // },

    {
    header: "Created At",
    render: (row) =>
        row.created_at
        ? new Date(row.created_at).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            })
        : "-",
    },

    {
    header: "Updated At",
    render: (row) =>
        row.updated_at
        ? new Date(row.updated_at).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            })
        : "-",
    },

    {
      header: "Check In / Check Out",
      render: (row) => (
        <PermissionButton
          permission="checkout_consumables"
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
            permission="update_consumables"
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
            permission="delete_consumables"
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
      <h1 className="text-xl font-semibold mb-4">
        {title}
      </h1>

      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={data}
          createPath="/kits/action/create"
          createLabel="Create Kit"
        />
      </div>
    </div>
  );
}