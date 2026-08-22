// AccessoryAction.jsx
import { useParams, useLocation } from "react-router-dom";
import AccessoryCreateForm from "../forms/AccessoryCreateForm";
import AccessoryUpdateForm from "../forms/AccessoryUpdateForm";
import AccessoryCloneForm from "../forms/AccessoryCloneForm";
import AccessoryCheckinCheckoutForm from "../forms/AccessoryCheckinCheckoutForm";

export default function AccessoryAction() {
  const { type } = useParams();
  const { state } = useLocation();

  const data = state?.data || {};

  if (type === "create") return <AccessoryCreateForm />;
  if (type === "update") return <AccessoryUpdateForm data={data} />;
  if (type === "clone") return <AccessoryCloneForm data={data} />;

  if (type === "checkin" || type === "checkout") {
    return <AccessoryCheckinCheckoutForm data={data} />;
  }

  return <div className="p-4">Invalid Accessory Action</div>;
}