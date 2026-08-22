//LicenseCloneForm.jsx
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

export default function LicenseCloneForm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const license = state?.data || {};

  const [companies, setCompanies] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    company: license.company_id || "",
    Software_name: license.Software_name || "",
    product_key: license.product_key || "",
    total: license.total || "",
    min_qty: license.min_qty || "",
    manufacturer: license.manufacturer_id || "",
    category: license.category_id || "",
    supplier: license.supplier_id || "",
    order_number: license.order_number || "",
    purchase_order: license.purchase_order_number || "",
    purchase_date: license.purchase_date || "",
    expiration_date: license.expiration_date || "",
    termination_date: license.termination_date || "",
    purchase_cost: license.purchase_cost || "",
    depreciation: license.depreciation || "",
    maintained: license.maintained || false,
    reassignable: license.reassignable ?? true,
    notes: license.notes || "",
    licensed_to_name: "",
    licensed_to_email: "",
    checkout_to: "",
    location: license.location_id || "",
  });

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    const headers = { Authorization: `Bearer ${token}` };

    axios.get(API.GET_COMPANIES, { headers }).then((r) => setCompanies(safeArray(r)));
    axios.get(API.GET_MANUFACTURERS, { headers }).then((r) => setManufacturers(safeArray(r)));
    axios.get(API.GET_CATEGORIES, { headers }).then((r) => setCategories(safeArray(r)));
    axios.get(API.GET_SUPPLIERS, { headers }).then((r) => setSuppliers(safeArray(r)));
    axios.get(API.GET_USERS, { headers }).then((r) => setUsers(safeArray(r)));
    axios.get(API.GET_LOCATIONS, { headers }).then((r) => setLocations(safeArray(r)));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);

    console.log("🚀 FORM STATE:", form);
    console.log("👥 USERS LIST:", users);

    const token = sessionStorage.getItem("access_token");

    const selectedUser = users.find(
        (u) =>
            u.name?.trim().toLowerCase() ===
            form.licensed_to_name?.trim().toLowerCase()
        );

        const payload = {
        company_id: Number(form.company),
        Software_name: form.Software_name,
        product_key: form.product_key,
        total: Number(form.total),
        min_qty: Number(form.min_qty),

        manufacturer_id: Number(form.manufacturer),
        category_id: Number(form.category),
        supplier_id: Number(form.supplier),

        licensed_to: form.licensed_to_name || null,
        licensed_to_email: selectedUser?.name || form.licensed_to_name || null,

        order_number: form.order_number || null,
        purchase_order_number: form.purchase_order || null,
        purchase_cost: Number(form.purchase_cost) || 0,
        depreciation: form.depreciation ? Number(form.depreciation) : 0,

        purchase_date: form.purchase_date || null,
        expiration_date: form.expiration_date || null,
        termination_date: form.termination_date || null,

        maintained: form.maintained,
        reassignable: form.reassignable,
        notes: form.notes || null,
    };

    console.log("📦 FINAL PAYLOAD SENT TO BACKEND:");
    console.log(JSON.stringify(payload, null, 2));

    const response = await axios.post(API.CREATE_LICENSE, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ SUCCESS RESPONSE:", response.data);

    toast.success("License cloned successfully!");
    navigate("/licenses");

  } catch (err) {
    console.error("❌ FULL ERROR OBJECT:", err);
    console.error("📛 RESPONSE DATA:", err?.response?.data);
    console.error("📛 STATUS:", err?.response?.status);

    toast.error(
      JSON.stringify(
        err?.response?.data?.detail || err?.response?.data || "Failed to clone license",
        null,
        2
      )
    );
  } finally {
    setLoading(false);
  }
};

  const fieldLabel =
    "block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5";

  const cancelBtn =
    "border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800";

  return (
    <div className="h-full overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
            Clone License
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {license.name || "License"} • Create duplicate with new details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* BASIC */}
          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <label className={fieldLabel}>Company</label>
              <select name="company" className="input" value={form.company} onChange={handleChange}>
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={fieldLabel}>License Name</label>
              <input name="Software_name" className="input" value={form.Software_name} onChange={handleChange} />
            </div>

            <div>
              <label className={fieldLabel}>Product Key</label>
              <input name="product_key" className="input" value={form.product_key} onChange={handleChange} />
            </div>

            <div>
              <label className={fieldLabel}>Seats</label>
              <input type="number" name="total" className="input" value={form.total} onChange={handleChange} />
            </div>

          </div>

          {/* CLASSIFICATION */}
          <div className="grid md:grid-cols-3 gap-4">

            <select name="manufacturer" className="input" value={form.manufacturer} onChange={handleChange}>
              <option value="">Manufacturer</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select name="category" className="input" value={form.category} onChange={handleChange}>
              <option value="">Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select name="supplier" className="input" value={form.supplier} onChange={handleChange}>
              <option value="">Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

          </div>

          {/* ASSIGNMENT */}
          <div className="grid md:grid-cols-2 gap-4">

            <select name="checkout_to" className="input" value={form.checkout_to} onChange={handleChange}>
              <option value="">Assign To User</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.email || u.name}</option>
              ))}
            </select>

            <input
              name="licensed_to_name"
              className="input"
              placeholder="Licensed To Name"
              value={form.licensed_to_name}
              onChange={handleChange}
            />

            <select name="location" className="input" value={form.location} onChange={handleChange}>
              <option value="">Location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>

          </div>

          {/* PURCHASE */}
          <div className="grid md:grid-cols-2 gap-4">

            <input name="order_number" className="input" placeholder="Order Number"
              value={form.order_number} onChange={handleChange} />

            <input name="purchase_order" className="input" placeholder="Purchase Order"
              value={form.purchase_order} onChange={handleChange} />

            <input name="purchase_cost" className="input" placeholder="Cost"
              value={form.purchase_cost} onChange={handleChange} />
            <div>
              <label className={fieldLabel}>Depreciation (Months)</label>
              <input
                type="number"
                name="depreciation"
                className="input"
                value={form.depreciation}
                onChange={handleChange}
                placeholder="e.g. 24"
                min="0"
              />
            </div>

          </div>

          {/* DATES */}
          <div className="grid md:grid-cols-3 gap-4">

            <input type="date" name="purchase_date" className="input"
              value={form.purchase_date} onChange={handleChange} />

            <input type="date" name="expiration_date" className="input"
              value={form.expiration_date} onChange={handleChange} />

            <input type="date" name="termination_date" className="input"
              value={form.termination_date} onChange={handleChange} />

          </div>

          {/* NOTES */}
          <textarea
            name="notes"
            className="input w-full"
            rows={4}
            placeholder="Notes"
            value={form.notes}
            onChange={handleChange}
          />

          {/* CHECKBOX */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="maintained" checked={form.maintained} onChange={handleChange} />
              Maintained
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="reassignable" checked={form.reassignable} onChange={handleChange} />
              Reassignable
            </label>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg"
            >
              {loading ? "Cloning..." : "Clone License"}
            </button>

            <button type="button" onClick={() => navigate("/licenses")} className={cancelBtn}>
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}