import { useParams, useLocation } from "react-router-dom";
import ConsumableCreateForm from "../forms/ConsumableCreateForm";
import ConsumableUpdateForm from "../forms/ConsumableUpdateForm";
import ConsumableCloneForm from "../forms/ConsumableCloneForm";
import ConsumableConsumeAddForm from "../forms/ConsumableConsumeAddForm";


export default function ConsumableAction() {
  const { type } = useParams();
  const { state } = useLocation();

  const data = state?.data || {};

  if (type === "create") return <ConsumableCreateForm />;
  if (type === "update") return <ConsumableUpdateForm data={data} />;
  if (type === "clone") return <ConsumableCloneForm data={data} />;
  if (type === "manage") return <ConsumableConsumeAddForm data={data} />;

  return <div className="p-4">Invalid Consumable Action</div>;
}