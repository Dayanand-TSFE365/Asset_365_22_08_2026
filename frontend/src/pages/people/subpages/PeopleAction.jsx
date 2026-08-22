import { useLocation } from "react-router-dom";

import PeopleCreateForm from "../forms/PeopleCreateForm";
import PeopleUpdateForm from "../forms/PeopleUpdateForm";
import PeopleCloneForm from "../forms/PeopleCloneForm";

export default function PeopleAction() {
  const { state } = useLocation();

  const action = state?.action;

  if (action === "update") {
    return (
      <PeopleUpdateForm
        data={state.data}
      />
    );
  }

  if (action === "clone") {
    return (
      <PeopleCloneForm
        data={state.data}
      />
    );
  }

  return <PeopleCreateForm />;
}