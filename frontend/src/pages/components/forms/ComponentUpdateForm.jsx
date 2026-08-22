import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { API } from "../../../config/api";

export default function ComponentUpdateForm({ data }) {
  const navigate = useNavigate();
  const componentId = data?.id;

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

    company_id: data?.company_id || data?.company?.id || "",
    category_id: data?.category_id || data?.category?.id || "",
    supplier_id: data?.supplier_id || data?.supplier?.id || "",
    manufacturer_id: data?.manufacturer_id || data?.manufacturer?.id || "",
    location_id: data?.location_id || data?.location?.id || "",

    serial_no: data?.serial_no || "",
    model_no: data?.model_no || "",
    order_number: data?.order_number || "",
    purchase_date: data?.purchase_date?.split("T")[0] || "",

    unit_cost: data?.unit_cost?.toString().replace("₹", "") || "",
    total_qty: data?.total_qty ?? 0,
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

    if (!componentId) {
      toast.error("Component ID not found.");
      return;
    }

    try {
      setLoading(true);

      const token = sessionStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const payload = new FormData();

      payload.append("name", formData.name);
      payload.append("company_id", Number(formData.company_id) || 0);
      payload.append("category_id", Number(formData.category_id) || 0);
      payload.append("supplier_id", Number(formData.supplier_id) || 0);
      payload.append("manufacturer_id", Number(formData.manufacturer_id) || 0);
      payload.append("location_id", Number(formData.location_id) || 0);

      payload.append("serial_no", formData.serial_no || "");
      payload.append("model_no", formData.model_no || "");
      payload.append("order_number", formData.order_number || "");
      payload.append("purchase_date", formData.purchase_date || "");

      payload.append("unit_cost", Number(formData.unit_cost) || 0);
      payload.append("total_qty", Number(formData.total_qty) || 0);
      payload.append("min_qty", Number(formData.min_qty) || 0);

      payload.append("notes", formData.notes || "");

      if (formData.file) {
        payload.append("file", formData.file);
      }

      await axios.patch(API.UPDATE_COMPONENT(componentId), payload, {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "multipart/form-data",
  },
});

      toast.success("Component updated successfully!");
      navigate("/components");
    } catch (error) {
      console.error("Update failed:", error.response?.data || error);
      toast.error(error.response?.data?.detail || "Failed to update component.");
    } finally {
      setLoading(false);
    }
  };

  const FormInput = ({ label, name, type = "text" }) => (
    <div>
      <label className="block mb-2 font-medium">{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name] || ""}
        onChange={handleChange}
        className="input w-full"
      />
    </div>
  );

  const FormSelect = ({ label, name, options }) => (
    <div>
      <label className="block mb-2 font-medium">{label}</label>
      <select
        name={name}
        value={formData[name] || ""}
        onChange={handleChange}
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="max-w-6xl mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">
            Update Component - {formData.name}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <FormInput label="Component Name" name="name" />

              <FormSelect label="Company" name="company_id" options={masters.companies} />

              <FormSelect label="Category" name="category_id" options={masters.categories} />

              <FormSelect label="Manufacturer" name="manufacturer_id" options={masters.manufacturers} />

              <FormSelect label="Supplier" name="supplier_id" options={masters.suppliers} />

              <FormSelect label="Location" name="location_id" options={masters.locations} />

              <FormInput label="Serial No" name="serial_no" />
              <FormInput label="Model No" name="model_no" />
              <FormInput label="Order Number" name="order_number" />
              <FormInput label="Purchase Date" name="purchase_date" type="date" />

              <FormInput label="Unit Cost" name="unit_cost" type="number" />
              <FormInput label="Total Quantity" name="total_qty" type="number" />
              <FormInput label="Minimum Quantity" name="min_qty" type="number" />

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
                {loading ? "Updating..." : "Update Component"}
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