//TicketAction.jsx
import { useLocation, useParams } from "react-router-dom";

import TicketCreateForm from "../forms/TicketCreateForm";
import TicketUpdateForm from "../forms/TicketUpdateForm";
import TicketAssignForm from "../forms/TicketAssignForm";
import TicketStatusForm from "../forms/TicketStatusForm";

export default function TicketAction() {

  const { type } = useParams();
  const { state } = useLocation();

  const data = state?.data || {};

  if (type === "create") {
    return <TicketCreateForm />;
  }

  if (type === "update") {
    return <TicketUpdateForm data={data} />;
  }

  if (type === "assign") {
    return <TicketAssignForm data={data} />;
  }

  if (type === "status") {
    return <TicketStatusForm data={data} />;
  }

  return <div className="p-4">Invalid Action</div>;
}