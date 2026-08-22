import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { API } from "../../../config/api";

export default function LicenseCheckinCheckoutForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = useParams();

  const license = location.state?.data || {};
  const isCheckin = type === "checkin";

  // console.log("🔵 LICENSE FROM NAVIGATION:", license);
  // console.log("🔵 LOCATION STATE:", location.state);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    licensed_to: "",
    note: "",
  });

  const token = sessionStorage.getItem("access_token");
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const selectedUser =
    users.find((user) => String(user.id) === String(formData.user_id)) || null;

  // console.log("🟡 FORM USER_ID:", formData.user_id);
  // console.log("🟡 USERS IDs:", users.map((u) => u.id));
  // console.log("🟡 SELECTED USER:", selectedUser);

  const getUserName = (user) => {
    const possibleName =
      user?.full_name ||
      user?.display_name ||
      user?.first_name ||
      user?.last_name ||
      user?.name;

    if (possibleName && !possibleName.includes("@")) {
      return possibleName;
    }

    return "";
  };

  const getUserEmail = (user) =>
    user?.email ||
    user?.email_address ||
    user?.username ||
    user?.name ||
    "-";

  useEffect(() => {
    if (!isCheckin) fetchUsers();
  }, [isCheckin]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API.GET_USERS, { headers });

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.results || [];

      // console.log("🟢 USERS API RAW:", res.data);
      // console.log("🟢 USERS NORMALIZED:", data);

      setUsers(data);
    } catch (error) {
      console.error("❌ Failed to fetch users:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === "user_id") {
        const user = users.find((u) => String(u.id) === String(value));
        if (user) {
          updated.licensed_to = getUserName(user) || "";
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isCheckin) {
        // console.log("🟢 Processing license check-in for:", license.id);

        await axios.put(
          API.LICENSE_CHECKIN(license.id),
          {
            user_id: null,
            checkin_note: formData.note || "",
          },
          { headers }
        );

        toast.success("License checked in successfully.");
      } else {
        if (!formData.user_id) {
          toast.error("Please select a user.");
          return;
        }

        // console.log("🟣 CHECKOUT PAYLOAD:", {
        //   license_id: Number(license.id),
        //   user_id: Number(formData.user_id),
        //   licensed_to: formData.licensed_to,
        //   licensed_to_email: getUserEmail(selectedUser),
        //   checkout_note: formData.note || "",
        // });

        await axios.put(
          API.LICENSE_CHECKOUT(license.id),
          {
            license_id: Number(license.id),
            user_id: Number(formData.user_id),
            licensed_to: formData.licensed_to,
            licensed_to_email: getUserEmail(selectedUser),
            checkout_note: formData.note || "",
          },
          { headers }
        );

        toast.success("License checked out successfully.");
      }

      navigate("/licenses");
    } catch (error) {
      console.error(" License action failed:", error.response?.data || error);

      const detail = error.response?.data?.detail;
      let msg = `Failed to ${type} license`;

      if (typeof detail === "string") msg = detail;
      else if (Array.isArray(detail))
        msg = detail.map((d) => d.msg).join(", ");

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/60 dark:border-zinc-800 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-200 dark:border-zinc-800 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <h1 className="text-3xl font-bold">
              License {isCheckin ? "Check In" : "Check Out"}
            </h1>
            <p className="mt-2 text-blue-100">
              {isCheckin
                ? "Return this license to the available pool"
                : "Assign this license to a user"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Software Name
                </label>
                <input
                  type="text"
                  value={license.Software_name || ""}
                  disabled
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 px-4 py-3 text-slate-700 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Product Key
                </label>
                <input
                  type="text"
                  value={license.product_key || ""}
                  disabled
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 px-4 py-3 text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            {!isCheckin && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Select User
                  </label>
                  <select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select User</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {getUserEmail(u)} {getUserName(u) ? `(${getUserName(u)})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Licensed To Name
                  </label>
                  <input
                    type="text"
                    name="licensed_to"
                    value={formData.licensed_to}
                    onChange={handleChange}
                    placeholder="Enter licensed user name"
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {selectedUser && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Selected User Name
                      </label>
                      <input
                        value={getUserName(selectedUser) || "Not available"}
                        disabled
                        className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Selected User Email
                      </label>
                      <input
                        value={getUserEmail(selectedUser)}
                        disabled
                        className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 px-4 py-3"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {isCheckin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Currently Assigned To
                  </label>
                  <input
                    value={license.licensed_to || "-"}
                    disabled
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    value={license.licensed_to_email || "-"}
                    disabled
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 px-4 py-3"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {isCheckin ? "Check-In Note" : "Checkout Note"}
              </label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={5}
                placeholder="Add any notes or comments..."
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => navigate("/licenses")}
                className="px-6 py-3 rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading
                  ? "Processing..."
                  : isCheckin
                  ? "Check In License"
                  : "Check Out License"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
