import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

import { API } from "../../../config/api";

export default function KitUpdateForm({ data }) {
  const navigate = useNavigate();

  const kitId = data?._id;

  const [loading, setLoading] = useState(false);

  const [assets, setAssets] = useState([]);
  const [models, setModels] = useState([]);
  const [accessories, setAccessories] =
    useState([]);
  const [components, setComponents] =
    useState([]);
  const [consumables, setConsumables] =
    useState([]);

  const [formData, setFormData] =
    useState({
      name: data?.name || "",
    });

  const [selectedAsset, setSelectedAsset] =
    useState("");

  const [
    selectedAccessory,
    setSelectedAccessory,
  ] = useState("");

  const [
    selectedComponent,
    setSelectedComponent,
  ] = useState("");

  const [
    selectedConsumable,
    setSelectedConsumable,
  ] = useState("");

  const [assetQty, setAssetQty] =
    useState(1);

  const [
    accessoryQty,
    setAccessoryQty,
  ] = useState(1);

  const [
    componentQty,
    setComponentQty,
  ] = useState(1);

  const [
    consumableQty,
    setConsumableQty,
  ] = useState(1);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const token =
        sessionStorage.getItem(
          "access_token"
        );

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        assetsRes,
        modelsRes,
        accessoriesRes,
        componentsRes,
        consumablesRes,
      ] = await Promise.all([
        axios.get(API.GET_ASSETS, {
          headers,
        }),
        axios.get(API.GET_MODELS, { headers }),

        axios.get(
          API.GET_ACCESSORIES,
          {
            headers,
          }
        ),

        axios.get(
          API.GET_COMPONENTS,
          {
            headers,
          }
        ),

        axios.get(
          API.GET_CONSUMABLES,
          {
            headers,
          }
        ),
      ]);

      setAssets(assetsRes.data || []);
      setModels(modelsRes.data || []);

      setAccessories(
        accessoriesRes.data?.items || []
      );

      setComponents(
        componentsRes.data || []
      );

      setConsumables(
        consumablesRes.data || []
      );
    } catch (error) {
      console.error(
        "Failed to fetch data:",
        error
      );
    }
  };

//   const modelMap = models.reduce((acc, m) => {
//   acc[m.id] = m.name;
//   return acc;
// }, {});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!kitId) {
      toast.error("Kit ID not found.");
      return;
    }

    try {
      setLoading(true);

      const token =
        sessionStorage.getItem(
          "access_token"
        );

      await axios.put(
        API.UPDATE_KIT(kitId),
        {
          name: formData.name,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      toast.success("Kit updated successfully!");
      navigate("/kits");
    } catch (error) {
      console.error(
        "Update failed:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to update kit."
      );
    } finally {
      setLoading(false);
    }
  };

  const addItemToKit = async (
    item_type,
    item_ref_id,
    quantity
  ) => {
    if (!kitId) {
      toast.error("Kit ID not found.");
      return;
    }

    if (!item_ref_id) {
      toast.error("Please select item.");
      return;
    }

    try {
      const token =
        sessionStorage.getItem(
          "access_token"
        );

      await axios.post(
        API.ADD_KIT_ITEM(kitId),
        {
          item_type,
          item_ref_id:
            Number(item_ref_id),
          quantity: Number(quantity),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      toast.success(
        `${item_type} added successfully!`
      );
    } catch (error) {
      console.error(
        "Add item failed:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.detail ||
          `Failed to add ${item_type}`
      );
    }
  };
  const assetOptions = assets.map((a) => ({
    ...a,
    display_name:
      models.find((m) => m.id === a.model_id)?.name ||
      "Unknown Model",
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="max-w-7xl mx-auto py-6">

          {/* HEADER */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              Update Kit -{" "}
              {formData.name}
            </h1>

            <p className="text-zinc-500 mt-1">
              Update kit details and
              manage kit items.
            </p>
          </div>

          {/* UPDATE FORM */}
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput
                label="Kit Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {loading
                  ? "Updating..."
                  : "Update Kit"}
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/kits")
                }
                className="border px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* ITEM CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

            {/* ASSETS */}
            <ItemCard
              title="Assets"
              value={selectedAsset}
              setValue={setSelectedAsset}
              quantity={assetQty}
              setQuantity={setAssetQty}
              options={assetOptions}
              valueField="model_id"
              labelField="display_name"
              buttonLabel="Add Asset"
              onAdd={() =>
              addItemToKit("asset", selectedAsset, assetQty)
              }
            />

            {/* ACCESSORIES */}
            <ItemCard
              title="Accessories"
              value={
                selectedAccessory
              }
              setValue={
                setSelectedAccessory
              }
              quantity={accessoryQty}
              setQuantity={
                setAccessoryQty
              }
              options={accessories}
              valueField="accessory_id"
              labelField="name"
              buttonLabel="Add Accessory"
              onAdd={() =>
                addItemToKit(
                  "accessory",
                  selectedAccessory,
                  accessoryQty
                )
              }
            />

            {/* COMPONENTS */}
            <ItemCard
              title="Components"
              value={
                selectedComponent
              }
              setValue={
                setSelectedComponent
              }
              quantity={componentQty}
              setQuantity={
                setComponentQty
              }
              options={components}
              valueField="id"
              labelField="name"
              buttonLabel="Add Component"
              onAdd={() =>
                addItemToKit(
                  "component",
                  selectedComponent,
                  componentQty
                )
              }
            />

            {/* CONSUMABLES */}
            <ItemCard
              title="Consumables"
              value={
                selectedConsumable
              }
              setValue={
                setSelectedConsumable
              }
              quantity={consumableQty}
              setQuantity={
                setConsumableQty
              }
              options={consumables}
              valueField="consumable_id"
              labelField="name"
              buttonLabel="Add Consumable"
              onAdd={() =>
                addItemToKit(
                  "consumable",
                  selectedConsumable,
                  consumableQty
                )
              }
            />

          </div>
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
      <label className="block mb-2 font-medium">
        {label}
      </label>

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

function ItemCard({
  title,
  value,
  setValue,
  quantity,
  setQuantity,
  options,
  valueField,
  labelField,
  buttonLabel,
  onAdd,
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-5 shadow">
      <h2 className="text-lg font-semibold mb-4">
        {title}
      </h2>

      <div className="space-y-4">

        <div>
          <label className="block mb-2 font-medium">
            Select {title}
          </label>

          <select
            value={value}
            onChange={(e) =>
              setValue(e.target.value)
            }
            className="input w-full"
          >
            <option value="">
              Select {title}
            </option>

            {options.map((item) => (
              <option
                key={item[valueField]}
                value={
                  item[valueField]
                }
              >
                {item[labelField]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Quantity
          </label>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                e.target.value
              )
            }
            className="input w-full"
          />
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}