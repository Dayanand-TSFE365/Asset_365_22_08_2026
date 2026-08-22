// AccessoryCreateForm.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { API } from "../../../config/api";

const safeArray = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.items)) return d.items;
  return [];
};

export default function AccessoryCreateForm() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("access_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [loading, setLoading] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [locations, setLocations] = useState([]);

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
    name: "",
    company_id: "",
    category_id: "",
    supplier_id: "",
    manufacturer_id: "",
    location_id: "",
    model_no: "",
    order_number: "",
    purchase_date: "",
    unit_cost: "",
    quantity: "",
    min_qty: "",
    notes: "",
    file: null,
  });

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const [companiesRes, categoriesRes, suppliersRes, manufacturersRes, locationsRes] =
        await Promise.all([
          axios.get(API.GET_COMPANIES, { headers }),
          axios.get(API.GET_CATEGORIES, { headers }),
          axios.get(API.GET_SUPPLIERS, { headers }),
          axios.get(API.GET_MANUFACTURERS, { headers }),
          axios.get(API.GET_LOCATIONS, { headers }),
        ]);

      setCompanies(safeArray(companiesRes));
      setCategories(safeArray(categoriesRes));
      setSuppliers(safeArray(suppliersRes));
      setManufacturers(safeArray(manufacturersRes));
      setLocations(safeArray(locationsRes));
    } catch (error) {
      console.error("Failed to load dropdowns:", error);
    }
  };

  // ── Create handlers ──

  const createCategory = async () => {
    const res = await axios.post(API.CREATE_CATEGORY, newCategory, { headers });
    setCategories((prev) => [...prev, res.data]);
    setForm((prev) => ({ ...prev, category_id: res.data.id }));
    setShowCategoryModal(false);
    setNewCategory({ name: "" });
  };

  const createManufacturer = async () => {
    const res = await axios.post(API.CREATE_MANUFACTURER, newManufacturer, { headers });
    setManufacturers((prev) => [...prev, res.data]);
    setForm((prev) => ({ ...prev, manufacturer_id: res.data.id }));
    setShowManufacturerModal(false);
    setNewManufacturer({ name: "", contact_email: "", contact_phone: "" });
  };

  const createSupplier = async () => {
    const res = await axios.post(API.CREATE_SUPPLIER, newSupplier, { headers });
    setSuppliers((prev) => [...prev, res.data]);
    setForm((prev) => ({ ...prev, supplier_id: res.data.id }));
    setShowSupplierModal(false);
    setNewSupplier({ name: "", contact_person: "", email: "", phone: "", address: "" });
  };

  const createCompany = async () => {
    const res = await axios.post(API.CREATE_COMPANY, {
      company_name: newCompany.name,
    }, { headers });
    setCompanies((prev) => [...prev, res.data]);
    setForm((prev) => ({ ...prev, company_id: res.data.id }));
    setShowCompanyModal(false);
    setNewCompany({ name: "" });
  };

  const createLocation = async () => {
    const res = await axios.post(API.CREATE_LOCATION, {
      location_name: newLocation.name,
    }, { headers });
    setLocations((prev) => [...prev, res.data]);
    setForm((prev) => ({ ...prev, location_id: res.data.id }));
    setShowLocationModal(false);
    setNewLocation({ name: "" });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          payload.append(key, value);
        }
      });

      await axios.post(API.CREATE_ACCESSORY, payload, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Accessory created successfully!");
      navigate("/accessories");
    } catch (error) {
      console.error("Create accessory failed:", error.response?.data || error);
      toast.error(
        JSON.stringify(
          error.response?.data?.detail || "Failed to create accessory",
          null,
          2
        )
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

  const inputClass = "input w-full";

  const newBtn =
    "shrink-0 px-3 py-2 text-xs font-semibold rounded-lg border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors self-end";

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

  // renderSelect stays unchanged — used for plain selects without + New
  const renderSelect = (label, name, options) => (
    <div>
      <label className={fieldLabel}>{label}</label>
      <select
        name={name}
        value={form[name]}
        onChange={handleChange}
        className={inputClass}
      >
        <option value="">Select {label}</option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <div className="h-full overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h1 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
              Create Accessory
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Add a new accessory to inventory
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>Accessory Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                  required
                  placeholder="Enter accessory name"
                />
              </div>

              <div>
                <label className={fieldLabel}>Total Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  className={inputClass}
                  required
                  min="1"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
              <p className={sectionHeading}>Classification</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* ── COMPANY with + New ── */}
                <div>
                  <label className={fieldLabel}>Company</label>
                  <div className="flex gap-2">
                    <select
                      name="company_id"
                      value={form.company_id}
                      onChange={handleChange}
                      className="input flex-1"
                    >
                      <option value="">Select Company</option>
                      {companies.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowCompanyModal(true)} className={newBtn}>
                      + New
                    </button>
                  </div>
                </div>

                {/* ── CATEGORY with + New ── */}
                <div>
                  <label className={fieldLabel}>Category</label>
                  <div className="flex gap-2">
                    <select
                      name="category_id"
                      value={form.category_id}
                      onChange={handleChange}
                      className="input flex-1"
                    >
                      <option value="">Select Category</option>
                      {categories.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowCategoryModal(true)} className={newBtn}>
                      + New
                    </button>
                  </div>
                </div>

                {/* ── MANUFACTURER with + New ── */}
                <div>
                  <label className={fieldLabel}>Manufacturer</label>
                  <div className="flex gap-2">
                    <select
                      name="manufacturer_id"
                      value={form.manufacturer_id}
                      onChange={handleChange}
                      className="input flex-1"
                    >
                      <option value="">Select Manufacturer</option>
                      {manufacturers.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowManufacturerModal(true)} className={newBtn}>
                      + New
                    </button>
                  </div>
                </div>

                {/* ── LOCATION with + New ── */}
                <div>
                  <label className={fieldLabel}>Location</label>
                  <div className="flex gap-2">
                    <select
                      name="location_id"
                      value={form.location_id}
                      onChange={handleChange}
                      className="input flex-1"
                    >
                      <option value="">Select Location</option>
                      {locations.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowLocationModal(true)} className={newBtn}>
                      + New
                    </button>
                  </div>
                </div>

              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
              <p className={sectionHeading}>Product Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabel}>Model Number</label>
                  <input
                    name="model_no"
                    value={form.model_no}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter model number"
                  />
                </div>

                <div>
                  <label className={fieldLabel}>Order Number</label>
                  <input
                    name="order_number"
                    value={form.order_number}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter order number"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
              <p className={sectionHeading}>Purchase Information</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* ── SUPPLIER with + New ── */}
                <div>
                  <label className={fieldLabel}>Supplier</label>
                  <div className="flex gap-2">
                    <select
                      name="supplier_id"
                      value={form.supplier_id}
                      onChange={handleChange}
                      className="input flex-1"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowSupplierModal(true)} className={newBtn}>
                      + New
                    </button>
                  </div>
                </div>

                <div>
                  <label className={fieldLabel}>Purchase Date</label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={form.purchase_date}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={fieldLabel}>Unit Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="unit_cost"
                    value={form.unit_cost}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className={fieldLabel}>Minimum Quantity</label>
                  <input
                    type="number"
                    min="0"
                    name="min_qty"
                    value={form.min_qty}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
              <p className={sectionHeading}>Additional Information</p>
              <div className="space-y-4">
                <div>
                  <label className={fieldLabel}>Notes</label>
                  <textarea
                    name="notes"
                    rows={4}
                    value={form.notes}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Additional accessory notes..."
                  />
                </div>

                <div>
                  <label className={fieldLabel}>Attachment</label>
                  <input
                    type="file"
                    name="file"
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Accessory"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/accessories")}
                className={cancelBtn}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
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
                className="input w-full"
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
                className="input w-full"
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
                className="input w-full"
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
              <input className="input w-full" placeholder="Name"
                value={newManufacturer.name}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, name: e.target.value })} />
              <input className="input w-full" placeholder="Email"
                value={newManufacturer.contact_email}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, contact_email: e.target.value })} />
              <input className="input w-full" placeholder="Phone"
                value={newManufacturer.contact_phone}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, contact_phone: e.target.value })} />
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
              <input className="input w-full" placeholder="Name"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
              <input className="input w-full" placeholder="Contact Person"
                value={newSupplier.contact_person}
                onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} />
              <input className="input w-full" placeholder="Email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} />
              <input className="input w-full" placeholder="Phone"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
              <input className="input w-full" placeholder="Address"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={createSupplier} className={saveBtn}>Save</button>
              <button type="button" onClick={() => setShowSupplierModal(false)} className={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}