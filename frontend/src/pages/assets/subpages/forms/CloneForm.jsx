import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API } from "../../../../config/api";

const safeArray = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.items)) return d.items;
  return [];
};

export default function CloneForm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const asset = state?.data || {};

  const [companies, setCompanies] = useState([]);
  const [models, setModels] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [formData, setFormData] = useState({
    asset_name: asset.asset_name || asset.name || "",
    company: asset.company_id || "",
    asset_tag: asset.asset_tag || asset.tag || "",
    serial_number: asset.serial_number || asset.serial || "",
    model: asset.model_id || "",
    status: asset.status_id || "",
    location: asset.location_id || "",
    supplier: asset.supplier_id || "",
    purchase_cost: asset.cost || "",
    depreciation_months: asset.depreciation_months || "",
    warranty_months: asset.warranty_months || "",
    eol_date: asset.eol_date && asset.eol_date !== "-" ? asset.eol_date : "",
    order_number: asset.order_number || "",
    notes: asset.notes || "",
    requestable: Boolean(asset.requestable),
    byod: Boolean(asset.byod),
    image: null,
  });

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const token = sessionStorage.getItem("access_token");
        const headers = { Authorization: `Bearer ${token}` };

        const [companiesRes, modelsRes, statusesRes, locationsRes, suppliersRes] = await Promise.all([
          axios.get(API.GET_COMPANIES, { headers }),
          axios.get(API.GET_MODELS, { headers }),
          axios.get(API.GET_STATUS, { headers }),
          axios.get(API.GET_LOCATIONS, { headers }),
          axios.get(API.GET_SUPPLIERS, { headers }),
        ]);

        setCompanies(safeArray(companiesRes));
        setModels(safeArray(modelsRes));
        setStatuses(safeArray(statusesRes));
        setLocations(safeArray(locationsRes));
        setSuppliers(safeArray(suppliersRes));
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
      }
    };

    fetchDropdowns();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox"
        ? checked
        : type === "file"
        ? files[0]
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = new FormData();

      payload.append("asset_name", formData.asset_name);
      payload.append("asset_tag", formData.asset_tag);
      payload.append("serial_number", formData.serial_number);
      payload.append("company_id", formData.company);
      payload.append("model_id", formData.model);
      payload.append("status_id", formData.status);
      payload.append("location_id", formData.location || "");
      payload.append("supplier_id", formData.supplier || "");
      payload.append("purchase_cost", Number(formData.purchase_cost.replace(/[^0-9.]/g, "")));
      payload.append("depreciation_months", Number(formData.depreciation_months || 0));
      payload.append("current_value", asset.current_value || "");
      payload.append("purchase_date", asset.purchase_date || "");
      payload.append("expected_checkin_date", asset.expected_checkin_date || "");
      payload.append("next_audit_date", asset.next_audit_date || "");
      payload.append("warranty_months", formData.warranty_months || "");
      payload.append("warranty_expires", asset.warranty_expires || "");
      payload.append("eol_date", formData.eol_date || "");
      payload.append("order_number", formData.order_number || "");
      payload.append("notes", formData.notes || "");
      payload.append("requestable", formData.requestable);
      payload.append("byod", formData.byod);

      if (formData.image) {
        payload.append("file", formData.image);
      }

      for (let pair of payload.entries()) {
        console.log(pair[0], pair[1]);
      }

      await axios.post(API.CREATE_ASSET, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
        },
      });

      toast.success("Asset cloned successfully!");
      navigate("/assets");
    } catch (error) {
      console.error("Clone asset failed:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to clone asset.");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Clone Asset</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {asset.asset_tag || asset.tag || "Unknown Asset"} • {asset.asset_name || asset.name || "Unnamed Asset"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SelectField
              label="Company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              options={companies}
              placeholder="Select Company"
            />

            <InputField
              label="Asset Name *"
              name="asset_name"
              value={formData.asset_name}
              onChange={handleChange}
              placeholder="Enter asset name"
              required
            />

            <InputField
              label="Asset Tag *"
              name="asset_tag"
              value={formData.asset_tag}
              onChange={handleChange}
              placeholder="Enter new unique asset tag"
              required
            />

            <InputField
              label="Serial Number *"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
              placeholder="Enter new unique serial number"
              required
            />

            <SelectField
              label="Model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              options={models}
              placeholder="Select Model"
            />

            <SelectField
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={statuses}
              placeholder="Select Status"
            />

            <SelectField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              options={locations}
              placeholder="Select Location"
            />

            <SelectField
              label="Supplier"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              options={suppliers}
              placeholder="Select Supplier"
            />

            <InputField
              label="Purchase Cost"
              name="purchase_cost"
              value={formData.purchase_cost}
              onChange={handleChange}
            />

            <InputField
              label="Warranty (Months)"
              name="warranty_months"
              value={formData.warranty_months}
              onChange={handleChange}
            />

            <InputField
              label="EOL Date"
              type="date"
              name="eol_date"
              value={formData.eol_date}
              onChange={handleChange}
            />

            <InputField
              label="Order Number"
              name="order_number"
              value={formData.order_number}
              onChange={handleChange}
            />

            <InputField
              label="Depreciation (Months)"
              name="depreciation_months"
              value={formData.depreciation_months}
              onChange={handleChange}
            />
          </div>

          <TextAreaField
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <CheckboxField
              label="Requestable"
              name="requestable"
              checked={formData.requestable}
              onChange={handleChange}
            />

            <CheckboxField
              label="BYOD"
              name="byod"
              checked={formData.byod}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
              Image (Optional)
            </label>
            <input
              type="file"
              name="image"
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
            />
            <p className="text-xs text-zinc-500 mt-2">Leave empty to keep the existing image.</p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium"
            >
              Create Clone
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700"
            >
              Go Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
      />
    </div>
  );
}

function SelectField({ label, options, placeholder = "Select", ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <select
        {...props}
        className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <textarea
        {...props}
        rows={4}
        className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
      />
    </div>
  );
}

function CheckboxField({ label, ...props }) {
  return (
    <label className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
      <input type="checkbox" className="h-4 w-4" {...props} />
      {label}
    </label>
  );
}
