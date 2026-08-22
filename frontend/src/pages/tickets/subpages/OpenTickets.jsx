import TicketList from "../components/TicketList";

export default function OpenTickets() {
  return (
    <TicketList
      title="Open Tickets"
      statusName="Open"
      showCreate={false}
    />
  );
}