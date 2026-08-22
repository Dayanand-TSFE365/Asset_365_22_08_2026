// AccessoryCheckinCheckoutForm.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API } from "../../../config/api";

export default function AccessoryCheckinCheckoutForm({ data = {} }) {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("checkout");

  const [formData, setFormData] = useState({
    user_id: "",
    quantity: "1",
    notes: "",
  });

  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    fetchUsers();
    if (data?.id || data?.accessory_id) {
      fetchTransactions();
    }
  }, [data]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API.GET_USERS, { headers });
      const userData = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setUsers(userData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    }
  };

  const fetchTransactions = async () => {
    try {
      const accessoryId = data?.id || data?.accessory_id;
      if (!accessoryId) return;

      const res = await axios.get(
        API.ACCESSORY_TRANSACTIONS(accessoryId),
        { headers }
      );

      let transactionData = [];

      if (Array.isArray(res.data)) {
        transactionData = res.data;
      } else if (Array.isArray(res.data?.data)) {
        transactionData = res.data.data;
      } else if (Array.isArray(res.data?.items)) {
        transactionData = res.data.items;
      } else if (Array.isArray(res.data?.transactions)) {
        transactionData = res.data.transactions;
      }

      console.log("Transactions API Response:", transactionData);
      console.log("Transaction Data:", transactionData);
      setTransactions(transactionData);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setTransactions([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.user_id) {
      toast.error("Please select a user.");
      return;
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      toast.error("Quantity must be greater than 0.");
      return;
    }

    const accessoryId = data?.id || data?.accessory_id;

    if (!accessoryId) {
      toast.error("Accessory ID is missing.");
      return;
    }

    const maxAllowed =
  mode === "checkout"
    ? Number(data?.available_qty ?? 0)
    : Number(data?.checked_out_qty ?? 0);

    if (Number(formData.quantity) > maxAllowed) {
      toast.error(`Maximum allowed quantity is ${maxAllowed}.`);
      return;
    }

    const payload = {
      accessory_id: Number(accessoryId),
      user_id: Number(formData.user_id),
      quantity: Number(formData.quantity),
      notes: formData.notes?.trim() || "",
    };

    try {
      setLoading(true);

      const endpoint =
        mode === "checkout"
          ? API.ACCESSORY_CHECKOUT
          : API.ACCESSORY_CHECKIN;

      const response = await axios.post(endpoint, payload, { headers });

      toast.success(
        response?.data?.message ||
          response?.data ||
          `Accessory ${
            mode === "checkout" ? "checked out" : "checked in"
          } successfully!`
      );

      setFormData({
        user_id: "",
        quantity: "1",
        notes: "",
      });

      await fetchTransactions();
      navigate("/accessories");
    } catch (error) {
      console.error(`Failed to ${mode}:`, error);
      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          `Failed to ${mode} accessory.`
      );
    } finally {
      setLoading(false);
    }
  };

  const availableQty = Number(data?.available_qty ?? 0);
  const checkedOutQty = Number(data?.checked_out_qty ?? 0);
  const totalQty = Number(data?.total_qty ?? 0);

  const quantityMax =
  mode === "checkout"
    ? Math.max(availableQty, 1)
    : Math.max(checkedOutQty, 1);

  const getTransactionDate = (txn) =>
    txn.created_at ||
    txn.transaction_date ||
    txn.date ||
    txn.checkout_date ||
    txn.checkin_date;

  const getTransactionType = (txn) =>
    txn.type || txn.transaction_type || txn.action || txn.status;

  const getTransactionUser = (txn) =>
    txn.user_name ||
    txn.user?.name ||
    txn.username ||
    txn.user?.full_name ||
    txn.user ||
    "-";

  const getTransactionNotes = (txn) =>
    txn.notes || txn.note || txn.remarks || txn.description || "-";

  return (
    <div className="h-full overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
              Accessory Check In / Check Out
            </h1>
            <p className="text-zinc-500 mt-1">{data?.name || "Accessory"}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
                  Accessory Details
                </h2>

                <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <p><strong>Name:</strong> {data?.name || "-"}</p>
                  <p><strong>Model No:</strong> {data?.model_no || "-"}</p>
                  <p><strong>Item No:</strong> {data?.item_no || "-"}</p>
                  <p><strong>Total:</strong> {totalQty}</p>
                  <p><strong>Available:</strong> {availableQty}</p>
                  <p><strong>Checked Out:</strong> {checkedOutQty}</p>
                </div>
              </div>

              <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setMode("checkout")}
                  className={`flex-1 py-3 font-medium transition ${
                    mode === "checkout"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  Check Out
                </button>
                <button
                  type="button"
                  onClick={() => setMode("checkin")}
                  className={`flex-1 py-3 font-medium transition ${
                    mode === "checkin"
                      ? "bg-orange-600 text-white"
                      : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  Check In
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                    User *
                  </label>
                  <select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-3 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.full_name || user.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    max={quantityMax}
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-3 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Maximum allowed: {quantityMax}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows="4"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-3 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter notes (optional)"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg text-white font-medium transition disabled:opacity-50 ${
                      mode === "checkout"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-orange-600 hover:bg-orange-700"
                    }`}
                  >
                    {loading
                      ? "Processing..."
                      : mode === "checkout"
                      ? "Check Out"
                      : "Check In"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/accessories")}
                    className="px-6 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
              Transaction History
            </h2>

            {transactions.length === 0 ? (
              <p className="text-zinc-500">No transactions found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
                  <thead className="bg-zinc-100 dark:bg-zinc-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">User</th>
                      <th className="px-4 py-3 text-left">Quantity</th>
                      <th className="px-4 py-3 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn, index) => {
                        const user = users.find(
                        (u) => Number(u.id) === Number(txn.user_id)
                        );

                        return (
                        <tr
                            key={txn.id || index}
                            className="border-t border-zinc-200 dark:border-zinc-700"
                        >
                            <td className="px-4 py-3">
                                {txn.last_activity
                                    ? new Date(txn.last_activity + "Z").toLocaleString("en-GB", {
                                        timeZone: "Asia/Kolkata",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                        hour12: false,
                                    })
                                    : "-"}
                            </td>
                            <td className="px-4 py-3 capitalize">
                            {txn.type || mode || "-"}
                            </td>

                            <td className="px-4 py-3">
                            {user?.name || `User #${txn.user_id}`}
                            </td>

                            <td className="px-4 py-3">
                            {txn.quantity ?? 0}
                            </td>

                            <td className="px-4 py-3">
                            {txn.notes || "-"}
                            </td>
                        </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}