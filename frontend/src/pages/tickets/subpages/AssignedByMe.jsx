import TicketList from "../components/TicketList";

export default function AssignedByMe() {
  return (
    <TicketList
    title="Assigned By Me"
    createdByMe={true}
/>
  );
}