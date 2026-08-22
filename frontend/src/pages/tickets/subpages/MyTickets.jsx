import TicketList from "../components/TicketList";

export default function MyTickets() {
  return (
    <TicketList
      title="My Tickets"
      assignedToMe
      showCreate={true}
    />
  );
}