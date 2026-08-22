//AssetCreateForm.jsx
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
// Safely extract array from any API response shape:
// handles: plain array, { data: [] }, { results: [] }, { items: [] }
const safeArray = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.items)) return d.items;
  return [];
};
import axios from "axios";
import { API } from "../../../../config/api";
import { useNavigate } from "react-router-dom";


export default function AssetCreateForm() {
  const navigate = useNavigate();
  const imageRef = useRef();

  // ── Dropdown lists (fetched from GET APIs) ──
  const [companies, setCompanies] = useState([]);
  const [models, setModels] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [fieldsets, setFieldsets] = useState([]);
  const [countries, setCountries] = useState([]);

  // ── Main form ──
  const [form, setForm] = useState({
    company: "",
    model: "",
    status: "",
    checkout_to: "",
    notes: "",
    location: "",
    requestable: false,
    image: null,
    asset_name: "",
    warranty: "",
    expected_checkin_date: "",
    next_audit_date: "",
    byod: false,
    order_number: "",
    purchase_date: "",
    eol_date: "",
    supplier: "",
    purchase_cost: "",
    depreciation_months: "",
  });

  // ── Dynamic asset tag + serial rows ──
  const [assetRows, setAssetRows] = useState([{ asset_tag: "", serial: "" }]);

  // ── Modals ──
  const [showModelModal, setShowModelModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showManufacturerModal, setShowManufacturerModal] = useState(false);

  // ── New Model form ──
  const [newModel, setNewModel] = useState({
    name: "",
    category: "",
    manufacturer: ""
  });

  // ── New Status form ──
  const [newStatus, setNewStatus] = useState({ name: "" });

  // ── New Location form ──
  const [newLocation, setNewLocation] = useState({ name: "" });

  // ── New Company form ──
  const [newCompany, setNewCompany] = useState({ name: "" });

  // ── New Supplier form ──
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
  });

  // ── New Category form ──
  const [newCategory, setNewCategory] = useState({ name: "" });

  // ── New Manufacturer form ──
  const [newManufacturer, setNewManufacturer] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
  });

  const [loading, setLoading] = useState(false);

  // ─────────────────────────────────────────────
  // FETCH ALL DROPDOWN DATA ON MOUNT
  // ─────────────────────────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    const headers = { Authorization: `Bearer ${token}` };

    // GET /api/companies → [{ id, name }]
    axios.get(API.GET_COMPANIES, { headers }).then((r) => setCompanies(safeArray(r)));

    // GET /api/models → [{ id, name }]
    axios.get(API.GET_MODELS, { headers }).then((r) => setModels(safeArray(r)));

    // GET /api/statuses → [{ id, name }]
    axios.get(API.GET_STATUS, { headers }).then((r) => setStatuses(safeArray(r)));

    // GET /api/users → [{ id, name }]
    axios.get(API.GET_USERS, { headers }).then((r) => setUsers(safeArray(r)));

    // GET /api/locations → [{ id, name }]
    axios.get(API.GET_LOCATIONS, { headers }).then((r) => setLocations(safeArray(r)));

    // GET /api/suppliers → [{ id, name }]
    axios.get(API.GET_SUPPLIERS, { headers }).then((r) => setSuppliers(safeArray(r)));

    // GET /api/categories → [{ id, name }]  (for New Model modal)
    axios.get(API.GET_CATEGORIES, { headers }).then((r) => setCategories(safeArray(r)));

    // GET /api/manufacturers → [{ id, name }]  (for New Model modal)
    axios.get(API.GET_MANUFACTURERS, { headers }).then((r) => setManufacturers(safeArray(r)));

    // GET /api/fieldsets → [{ id, name }]  (for New Model modal)
    // axios.get(API.GET_FIELDSETS, { headers }).then((r) => setFieldsets(safeArray(r)));

    // GET /api/countries → [{ id, name }]  (for New Location modal)
    // axios.get(API.GET_COUNTRIES, { headers }).then((r) => setCountries(safeArray(r)));
  }, []);

  // ─────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleAssetRow = (index, field, value) => {
    setAssetRows(assetRows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addAssetRow = () => {
    setAssetRows([...assetRows, { asset_tag: "", serial: "" }]);
  };

  const removeAssetRow = (index) => {
    setAssetRows(assetRows.filter((_, i) => i !== index));
  };

  // ─────────────────────────────────────────────
  // POST: Create New Model
  // ─────────────────────────────────────────────
  const handleSaveModel = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      const res = await axios.post(API.CREATE_MODEL, {
        model_name: newModel.name,
        category_id: Number(newModel.category) || 0,
        manufacturer_id: Number(newModel.manufacturer) || 0,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const created = res.data;
      setModels([...models, created]);
      setForm({ ...form, model: created.id });
      setShowModelModal(false);
      setNewModel({ name: "", category: "", manufacturer: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create model");
    }
  };

  // ─────────────────────────────────────────────
  // POST: Create New Status
  // ─────────────────────────────────────────────
  const handleSaveStatus = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      const res = await axios.post(API.CREATE_STATUS, {
        name: newStatus.name
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const created = res.data;
      setStatuses([...statuses, created]);
      setForm({ ...form, status: created.id });
      setShowStatusModal(false);
      setNewStatus({ name: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create status");
    }
  };

  // ─────────────────────────────────────────────
  // POST: Create New Location
  // ─────────────────────────────────────────────
  const handleSaveLocation = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      const res = await axios.post(API.CREATE_LOCATION, {
        location_name: newLocation.name
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const created = res.data;
      setLocations([...locations, created]);
      setForm({ ...form, location: created.id });
      setShowLocationModal(false);
      setNewLocation({ name: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create location");
    }
  };

  // ─────────────────────────────────────────────
  // POST: Create New Company
  // ─────────────────────────────────────────────
  const handleSaveCompany = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      const res = await axios.post(API.CREATE_COMPANY, {
        company_name: newCompany.name,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const created = res.data;
      setCompanies([...companies, created]);
      setForm({ ...form, company: created.id });
      setShowCompanyModal(false);
      setNewCompany({ name: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create company");
    }
  };

  // ─────────────────────────────────────────────
  // POST: Create New Supplier
  // ─────────────────────────────────────────────
  const handleSaveSupplier = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      const res = await axios.post(API.CREATE_SUPPLIER, {
        name: newSupplier.name,
        contact_person: newSupplier.contact_person,
        email: newSupplier.email,
        phone: newSupplier.phone,
        address: newSupplier.address,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const created = res.data;
      setSuppliers([...suppliers, created]);
      setForm({ ...form, supplier: created.id });
      setShowSupplierModal(false);
      setNewSupplier({ name: "", contact_person: "", email: "", phone: "", address: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create supplier");
    }
  };

  // ─────────────────────────────────────────────
  // POST: Create New Category  (used inside New Model modal)
  // ─────────────────────────────────────────────
  const handleSaveCategory = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      const res = await axios.post(API.CREATE_CATEGORY, {
        name: newCategory.name,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const created = res.data;
      setCategories([...categories, created]);
      setNewModel({ ...newModel, category: created.id });
      setShowCategoryModal(false);
      setNewCategory({ name: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create category");
    }
  };

  // ─────────────────────────────────────────────
  // POST: Create New Manufacturer  (used inside New Model modal)
  // ─────────────────────────────────────────────
  const handleSaveManufacturer = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      const res = await axios.post(API.CREATE_MANUFACTURER, {
        name: newManufacturer.name,
        contact_email: newManufacturer.contact_email,
        contact_phone: newManufacturer.contact_phone,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const created = res.data;
      setManufacturers([...manufacturers, created]);
      setNewModel({ ...newModel, manufacturer: created.id });
      setShowManufacturerModal(false);
      setNewManufacturer({ name: "", contact_email: "", contact_phone: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create manufacturer");
    }
  };

  // ─────────────────────────────────────────────
  // POST: Submit Main Asset Form
  // ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = sessionStorage.getItem("access_token");

      const payload = new FormData();

      //  REQUIRED
      payload.append("asset_tag", assetRows[0]?.asset_tag || "");
      payload.append("asset_name", form.asset_name || "Asset");
      payload.append("company_id", Number(form.company));
      payload.append("model_id", Number(form.model));
      payload.append("status_id", Number(form.status));

      //  OPTIONAL
      if (assetRows[0]?.serial)
        payload.append("serial_number", assetRows[0].serial);

      if (form.checkout_to)
        payload.append("checked_out_to", Number(form.checkout_to));

      if (form.location)
        payload.append("location_id", Number(form.location));

      if (form.supplier)
        payload.append("supplier_id", Number(form.supplier));

      if (form.purchase_cost)
        payload.append("purchase_cost", Number(form.purchase_cost));

      if (form.depreciation_months)
        payload.append("depreciation_months", Number(form.depreciation_months));

      if (form.purchase_date)
        payload.append("purchase_date", form.purchase_date);

      if (form.expected_checkin_date)
        payload.append("expected_checkin_date", form.expected_checkin_date);

      if (form.next_audit_date)
        payload.append("next_audit_date", form.next_audit_date);

      if (form.order_number)
        payload.append("order_number", form.order_number);

      if (form.notes)
        payload.append("notes", form.notes);

      //  WARRANTY
      if (form.warranty) {
        payload.append("warranty_months", Number(form.warranty));

        //  OPTIONAL: auto-calc expiry from purchase_date
        if (form.purchase_date) {
          const d = new Date(form.purchase_date);
          d.setMonth(d.getMonth() + Number(form.warranty));
          payload.append("warranty_expires", d.toISOString().split("T")[0]);
        }
      }

      //  EOL DATE
      if (form.eol_date) {
        payload.append("warranty_expires", form.eol_date);
        payload.append("eol_date", form.eol_date);
      }

      if (form.byod)
        payload.append("byod", form.byod);

      if (form.requestable)
        payload.append("requestable", form.requestable);

      if (form.image)
        payload.append("file", form.image);

      //  DEBUG
      for (let pair of payload.entries()) {
        console.log(pair[0], pair[1]);
      }

      const res = await axios.post(API.CREATE_ASSET, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("SUCCESS:", res.data);
      toast.success("Asset created successfully!");
      navigate("/assets");

    } catch (err) {
      console.error("FULL ERROR:", err?.response?.data);
      toast.error(
        JSON.stringify(err?.response?.data?.detail || "Failed to create asset", null, 2)
      );
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // UI CLASS CONSTANTS (dark mode aware, no logic)
  // ─────────────────────────────────────────────
  const fieldLabel = "block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5";
  const sectionHeading = "text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-700";
  const newBtn = "shrink-0 px-3 py-2 text-xs font-semibold rounded-lg border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors";
  const modalOverlay = "fixed inset-0 bg-black/60 dark:bg-black/75 flex items-center justify-center z-50 p-4";
  const modalOverlayTop = "fixed inset-0 bg-black/60 dark:bg-black/75 flex items-center justify-center z-[60] p-4";
  const modalBox = "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-6 w-full max-w-md";
  const modalTitle = "text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-4";
  const saveBtn = "bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors";
  const cancelBtn = "border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors";

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">

        {/* ── Page header ── */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <h1 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Create Asset</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Fill in the details below to register a new asset</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── 1. COMPANY ── */}
            <div>
              <label className={fieldLabel}>Company</label>
              <div className="flex gap-2">
                {/* GET /api/companies populates this dropdown */}
                <select name="company" className="input flex-1" value={form.company} onChange={handleChange}>
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowCompanyModal(true)} className={newBtn}>+ New</button>
              </div>
            </div>

            {/* ── 2. ASSET TAG + SERIAL (dynamic rows) ── */}
            <div>
              <label className={fieldLabel}>Asset Tag & Serial</label>
              <div className="space-y-2">
                {assetRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-2 gap-3 items-center">
                    <input
                      className="input"
                      placeholder={`Asset Tag ${i + 1}`}
                      value={row.asset_tag}
                      onChange={(e) => handleAssetRow(i, "asset_tag", e.target.value)}
                    />
                    <div className="flex gap-2">
                      <input
                        className="input flex-1"
                        placeholder={`Serial ${i + 1}`}
                        value={row.serial}
                        onChange={(e) => handleAssetRow(i, "serial", e.target.value)}
                      />
                      {assetRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAssetRow(i)}
                          className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 text-sm px-2 transition-colors"
                        >✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addAssetRow} className={`mt-2 ${newBtn}`}>
                + Add Row
              </button>
            </div>

            {/* ── 3. MODEL ── */}
            <div>
              <label className={fieldLabel}>Model</label>
              <div className="flex gap-2">
                {/* GET /api/models populates this dropdown */}
                <select name="model" className="input flex-1" value={form.model} onChange={handleChange}>
                  <option value="">Select Model</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowModelModal(true)} className={newBtn}>+ New</button>
              </div>
            </div>

            {/* ── 4. STATUS ── */}
            <div>
              <label className={fieldLabel}>Status</label>
              <div className="flex gap-2">
                {/* GET /api/statuses populates this dropdown */}
                <select name="status" className="input flex-1" value={form.status} onChange={handleChange}>
                  <option value="">Select Status</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowStatusModal(true)} className={newBtn}>+ New</button>
              </div>
            </div>

            {/* ── 5. CHECKOUT TO ── */}
            <div>
              <label className={fieldLabel}>Checkout To</label>
              {/* GET /api/users populates this dropdown — no POST endpoint exists */}
              <select name="checkout_to" className="input" value={form.checkout_to} onChange={handleChange}>
                <option value="">Select User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* ── 6. NOTES ── */}
            <div>
              <label className={fieldLabel}>Notes</label>
              <textarea
                name="notes"
                className="input w-full"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                placeholder="Add any notes about this asset..."
              />
            </div>

            {/* ── 7. DEFAULT LOCATION ── */}
            <div>
              <label className={fieldLabel}>Default Location</label>
              <div className="flex gap-2">
                {/* GET /api/locations populates this dropdown */}
                <select name="location" className="input flex-1" value={form.location} onChange={handleChange}>
                  <option value="">Select Location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowLocationModal(true)} className={newBtn}>+ New</button>
              </div>
            </div>

            {/* ── 8. REQUESTABLE ── */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="requestable"
                  checked={form.requestable}
                  onChange={handleChange}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Requestable</span>
              </label>
            </div>

            {/* ── 9. UPLOAD IMAGE ── */}
            <div>
              <label className={fieldLabel}>Upload Image</label>
              <input
                type="file"
                accept="image/*"
                ref={imageRef}
                className="hidden"
                onChange={(e) => setForm({ ...form, image: e.target.files[0] || null })}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => imageRef.current.click()}
                  className="border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  📎 Choose Image
                </button>
                {form.image && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-xs">
                    ✓ {form.image.name}
                  </span>
                )}
              </div>
            </div>

            {/* ── 10. OPTIONAL INFORMATION ── */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
              <p className={sectionHeading}>Optional Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabel}>Asset Name</label>
                  <input
                    name="asset_name"
                    placeholder="Asset Name"
                    className="input"
                    value={form.asset_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Warranty</label>
                  <div className="flex gap-2 items-center">
                    <input
                      name="warranty"
                      placeholder="e.g. 12"
                      className="input flex-1"
                      value={form.warranty}
                      onChange={handleChange}
                    />
                    <span className="text-sm text-zinc-400 dark:text-zinc-500 whitespace-nowrap">months</span>
                  </div>
                </div>
                <div>
                  <label className={fieldLabel}>Expected Checkin Date</label>
                  <input
                    type="date"
                    name="expected_checkin_date"
                    className="input"
                    value={form.expected_checkin_date}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Next Audit Date</label>
                  <input
                    type="date"
                    name="next_audit_date"
                    className="input"
                    value={form.next_audit_date}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
                    Usually auto-calculated from last audit date and audit frequency in Admin Settings → Alerts.
                  </p>
                </div>
              </div>
              <div>
                <label className={fieldLabel}>Depreciation (Months)</label>
                <input
                  name="depreciation_months"
                  type="number"
                  placeholder="e.g. 36"
                  className="input"
                  value={form.depreciation_months}
                  onChange={handleChange}
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Total number of months for asset depreciation calculation
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  name="byod"
                  checked={form.byod}
                  onChange={handleChange}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  BYOD — This device is owned by the user
                </span>
              </label>
            </div>

            {/* ── 11. ORDER RELATED INFORMATION ── */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
              <p className={sectionHeading}>Order Related Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabel}>Order Number</label>
                  <input
                    name="order_number"
                    placeholder="Order Number"
                    className="input"
                    value={form.order_number}
                    onChange={handleChange}
                  />
                </div>
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
                  <label className={fieldLabel}>EOL Date</label>
                  <input
                    type="date"
                    name="eol_date"
                    className="input"
                    value={form.eol_date}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Supplier</label>
                  <div className="flex gap-2">
                    {/* GET /api/suppliers populates this dropdown */}
                    <select name="supplier" className="input flex-1" value={form.supplier} onChange={handleChange}>
                      <option value="">Select Supplier</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowSupplierModal(true)} className={newBtn}>+ New</button>
                  </div>
                </div>
                <div>
                  <label className={fieldLabel}>Purchase Cost</label>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">RS.</span>
                    <input
                      name="purchase_cost"
                      placeholder="0.00"
                      className="input flex-1"
                      value={form.purchase_cost}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── BUTTONS ── */}
            <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {loading ? "Creating..." : "Create Asset"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/assets")}
                className={cancelBtn}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MODAL: NEW MODEL
          POST /api/models
      ══════════════════════════════════════════ */}
      {showModelModal && (
        <div className={modalOverlay}>
          <div className={modalBox}>
            <h2 className={modalTitle}>Create New Model</h2>
            <div className="space-y-3">
              <input
                className="input w-full"
                placeholder="Name"
                value={newModel.name}
                onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
              />
              {/* GET /api/categories — with inline + New */}
              <div className="flex gap-2">
                <select
                  className="input flex-1"
                  value={newModel.category}
                  onChange={(e) => setNewModel({ ...newModel, category: e.target.value })}
                >
                  <option value="">Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowCategoryModal(true)} className={newBtn}>+ New</button>
              </div>
              {/* GET /api/manufacturers — with inline + New */}
              <div className="flex gap-2">
                <select
                  className="input flex-1"
                  value={newModel.manufacturer}
                  onChange={(e) => setNewModel({ ...newModel, manufacturer: e.target.value })}
                >
                  <option value="">Manufacturer</option>
                  {manufacturers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowManufacturerModal(true)} className={newBtn}>+ New</button>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={handleSaveModel} className={saveBtn}>Save</button>
              <button type="button" onClick={() => setShowModelModal(false)} className={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: NEW STATUS
          POST /api/statuses
      ══════════════════════════════════════════ */}
      {showStatusModal && (
        <div className={modalOverlay}>
          <div className={modalBox}>
            <h2 className={modalTitle}>Create Status Label</h2>
            <div className="space-y-3">
              <input
                className="input w-full"
                placeholder="Status Name"
                value={newStatus.name}
                onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={handleSaveStatus} className={saveBtn}>Save</button>
              <button type="button" onClick={() => setShowStatusModal(false)} className={cancelBtn}>Cancel</button>
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
                className="input w-full"
                placeholder="Name"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={handleSaveLocation} className={saveBtn}>Save</button>
              <button type="button" onClick={() => setShowLocationModal(false)} className={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

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
                className="input w-full"
                placeholder="Company Name"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ name: e.target.value })}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={handleSaveCompany} className={saveBtn}>Save</button>
              <button type="button" onClick={() => setShowCompanyModal(false)} className={cancelBtn}>Cancel</button>
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
            <h2 className={modalTitle}>Create New Supplier</h2>
            <div className="space-y-3">
              <input
                className="input w-full"
                placeholder="Supplier Name"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
              />
              <input
                className="input w-full"
                placeholder="Contact Person"
                value={newSupplier.contact_person}
                onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
              />
              <input
                className="input w-full"
                placeholder="Email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
              />
              <input
                className="input w-full"
                placeholder="Phone"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
              />
              <input
                className="input w-full"
                placeholder="Address"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={handleSaveSupplier} className={saveBtn}>Save</button>
              <button type="button" onClick={() => setShowSupplierModal(false)} className={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: NEW CATEGORY  (opened from inside New Model modal)
          POST /api/categories
          z-[60] so it layers above the Model modal (z-50)
      ══════════════════════════════════════════ */}
      {showCategoryModal && (
        <div className={modalOverlayTop}>
          <div className={modalBox}>
            <h2 className={modalTitle}>Create New Category</h2>
            <div className="space-y-3">
              <input
                className="input w-full"
                placeholder="Category Name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ name: e.target.value })}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={handleSaveCategory} className={saveBtn}>Save</button>
              <button type="button" onClick={() => setShowCategoryModal(false)} className={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: NEW MANUFACTURER  (opened from inside New Model modal)
          POST /api/manufacturers
          z-[60] so it layers above the Model modal (z-50)
      ══════════════════════════════════════════ */}
      {showManufacturerModal && (
        <div className={modalOverlayTop}>
          <div className={modalBox}>
            <h2 className={modalTitle}>Create New Manufacturer</h2>
            <div className="space-y-3">
              <input
                className="input w-full"
                placeholder="Manufacturer Name"
                value={newManufacturer.name}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, name: e.target.value })}
              />
              <input
                className="input w-full"
                placeholder="Email"
                value={newManufacturer.contact_email}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, contact_email: e.target.value })}
              />
              <input
                className="input w-full"
                placeholder="Phone"
                value={newManufacturer.contact_phone}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, contact_phone: e.target.value })}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={handleSaveManufacturer} className={saveBtn}>Save</button>
              <button type="button" onClick={() => setShowManufacturerModal(false)} className={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}