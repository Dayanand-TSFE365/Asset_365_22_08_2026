// KitCheckinCheckoutForm.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API } from "../../../config/api";

export default function KitCheckinCheckoutForm({ data = {} }) {
  const navigate = useNavigate();

  console.log("KIT DATA:", data);

  const kitId = data?.id || data?._id;

  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("checkout");

  const [formData, setFormData] = useState({
    user_id: "",
    checkout_date: new Date().toISOString().split("T")[0],
    expected_checkin_date: "",
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
    fetchTransactions();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API.GET_USERS, {
        headers,
      });

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
      const res = await axios.get(
        API.GET_ACTIVE_KIT_TRANSACTIONS,
        { headers }
      );

      const raw = Array.isArray(res.data)
        ? res.data
        : [];

      setTransactions(raw);
    } catch (error) {
      console.error(
        "Failed to fetch transactions:",
        error
      );
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

  const handleCheckout = async () => {
    if (!kitId) {
      toast.error("Kit ID missing.");
      return;
    }

    if (!formData.user_id) {
      toast.error("Please select user.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        user_id: Number(formData.user_id),

        checkout_date: formData.checkout_date
          ? new Date(
              formData.checkout_date
            ).toISOString()
          : null,

        expected_checkin_date:
          formData.expected_checkin_date
            ? new Date(
                formData.expected_checkin_date
              ).toISOString()
            : null,

        notes: formData.notes || "",
      };

      const res = await axios.post(
        API.CHECKOUT_KIT(kitId),
        payload,
        { headers }
      );

      toast.success(
        res?.data?.message ||
        res?.data?.detail ||
        "Kit checked out successfully!"
      );

      navigate("/kits");
    } catch (error) {
  console.error(error);

  const message =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    "Failed to checkout kit.";

  toast.error(message);
} finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (
    transactionId
  ) => {
    try {
      setLoading(true);

      const res = await axios.post(
        API.CHECKIN_KIT(transactionId),
        {},
        { headers }
      );

      toast.success(
        res?.data?.message ||
        res?.data?.detail ||
        "Kit checked in successfully!"
      );

      await fetchTransactions();

      setMode("checkout");
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.detail ||
          "Failed to checkin kit."
      );
    } finally {
      setLoading(false);
    }
  };

  const activeTransaction = transactions.find(
  (txn) =>
    txn.kit_name === data?.name
);

  return (
    <div className="h-full overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
              Kit Check In / Check Out
            </h1>

            <p className="text-zinc-500 mt-1">
              {data?.name || "-"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            
            <div className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
                  Kit Details
                </h2>

                <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <p>
                    <strong>Kit:</strong>{" "}
                    {data?.name || "-"}
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    {activeTransaction
                      ? "Checked Out"
                      : "Available"}
                  </p>

                  {activeTransaction && (
                    <>
                      <p>
                        <strong>User ID:</strong>{" "}
                        {
                          activeTransaction.user_id
                        }
                      </p>

                      <p>
                        <strong>Checkout Date:</strong>{" "}
                        {new Date(
                          activeTransaction.checkout_date
                        ).toLocaleDateString(
                          "en-IN"
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() =>
                    setMode("checkout")
                  }
                  className={`flex-1 py-3 font-medium transition ${
                    mode === "checkout"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  Checkout
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMode("checkin")
                  }
                  className={`flex-1 py-3 font-medium transition ${
                    mode === "checkin"
                      ? "bg-orange-600 text-white"
                      : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  Checkin
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              {mode === "checkout" ? (
                <div className="space-y-5">
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                      User *
                    </label>

                    <select
                      name="user_id"
                      value={formData.user_id}
                      onChange={handleChange}
                      className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-3 bg-white dark:bg-zinc-900"
                    >
                      <option value="">
                        Select User
                      </option>

                      {users.map((user) => (
                        <option
                          key={user.id}
                          value={user.id}
                        >
                          {user.name ||
                            user.full_name ||
                            user.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                      Checkout Date
                    </label>

                    <input
                      type="date"
                      name="checkout_date"
                      value={
                        formData.checkout_date
                      }
                      onChange={handleChange}
                      className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-3 bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                      Expected Checkin Date
                    </label>

                    <input
                      type="date"
                      name="expected_checkin_date"
                      value={
                        formData.expected_checkin_date
                      }
                      onChange={handleChange}
                      className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-3 bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                      Notes
                    </label>

                    <textarea
                      rows="4"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Enter notes"
                      className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-3 bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCheckout}
                      disabled={loading}
                      className="px-6 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading
                        ? "Processing..."
                        : "Checkout Kit"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate("/kits")
                      }
                      className="px-6 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {!activeTransaction ? (
                    <div className="text-zinc-500">
                      No active checkout found.
                    </div>
                  ) : (
                    <>
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>
                              Transaction ID:
                            </strong>{" "}
                            {
                              activeTransaction.transaction_id
                            }
                          </p>

                          <p>
                            <strong>Kit:</strong>{" "}
                            {
                              activeTransaction.kit_name
                            }
                          </p>

                          <p>
                            <strong>User ID:</strong>{" "}
                            {
                              activeTransaction.user_id
                            }
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleCheckin(
                            activeTransaction.transaction_id
                          )
                        }
                        disabled={loading}
                        className="px-6 py-3 rounded-lg text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                      >
                        {loading
                          ? "Processing..."
                          : "Checkin Kit"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}