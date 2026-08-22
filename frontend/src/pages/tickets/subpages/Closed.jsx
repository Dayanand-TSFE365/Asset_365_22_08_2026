import TicketList from "../components/TicketList";

export default function ClosedTickets() {
  return (
    <TicketList
      title="Closed Tickets"
      statusName="Closed"
      showCreate={false}
    />
  );
}