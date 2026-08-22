import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { API } from "../../../config/api";

export default function KitCreateForm() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
  });

  const token = sessionStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Kit name is required");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        API.CREATE_KIT,
        {
          name: formData.name,
        },
        { headers }
      );

      toast.success("Kit created successfully!");

      navigate("/kits");
    } catch (error) {
      console.error(
        "Create Kit Error:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to create kit."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center p-4 md:p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border dark:border-zinc-800">
        
        {/* Header */}
        <div className="border-b dark:border-zinc-800 px-6 py-4">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">
            Create Kit
          </h1>

          <p className="text-sm text-zinc-500 mt-1">
            Create a new kit for grouped asset management.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
        >
          {/* Kit Name */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Kit Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter kit name"
              className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/kits")}
              className="px-5 py-2.5 rounded-xl border dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Kit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}