from .common import send_email


async def send_task_approved_email(
    email: str,
    employee_name: str,
    task_title: str,
    approved_by: str,
    comment: str | None = None,
):

    body = f"""
    <html>

    <body style="font-family:Arial">

    <h2> Task Approved - SAMPATTI MANAGEMENT 365</h2>

    <p>Hello <b>{employee_name}</b>,</p>

    <p>Your task has been approved.</p>

    <table cellpadding="8">

        <tr>

            <td><b>Task</b></td>

            <td>{task_title}</td>

        </tr>

        <tr>

            <td><b>Approved By</b></td>

            <td>{approved_by}</td>

        </tr>

        <tr>

            <td><b>Comment</b></td>

            <td>{comment or "-"}</td>

        </tr>

    </table>

    <br>

    Congratulations!

    </body>

    </html>
    """

    await send_email(
        subject="Task Approved",
        recipients=[email],
        body=body,
    )


async def send_task_rejected_email(
    email: str,
    employee_name: str,
    task_title: str,
    approved_by: str,
    reason: str,
):

    body = f"""
    <html>

    <body style="font-family:Arial">

    <h2> Task Returned - SAMPATTI MANAGEMENT 365</h2>

    <p>Hello <b>{employee_name}</b>,</p>

    <p>Your task has been returned for rework.</p>

    <table cellpadding="8">

        <tr>

            <td><b>Task</b></td>

            <td>{task_title}</td>

        </tr>

        <tr>

            <td><b>Reviewed By</b></td>

            <td>{approved_by}</td>

        </tr>

        <tr>

            <td><b>Reason</b></td>

            <td>{reason}</td>

        </tr>

    </table>

    <br>

    Please update the task and submit it again.

    </body>

    </html>
    """

    await send_email(
        subject="Task Returned",
        recipients=[email],
        body=body,
    )