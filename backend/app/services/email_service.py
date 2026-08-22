from fastapi_mail import FastMail, MessageSchema
from app.core.email_config import conf
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("BASE_URL")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

async def send_admin_notification(user_email: str, approval_token: str):

    admin_email = ADMIN_EMAIL

    approval_link = f"{BASE_URL}/auth/approve-user?token={approval_token}"

    message = MessageSchema(
        subject="User Approval Required",
        recipients=[admin_email],
        body=f"""
        <!DOCTYPE html>
        <html>
    <head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:20px;">

    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">

                <table width="600" cellpadding="0" cellspacing="0"
                       style="background:white; border-radius:10px;
                       box-shadow:0 2px 10px rgba(0,0,0,0.1);">

                    <tr>
                        <td style="background:#0f4c81; color:white;
                                   padding:20px; text-align:center;
                                   border-radius:10px 10px 0 0;">

                            <h2>TSF Engineers Private Limited</h2>
                            <p>User Approval Required(TSFE SAMPATTI 365 PORTAL ACCESS)</p>

                        </td>
                    </tr>

                    <tr>
                        <td style="padding:30px;">

                            <h3>Hello Admin,</h3>

                            <p>A new user has successfully verified their email address.</p>

                            <table cellpadding="8">
                                <tr>
                                    <td><b>Email:</b></td>
                                    <td>{user_email}</td>
                                </tr>
                            </table>

                            <p>Please review and approve the account.</p>

                            <div style="text-align:center; margin:30px 0;">
                                <a href="{approval_link}"
                                   style="background:#28a745;
                                          color:white;
                                          padding:12px 25px;
                                          text-decoration:none;
                                          border-radius:5px;
                                          font-weight:bold;">
                                    Approve User
                                </a>
                            </div>

                        </td>
                    </tr>

                    <tr>
                        <td style="background:#f5f5f5;
                                   padding:15px;
                                   text-align:center;
                                   font-size:12px;
                                   color:#777;">

                            © 2026 TSF Engineers Private Limited<br>
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