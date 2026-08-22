import TicketList from "../components/TicketList";

export default function WaitingReviewTickets() {
  return (
    <TicketList
      title="Waiting Review"
      statusName="Submitted"
      showCreate={false}
    />
  );
}