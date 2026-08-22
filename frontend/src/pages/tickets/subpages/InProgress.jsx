import TicketList from "../components/TicketList";

export default function InProgressTickets() {
  return (
    <TicketList
      title="In Progress Tickets"
      statusName="In Progress"
      showCreate={false}
    />
  );
}