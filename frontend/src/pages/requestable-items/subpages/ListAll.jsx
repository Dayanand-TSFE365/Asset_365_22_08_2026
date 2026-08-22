import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import DataTable from "../components/common/DataTable";
import { API } from "../../../config/api";

export default function ListAll() {
  const [data, setData] = useState([]);

  // master data
  const [models, setModels] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
//   console.log(
//   JSON.parse(
//     sessionStorage.getItem("user")
//   )
// );

  const [showRequestModal, setShowRequestModal] =
  useState(false);

const [selectedAsset, setSelectedAsset] =
  useState(null);

const [requestForm, setRequestForm] =
  useState({
    expected_checkin_date: "",
    notes: "",
  });

  // fetch master data
  useEffect(() => {
    const token = sessionStorage.getItem("access_token");

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    axios.get(API.GET_COMPANIES, { headers })
      .then((r) => setCompanies(r.data));

    axios.get(API.GET_SUPPLIERS, { headers })
      .then((r) => setSuppliers(r.data));

    axios.get(API.GET_MODELS, { headers })
      .then((r) => setModels(r.data));

    axios.get(API.GET_STATUS, { headers })
      .then((r) => setStatuses(r.data));

    axios.get(API.GET_LOCATIONS, { headers })
      .then((r) => setLocations(r.data));

    axios.get(API.GET_USERS, { headers })
      .then((r) => setUsers(r.data));
  }, []);

  const findName = (list, id) =>
    list.find((i) => i.id === id)?.name || "-";

  // fetch requestable assets
  useEffect(() => {
  const fetchAssets = async () => {
    try {
      const token = sessionStorage.getItem("access_token");

      const res = await axios.get(
        API.GET_REQUESTABLE_ASSETS,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const formatted = res.data.map((item) => ({
        id: item.asset_id,
        tag: item.asset_tag,
        name: item.asset_name,

        image: item.image_url
          ? item.image_url.startsWith("http")
            ? item.image_url
            : `${import.meta.env.VITE_AUTH_BASE}/${item.image_url.replace(/^\/+/, "")}`
          : "https://via.placeholder.com/40",

        serial: item.serial_number,

        model: findName(models, item.model_id),
        company: findName(companies, item.company_id),
        supplier: findName(suppliers, item.supplier_id),
        status: findName(statuses, item.status_id),
        location: findName(locations, item.location_id),

        user: findName(users, item.checked_out_to),

        requestable: item.requestable,
        order_number: item.order_number,
  condition: item.condition,
  purchase_date: item.purchase_date,
  warranty_expires: item.warranty_expires,
  eol_date: item.eol_date,
  purchase_cost: item.purchase_cost,
  current_value: item.current_value,
  byod: item.byod,
  next_audit_date: item.next_audit_date,
  created_at: item.created_at,
  updated_at: item.updated_at,

      }));

      setData(formatted); // ✅ NO FILTER
    } catch (err) {
      console.error(err);
    }
  };

  fetchAssets();
}, [
  models,
  statuses,
  locations,
  users,
  companies,
  suppliers,
]);

  // request button
  const handleRequest = async () => {
    try {
        const token = sessionStorage.getItem("access_token");

        const sessionUser = JSON.parse(
        sessionStorage.getItem("user")
        );

        // STEP 1: find user from master list using email
        const loggedUser = users.find(
        (u) => u.name === sessionUser.email
        );

        if (!loggedUser) {
        toast.error("User not found in system");
        return;
        }

        const payload = {
        asset_id: Number(selectedAsset.id),
        requested_by: loggedUser.id,   // ✅ REAL ID FROM MASTER API
        expected_checkin_date: requestForm.expected_checkin_date,
        notes: requestForm.notes,
        };

        // console.log("PAYLOAD =>", payload);

        await axios.post(
        API.CREATE_ASSET_REQUEST,
        payload,
        {
            headers: {
            Authorization: `Bearer ${token}`,
            },
        }
        );

        toast.success("Asset requested successfully");
        setShowRequestModal(false);

    } catch (err) {
        console.error("ERROR =>", err.response?.data);

        toast.error(
        err.response?.data?.detail?.[0]?.msg ||
        "Failed to request asset"
        );
    }
  };

  const columns = [
    {
      header: "Asset Name",
      accessor: "name",
    },

    {
      header: "Asset Tag",
      accessor: "tag",
    },

    {
      header: "Image",
      render: (row) => (
        <img
          src={row.image}
          alt=""
          className="w-10 h-10 rounded"
        />
      ),
    },

    {
      header: "Serial",
      accessor: "serial",
    },

    {
      header: "Model",
      accessor: "model",
    },

    {
      header: "Company",
      accessor: "company",
    },

    {
      header: "Status",
      accessor: "status",
    },

    {
      header: "Location",
      accessor: "location",
    },
    {
      header: "Order No",
      accessor: "order_number",
    },
    {
      header: "Condition",
      accessor: "condition",
    },
    {
      header: "Purchase Date",
      accessor: "purchase_date",
    },
    {
      header: "Cost",
      render: (row) => `₹${row.purchase_cost || 0}`,
    },
    {
      header: "Warranty Expires",
      accessor: "warranty_expires",
    },
    {
      header: "BYOD",
      render: (row) => (row.byod ? "✔️" : "❌"),
    },

    {
      header: "Request",
      render: (row) => (
        <button
            onClick={() => {
            setSelectedAsset(row);

            setRequestForm({
                expected_checkin_date:
                new Date()
                    .toISOString()
                    .split("T")[0],

                notes: "",
            });

            setShowRequestModal(true);
            }}
          className="px-3 py-2 -my-1 text-xs bg-indigo-600 text-white rounded"
        >
          Request
        </button>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-semibold mb-2">
        Requestable Items
      </h1>

      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={data}
          createLabel="Request"
        />
      </div>
      {showRequestModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl w-[450px] shadow-xl">

      <h2 className="text-xl font-semibold mb-4">
        Request Asset
      </h2>

      <div className="space-y-4">

        {/* Asset */}
        <div>
          <label className="block text-sm mb-1">
            Asset
          </label>

          <input
            type="text"
            value={selectedAsset?.name || ""}
            disabled
            className="w-full border rounded px-3 py-2 bg-zinc-100 dark:bg-zinc-800"
          />
        </div>

        {/* Requested By */}
        <div>
          <label className="block text-sm mb-1">
            Requested By
          </label>

          <input
            type="text"
            value={
            JSON.parse(
                sessionStorage.getItem("user")
            )?.email || ""
            }
            disabled
            className="w-full border rounded px-3 py-2 bg-zinc-100 dark:bg-zinc-800"
          />
        </div>

        {/* Expected Checkin */}
        <div>
          <label className="block text-sm mb-1">
            Expected Checkin Date
          </label>

          <input
            type="date"
            value={
              requestForm.expected_checkin_date
            }
            onChange={(e) =>
              setRequestForm({
                ...requestForm,
                expected_checkin_date:
                  e.target.value,
              })
            }
            className="w-full border rounded px-3 py-2 dark:bg-zinc-800"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm mb-1">
            Notes
          </label>

          <textarea
            rows={4}
            value={requestForm.notes}
            onChange={(e) =>
              setRequestForm({
                ...requestForm,
                notes: e.target.value,
              })
            }
            className="w-full border rounded px-3 py-2 dark:bg-zinc-800"
            placeholder="Enter notes..."
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-2">

          <button
            onClick={() =>
              setShowRequestModal(false)
            }
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleRequest}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Submit Request
          </button>

        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}