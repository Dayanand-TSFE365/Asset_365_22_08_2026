import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API } from "../../../../config/api";

export default function UpdateForm({ data }) {
  const navigate = useNavigate();
  const assetId = data?.asset_id || data?.id;

  const [masters, setMasters] = useState({
    companies: [],
    models: [],
    statuses: [],
    suppliers: [],
    locations: [],
  });

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    asset_tag: data?.asset_tag || data?.tag || "",
    asset_name: data?.asset_name || data?.name || "",
    serial_number: data?.serial_number || data?.serial || "",
    company_id: data?.company_id || "",
    model_id: data?.model_id || "",
    status_id: data?.status_id || "",
    supplier_id: data?.supplier_id || "",
    location_id: data?.location_id || "",
    purchase_cost: data?.purchase_cost || "",
    current_value: data?.current_value || data?.value || data?.asset_value || "",
    depreciation_months: data?.depreciation_months || "",
    purchase_date: data?.purchase_date?.split("T")[0] || "",
    expected_checkin_date: data?.expected_checkin_date?.split("T")[0] || "",
    next_audit_date: data?.next_audit_date?.split("T")[0] || "",
    warranty_months: data?.warranty_months || "",
    warranty_expires: data?.warranty_expires?.split("T")[0] || "",
    order_number: data?.order_number || "",
    notes: data?.notes || "",
    condition: data?.condition || "",
    eol_date: data?.eol_date?.split("T")[0] || "",
    requestable: Boolean(data?.requestable),
    byod: Boolean(data?.byod),
  });

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [companies, models, statuses, suppliers, locations] =
          await Promise.all([
            axios.get(API.GET_COMPANIES),
            axios.get(API.GET_MODELS),
            axios.get(API.GET_STATUS),
            axios.get(API.GET_SUPPLIERS),
            axios.get(API.GET_LOCATIONS),
          ]);

        setMasters({
          companies: companies.data || [],
          models: models.data || [],
          statuses: statuses.data || [],
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
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  const token = sessionStorage.getItem("access_token");

  console.log("TOKEN:", token); // 👈 ADD HERE

  if (!assetId) {
    toast.error("Asset ID not found.");
    return;
  }

  try {
    setLoading(true);

    const payload = {
      ...formData,
      company_id: Number(formData.company_id) || null,
      model_id: Number(formData.model_id) || null,
      status_id: Number(formData.status_id) || null,
      supplier_id: Number(formData.supplier_id) || null,
      location_id: Number(formData.location_id) || null,
      purchase_cost: Number(formData.purchase_cost) || 0,
      current_value: Number(formData.current_value) || 0,
      depreciation_months: Number(formData.depreciation_months) || 0,
      warranty_months: Number(formData.warranty_months) || 0,
    };

    await axios.put(
      API.UPDATE_ASSET(assetId),
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    toast.success("Asset updated successfully!");
    navigate(-1);
  } catch (error) {
    console.error("Update failed:", error.response?.data || error);
    toast.error(error.response?.data?.detail || "Failed to update asset.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="max-w-6xl mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">
            Update Asset - {formData.asset_tag}
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

              <FormInput
                label="Asset Tag"
                name="asset_tag"
                value={formData.asset_tag}
                onChange={handleChange}
              />

              <FormInput
                label="Asset Name"
                name="asset_name"
                value={formData.asset_name}
                onChange={handleChange}
              />

              <FormInput
                label="Serial Number"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
              />

              <FormSelect
                label="Model"
                name="model_id"
                value={formData.model_id}
                onChange={handleChange}
                options={masters.models}
                valueKey="model_id"
                labelKey="model_name"
              />

              <FormSelect
                label="Status"
                name="status_id"
                value={formData.status_id}
                onChange={handleChange}
                options={masters.statuses}
                valueKey="status_id"
                labelKey="status_name"
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

              <FormSelect
                label="Location"
                name="location_id"
                value={formData.location_id}
                onChange={handleChange}
                options={masters.locations}
                valueKey="location_id"
                labelKey="location_name"
              />

              <FormInput
                label="Purchase Cost"
                name="purchase_cost"
                type="number"
                value={formData.purchase_cost}
                onChange={handleChange}
              />

              <FormInput
                label="Current Value"
                name="current_value"
                type="number"
                value={formData.current_value}
                onChange={handleChange}
              />
              <FormInput
                label="Depreciation (Months)"
                name="depreciation_months"
                type="number"
                value={formData.depreciation_months}
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
                label="Expected Check-in Date"
                name="expected_checkin_date"
                type="date"
                value={formData.expected_checkin_date}
                onChange={handleChange}
              />

              <FormInput
                label="Next Audit Date"
                name="next_audit_date"
                type="date"
                value={formData.next_audit_date}
                onChange={handleChange}
              />

              <FormInput
                label="Warranty (Months)"
                name="warranty_months"
                type="number"
                value={formData.warranty_months}
                onChange={handleChange}
              />

              <FormInput
                label="Warranty Expires"
                name="warranty_expires"
                type="date"
                value={formData.warranty_expires}
                onChange={handleChange}
              />

              <FormInput
                label="EOL Date"
                name="eol_date"
                type="date"
                value={formData.eol_date}
                onChange={handleChange}
              />

              <FormInput
                label="Order Number"
                name="order_number"
                value={formData.order_number}
                onChange={handleChange}
              />

              <FormInput
                label="Condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
              />
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
                  name="requestable"
                  checked={formData.requestable}
                  onChange={handleChange}
                />
                Requestable
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="byod"
                  checked={formData.byod}
                  onChange={handleChange}
                />
                BYOD
              </label>
            </div>

            <div className="flex gap-4 pb-8">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Asset"}
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

function FormInput({
  label,
  name,
  value,
  onChange,
  type = "text",
}) {
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

function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  valueKey,
  labelKey,
}) {
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
          <option
            key={item[valueKey] || item.id}
            value={item[valueKey] || item.id}
          >
            {item[labelKey] || item.name}
          </option>
        ))}
      </select>
    </div>
  );
}