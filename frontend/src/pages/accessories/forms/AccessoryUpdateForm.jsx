// AccessoryUpdateForm.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { API } from "../../../config/api";

export default function AccessoriesUpdateForm({ data }) {
  const navigate = useNavigate();
  const accessoryId = data?.id;

  const [loading, setLoading] = useState(false);
  const [masters, setMasters] = useState({
    companies: [],
    categories: [],
    manufacturers: [],
    suppliers: [],
    locations: [],
  });

  const [formData, setFormData] = useState({
    name: data?.name || "",
    company_id: data?.company_id || "",
    category_id: data?.category_id || "",
    supplier_id: data?.supplier_id || "",
    manufacturer_id: data?.manufacturer_id || "",
    location_id: data?.location_id || "",
    model_no: data?.model_no || "",
    // item_no: data?.item_no || "",
    order_number: data?.order_number || "",
    purchase_date: data?.purchase_date?.split("T")[0] || "",
    unit_cost: data?.unit_cost?.toString().replace("₹", "") || "",
    quantity: data?.total_qty ?? 0,
    min_qty: data?.min_qty || 0,
    notes: data?.notes || "",
    file: null,
  });

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const token = sessionStorage.getItem("access_token");
        const headers = { Authorization: `Bearer ${token}` };

        const [companies, categories, manufacturers, suppliers, locations] =
          await Promise.all([
            axios.get(API.GET_COMPANIES, { headers }),
            axios.get(API.GET_CATEGORIES, { headers }),
            axios.get(API.GET_MANUFACTURERS, { headers }),
            axios.get(API.GET_SUPPLIERS, { headers }),
            axios.get(API.GET_LOCATIONS, { headers }),
          ]);

        setMasters({
          companies: companies.data || [],
          categories: categories.data || [],
          manufacturers: manufacturers.data || [],
          suppliers: suppliers.data || [],
          locations: locations.data || [],
        });
      } catch (error) {
        console.error("Failed to load master data:", error);
      }
    };

    fetchMasters();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!accessoryId) {
      toast.error("Accessory ID not found.");
      return;
    }

    try {
      setLoading(true);

      const token = sessionStorage.getItem("access_token");
      const payload = new FormData();

      payload.append("name", formData.name);
      payload.append("company_id", Number(formData.company_id));
      payload.append("category_id", Number(formData.category_id));
      payload.append("supplier_id", Number(formData.supplier_id));
      payload.append("manufacturer_id", Number(formData.manufacturer_id));
      payload.append("location_id", Number(formData.location_id));
      payload.append("model_no", formData.model_no || "");
    //   payload.append("item_no", formData.item_no || "");
      payload.append("order_number", formData.order_number || "");
      payload.append("purchase_date", formData.purchase_date || "");
      payload.append("unit_cost", Number(formData.unit_cost) || 0);
      payload.append("quantity", Number(formData.quantity) || 0);
      payload.append("min_qty", Number(formData.min_qty) || 0);
      payload.append("notes", formData.notes || "");

      if (formData.file) {
        payload.append("file", formData.file);
      }

      await axios.put(API.UPDATE_ACCESSORY(accessoryId), payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Accessory updated successfully!");
      navigate("/accessories");
    } catch (error) {
      console.error("Update failed:", error.response?.data || error);
      toast.error(error.response?.data?.detail || "Failed to update accessory.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="max-w-6xl mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">
            Update Accessory - {formData.name}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormSelect
                label="Company"
                name="company_id"
                value={formData.company_id}
                onChange={handleChange}
                options={masters.companies}
              />

              <FormInput
                label="Accessory Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />

              <FormSelect
                label="Category"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                options={masters.categories}
              />

              <FormSelect
                label="Manufacturer"
                name="manufacturer_id"
                value={formData.manufacturer_id}
                onChange={handleChange}
                options={masters.manufacturers}
              />

              <FormSelect
                label="Supplier"
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                options={masters.suppliers}
              />

              <FormSelect
                label="Location"
                name="location_id"
                value={formData.location_id}
                onChange={handleChange}
                options={masters.locations}
              />

              <FormInput
                label="Model Number"
                name="model_no"
                value={formData.model_no}
                onChange={handleChange}
              />

              {/* <FormInput
                label="Item Number"
                name="item_no"
                value={formData.item_no}
                onChange={handleChange}
              /> */}

              <FormInput
                label="Order Number"
                name="order_number"
                value={formData.order_number}
                onChange={handleChange}
              />

              <FormInput
                label="Purchase Date"
                name="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={handleChange}
              />

              <FormInput
                label="Unit Cost"
                name="unit_cost"
                type="number"
                value={formData.unit_cost}
                onChange={handleChange}
              />

              <FormInput
                label="Total Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
              />

              <FormInput
                label="Minimum Quantity"
                name="min_qty"
                type="number"
                value={formData.min_qty}
                onChange={handleChange}
              />

              <div>
                <label className="block mb-2 font-medium">Upload File</label>
                <input
                  type="file"
                  name="file"
                  onChange={handleChange}
                  className="input w-full"
                />
              </div>
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

            <div className="flex gap-4 pb-8">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Accessory"}
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
        value={value || ""}
        onChange={onChange}
        className="input w-full"
      />
    </div>
  );
}

function FormSelect({ label, name, value, onChange, options }) {
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
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}