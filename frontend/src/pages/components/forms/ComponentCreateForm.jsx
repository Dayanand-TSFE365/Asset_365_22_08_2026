//ComponentCreateForm.jsx
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

export default function ComponentCreateForm() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("access_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [loading, setLoading] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [locations, setLocations] = useState([]);

  const [form, setForm] = useState({
    name: "",
    company_id: "",
    category_id: "",
    supplier_id: "",
    manufacturer_id: "",
    location_id: "",
    serial_no: "",
    model_no: "",
    order_number: "",
    purchase_date: "",
    unit_cost: "",
    total_qty: "",
    min_qty: "",
    notes: "",
    image: null,
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
      console.error("Dropdown load failed:", error);
    }
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

      await axios.post(API.CREATE_COMPONENT, payload, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Component created successfully!");
      navigate("/components");
    } catch (error) {
      console.error(error.response?.data || error);
      toast.error(
        JSON.stringify(
          error.response?.data?.detail || "Create failed",
          null,
          2
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const input = "input w-full";
  const label =
    "block text-xs font-semibold uppercase text-zinc-500 mb-1";

  const renderSelect = (name, labelText, options) => (
    <div>
      <label className={label}>{labelText}</label>
      <select
        name={name}
        value={form[name]}
        onChange={handleChange}
        className={input}
      >
        <option value="">Select {labelText}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
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
  setNewManufacturer({
    name: "",
    contact_email: "",
    contact_phone: "",
  });
};

const createSupplier = async () => {
  const res = await axios.post(API.CREATE_SUPPLIER, newSupplier, { headers });
  setSuppliers((prev) => [...prev, res.data]);
  setForm((prev) => ({ ...prev, supplier_id: res.data.id }));
  setShowSupplierModal(false);
  setNewSupplier({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
  });
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


  return (
    <div className="h-full overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 p-6 rounded-xl shadow">
        <h1 className="text-lg font-bold mb-4">Create Component</h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* BASIC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Name</label>
              <input name="name" required value={form.name} onChange={handleChange} className={input}/>
            </div>

            <div>
              <label className={label}>Total Quantity</label>
              <input type="number" name="total_qty" required value={form.total_qty} onChange={handleChange} className={input}/>
            </div>
          </div>

          {/* CLASSIFICATION */}
          <div className="grid grid-cols-2 gap-4">
            {/* COMPANY */}
            <div className="flex gap-2">
                <div className="flex-1">
                {renderSelect("company_id", "Company", companies)}
                </div>
                <button
                type="button"
                onClick={() => setShowCompanyModal(true)}
                className="px-3 py-2 text-xs bg-blue-100 text-blue-600 rounded-lg self-end"
                >
                + New
                </button>
            </div>

            {/* CATEGORY */}
            <div className="flex gap-2">
                <div className="flex-1">
                {renderSelect("category_id", "Category", categories)}
                </div>
                <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="px-3 py-2 text-xs bg-blue-100 text-blue-600 rounded-lg self-end"
                >
                + New
                </button>
            </div>

            {/* MANUFACTURER */}
            <div className="flex gap-2">
                <div className="flex-1">
                {renderSelect("manufacturer_id", "Manufacturer", manufacturers)}
                </div>
                <button
                type="button"
                onClick={() => setShowManufacturerModal(true)}
                className="px-3 py-2 text-xs bg-blue-100 text-blue-600 rounded-lg self-end"
                >
                + New
                </button>
            </div>

            {/* SUPPLIER */}
            <div className="flex gap-2">
                <div className="flex-1">
                {renderSelect("supplier_id", "Supplier", suppliers)}
                </div>
                <button
                type="button"
                onClick={() => setShowSupplierModal(true)}
                className="px-3 py-2 text-xs bg-blue-100 text-blue-600 rounded-lg self-end"
                >
                + New
                </button>
            </div>

            {/* LOCATION */}
            <div className="flex gap-2">
                <div className="flex-1">
                {renderSelect("location_id", "Location", locations)}
                </div>
                <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="px-3 py-2 text-xs bg-blue-100 text-blue-600 rounded-lg self-end"
                >
                + New
                </button>
            </div>
          </div>

          {/* DETAILS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Serial No</label>
              <input name="serial_no" value={form.serial_no} onChange={handleChange} className={input}/>
            </div>

            <div>
              <label className={label}>Model No</label>
              <input name="model_no" value={form.model_no} onChange={handleChange} className={input}/>
            </div>

            <div>
              <label className={label}>Order Number</label>
              <input name="order_number" value={form.order_number} onChange={handleChange} className={input}/>
            </div>

            <div>
              <label className={label}>Purchase Date</label>
              <input type="date" name="purchase_date" value={form.purchase_date} onChange={handleChange} className={input}/>
            </div>
          </div>

          {/* COST */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Unit Cost</label>
              <input type="number" name="unit_cost" value={form.unit_cost} onChange={handleChange} className={input}/>
            </div>

            <div>
              <label className={label}>Min Quantity</label>
              <input type="number" name="min_qty" value={form.min_qty} onChange={handleChange} className={input}/>
            </div>
          </div>

          {/* NOTES */}
          <div>
            <label className={label}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} className={input}/>
          </div>

          {/* IMAGE */}
          <div>
            <label className={label}>Image</label>
            <input type="file" name="image" onChange={handleChange} className={input}/>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded"
            >
              {loading ? "Creating..." : "Create Component"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/components")}
              className="border px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Create Category</h2>
            <input
                className="input w-full"
                placeholder="Category Name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ name: e.target.value })}
            />
            <div className="flex justify-end gap-2">
                <button onClick={() => setShowCategoryModal(false)} className="border px-3 py-1 rounded">
                Cancel
                </button>
                <button onClick={createCategory} className="bg-blue-600 text-white px-3 py-1 rounded">
                Save
                </button>
            </div>
            </div>
        </div>
     )}
     {showManufacturerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-3">
            <h2 className="text-lg font-semibold">Create Manufacturer</h2>

            <input className="input" placeholder="Name"
                value={newManufacturer.name}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, name: e.target.value })}
            />

            <input className="input" placeholder="Email"
                value={newManufacturer.contact_email}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, contact_email: e.target.value })}
            />

            <input className="input" placeholder="Phone"
                value={newManufacturer.contact_phone}
                onChange={(e) => setNewManufacturer({ ...newManufacturer, contact_phone: e.target.value })}
            />

            <div className="flex justify-end gap-2">
                <button onClick={() => setShowManufacturerModal(false)} className="border px-3 py-1 rounded">
                Cancel
                </button>
                <button onClick={createManufacturer} className="bg-blue-600 text-white px-3 py-1 rounded">
                Save
                </button>
            </div>
            </div>
        </div>
      )}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-3">
            <h2 className="text-lg font-semibold">Create Supplier</h2>

            <input className="input" placeholder="Name"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
            />

            <input className="input" placeholder="Contact Person"
                value={newSupplier.contact_person}
                onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
            />

            <input className="input" placeholder="Email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
            />

            <input className="input" placeholder="Phone"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
            />

            <input className="input" placeholder="Address"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
            />

            <div className="flex justify-end gap-2">
                <button onClick={() => setShowSupplierModal(false)} className="border px-3 py-1 rounded">
                Cancel
                </button>
                <button onClick={createSupplier} className="bg-blue-600 text-white px-3 py-1 rounded">
                Save
                </button>
            </div>
            </div>
        </div>
      )}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Create New Company</h2>
            <input
                className="input w-full"
                placeholder="Company Name"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ name: e.target.value })}
            />
            <div className="flex justify-end gap-2">
                <button onClick={() => setShowCompanyModal(false)} className="border px-3 py-1 rounded">
                Cancel
                </button>
                <button onClick={createCompany} className="bg-blue-600 text-white px-3 py-1 rounded">
                Save
                </button>
            </div>
            </div>
        </div>
      )}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Create New Location</h2>
            <input
                className="input w-full"
                placeholder="Location Name"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ name: e.target.value })}
            />
            <div className="flex justify-end gap-2">
                <button onClick={() => setShowLocationModal(false)} className="border px-3 py-1 rounded">
                Cancel
                </button>
                <button onClick={createLocation} className="bg-blue-600 text-white px-3 py-1 rounded">
                Save
                </button>
            </div>
            </div>
        </div>
      )}
    </div>
  );
}