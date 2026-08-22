import { useParams, useLocation } from "react-router-dom";
import LicenseCreateForm from "../forms/LicenseCreateForm";
import LicenseUpdateForm from "../forms/LicenseUpdateForm";
import LicenseCloneForm from "../forms/LicenseCloneForm";
import LicenseCheckinCheckoutForm from "../forms/LicenseCheckinCheckoutForm";

export default function LicenseAction() {
  const { type } = useParams();
  const { state } = useLocation();

  const data = state?.data || {};

  if (type === "create") return <LicenseCreateForm />;
  if (type === "update") return <LicenseUpdateForm data={data} />;
  if (type === "clone") return <LicenseCloneForm data={data} />;
  if (type === "checkin" || type === "checkout") {
    return <LicenseCheckinCheckoutForm data={data} />;
  }

  return <div className="p-4">Invalid License Action</div>;
}