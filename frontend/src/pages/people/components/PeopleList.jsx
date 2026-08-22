import { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "./common/DataTable";
import { API } from "../../../config/api";
import { useNavigate } from "react-router-dom";
import PermissionButton from "../../../components/common/PermissionButton";
import toast from "react-hot-toast";
import {
  FiEdit,
  FiCopy,
  FiTrash2,
} from "react-icons/fi";

export default function PeopleList({
  title,
  filter,
}) {
  const navigate = useNavigate();

  const [data, setData] = useState([]);

  // FETCH EMPLOYEES
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token =
          sessionStorage.getItem("access_token");

        const res = await axios.get(
          API.GET_EMPLOYEES,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const formatted = res.data.map((item) => ({
  user_id: item.user_id,
  employee_id: item.employee_id,

  employee_code: item.employee_code,
  full_name: item.full_name,
  email: item.email,

  phone: item.phone || "-",
  department: item.department || "-",
  designation: item.designation || "-",

  status: item.status || "-",
  role: item.role || "-",

  login_enabled: item.login_enabled,

  created_at: item.created_at
    ? new Date(item.created_at).toLocaleDateString("en-GB")
    : "-",
}));

        // FILTERS
        let filtered = formatted;

        if (filter === "enabled") {
          filtered = formatted.filter(
            (i) =>
              i.login_enabled === true
          );
        }

        if (filter === "disabled") {
          filtered = formatted.filter(
            (i) =>
              i.login_enabled === false
          );
        }

        setData(filtered);
      } catch (err) {
        console.error(err);
      }
    };

    fetchEmployees();
  }, [filter]);

  // ACTIONS
  const handleAction = (
    type,
    row
  ) => {
    navigate(
      `/people/action/${type}`,
      {
        state: {
          data: row,
          action: type,
        },
      }
    );
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

      <span
        className="absolute bottom-full mb-1 left-1/2
        -translate-x-1/2 whitespace-nowrap
        text-xs bg-black text-white
        px-2 py-1 rounded opacity-0
        group-hover:opacity-100"
      >
        {label}
      </span>
    </div>
  );
  const handleDelete = async (row) => {
  const confirmDelete = window.confirm(
    `Are you sure you want to delete ${row.full_name}?`
  );

  if (!confirmDelete) return;

  try {
    const token = sessionStorage.getItem("access_token");

    await axios.delete(API.DELETE_EMPLOYEE(row.user_id), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // remove from UI instantly
    setData((prev) => prev.filter((item) => item.user_id !== row.user_id));

    toast.success("Employee deleted successfully!");
  } catch (err) {
    console.error(err);
    toast.error(err.response?.data?.detail || "Failed to delete employee");
  }
};

  const columns = [
    {
      header: "Employee Code",
      accessor: "employee_code",
    },

    {
      header: "Full Name",
      accessor: "full_name",
    },

    {
      header: "Email",
      accessor: "email",
    },

    {
      header: "Phone",
      accessor: "phone",
    },

    {
      header: "Department",
      accessor: "department",
    },

    {
      header: "Designation",
      accessor: "designation",
    },

    {
      header: "Status",
      accessor: "status",
    },

    {
      header: "Role",
      accessor: "role",
    },

    {
      header: "Login",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium
          ${
            row.login_enabled
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.login_enabled
            ? "Enabled"
            : "Disabled"}
        </span>
      ),
    },

    {
      header: "Created",
      accessor: "created_at",
    },

    {
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">

          {/* Clone */}
          <PermissionButton
            permission="clone_people"
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

          {/* Update */}
          <PermissionButton
            permission="update_people"
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

          {/* Delete */}
          <PermissionButton
            permission="delete_people"
            onClick={() =>
              handleDelete(row)
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
      <h1 className="text-xl font-semibold mb-2">
        {title}
      </h1>

      <div className="flex-1 min-h-0">
        <DataTable
            columns={columns}
            data={data}
            createPath="/people/action/create"
            createLabel="Create Employee"
        />
      </div>
    </div>
  );
}