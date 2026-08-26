from fastapi_mail import FastMail, MessageSchema
from app.core.email_config import conf
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

BASE_URL = os.getenv("BASE_URL")
FRONTEND_URL = os.getenv("FRONTEND_URL")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")


async def send_admin_notification(
    user_email: str,
    approval_token: str
):

    admin_email = ADMIN_EMAIL

    # This should open the ADMIN FRONTEND page.
    # approval_link = (
    #     f"{FRONTEND_URL}/admin/user-approval"
    #     f"?token={approval_token}"
    # )
    approval_link = f"{FRONTEND_URL}/people/pending-approvals"


    message = MessageSchema(
        subject="User Approval Required - Asset365",
        recipients=[admin_email],
        body=f"""
        <!DOCTYPE html>
        <html>

        <head>
            <meta charset="UTF-8">
            <title>User Approval Required</title>
        </head>

        <body style="
            font-family: Arial, sans-serif;
            background-color:#f4f6f9;
            padding:20px;
        ">

        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center">

                    <table
                        width="600"
                        cellpadding="0"
                        cellspacing="0"
                        style="
                            background:white;
                            border-radius:10px;
                            box-shadow:0 2px 10px rgba(0,0,0,0.1);
                        "
                    >

                        <!-- HEADER -->

                        <tr>
                            <td style="
                                background:#0f4c81;
                                color:white;
                                padding:20px;
                                text-align:center;
                                border-radius:10px 10px 0 0;
                            ">

                                <h2>
                                    TSF Engineers Private Limited
                                </h2>

                                <p>
                                    User Approval Required
                                </p>

                                <p style="font-size:13px;">
                                    TSFE SAMPATTI 365 PORTAL ACCESS
                                </p>

                            </td>
                        </tr>


                        <!-- CONTENT -->

                        <tr>
                            <td style="padding:30px;">

                                <h3>Hello Admin,</h3>

                                <p>
                                    A new user has successfully
                                    verified their email address
                                    and is waiting for approval.
                                </p>


                                <table
                                    cellpadding="8"
                                    cellspacing="0"
                                    style="margin-top:15px;"
                                >

                                    <tr>
                                        <td>
                                            <b>Email:</b>
                                        </td>

                                        <td>
                                            {user_email}
                                        </td>
                                    </tr>

                                </table>


                                <p style="margin-top:20px;">
                                    Please review the user and select
                                    the appropriate access type.
                                </p>


                                <!-- ACCESS TYPES -->

                                <table
                                    width="100%"
                                    cellpadding="10"
                                    cellspacing="0"
                                    style="
                                        background:#f8f9fa;
                                        border-radius:6px;
                                        margin-top:20px;
                                    "
                                >

                                    <tr>
                                        <td>

                                            <b>
                                                Available Access Types:
                                            </b>

                                            <ul>
                                                <li>
                                                    <b>Permanent Access</b>
                                                    - No expiration
                                                </li>

                                                <li>
                                                    <b>Temporary Access</b>
                                                    - Admin selects
                                                    expiration date/time
                                                </li>
                                            </ul>

                                        </td>
                                    </tr>

                                </table>


                                <!-- BUTTON -->

                                <div style="
                                    text-align:center;
                                    margin:35px 0;
                                ">

                                    <a
                                        href="{approval_link}"
                                        style="
                                            background:#28a745;
                                            color:white;
                                            padding:14px 28px;
                                            text-decoration:none;
                                            border-radius:5px;
                                            font-weight:bold;
                                            display:inline-block;
                                        "
                                    >
                                        Review &amp; Approve User
                                    </a>

                                </div>


                                <p style="
                                    font-size:12px;
                                    color:#777;
                                ">
                                    Clicking the button will open the
                                    Asset365 admin approval page where
                                    you can choose Permanent or
                                    Temporary access.
                                </p>

                            </td>
                        </tr>


                        <!-- FOOTER -->

                        <tr>
                            <td style="
                                background:#f5f5f5;
                                padding:15px;
                                text-align:center;
                                font-size:12px;
                                color:#777;
                            ">

                                © 2026 TSF Engineers Private Limited
                                <br>

                                This is an automated email.

                            </td>
                        </tr>

                    </table>

                </td>
            </tr>
        </table>

        </body>
        </html>
        """,
        subtype="html"
    )

    fm = FastMail(conf)

    await fm.send_message(message)

# async def send_admin_notification(user_email: str, approval_token: str):

#     admin_email = ADMIN_EMAIL

