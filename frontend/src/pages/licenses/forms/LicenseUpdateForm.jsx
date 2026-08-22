

// LicenseUpdateForm.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API } from "../../../config/api";

export default function LicenseUpdateForm({ data }) {
  const navigate = useNavigate();
  const licenseId = data?.id;

  const [loading, setLoading] = useState(false);
  const [masters, setMasters] = useState({
    companies: [],
    categories: [],
    manufacturers: [],
    suppliers: [],
    users: [],
  });

  const [formData, setFormData] = useState({
    Software_name: data?.Software_name || "",
    product_key: data?.product_key || "",
    total: data?.total || 0,
    min_qty: data?.min_qty || 0,
    category_id: data?.category_id || "",
    company_id: data?.company_id || "",
    manufacturer_id: data?.manufacturer_id || "",
    supplier_id: data?.supplier_id || "",
    licensed_to: data?.licensed_to || "",
    licensed_to_email: data?.licensed_to_email || "",
    reassignable: Boolean(data?.reassignable),
    maintained: Boolean(data?.maintained),
    order_number: data?.order_number || "",
    purchase_order_number: data?.purchase_order_number || "",
    purchase_cost: data?.purchase_cost || 0,
    depreciation: data?.depreciation || 0,
    purchase_date: data?.purchase_date?.split("T")[0] || "",
    expiration_date: data?.expiration_date?.split("T")[0] || "",
    termination_date: data?.termination_date?.split("T")[0] || "",
    notes: data?.notes || "",
  });

  useEffect(() => {
  const fetchMasters = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [companies, categories, manufacturers, suppliers, users] =
        await Promise.all([
          axios.get(API.GET_COMPANIES, { headers }),
          axios.get(API.GET_CATEGORIES, { headers }),
          axios.get(API.GET_MANUFACTURERS, { headers }),
          axios.get(API.GET_SUPPLIERS, { headers }),
          axios.get(API.GET_USERS, { headers }),
        ]);

      setMasters({
        companies: companies.data || [],
        categories: categories.data || [],
        manufacturers: manufacturers.data || [],
        suppliers: suppliers.data || [],
        users: users.data || [],
      });
    } catch (error) {
      console.error("Failed to load master data:", error);
    }
  };

  fetchMasters();
}, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLicensedToChange = (e) => {
    const selectedUserId = Number(e.target.value);

    const selectedUser = masters.users.find(
        (user) => user.id === selectedUserId
    );

    setFormData((prev) => ({
        ...prev,
        checkout_to: selectedUserId,
        licensed_to_email: selectedUser?.name || "",
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!licenseId) {
    toast.error("License ID not found.");
    return;
  }

  try {
    setLoading(true);

    const token = sessionStorage.getItem("access_token");

    const payload = {
      Software_name: formData.Software_name,
      product_key: formData.product_key || null,
      total: Number(formData.total) || 0,
      min_qty: Number(formData.min_qty) || 0,
      category_id: Number(formData.category_id) || null,
      company_id: Number(formData.company_id) || null,
      manufacturer_id: Number(formData.manufacturer_id) || null,
      supplier_id: Number(formData.supplier_id) || null,
      licensed_to: formData.licensed_to || null,
      licensed_to_email: formData.licensed_to_email || null,
      reassignable: Boolean(formData.reassignable),
      maintained: Boolean(formData.maintained),
      order_number: formData.order_number || null,
      purchase_order_number: formData.purchase_order_number || null,
      purchase_cost: Number(formData.purchase_cost) || 0,
      depreciation: Number(formData.depreciation) || 0,
      purchase_date: formData.purchase_date || null,
      expiration_date: formData.expiration_date || null,
      termination_date: formData.termination_date || null,
      notes: formData.notes || null,
    };

    await axios.put(
      API.UPDATE_LICENSE(licenseId),
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    toast.success("License updated successfully!");
    navigate(-1);
  } catch (error) {
    console.error("Update failed:", error.response?.data || error);
    toast.error(error.response?.data?.detail || "Failed to update license.");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="max-w-6xl mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">
            Update License - {formData.Software_name}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormSelect
                label="Company"
                name="company_id"
                value={formData.company_id}
                onChange={handleChange}
                options={masters.companies}
                valueKey="company_id"
                labelKey="company_name"
              />

              <FormInput label="License Name" name="Software_name" value={formData.Software_name} onChange={handleChange} />
              <FormInput label="Product Key" name="product_key" value={formData.product_key} onChange={handleChange} />
              <FormInput label="Total Licenses" name="total" type="number" value={formData.total} onChange={handleChange} />
              <FormInput label="Minimum Quantity" name="min_qty" type="number" value={formData.min_qty} onChange={handleChange} />

              <FormSelect
                label="Category"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                options={masters.categories}
                valueKey="category_id"
                labelKey="category_name"
              />

              <FormSelect
                label="Manufacturer"
                name="manufacturer_id"
                value={formData.manufacturer_id}
                onChange={handleChange}
                options={masters.manufacturers}
                valueKey="manufacturer_id"
                labelKey="manufacturer_name"
              />

              <FormSelect
                label="Supplier"
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                options={masters.suppliers}
                valueKey="supplier_id"
                labelKey="supplier_name"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block mb-2 font-medium">
                    Licensed To Email
                    </label>
                    <select
                    name="checkout_to"
                    value={formData.checkout_to}
                    onChange={handleLicensedToChange}
                    className="input w-full"
                    >
                    <option value="">Select User</option>
                    {masters.users.map((user) => (
                        <option key={user.id} value={user.id}>
                        {user.email || user.name}
                        </option>
                    ))}
                    </select>
                </div>

                <FormInput
                    label="Licensed To Name"
                    name="licensed_to"
                    value={formData.licensed_to}
                    onChange={handleChange}
                />
              </div>

              <FormInput label="Order Number" name="order_number" value={formData.order_number} onChange={handleChange} />
              <FormInput label="Purchase Order Number" name="purchase_order_number" value={formData.purchase_order_number} onChange={handleChange} />
              <FormInput label="Purchase Cost" name="purchase_cost" type="number" value={formData.purchase_cost} onChange={handleChange} />
              <FormInput label="Depreciation" name="depreciation" type="number" value={formData.depreciation} onChange={handleChange} />
              <FormInput label="Purchase Date" name="purchase_date" type="date" value={formData.purchase_date} onChange={handleChange} />
              <FormInput label="Expiration Date" name="expiration_date" type="date" value={formData.expiration_date} onChange={handleChange} />
              <FormInput label="Termination Date" name="termination_date" type="date" value={formData.termination_date} onChange={handleChange} />
            </div>

            <div>
              <label className="block mb-2 font-medium">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="input w-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="reassignable"
                  checked={formData.reassignable}
                  onChange={handleChange}
                />
                Reassignable
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="maintained"
                  checked={formData.maintained}
                  onChange={handleChange}
                />
                Maintained
              </label>
            </div>

            <div className="flex gap-4 pb-8">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update License"}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="border px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FormInput({ label, name, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block mb-2 font-medium">{label}</label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        className="input w-full"
      />
    </div>
  );
}

function FormSelect({ label, name, value, onChange, options, valueKey, labelKey }) {
  return (
    <div>
      <label className="block mb-2 font-medium">{label}</label>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className="input w-full"
      >
        <option value="">Select {label}</option>
        {options.map((item) => (
          <option key={item[valueKey] || item.id} value={item[valueKey] || item.id}>
            {item[labelKey] || item.name}
          </option>
        ))}
      </select>
    </div>
  );
}