// LicenseCreateForm.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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

export default function LicenseCreateForm() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(false);

  // ── Modals ──
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showManufacturerModal, setShowManufacturerModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [newCategory, setNewCategory] = useState({ name: "" });

  const [newManufacturer, setNewManufacturer] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
  });

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
  });

  const [newCompany, setNewCompany] = useState({ name: "" });

  const [newLocation, setNewLocation] = useState({ name: "" });

  const [form, setForm] = useState({
    company: "",
    Software_name: "",
    product_key: "",
    total: "",
    manufacturer: "",
    category: "",
    supplier: "",
    order_number: "",
    min_qty: "",
    purchase_order: "",
    purchase_date: "",
    expiration_date: "",
    termination_date: "",
    purchase_cost: "",
    depreciation: "",
    maintained: false,
    reassignable: true,
    notes: "",
    licensed_to_name: "",
    licensed_to_email: "",
    checkout_to: "",
    location: "",
  });

  // =========================
  // CREATE HANDLERS
  // =========================

  const createCategory = async () => {
    const token = sessionStorage.getItem("access_token");
    const res = await axios.post(API.CREATE_CATEGORY, newCategory, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCategories([...categories, res.data]);
    setForm({ ...form, category: res.data.id });
    setShowCategoryModal(false);
    setNewCategory({ name: "" });
  };

  const createManufacturer = async () => {
    const token = sessionStorage.getItem("access_token");
    const res = await axios.post(API.CREATE_MANUFACTURER, newManufacturer, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setManufacturers([...manufacturers, res.data]);
    setForm({ ...form, manufacturer: res.data.id });
    setShowManufacturerModal(false);
    setNewManufacturer({ name: "", contact_email: "", contact_phone: "" });
  };

  const createSupplier = async () => {
    const token = sessionStorage.getItem("access_token");
    const res = await axios.post(API.CREATE_SUPPLIER, newSupplier, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSuppliers([...suppliers, res.data]);
    setForm({ ...form, supplier: res.data.id });
    setShowSupplierModal(false);
    setNewSupplier({ name: "", contact_person: "", email: "", phone: "", address: "" });
  };

  const createCompany = async () => {
    const token = sessionStorage.getItem("access_token");
    const res = await axios.post(API.CREATE_COMPANY, {
      company_name: newCompany.name,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCompanies([...companies, res.data]);
    setForm({ ...form, company: res.data.id });
    setShowCompanyModal(false);
    setNewCompany({ name: "" });
  };

  const createLocation = async () => {
    const token = sessionStorage.getItem("access_token");
    const res = await axios.post(API.CREATE_LOCATION, {
      location_name: newLocation.name,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setLocations([...locations, res.data]);
    setForm({ ...form, location: res.data.id });
    setShowLocationModal(false);
    setNewLocation({ name: "" });
  };

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
    console.log("user state:", users);
    console.log("slected id:", form.checkout_to);

    try {
      setLoading(true);
      const token = sessionStorage.getItem("access_token");

      const selectedUser = form.checkout_to
        ? users.find((u) => u.id === Number(form.checkout_to))
        : null;

        console.log("=== LICENSE DEBUG ===");
        console.log("checkout_to:", form.checkout_to);
        console.log("selectedUser:", selectedUser);
        console.log("selectedUser.name:", selectedUser?.name);
        console.log("selectedUser.email:", selectedUser?.email);
        console.log("licensed_to_name (manual):", form.licensed_to_name);

        const payload = {
            company_id: Number(form.company),
            Software_name: form.Software_name,
            product_key: form.product_key,
            total: Number(form.total || 0),
            min_qty: form.min_qty ? Number(form.min_qty) : null,

            manufacturer_id: form.manufacturer ? Number(form.manufacturer) : null,
            category_id: form.category ? Number(form.category) : null,
            supplier_id: form.supplier ? Number(form.supplier) : null,

            licensed_to: form.licensed_to_name || null,
            licensed_to_email: selectedUser?.name || null,

            order_number: form.order_number || null,
            purchase_order_number: form.purchase_order || null,
            purchase_cost: form.purchase_cost ? Number(form.purchase_cost) : null,
            depreciation: form.depreciation ? Number(form.depreciation) : 0,

            purchase_date: form.purchase_date || null,
            expiration_date: form.expiration_date || null,
            termination_date: form.termination_date || null,

            maintained: form.maintained,
            reassignable: form.reassignable,

            notes: form.notes || null,
        };

      await axios.post(API.CREATE_LICENSE, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("License created successfully!");
      navigate("/licenses");
    } catch (err) {
      console.error(err);
      toast.error(
        JSON.stringify(err?.response?.data?.detail || "Failed to create license", null, 2)
      );
    } finally {
      setLoading(false);
    }
  };

  // ── UI class constants ──
  const fieldLabel =
    "block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5";

  const sectionHeading =
    "text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-700";

  const newBtn =
    "shrink-0 px-3 py-2 text-xs font-semibold rounded-lg border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors";

  const cancelBtn =
    "border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors";

  const saveBtn =
    "bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors";

  const modalOverlay =
    "fixed inset-0 bg-black/60 dark:bg-black/75 flex items-center justify-center z-50 p-4";

  const modalBox =
    "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-6 w-full max-w-md";

  const modalTitle =
    "text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-4";

  const modalInput =
    "input w-full";

  return (
    <div className="h-full overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
            Create License
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Add a new software license to inventory
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ── COMPANY ── */}
            <div>
              <label className={fieldLabel}>Company</label>
              <div className="flex gap-2">
                <select name="company" className="input flex-1" value={form.company} onChange={handleChange} required>
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowCompanyModal(true)} className={newBtn}>+ New</button>
              </div>
            </div>

            <div>
              <label className={fieldLabel}>License Name</label>
              <input
                name="Software_name"
                className="input"
                value={form.Software_name}
                onChange={handleChange}
                placeholder="Microsoft 365 Business Premium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={fieldLabel}>Product Key</label>
              <input
                name="product_key"
                className="input"
                value={form.product_key}
                onChange={handleChange}
                placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TOTAL SEATS */}
              <div>
                <label className={fieldLabel}>Seats</label>
                <input
                  type="number"
                  name="total"
                  className="input"
                  value={form.total}
                  onChange={handleChange}
                  placeholder="10"
                />
              </div>

              {/* MIN QTY */}
              <div>
                <label className={fieldLabel}>Min Qty (Optional)</label>
                <input
                  type="number"
                  name="min_qty"
                  className="input"
                  value={form.min_qty}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <p className={sectionHeading}>Classification</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-2">
                <select
                  name="manufacturer"
                  className="input flex-1"
                  value={form.manufacturer}
                  onChange={handleChange}
                >
                  <option value="">Select Manufacturer</option>
                  {manufacturers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowManufacturerModal(true)} className={newBtn}>
                  + New
                </button>
              </div>

              <div className="flex gap-2">
                <select
                  name="category"
                  className="input flex-1"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowCategoryModal(true)} className={newBtn}>
                  + New
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <p className={sectionHeading}>Assignment & Ownership</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* License To Email (User Select) */}
              <select
                name="checkout_to"
                className="input"
                value={form.checkout_to}
                onChange={handleChange}
              >
                <option value="">Select License To Email</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email || u.name}
                  </option>
                ))}
              </select>

              {/* Licensed To Name */}
              <input
                name="licensed_to_name"
                className="input"
                value={form.licensed_to_name}
                onChange={handleChange}
                placeholder="Licensed To Name"
              />

              {/* ── LOCATION ── */}
              <div>
                <label className={fieldLabel}>Location</label>
                <div className="flex gap-2">
                  <select
                    name="location"
                    className="input flex-1"
                    value={form.location}
                    onChange={handleChange}
                  >
                    <option value="">Select Location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowLocationModal(true)} className={newBtn}>+ New</button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <p className={sectionHeading}>Purchase Details</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supplier */}
              <div>
                <label className={fieldLabel}>Supplier</label>
                <div className="flex gap-2">
                  <select
                    name="supplier"
                    className="input flex-1"
                    value={form.supplier}
                    onChange={handleChange}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowSupplierModal(true)} className={newBtn}>
                    + New
                  </button>
                </div>
              </div>

              {/* Order Number */}
              <div>
                <label className={fieldLabel}>Order Number</label>
                <input
                  name="order_number"
                  className="input"
                  value={form.order_number}
                  onChange={handleChange}
                  placeholder="Enter Order Number"
                />
              </div>

              {/* Purchase Order */}
              <div>
                <label className={fieldLabel}>Purchase Order Number</label>
                <input
                  name="purchase_order"
                  className="input"
                  value={form.purchase_order}
                  onChange={handleChange}
                  placeholder="Enter Purchase Order Number"
                />
              </div>

              {/* Purchase Cost */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">₹</span>
                <input
                  name="purchase_cost"
                  className="input flex-1"
                  value={form.purchase_cost}
                  onChange={handleChange}
                  placeholder="Purchase Cost"
                />
              </div>

              <div>
                <label className={fieldLabel}>Depreciation (Months)</label>
                <input
                  type="number"
                  name="depreciation"
                  className="input"
                  value={form.depreciation}
                  onChange={handleChange}
                  placeholder="e.g. 10"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* LICENSE PERIOD SECTION */}
            <div className="mt-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <p className="text-xs font-bold uppercase text-zinc-500 mb-3">
                License Period
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={fieldLabel}>Purchase Date</label>
                  <input
                    type="date"
                    name="purchase_date"
                    className="input"
                    value={form.purchase_date}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Expiration Date</label>
                  <input
                    type="date"
                    name="expiration_date"
                    className="input"
                    value={form.expiration_date}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Termination Date</label>
                  <input
                    type="date"
                    name="termination_date"
                    className="input"
                    value={form.termination_date}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Notes</label>
            <textarea
              name="notes"
              rows={4}
              className="input w-full"
              value={form.notes}
              onChange={handleChange}
              placeholder="Additional license notes..."
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="maintained"
                checked={form.maintained}
                onChange={handleChange}
                className="w-4 h-4 accent-blue-600"
              />
              <span>Maintained</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="reassignable"
                checked={form.reassignable}
                onChange={handleChange}
                className="w-4 h-4 accent-blue-600"
              />
              <span>Reassignable</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create License"}
            </button>

            <button
              type="button"
              onClick={() => navigate('/licenses')}
              className={cancelBtn}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* ══════════════════════════════════════════
          MODAL: NEW COMPANY
          POST /api/companies
      ══════════════════════════════════════════ */}
      {showCompanyModal && (
        <div className={modalOverlay}>
          <div className={modalBox}>
            <h2 className={modalTitle}>Create New Company</h2>
            <div className="space-y-3">
              <input
                className={modalInput}
                placeholder="Company Name"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ name: e.target.value })}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={createCompany} className={saveBtn}>Save</button>
              <button type="button" onClick={() => setShowCompanyModal(false)} className={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: NEW LOCATION
          POST /api/locations
      ══════════════════════════════════════════ */}
      {showLocationModal && (
        <div className={modalOverlay}>
          <div className={modalBox}>
            <h2 className={modalTitle}>Create New Location</h2>
            <div className="space-y-3">
              <input
                className={modalInput}
                placeholder="Location Name"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ name: e.target.value })}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={createLocation} className={saveBtn}>Save</button>
              <button type="button" onClick={() => setShowLocationModal(false)} className={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: NEW CATEGORY
          POST /api/categories
      ══════════════════════════════════════════ */}
      {showCategoryModal && (
        <div className={modalOverlay}>
          <div className={modalBox}>
            <h2 className={modalTitle}>Create Category</h2>
            <div className="space-y-3">
              <input
                className={modalInput}
                placeholder="Category Name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ name: e.target.value })}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={createCategory} className={saveBtn}>Save</button>
              <button type="button" onClick={() => setShowCategoryModal(false)} className={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: NEW MANUFACTURER
          POST /api/manufacturers
      ══════════════════════════════════════════ */}
      {showManufacturerModal && (
        <div className={modalOverlay}>
          <div className={modalBox}>
            <h2 className={modalTitle}>Create Manufacturer</h2>
            <div className="space-y-3">
              <input
                placeholder="Name"
                className={modalInput}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, name: e.target.value })}
              />
              <input
                placeholder="Email"
                className={modalInput}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, contact_email: e.target.value })}
              />
              <input
                placeholder="Phone"
                className={modalInput}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, contact_phone: e.target.value })}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={createManufacturer} className={saveBtn}>Save</button>
              <button type="button" onClick={() => setShowManufacturerModal(false)} className={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: NEW SUPPLIER
          POST /api/suppliers
      ══════════════════════════════════════════ */}
      {showSupplierModal && (
        <div className={modalOverlay}>
          <div className={modalBox}>
            <h2 className={modalTitle}>Create Supplier</h2>
            <div className="space-y-3">
              <input placeholder="Name" className={modalInput}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
              <input placeholder="Contact Person" className={modalInput}
                onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} />
              <input placeholder="Email" className={modalInput}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} />
              <input placeholder="Phone" className={modalInput}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
              <input placeholder="Address" className={modalInput}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={createSupplier} className={saveBtn}>Save</button>
              <button type="button" onClick={() => setShowSupplierModal(false)} className={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}