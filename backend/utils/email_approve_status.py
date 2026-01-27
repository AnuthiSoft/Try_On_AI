import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_status_email(
    *,
    to_email: str,
    username: str,
    status: str,   # approved | rejected
    enterprise_name: str
):
    if not all([SMTP_HOST, SMTP_EMAIL, SMTP_PASSWORD]):
        print("❌ SMTP config missing")
        return

    msg = EmailMessage()
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email

    if status == "approved":
        msg["Subject"] = "🎉 Enterprise Account Approved"
        msg.set_content(f"""
Hello {username},

Good news! 🎉

Your enterprise account "{enterprise_name}" has been APPROVED.

You can now log in and start using our platform.

Thank you,
Support Team
""")
    else:
        msg["Subject"] = "❌ Enterprise Account Rejected"
        msg.set_content(f"""
Hello {username},

We regret to inform you that your enterprise account "{enterprise_name}" has been REJECTED.

If you believe this is a mistake, please contact support.

Thank you,
Support Team
""")

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
            print(f"📧 Status email sent to {to_email}")
    except Exception as e:
        print("❌ Failed to send email:", e)
