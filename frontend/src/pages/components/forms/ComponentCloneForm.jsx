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

export default function ComponentCloneForm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const component = state?.data || {};

  const token = sessionStorage.getItem("access_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [companies, setCompanies] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  // ✅ NEW MODAL STATES
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showManufacturerModal, setShowManufacturerModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

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

  const [form, setForm] = useState({
    name: component.name || "",
    company_id: component.company_id || "",
    category_id: component.category_id || "",
    supplier_id: component.supplier_id || "",
    manufacturer_id: component.manufacturer_id || "",
    location_id: component.location_id || "",
    serial_no: component.serial_no || "",
    model_no: component.model_no || "",
    order_number: component.order_number || "",
    purchase_date: component.purchase_date || "",
    unit_cost: component.unit_cost || "",
    total_qty: component.total_qty || "",
    min_qty: component.min_qty || "",
    notes: component.notes || "",
  });

  useEffect(() => {
    Promise.all([
      axios.get(API.GET_COMPANIES, { headers }),
      axios.get(API.GET_MANUFACTURERS, { headers }),
      axios.get(API.GET_CATEGORIES, { headers }),
      axios.get(API.GET_SUPPLIERS, { headers }),
      axios.get(API.GET_LOCATIONS, { headers }),
    ])
      .then(([c, m, cat, s, l]) => {
        setCompanies(safeArray(c));
        setManufacturers(safeArray(m));
        setCategories(safeArray(cat));
        setSuppliers(safeArray(s));
        setLocations(safeArray(l));
      })
      .catch((err) => console.error("Master load failed:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  // ✅ CREATE MASTER DATA
  const createCategory = async () => {
    const res = await axios.post(API.CREATE_CATEGORY, newCategory, { headers });
    setCategories((p) => [...p, res.data]);
    setForm((p) => ({ ...p, category_id: res.data.id }));
    setShowCategoryModal(false);
    setNewCategory({ name: "" });
  };

  const createManufacturer = async () => {
    const res = await axios.post(API.CREATE_MANUFACTURER, newManufacturer, { headers });
    setManufacturers((p) => [...p, res.data]);
    setForm((p) => ({ ...p, manufacturer_id: res.data.id }));
    setShowManufacturerModal(false);
  };

  const createSupplier = async () => {
    const res = await axios.post(API.CREATE_SUPPLIER, newSupplier, { headers });
    setSuppliers((p) => [...p, res.data]);
    setForm((p) => ({ ...p, supplier_id: res.data.id }));
    setShowSupplierModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null) formData.append(k, v);
      });

      if (file) formData.append("image", file);

      await axios.post(API.CREATE_COMPONENT, formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Component cloned successfully!");
      navigate("/components");
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error("Clone failed");
    } finally {
      setLoading(false);
    }
  };

  const input = "input w-full";
  const label = "text-xs font-semibold uppercase mb-1";

  const renderSelect = (name, labelText, list) => (
    <div>
      <label className={label}>{labelText}</label>
      <select name={name} value={form[name]} onChange={handleChange} className={input}>
        <option value="">Select {labelText}</option>
        {list.map((i) => (
          <option key={i.id} value={i.id}>{i.name}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 p-6 rounded-xl shadow">
        <h1 className="text-lg font-bold mb-4">
          Clone Component
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Name</label>
              <input name="name" value={form.name} onChange={handleChange} className={input} required />
            </div>

            <div>
              <label className={label}>Total Qty</label>
              <input type="number" name="total_qty" value={form.total_qty} onChange={handleChange} className={input} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">

            {renderSelect("company_id", "Company", companies)}

            {/* CATEGORY */}
            <div className="flex gap-2">
              <div className="flex-1">
                {renderSelect("category_id", "Category", categories)}
              </div>
              <button type="button" onClick={() => setShowCategoryModal(true)}
                className="px-3 py-2 text-xs bg-blue-100 text-blue-600 rounded-lg self-end">
                + New
              </button>
            </div>

            {/* MANUFACTURER */}
            <div className="flex gap-2">
              <div className="flex-1">
                {renderSelect("manufacturer_id", "Manufacturer", manufacturers)}
              </div>
              <button type="button" onClick={() => setShowManufacturerModal(true)}
                className="px-3 py-2 text-xs bg-blue-100 text-blue-600 rounded-lg self-end">
                + New
              </button>
            </div>

            {/* SUPPLIER */}
            <div className="flex gap-2">
              <div className="flex-1">
                {renderSelect("supplier_id", "Supplier", suppliers)}
              </div>
              <button type="button" onClick={() => setShowSupplierModal(true)}
                className="px-3 py-2 text-xs bg-blue-100 text-blue-600 rounded-lg self-end">
                + New
              </button>
            </div>

            {renderSelect("location_id", "Location", locations)}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input name="serial_no" placeholder="Serial No" value={form.serial_no} onChange={handleChange} className={input}/>
            <input name="model_no" placeholder="Model No" value={form.model_no} onChange={handleChange} className={input}/>
            <input name="order_number" placeholder="Order Number" value={form.order_number} onChange={handleChange} className={input}/>
            <input type="date" name="purchase_date" value={form.purchase_date} onChange={handleChange} className={input}/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="number" name="unit_cost" placeholder="Unit Cost" value={form.unit_cost} onChange={handleChange} className={input}/>
            <input type="number" name="min_qty" placeholder="Min Qty" value={form.min_qty} onChange={handleChange} className={input}/>
          </div>

          <textarea name="notes" value={form.notes} onChange={handleChange} className={input} placeholder="Notes" />

          <input type="file" onChange={handleFileChange} className={input} />

          <div className="flex gap-3">
            <button className="bg-blue-600 text-white px-5 py-2 rounded">
              {loading ? "Cloning..." : "Clone Component"}
            </button>

            <button type="button" onClick={() => navigate("/components")} className="border px-4 py-2 rounded">
              Cancel
            </button>
          </div>

        </form>
      </div>
      {/* CATEGORY MODAL */}
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
            <button
            onClick={() => setShowCategoryModal(false)}
            className="border px-3 py-1 rounded"
            >
            Cancel
            </button>

            <button
            onClick={createCategory}
            className="bg-blue-600 text-white px-3 py-1 rounded"
            >
            Save
            </button>
        </div>
        </div>
    </div>
    )}

    {/* MANUFACTURER MODAL */}
    {showManufacturerModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-3">
        <h2 className="text-lg font-semibold">Create Manufacturer</h2>

        <input
            className="input"
            placeholder="Name"
            value={newManufacturer.name}
            onChange={(e) =>
            setNewManufacturer({ ...newManufacturer, name: e.target.value })
            }
        />

        <input
            className="input"
            placeholder="Email"
            value={newManufacturer.contact_email}
            onChange={(e) =>
            setNewManufacturer({
                ...newManufacturer,
                contact_email: e.target.value,
            })
            }
        />

        <input
            className="input"
            placeholder="Phone"
            value={newManufacturer.contact_phone}
            onChange={(e) =>
            setNewManufacturer({
                ...newManufacturer,
                contact_phone: e.target.value,
            })
            }
        />

        <div className="flex justify-end gap-2">
            <button
            onClick={() => setShowManufacturerModal(false)}
            className="border px-3 py-1 rounded"
            >
            Cancel
            </button>

            <button
            onClick={createManufacturer}
            className="bg-blue-600 text-white px-3 py-1 rounded"
            >
            Save
            </button>
        </div>
        </div>
    </div>
    )}

    {/* SUPPLIER MODAL */}
    {showSupplierModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-3">
        <h2 className="text-lg font-semibold">Create Supplier</h2>

        <input
            className="input"
            placeholder="Name"
            value={newSupplier.name}
            onChange={(e) =>
            setNewSupplier({ ...newSupplier, name: e.target.value })
            }
        />

        <input
            className="input"
            placeholder="Contact Person"
            value={newSupplier.contact_person}
            onChange={(e) =>
            setNewSupplier({
                ...newSupplier,
                contact_person: e.target.value,
            })
            }
        />

        <input
            className="input"
            placeholder="Email"
            value={newSupplier.email}
            onChange={(e) =>
            setNewSupplier({ ...newSupplier, email: e.target.value })
            }
        />

        <input
            className="input"
            placeholder="Phone"
            value={newSupplier.phone}
            onChange={(e) =>
            setNewSupplier({ ...newSupplier, phone: e.target.value })
            }
        />

        <input
            className="input"
            placeholder="Address"
            value={newSupplier.address}
            onChange={(e) =>
            setNewSupplier({ ...newSupplier, address: e.target.value })
            }
        />

        <div className="flex justify-end gap-2">
            <button
            onClick={() => setShowSupplierModal(false)}
            className="border px-3 py-1 rounded"
            >
            Cancel
            </button>

            <button
            onClick={createSupplier}
            className="bg-blue-600 text-white px-3 py-1 rounded"
            >
            Save
            </button>
        </div>
        </div>
    </div>
    )}
    </div>
  );
}