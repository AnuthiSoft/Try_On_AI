import os
import smtplib
from email.mime.text import MIMEText

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_email_otp(to_email: str, otp: str, purpose: str):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise RuntimeError("SMTP credentials missing")

    if purpose == "signup":
        subject = "Your Signup OTP"
        heading = "Email Verification"
    elif purpose == "reset_password":
        subject = "Your Password Reset OTP"
        heading = "Password Reset"
    else:
        subject = "Your OTP"
        heading = "Verification"

    body = f"""
Hello,

Your {heading} OTP is:

{otp}

This OTP is valid for 5 minutes.
Do not share this code with anyone.

Thanks,
Support Team
"""

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = f"Support <{SMTP_EMAIL}>"
    msg["To"] = to_email

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
