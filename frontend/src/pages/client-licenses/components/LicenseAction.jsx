import { useLocation, useParams } from "react-router-dom";

import LicenseCreateForm from "../forms/LicenseCreateForm";
import LicenseCloneForm from "../forms/LicenseCloneForm";
import LicenseUpdateForm from "../forms/LicenseUpdateForm";

export default function LicenseAction() {
  const { type } = useParams();
  const { state } = useLocation();

  const data = state?.data || {};

  if (type === "create") {
    return <LicenseCreateForm />;
  }

  if (type === "clone") {
    return <LicenseCloneForm />
  }

  if (type === "update") {
    return <LicenseUpdateForm />
  }

  return <div className="p-4">Invalid Action</div>;
}