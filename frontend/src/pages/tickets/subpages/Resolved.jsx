import TicketList from "../components/TicketList";

export default function ResolvedTickets() {
  return (
    <TicketList
      title="Resolved Tickets"
      statusName="Resolved"
      showCreate={false}
    />
  );
}