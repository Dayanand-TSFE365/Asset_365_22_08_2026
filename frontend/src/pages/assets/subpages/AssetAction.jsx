import { useParams, useLocation } from "react-router-dom";
import CloneForm from "./forms/CloneForm";
import UpdateForm from "./forms/UpdateForm";
import AuditForm from "./forms/AuditForm";
import AssetCreateForm from "./forms/AssetCreateForm";
import CheckinCheckoutForm from "./forms/CheckinCheckoutForm";
import AssetMaintenanceForm from "./forms/AssetMaintenanceForm";

export default function AssetAction() {
  const { type } = useParams();
  const { state } = useLocation();

  const data = state?.data || {};

  if (type === "clone") return <CloneForm data={data} />;
  if (type === "update") return <UpdateForm data={data} />;
  if (type === "audit") return <AuditForm data={data} />;
  if (type === "create") return <AssetCreateForm />;
  if (type === "maintenance") return <AssetMaintenanceForm data={data} />;

  if (type === "checkin" || type === "checkout") {
    return <CheckinCheckoutForm />;
  }

  return <div className="p-4">Invalid Action</div>;
}