import { useParams, useLocation } from "react-router-dom";

import ComputerAssetCreateForm from "./forms/ComputerAssetCreateForm";
import ComputerAssetUpdateForm from "./forms/ComputerAssetUpdateForm";
import ComputerAssetCloneForm from "./forms/ComputerAssetCloneForm";

export default function ComputerAssetAction() {
  const { type } = useParams();
  const { state } = useLocation();

  const data = state?.data || {};

  if (type === "create") {
    return <ComputerAssetCreateForm />;
  }

  if (type === "update") {
    return <ComputerAssetUpdateForm data={data} />;
  }

  if (type === "clone") {
    return <ComputerAssetCloneForm data={data} />;
  }

  return <div className="p-4">Invalid Action</div>;
}