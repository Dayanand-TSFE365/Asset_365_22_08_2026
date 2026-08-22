import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API } from "../../../config/api";

export default function ConsumableConsumeAddForm({ data = {} }) {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("consume");

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
    if (data?.id) fetchTransactions();
  }, [data]);

  // ✅ USERS
  const fetchUsers = async () => {
    try {
      const res = await axios.get(API.GET_USERS, { headers });

      const userData = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setUsers(userData);
    } catch (err) {
      console.error("Users fetch failed:", err);
      setUsers([]);
    }
  };

  // ✅ TRANSACTIONS (FIXED LIKE ACCESSORY)
  const fetchTransactions = async () => {
    try {
      const res = await axios.get(
        API.CONSUMABLE_TRANSACTIONS(data.id),
        { headers }
      );

      let txn = [];

      if (Array.isArray(res.data)) txn = res.data;
      else if (Array.isArray(res.data?.data)) txn = res.data.data;
      else if (Array.isArray(res.data?.items)) txn = res.data.items;
      else if (Array.isArray(res.data?.transactions))
        txn = res.data.transactions;

      console.log("Consumable TXN:", txn);

      setTransactions(txn);
    } catch (err) {
      console.error("Transaction fetch failed:", err);
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

    if (mode === "consume" && !formData.user_id) {
      toast.error("Select user");
      return;
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      toast.error("Invalid quantity");
      return;
    }

    try {
      setLoading(true);

      if (mode === "consume") {
        await axios.post(
          API.CONSUMABLE_CONSUME,
          {
            consumable_id: Number(data.id),
            user_id: Number(formData.user_id),
            quantity: Number(formData.quantity),
            notes: formData.notes,
          },
          { headers }
        );
      } else {
        await axios.post(
          API.CONSUMABLE_ADD_STOCK,
          {
            consumable_id: Number(data.id),
            quantity: Number(formData.quantity),
            notes: formData.notes,
          },
          { headers }
        );
      }

      toast.success(mode === "consume" ? "Consumed!" : "Stock added!");

      setFormData({ user_id: "", quantity: "1", notes: "" });

      await fetchTransactions();
      navigate("/consumables");
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(err.response?.data?.detail || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const remainingQty = Number(data?.remaining_qty ?? 0);
  const totalQty = Number(data?.quantity ?? 0);

  const maxAllowed =
    mode === "consume"
      ? Math.max(remainingQty, 1)
      : 999999;

  const getDate = (txn) =>
    txn.last_activity ||
    txn.created_at ||
    txn.transaction_date ||
    txn.date;

  return (
    <div className="h-full overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow border p-6">

        <h1 className="text-xl font-bold mb-4">
          Manage Consumable - {data?.name}
        </h1>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="space-y-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded">
              <p><strong>Total:</strong> {totalQty}</p>
              <p><strong>Remaining:</strong> {remainingQty}</p>
            </div>

            <div className="flex rounded overflow-hidden border">
              <button
                onClick={() => setMode("consume")}
                className={`flex-1 py-2 ${
                  mode === "consume"
                    ? "bg-red-600 text-white"
                    : ""
                }`}
              >
                Consume
              </button>

              <button
                onClick={() => setMode("add")}
                className={`flex-1 py-2 ${
                  mode === "add"
                    ? "bg-green-600 text-white"
                    : ""
                }`}
              >
                Add Stock
              </button>
            </div>
          </div>

          {/* FORM */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4">

              {mode === "consume" && (
                <div>
                    <label className="block text-sm font-medium mb-2">
                    Select User *
                    </label>
                    <select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    className="input w-full"
                    required
                    >
                    <option value="">Select User</option>
                    {users.map((u) => (
                        <option key={u.id} value={u.id}>
                        {u.name || u.email}
                        </option>
                    ))}
                    </select>
                </div>
               )}

              <div>
                <label className="block text-sm font-medium mb-2">
                    Quantity *
                </label>
                <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    max={maxAllowed}
                    className="input w-full"
                />
                <p className="text-xs text-zinc-500 mt-1">
                    Maximum allowed: {maxAllowed}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                    Notes
                </label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Enter notes..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-white rounded ${
                  mode === "consume"
                    ? "bg-red-600"
                    : "bg-green-600"
                }`}
              >
                {loading
                  ? "Processing..."
                  : mode === "consume"
                  ? "Consume"
                  : "Add Stock"}
              </button>
            </form>
          </div>
        </div>

        {/* ✅ TRANSACTION TABLE (FIXED) */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">
            Transaction History
          </h2>

          {transactions.length === 0 ? (
            <p className="text-zinc-500">No transactions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-zinc-100 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2 text-left">Qty</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                  </tr>
                </thead>

                <tbody>
                    {transactions.map((txn, i) => {
                        const user = users.find(
                        (u) => Number(u.id) === Number(txn.user_id)
                        );

                        return (
                        <tr key={i} className="border-t">

                            {/* DATE */}
                            <td className="px-4 py-2">
                            {getDate(txn)
                                ? new Date(getDate(txn) + "Z").toLocaleString("en-GB", {
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

                            {/* TYPE */}
                            <td className="px-4 py-2 capitalize">
                            {txn.type ||
                            txn.transaction_type ||
                            txn.action ||
                            txn.mode ||
                            (txn.user_id ? "consume" : "add")}
                            </td>

                            {/* USER */}
                            <td className="px-4 py-2">
                            {txn.user_id
                                ? user?.name || user?.email || `User #${txn.user_id}`
                                : "Admin"}
                            </td>

                            {/* QTY */}
                            <td className="px-4 py-2">
                            {txn.quantity ?? txn.qty ?? 0}
                            </td>

                            {/* NOTES */}
                            <td className="px-4 py-2">
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
  );
}