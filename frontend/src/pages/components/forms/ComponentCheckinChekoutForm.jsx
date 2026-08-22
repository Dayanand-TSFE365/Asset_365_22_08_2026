import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API } from "../../../config/api";

export default function ComponentCheckinCheckoutForm({ data = {} }) {
  const navigate = useNavigate();

  const componentId = data?.id;

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
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // ✅ FIXED QUANTITY LOGIC
  const availableQty = Number(data?.remaining_qty ?? 0);
  const checkedOutQty =
    Number(data?.total_qty ?? 0) - availableQty;

  const maxQty =
    mode === "checkout" ? availableQty : checkedOutQty;

  useEffect(() => {
    fetchUsers();
    if (componentId) {
      fetchTransactions();
    }
  }, [componentId]);

  // ---------------- USERS ----------------
  const fetchUsers = async () => {
    try {
      const res = await axios.get(API.GET_USERS, { headers });

      const userData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      setUsers(userData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  // ---------------- TRANSACTIONS ----------------
  const fetchTransactions = async () => {
    try {
      const res = await axios.get(
        API.GET_COMPONENT_TRANSACTIONS(componentId),
        { headers }
      );

      const txns =
        res.data?.transactions ||
        res.data?.data ||
        res.data ||
        [];

      setTransactions(Array.isArray(txns) ? txns : []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setTransactions([]);
    }
  };

  // ---------------- FORM CHANGE ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!componentId) {
      toast.error("Component ID missing");
      return;
    }

    if (!formData.user_id) {
      toast.error("Select user");
      return;
    }

    const qty = Number(formData.quantity);

    if (qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    // ✅ VALIDATION
    if (mode === "checkout" && qty > availableQty) {
      toast.error(`Only ${availableQty} available`);
      return;
    }

    if (mode === "checkin" && qty > checkedOutQty) {
      toast.error(`Only ${checkedOutQty} checked out`);
      return;
    }

    const payload = {
      user_id: Number(formData.user_id),
      quantity: qty,
      notes: formData.notes || "",
    };

    try {
      setLoading(true);

      const endpoint =
        mode === "checkout"
          ? API.CHECKOUT_COMPONENT(componentId)
          : API.CHECKIN_COMPONENT(componentId);

      await axios.post(endpoint, payload, { headers });

      toast.success(
        `Component ${
          mode === "checkout" ? "checked out" : "checked in"
        } successfully!`
      );

      setFormData({
        user_id: "",
        quantity: "1",
        notes: "",
      });

      fetchTransactions();
      navigate("/components");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950">

    {/* SCROLLABLE AREA */}
    <div className="flex-1 overflow-y-auto px-4">
      <div className="max-w-5xl mx-auto py-6">

        {/* CARD */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">

          {/* HEADER */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
              Component Check In / Check Out
            </h1>
            <p className="text-zinc-500 mt-1">
              {data?.name || "Component"}
            </p>
          </div>

          {/* BODY */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT SIDE */}
            <div className="space-y-5">

              {/* MODE SWITCH */}
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

              {/* FORM */}
              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="block text-sm mb-1 font-medium text-zinc-700 dark:text-zinc-300">
                    User *
                  </label>
                  <select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900"
                  >
                    <option value="">Select User</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium text-zinc-700 dark:text-zinc-300">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    min="1"
                    max={Math.max(maxQty, 1)}
                    onChange={handleChange}
                    className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Max allowed: {maxQty}
                  </p>
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium text-zinc-700 dark:text-zinc-300">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900"
                    placeholder="Enter notes"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    disabled={loading || maxQty === 0}
                    className={`px-5 py-2 rounded-lg text-white font-medium ${
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
                    onClick={() => navigate("/components")}
                    className="px-5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>

            {/* RIGHT SIDE - TRANSACTIONS */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
                Transactions
              </h2>

              {transactions.length === 0 ? (
                <p className="text-zinc-500">No transactions found</p>
              ) : (
                <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-xl">

                  <table className="min-w-full text-sm">

                    <thead className="bg-zinc-100 dark:bg-zinc-800 text-left">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">Notes</th>
                      </tr>
                    </thead>

                    <tbody>
                      {transactions.map((t, i) => (
                        <tr
                          key={i}
                          className="border-t border-zinc-200 dark:border-zinc-700"
                        >
                          <td className="px-4 py-3">
                            {t.created_at
                              ? new Date(t.created_at + "Z").toLocaleString(
                                  "en-IN",
                                  {
                                    timeZone: "Asia/Kolkata",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: false,
                                  }
                                )
                              : "-"}
                          </td>

                          <td className="px-4 py-3">
                            {users.find(
                              (u) => Number(u.id) === Number(t.user_id)
                            )?.name || `User #${t.user_id}`}
                          </td>

                          <td className="px-4 py-3 capitalize">
                            {t.type || "-"}
                          </td>

                          <td className="px-4 py-3">
                            {t.quantity}
                          </td>

                          <td className="px-4 py-3">
                            {t.notes || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
);
}