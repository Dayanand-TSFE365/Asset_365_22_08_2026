// ConsumableCloneForm.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { API } from "../../../config/api";

const safeArray = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.items)) return d.items;
  return [];
};

export default function ConsumableCloneForm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const consumable = state?.data || {};

  const [companies, setCompanies] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const [form, setForm] = useState({
    name: consumable.name || "",
    company_id: consumable.company_id || "",
    category_id: consumable.category_id || "",
    supplier_id: consumable.supplier_id || "",
    manufacturer_id: consumable.manufacturer_id || "",
    location_id: consumable.location_id || "",
    model_no: consumable.model_no || "",
    item_no: consumable.item_no || "",
    order_number: consumable.order_number || "",
    purchase_date: consumable.purchase_date || "",
    unit_cost: consumable.unit_cost?.toString().replace("₹", "") || "",
    quantity: consumable.total_qty ?? consumable.quantity ?? "",
    min_qty: consumable.min_qty || "",
    notes: consumable.notes || "",
  });

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get(API.GET_COMPANIES, { headers }),
      axios.get(API.GET_MANUFACTURERS, { headers }),
      axios.get(API.GET_CATEGORIES, { headers }),
      axios.get(API.GET_SUPPLIERS, { headers }),
      axios.get(API.GET_LOCATIONS, { headers }),
    ])
      .then(([companiesRes, manufacturersRes, categoriesRes, suppliersRes, locationsRes]) => {
        setCompanies(safeArray(companiesRes));
        setManufacturers(safeArray(manufacturersRes));
        setCategories(safeArray(categoriesRes));
        setSuppliers(safeArray(suppliersRes));
        setLocations(safeArray(locationsRes));
      })
      .catch((err) => console.error("Failed to load master data:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = sessionStorage.getItem("access_token");
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          if (["quantity", "unit_cost", "min_qty"].includes(key)) {
            formData.append(key, Number(value));
          } else {
            formData.append(key, value);
          }
        }
      });

      if (file) {
        formData.append("file", file);
      }

      await axios.post(API.CREATE_CONSUMABLE, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Consumable cloned successfully!");
      navigate("/consumables");
    } catch (err) {
      console.error("Clone consumable failed:", err.response?.data || err);
      toast.error(
        JSON.stringify(
          err?.response?.data?.detail ||
            err?.response?.data ||
            "Failed to clone consumable",
          null,
          2
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const labelClass =
    "block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5";

  const cancelBtn =
    "border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800";

  return (
    <div className="h-full overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
            Clone Consumable
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {consumable.name || "Consumable"} • Create duplicate with new details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Consumable Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Company</label>
              <select
                name="company_id"
                value={form.company_id}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select name="category_id" value={form.category_id} onChange={handleChange} className={inputClass}>
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Manufacturer</label>
              <select name="manufacturer_id" value={form.manufacturer_id} onChange={handleChange} className={inputClass}>
                <option value="">Select Manufacturer</option>
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Supplier</label>
              <select name="supplier_id" value={form.supplier_id} onChange={handleChange} className={inputClass}>
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Location</label>
              <select name="location_id" value={form.location_id} onChange={handleChange} className={inputClass}>
                <option value="">Select Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Model No</label>
              <input name="model_no" value={form.model_no} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Item No</label>
              <input name="item_no" value={form.item_no} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Order Number</label>
              <input name="order_number" value={form.order_number} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Total Quantity</label>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange} className={inputClass} required />
            </div>

            <div>
              <label className={labelClass}>Minimum Quantity</label>
              <input type="number" name="min_qty" value={form.min_qty} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Unit Cost</label>
              <input type="number" step="0.01" name="unit_cost" value={form.unit_cost} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Purchase Date</label>
              <input type="date" name="purchase_date" value={form.purchase_date} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Upload Image / File</label>
            <input
              type="file"
              onChange={handleFileChange}
              className={`${inputClass} file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white`}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg"
            >
              {loading ? "Cloning..." : "Clone Consumable"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/consumables")}
              className={cancelBtn}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
