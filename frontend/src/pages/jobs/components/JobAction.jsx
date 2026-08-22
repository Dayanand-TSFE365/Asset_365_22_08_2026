import { useLocation, useParams } from "react-router-dom";

import JobCreateForm from "../forms/JobCreateForm";
import JobCloneForm from "../forms/JobCloneForm";
import JobUpdateForm from "../forms/JobUpdateForm";
import JobUploadForm from "../forms/JobUploadForm";

export default function JobAction() {
  const { type } = useParams();
  const { state } = useLocation();

  const data = state?.data || {};

  if (type === "create") {
    return <JobCreateForm />;
  }

  if (type === "clone") {
    return <JobCloneForm data={data} />;
  }

  if (type === "upload") {
    return <JobUploadForm data={data} />;
  }

  if (type === "update") {
    return <JobUpdateForm data={data} />;
  }

  return <div className="p-4">Invalid Action</div>;
}