#     approval_link = f"{BASE_URL}/auth/approve-user?token={approval_token}"

#     message = MessageSchema(
#         subject="User Approval Required",
#         recipients=[admin_email],
#         body=f"""
#         <!DOCTYPE html>
#         <html>
#     <head>
#     <meta charset="UTF-8">
# </head>
# <body style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:20px;">

#     <table width="100%" cellpadding="0" cellspacing="0">
#         <tr>
#             <td align="center">

#                 <table width="600" cellpadding="0" cellspacing="0"
#                        style="background:white; border-radius:10px;
#                        box-shadow:0 2px 10px rgba(0,0,0,0.1);">

#                     <tr>
#                         <td style="background:#0f4c81; color:white;
#                                    padding:20px; text-align:center;
#                                    border-radius:10px 10px 0 0;">

#                             <h2>TSF Engineers Private Limited</h2>
#                             <p>User Approval Required(TSFE SAMPATTI 365 PORTAL ACCESS)</p>

#                         </td>
#                     </tr>

#                     <tr>
#                         <td style="padding:30px;">

#                             <h3>Hello Admin,</h3>

#                             <p>A new user has successfully verified their email address.</p>

#                             <table cellpadding="8">
#                                 <tr>
#                                     <td><b>Email:</b></td>
#                                     <td>{user_email}</td>
#                                 </tr>
#                             </table>

#                             <p>Please review and approve the account.</p>

#                             <div style="text-align:center; margin:30px 0;">
#                                 <a href="{approval_link}"
#                                    style="background:#28a745;
#                                           color:white;
#                                           padding:12px 25px;
#                                           text-decoration:none;
#                                           border-radius:5px;
#                                           font-weight:bold;">
#                                     Approve User
#                                 </a>
#                             </div>

#                         </td>
#                     </tr>

#                     <tr>
#                         <td style="background:#f5f5f5;
#                                    padding:15px;
#                                    text-align:center;
#                                    font-size:12px;
#                                    color:#777;">

#                             © 2026 TSF Engineers Private Limited<br>
#                             This is an automated email.

#                         </td>
#                     </tr>

#                 </table>

#             </td>
#         </tr>
#     </table>

# </body>
# </html>
# """,
#         subtype="html"
#     )

#     fm = FastMail(conf)
#     await fm.send_message(message)

async def send_approval_email(
    user_email: str,
    access_type: str,
    access_expires_at=None
):

    # ----------------------------------------
    # ACCESS DETAILS
    # ----------------------------------------

    if access_type == "TEMPORARY":

        if access_expires_at:
            expiry_text = access_expires_at.strftime(
                "%d %B %Y, %I:%M %p"
            )
        else:
            expiry_text = "Not configured"

        access_text = "Temporary"

    else:

        access_text = "Permanent"
        expiry_text = "No expiry"

    login_link = f"{FRONTEND_URL}/login"

    message = MessageSchema(
        subject="Asset365 Account Approved",
        recipients=[user_email],
        body=f"""
        <!DOCTYPE html>
        <html>

        <head>
            <meta charset="UTF-8">
        </head>

        <body style="
            font-family: Arial, sans-serif;
            background:#f4f6f9;
            padding:20px;
        ">

        <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
        <td align="center">

        <table width="600"
               cellpadding="0"
               cellspacing="0"
               style="
                   background:white;
                   border-radius:10px;
                   box-shadow:0 2px 10px rgba(0,0,0,0.1);
               ">

            <!-- HEADER -->

            <tr>
            <td style="
                background:#0f4c81;
                color:white;
                padding:20px;
                text-align:center;
                border-radius:10px 10px 0 0;
            ">

                <h2>TSF Engineers Private Limited</h2>

                <p>
                    TSFE SAMPATTI 365 PORTAL ACCESS
                </p>

            </td>
            </tr>


            <!-- BODY -->

            <tr>
            <td style="padding:30px;">

                <h3>Your Account Has Been Approved</h3>

                <p>
                    Hello,
                </p>

                <p>
                    Your Asset365 account has been approved
                    by the administrator.
                </p>


                <table
                    cellpadding="8"
                    cellspacing="0"
                    style="margin-top:20px;"
                >

                    <tr>
                        <td>
                            <b>Email:</b>
                        </td>

                        <td>
                            {user_email}
                        </td>
                    </tr>


                    <tr>
                        <td>
                            <b>Access Type:</b>
                        </td>

                        <td>
                            {access_text}
                        </td>
                    </tr>


                    <tr>
                        <td>
                            <b>Access Expires:</b>
                        </td>

                        <td>
                            {expiry_text}
                        </td>
                    </tr>

                </table>


                <p style="margin-top:25px;">
                    You can now log in to the Asset365 portal
                    using the email address and password you
                    created during registration.
                </p>


                <div style="
                    text-align:center;
                    margin:30px 0;
                ">

                    <a href="{login_link}"
                       style="
                           background:#28a745;
                           color:white;
                           padding:12px 25px;
                           text-decoration:none;
                           border-radius:5px;
                           font-weight:bold;
                       ">

                        Login to Asset365

                    </a>

                </div>


                <p style="font-size:13px; color:#666;">

                    {"Your access will automatically expire after the above date and time." if access_type == "TEMPORARY" else "Your account has permanent access unless an administrator changes or disables it."}

                </p>

            </td>
            </tr>


            <!-- FOOTER -->

            <tr>
            <td style="
                background:#f5f5f5;
                padding:15px;
                text-align:center;
                font-size:12px;
                color:#777;
            ">

                © 2026 TSF Engineers Private Limited
                <br>
                This is an automated notification.

            </td>
            </tr>

        </table>

        </td>
        </tr>
        </table>

        </body>
        </html>
        """,
        subtype="html"
    )

    fm = FastMail(conf)

    await fm.send_message(message)

