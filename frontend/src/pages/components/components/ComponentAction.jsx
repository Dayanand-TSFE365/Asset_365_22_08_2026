import { useParams, useLocation } from "react-router-dom";
import ComponentCreateForm from "../forms/ComponentCreateForm";
import ComponentUpdateForm from "../forms/ComponentUpdateForm";
import ComponentCloneForm from "../forms/ComponentCloneForm";
import ComponentCheckinCheckoutForm from "../forms/ComponentCheckinChekoutForm";

export default function ComponentAction() {
  const { type } = useParams();
  const { state } = useLocation();

  const data = state?.data || {};

  if (type === "create") return <ComponentCreateForm />;
  if (type === "update") return <ComponentUpdateForm data={data} />;
  if (type === "clone") return <ComponentCloneForm data={data} />;

  if (type === "checkin" || type === "checkout") {
    return <ComponentCheckinCheckoutForm data={data} />;
  }

  return <div className="p-4">Invalid Component Action</div>;
}