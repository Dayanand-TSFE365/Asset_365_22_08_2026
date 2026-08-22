from .common import send_email

async def send_new_task_assignment_email(
    email: str,
    employee_name: str,
    task_title: str,
    assigned_by: str,
    reason: str,
    deadline: str = "-",
):

    body = f"""
    <html>
    <body style="font-family:Arial">

    <h2>New Task Assigned — SAMPATTI MANAGEMENT 365</h2>

    <p>Hello <b>{employee_name}</b>,</p>

    <p>A new task has been assigned to you.</p>

    <table cellpadding="8">

        <tr>
            <td><b>Task</b></td>
            <td>{task_title}</td>
        </tr>

        <tr>
            <td><b>Assigned By</b></td>
            <td>{assigned_by}</td>
        </tr>

        <tr>
            <td><b>Deadline</b></td>
            <td>{deadline}</td>
        </tr>

        <tr>
            <td><b>Reason</b></td>
            <td>{reason}</td>
        </tr>

    </table>

    <br>

    Please login to SAMPATTI MANAGEMENT 365 and start working on this task.

    <br><br>

    Regards,<br>
    TSF Engineers Pvt. Ltd.

    </body>
    </html>
    """

    await send_email(
        subject="New Task Assigned",
        recipients=[email],
        body=body,
    )


async def send_task_reassigned_email(
    email: str,
    employee_name: str,
    task_title: str,
    new_assignee: str,
    reason: str,
):

    body = f"""
    <html>
    <body style="font-family:Arial">

    <h2> Task Reassigned - SAMPATTI MANAGEMENT 365</h2>

    <p>Hello <b>{employee_name}</b>,</p>

    <p>Your assigned task has been reassigned.</p>

    <table cellpadding="8">

        <tr>
            <td><b>Task</b></td>
            <td>{task_title}</td>
        </tr>

        <tr>
            <td><b>New Assignee</b></td>
            <td>{new_assignee}</td>
        </tr>

        <tr>
            <td><b>Reason</b></td>
            <td>{reason}</td>
        </tr>

    </table>

    <br>

    Regards,<br>
    TSF Engineers Pvt. Ltd.

    </body>
    </html>
    """

    await send_email(
        subject="Task Reassigned",
        recipients=[email],
        body=body,
    )