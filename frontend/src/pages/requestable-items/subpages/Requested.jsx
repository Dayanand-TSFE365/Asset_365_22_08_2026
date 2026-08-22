import { useEffect, useState } from "react";
import { FiCheck, FiX, FiTrash2, FiLogOut } from "react-icons/fi";
import axios from "axios";
import DataTable from "../components/common/DataTable";
import { API } from "../../../config/api";
import { useAuth } from "../../../auth/AuthContext";

export default function Requested() {
  const [data, setData] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);

  const { user } = useAuth();

  const token = sessionStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // ================= CHECK ROLE =================
  const isAdmin =
    user?.role === "admin" ||
    user?.role === "superadmin";

  // ================= FETCH =================
  const fetchRequested = async () => {
    try {
      // logged in user from session
      const storedUser = JSON.parse(
        sessionStorage.getItem("user")
      );

      const userId =
        storedUser?.user_id ||
        storedUser?.id;

      // ================= REQUEST API =================
      const requestApi = isAdmin
        ? API.GET_ASSET_REQUESTS
        : API.GET_USER_ASSET_REQUESTS(userId);

      const [requestRes, assetRes, userRes] =
        await Promise.all([
          axios.get(requestApi, { headers }),
          axios.get(API.GET_ASSETS, {
            headers,
          }),
          axios.get(API.GET_USERS, {
            headers,
          }),
        ]);

      setAssets(assetRes.data || []);
      setUsers(userRes.data || []);

      const formatted = (
        requestRes.data || []
      ).map((item) => ({
        id: item.request_id,
        asset_id: item.asset_id,
        asset_tag: item.asset_tag,
        image_url: item.image_url,
        requested_by: item.requested_by,
        expected_checkin_date:
          item.expected_checkin_date,
        request_date: item.request_date,
        status: item.status,
        notes: item.notes,
      }));

      setData(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequested();
  }, []);

  // ================= HELPERS =================
  const getAssetName = (id) => {
    const asset = assets.find(
      (a) => a.asset_id === id
    );

    return (
      asset?.asset_name || `Asset ${id}`
    );
  };

  const getUserName = (id) => {
    const foundUser = users.find(
      (u) =>
        u.user_id === id || u.id === id
    );

    return (
      foundUser?.full_name ||
      foundUser?.name ||
      foundUser?.username ||
      foundUser?.email ||
      `User ${id}`
    );
  };

  // ================= DELETE =================
  const deleteRequest = async (id) => {
    try {
      await axios.delete(
        API.DELETE_ASSET_REQUEST(id),
        { headers }
      );

      setData((prev) =>
        prev.filter(
          (item) => item.id !== id
        )
      );
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Delete failed"
      );
    }
  };

  // ================= APPROVE / REJECT =================
  const updateStatus = async (
    id,
    status
  ) => {
    try {
      await axios.put(
        API.UPDATE_ASSET_REQUEST_STATUS(
          id
        ),
        {
          status,
        },
        { headers }
      );

      fetchRequested();
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Status update failed"
      );
    }
  };

  // ================= CHECKOUT =================
  const checkoutRequest = async (
    id
  ) => {
    try {
      await axios.post(
        API.CHECKOUT_ASSET_REQUEST(id),
        {},
        { headers }
      );

      fetchRequested();
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Checkout failed"
      );
    }
  };
  // ================= ICON BUTTON HELPER =================
  const IconBtn = ({ onClick, label, color, icon: Icon }) => (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 ${color}`}
      >
        <Icon size={16} />
      </button>
      <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10">
        {label}
      </span>
    </div>
  );

  // ================= TABLE COLUMNS =================
  const columns = [

    {
      header: "Asset",
      render: (row) =>
        getAssetName(row.asset_id),
    },

    {
      header: "Asset Tag",
      accessor: "asset_tag",
    },
    {
      header: "Asset Image",
      render: (row) => (
        <img
          src={
            row.image_url
              ? row.image_url.startsWith(
                  "http"
                )
                ? row.image_url
                : `${
                    import.meta.env
                      .VITE_AUTH_BASE
                  }/${row.image_url.replace(
                    /^\/+/,
                    ""
                  )}`
              : "https://via.placeholder.com/40"
          }
          className="w-10 h-10 rounded object-cover"
          alt=""
        />
      ),
    },

    {
      header: "Requested By",
      render: (row) =>
        getUserName(row.requested_by),
    },

    {
      header: "Expected Checkin",
      accessor:
        "expected_checkin_date",
    },

    {
      header: "Notes",
      accessor: "notes",
    },

    {
      header: "Status",
      render: (row) => {
        let color =
          "bg-yellow-100 text-yellow-700";

        if (row.status === "Approved") {
          color =
            "bg-green-100 text-green-700";
        }

        if (row.status === "Rejected") {
          color =
            "bg-red-100 text-red-700";
        }

        return (
          <span
            className={`px-2 py-1 rounded text-xs ${color}`}
          >
            {row.status}
          </span>
        );
      },
    },
  ];

  // ================= ADMIN ACTION COLUMN =================
  if (isAdmin) {
    columns.push({
      header: "Actions",
      render: (row) => (
        <div className="flex gap-1">
          {/* PENDING */}
          {row.status === "Pending" && (
            <>
              <IconBtn
                label="Approve"
                color="text-green-600"
                icon={FiCheck}
                onClick={() =>
                  updateStatus(row.id, "Approved")
                }
              />

              <IconBtn
                label="Reject"
                color="text-red-600"
                icon={FiX}
                onClick={() =>
                  updateStatus(row.id, "Rejected")
                }
              />

              <IconBtn
                label="Delete"
                color="text-gray-600"
                icon={FiTrash2}
                onClick={() => deleteRequest(row.id)}
              />
            </>
          )}

          {/* APPROVED */}
          {row.status === "Approved" && (
            <IconBtn
              label="Checkout"
              color="text-purple-600"
              icon={FiLogOut}
              onClick={() => checkoutRequest(row.id)}
            />
          )}
        </div>
      ),
    });
  }

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-semibold mb-4">
        Requested Items
      </h1>

      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={data}
        />
      </div>
    </div>
  );
}