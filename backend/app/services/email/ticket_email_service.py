from .common import send_email


async def send_new_ticket_assignment_email(
    email: str,
    employee_name: str,
    ticket_no: str,
    customer_name: str,
    scope_of_work: str,
    assigned_by: str,
    due_date: str = "-",
):
 
    body = f"""
<html>
<body style="font-family:Arial">

<h2>New Ticket Assigned - ASSET MANAGEMENT 365 </h2>

<p>Hello <b>{employee_name}</b>,</p>

<p>A new ticket has been assigned to you.</p>

<table cellpadding="8">

    <tr>
        <td><b>Ticket No</b></td>
        <td>{ticket_no}</td>
    </tr>

    <tr>
        <td><b>Customer</b></td>
        <td>{customer_name}</td>
    </tr>

    <tr>
        <td><b>Scope of Work</b></td>
        <td>{scope_of_work}</td>
    </tr>

    <tr>
        <td><b>Assigned By</b></td>
        <td>{assigned_by}</td>
    </tr>

    <tr>
        <td><b>Due Date</b></td>
        <td>{due_date}</td>
    </tr>

</table>

<br>

<p>
Please login to <b>SAMPATTI MANAGEMENT 365</b>
and start working on this ticket.
</p>

<br>

Regards,<br>
TSF Engineers Pvt. Ltd.

</body>
</html>
"""

    await send_email(
        subject=f"New Ticket Assigned - {ticket_no}",
        recipients=[email],
        body=body,
    )