async def send_verification_email(email: str, token: str):

    verify_link = f"{BASE_URL}/auth/verify-email?token={token}"

    message = MessageSchema(
        subject="Verify Your Email",
        recipients=[email],
        body=f"""
         <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; background:#f4f6f9; padding:20px;">

            <table width="100%">
            <tr>
            <td align="center">

            <table width="600" style="background:white; border-radius:10px;">

            <tr>
            <td style="background:#0f4c81; color:white; padding:20px; text-align:center;">
            <h2>TSF Engineers Private Limited</h2>
            <p>Email Verification</p>
            </td>
            </tr>

            <tr>
            <td style="padding:30px;">

            <h3>Welcome!</h3>

            <p>Thank you for registering with TSF Engineers.</p>

            <p>Please verify your email address to activate your account.</p>

            <div style="text-align:center; margin:30px 0;">
            <a href="{verify_link}"
            style="background:#007bff;
                    color:white;
                    padding:12px 25px;
                    text-decoration:none;
                    border-radius:5px;">
            Verify Email
            </a>
            </div>

            <p>If you did not create this account, please ignore this email.</p>

            </td>
            </tr>

            <tr>
            <td style="background:#f5f5f5; padding:15px; text-align:center; font-size:12px;">
            © 2026 TSF Engineers Private Limited
            </td>
            </tr>

            </table>

            </td>
            </tr>
            </table>

            </body>
            </html>
            """,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)
    
    
    


async def send_reset_email(email: str, otp: str):

    message = MessageSchema(
        subject="Password Reset OTP",
        recipients=[email],
        body=f"""
        <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; background:#f4f6f9; padding:20px;">

            <table width="100%">
            <tr>
            <td align="center">

            <table width="600"
                style="background:white;
                        border-radius:10px;
                        box-shadow:0 2px 10px rgba(0,0,0,0.1);">

            <tr>
            <td style="background:#dc3545;
                    color:white;
                    padding:20px;
                    text-align:center;">

            <h2>TSF Engineers Private Limited</h2>
            <p>Password Reset Request</p>

            </td>
            </tr>

            <tr>
            <td style="padding:30px;">

            <h3>Hello,</h3>

            <p>We received a request to reset your password.</p>

            <p>Your One-Time Password (OTP) is:</p>

            <div style="
                text-align:center;
                margin:30px 0;
                padding:20px;
                background:#f8f9fa;
                border:2px dashed #dc3545;
                border-radius:8px;">

                <h1 style="
                    letter-spacing:8px;
                    color:#dc3545;
                    margin:0;">
                    {otp}
                </h1>

            </div>

            <p>
            This OTP will expire in <b>5 minutes</b>.
            </p>

            <p>
            If you did not request a password reset,
            please ignore this email.
            </p>

            </td>
            </tr>

            <tr>
            <td style="background:#f5f5f5;
                    padding:15px;
                    text-align:center;
                    font-size:12px;
                    color:#777;">

            © 2026 TSF Engineers Private Limited<br>
            Automated Security Notification

            </td>
            </tr>

            </table>

            </td>
            </tr>
            </table>

            </body>
            </html>
            """,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)



