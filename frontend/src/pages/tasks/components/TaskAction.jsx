//tasks/components/TaskAction.jsx
import { useLocation, useParams } from "react-router-dom";

import TaskCreateForm from "../forms/TaskCreateForm";
import TaskUpdateForm from "../forms/TaskUpdateForm";
// import TaskAssignForm from "../forms/TaskAssignForm";
import TaskProgressForm from "../forms/TaskProgressForm";
import TaskCloseForm from "../forms/TaskCloseForm";
import TaskReassignForm from "../forms/TaskReassignForm";

export default function TaskAction() {

  const { type } = useParams();
  const { state } = useLocation();

  const data = state?.data || {};

  if (type === "create") {
    return <TaskCreateForm />;
  }

  if (type === "update") {
    return <TaskUpdateForm data={data} />;
  }

  // if (type === "assign") {
  //   return <TaskAssignForm data={data} />;
  // }

  if (type === "progress") {
    return <TaskProgressForm data={data} />;
  }

  if (type === "close") {
    return <TaskCloseForm data={data} />;
  }

  if (type === "reassign") {
    return <TaskReassignForm data={data} />;
  }

  return <div className="p-4">Invalid Action</div>;
}