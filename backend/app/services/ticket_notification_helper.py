def get_ticket_notification_receiver(
    ticket,
    actor_id: int
):

    # Ticket creator sent the message
    # → notify assigned user

    if actor_id == ticket.created_by:

        return ticket.assigned_to


    # Assigned user sent the message
    # → notify ticket creator

    if actor_id == ticket.assigned_to:

        return ticket.created_by


    return None