async def send_access_extension_request_email(
    user_email: str,
    requested_at: datetime,
    current_expiry: datetime
):

    admin_email = ADMIN_EMAIL

    approval_page = (
        f"{FRONTEND_URL}/people/pending-approvals"
    )

    message = MessageSchema(
        subject="Access Extension Request - Asset365",
        recipients=[admin_email],

        body=f"""
        <!DOCTYPE html>

        <html>

        <body style="
            font-family: Arial, sans-serif;
            background:#f4f6f9;
            padding:20px;
        ">

        <table width="100%">

        <tr>
        <td align="center">

        <table width="600"
            style="
                background:white;
                border-radius:10px;
                box-shadow:0 2px 10px rgba(0,0,0,0.1);
            ">

        <!-- HEADER -->

        <tr>

        <td style="
            background:#0f4c81;
            color:white;
            padding:20px;
            text-align:center;
        ">

            <h2>TSF Engineers Private Limited</h2>

            <p>
                Asset365 Access Extension Request
            </p>

        </td>

        </tr>


        <!-- BODY -->

        <tr>

        <td style="padding:30px;">

            <h3>Hello Admin,</h3>

            <p>
                A user whose temporary access has expired
                has requested additional access.
            </p>

            <table cellpadding="8">

                <tr>
                    <td><b>User Email:</b></td>
                    <td>{user_email}</td>
                </tr>

                <tr>
                    <td><b>Current Expiry:</b></td>
                    <td>{current_expiry}</td>
                </tr>

                <tr>
                    <td><b>Requested At:</b></td>
                    <td>{requested_at}</td>
                </tr>

            </table>


            <p>
                Please review the request from the
                Asset365 administration dashboard.
            </p>


            <div style="
                text-align:center;
                margin:30px 0;
            ">

                <a href="{approval_page}"
                   style="
                    background:#28a745;
                    color:white;
                    padding:12px 25px;
                    text-decoration:none;
                    border-radius:5px;
                    font-weight:bold;
                   ">

                    Review Request

                </a>

            </div>

        </td>

        </tr>


        <!-- FOOTER -->

        <tr>

        <td style="
            background:#f5f5f5;
            padding:15px;
            text-align:center;
            font-size:12px;
            color:#777;
        ">

            © 2026 TSF Engineers Private Limited<br>

            This is an automated notification.

        </td>

        </tr>

        </table>

        </td>
        </tr>

        </table>

        </body>

        </html>
        """,

        subtype="html"
    )

    fm = FastMail(conf)

    await fm.send_message(message)



async def send_access_extension_approved_email(
    user_email: str,
    access_expires_at
):
    message = MessageSchema(
        subject="Your Asset365 Access Has Been Extended",
        recipients=[user_email],

        body=f"""
        <!DOCTYPE html>
        <html>

        <body style="
            font-family: Arial, sans-serif;
            background:#f4f6f9;
            padding:20px;
        ">

        <table width="100%">
        <tr>
        <td align="center">

        <table width="600"
            style="
                background:white;
                border-radius:10px;
                box-shadow:0 2px 10px rgba(0,0,0,0.1);
            ">

        <tr>
        <td style="
            background:#0f4c81;
            color:white;
            padding:20px;
            text-align:center;
        ">

            <h2>TSF Engineers Private Limited</h2>
            <p>Asset365 Access Extended</p>

        </td>
        </tr>

        <tr>
        <td style="padding:30px;">

            <h3>Hello,</h3>

            <p>
                Your request for additional temporary access
                has been approved by the administrator.
            </p>

            <p>
                Your Asset365 access has been extended.
            </p>

            <table cellpadding="8">

                <tr>
                    <td><b>Access Type:</b></td>
                    <td>Temporary</td>
                </tr>

                <tr>
                    <td><b>New Access Expiry:</b></td>
                    <td>{access_expires_at}</td>
                </tr>

            </table>

            <p>
                You can now log in to Asset365 using your
                existing credentials.
            </p>

            <p>
                Regards,<br>
                TSF Engineers Private Limited
            </p>

        </td>
        </tr>

        <tr>
        <td style="
            background:#f5f5f5;
            padding:15px;
            text-align:center;
            font-size:12px;
            color:#777;
        ">

            © 2026 TSF Engineers Private Limited<br>
            This is an automated notification.

        </td>
        </tr>

        </table>

        </td>
        </tr>
        </table>

        </body>
        </html>
        """,

        subtype="html"
    )

    fm = FastMail(conf)

    await fm.send_message(message)