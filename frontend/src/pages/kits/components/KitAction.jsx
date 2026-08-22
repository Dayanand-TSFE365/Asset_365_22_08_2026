import { useParams, useLocation } from "react-router-dom";

import KitCreateForm from "../forms/KitCreateForm";
import KitUpdateForm from "../forms/KitUpdateForm";
import KitCheckinCheckoutForm from "../forms/KitCheckinCheckoutForm";
// import KitAddItemForm from "../forms/KitAddItemForm";
// import KitCheckoutForm from "../forms/KitCheckoutForm";
// import KitCheckinForm from "../forms/KitCheckinForm";

export default function KitAction() {
  const { type } = useParams();
  const { state } = useLocation();

  const data = state?.data || {};

  if (type === "create") return <KitCreateForm />;

  if (type === "update") {   
    return <KitUpdateForm data={data} />;
  }

  if (type === "checkin" || type === "checkout") {
    return <KitCheckinCheckoutForm data={data} />;
  }

//   if (type === "add-item") {
//     return <KitAddItemForm data={data} />;
//   }

//   if (type === "checkout") {
//     return <KitCheckoutForm data={data} />;
//   }

//   if (type === "checkin") {
//     return <KitCheckinForm data={data} />;
//   }

  return <div className="p-4">Invalid Kit Action</div>;
}