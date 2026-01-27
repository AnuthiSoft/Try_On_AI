import os
import smtplib
from email.mime.text import MIMEText

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_email_otp(to_email: str, otp: str):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise RuntimeError("SMTP credentials missing")

    msg = MIMEText(f"""
Hello,

Your Email Verification OTP is:

{otp}

This OTP is valid for 5 minutes.
Do not share this code with anyone.

Thanks,
Support Team
""")

    msg["Subject"] = "Your OTP for Email Verification"
    msg["From"] = f"Support <{SMTP_EMAIL}>"
    msg["To"] = to_email

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(SMTP_EMAIL, SMTP_PASSWORD)
    server.send_message(msg)
    server.quit()
