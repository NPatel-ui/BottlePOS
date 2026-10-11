from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Tuple
import random
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings
from app.core.supabase import get_supabase_client

logger = logging.getLogger("BottlePOS.EmailVerification")

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

@dataclass
class VerificationRecord:
    email: str
    code: str
    created_at: datetime
    expires_at: datetime
    is_verified: bool = False

class EmailVerificationService:
    def __init__(self, expiration_minutes: int = 10):
        self.expiration_minutes = expiration_minutes
        self._records: Dict[str, VerificationRecord] = {}

    def send_verification_email(self, recipient_email: str, code: str) -> bool:
        """
        Sends an authentic, high-grade security verification HTML email to the recipient's inbox.
        Uses configured SMTP settings (e.g., Gmail, Outlook, Brevo, SendGrid, Resend SMTP).
        """
        smtp_host = settings.smtp_host.strip()
        smtp_user = settings.smtp_user.strip()
        smtp_pass = settings.smtp_password.strip()
        smtp_port = settings.smtp_port or 587
        from_email = settings.smtp_from_email.strip() or smtp_user or "no-reply@bottlepos.com"
        from_name = settings.smtp_from_name or "BottlePOS Security"

        subject = f"Your BottlePOS Verification Code: {code}"
        
        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BottlePOS Security Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 36px 32px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">🍾</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">BottlePOS</h1>
              <p style="margin: 6px 0 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Intelligent Liquor Retail Platform</p>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 20px; font-weight: 800;">Verify Your Admin Account</h2>
              <p style="margin: 0 0 24px; color: #475569; font-size: 14px; line-height: 1.6;">
                Welcome to BottlePOS. Please enter the single-use 6-digit security code below to activate your manager account and unlock the admin portal:
              </p>
              
              <!-- Verification Code Display -->
              <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 18px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 900; letter-spacing: 8px; color: #0f172a; display: block;">
                  {code}
                </span>
                <span style="display: inline-block; margin-top: 12px; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; font-size: 12px; font-weight: 800; padding: 4px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                  ⏱ Valid for {self.expiration_minutes} minutes only
                </span>
              </div>

              <!-- Expiry Alert -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600; line-height: 1.5;">
                  <strong>Note:</strong> If not verified within 10 minutes, this code and your pending registration will expire. You will then need to recreate your account.
                </p>
              </div>

              <p style="margin: 24px 0 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                If you did not register for BottlePOS, please disregard this email. Your email remains safe and unverified.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 11px; font-weight: 600;">
                © BottlePOS Security • End-to-End Enterprise Encryption
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

        plain_text = f"""BottlePOS - Admin Account Verification

Your verification code is: {code}

This code will expire in {self.expiration_minutes} minutes.
Please enter this code on the BottlePOS verification screen.

If you did not request this, please disregard this email.
"""

        # 1. PRIORITY: Lightning-Fast Resend REST API (Delivers in < 1-2 seconds)
        resend_key = (getattr(settings, "resend_api_key", "") or "").strip()
        if resend_key:
            try:
                import httpx
                logger.info("Dispatching verification email instantly via Resend API to %s", recipient_email)
                sender = f"{from_name} <{from_email or 'onboarding@resend.dev'}>"
                resp = httpx.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": sender,
                        "to": [recipient_email],
                        "subject": subject,
                        "html": html_body,
                        "text": plain_text
                    },
                    timeout=6.0
                )
                if resp.status_code in (200, 201):
                    logger.info("Delivered instant verification email via Resend to %s", recipient_email)
                    return True
                else:
                    logger.warning("Resend API response %s: %s. Falling back to SMTP/Supabase.", resp.status_code, resp.text)
            except Exception as e:
                logger.warning("Resend API dispatch failed: %s. Falling back to SMTP/Supabase.", e)

        # 2. PRIORITY: Direct High-Speed SMTP (Gmail / Brevo / Custom SMTP)
        if smtp_host and smtp_user and smtp_pass:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{from_email}>"
            msg["To"] = recipient_email

            msg.attach(MIMEText(plain_text, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            try:
                if smtp_port == 465:
                    with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10) as server:
                        server.login(smtp_user, smtp_pass)
                        server.sendmail(from_email, [recipient_email], msg.as_string())
                else:
                    with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                        if settings.smtp_tls:
                            server.starttls()
                        server.login(smtp_user, smtp_pass)
                        server.sendmail(from_email, [recipient_email], msg.as_string())

                logger.info("Delivered verification email to %s via SMTP (%s)", recipient_email, smtp_host)
                return True
            except Exception as e:
                logger.error("Failed to deliver verification email to %s via SMTP: %s", recipient_email, e)

        # 3. PRIORITY: Supabase Auth Email Service (Fallback)
        client = get_supabase_client()
        if client:
            try:
                logger.info("Delegating verification email to Supabase Auth for: %s", recipient_email)
                res = client.auth.sign_in_with_otp({"email": recipient_email})
                logger.info("Requested Supabase Auth OTP email delivery for %s: %s", recipient_email, res)
                return True
            except Exception as e:
                logger.error("Supabase Auth email delivery failed for %s: %s", recipient_email, e)

        logger.warning("No email dispatch service (Resend, SMTP, or Supabase) was able to deliver to %s", recipient_email)
        return False

    def create_verification(self, email: str) -> VerificationRecord:
        normalized_email = email.strip().lower()
        code = f"{random.randint(100000, 999999)}"
        now = utc_now()
        expires_at = now + timedelta(minutes=self.expiration_minutes)

        record = VerificationRecord(
            email=normalized_email,
            code=code,
            created_at=now,
            expires_at=expires_at,
            is_verified=False
        )
        self._records[normalized_email] = record

        # Dispatch real email to the user's inbox
        self.send_verification_email(normalized_email, code)

        # Attempt to save to Supabase email_verifications table if available
        client = get_supabase_client()
        if client:
            try:
                client.table("email_verifications").upsert({
                    "email": normalized_email,
                    "code": code,
                    "created_at": now.isoformat(),
                    "expires_at": expires_at.isoformat(),
                    "is_verified": False
                }).execute()
            except Exception as e:
                logger.debug("Optional Supabase email_verifications sync skipped: %s", e)

        return record

    def get_record(self, email: str) -> Optional[VerificationRecord]:
        normalized_email = email.strip().lower()
        record = self._records.get(normalized_email)
        if record:
            return record

        client = get_supabase_client()
        if client:
            try:
                res = client.table("email_verifications").select("*").eq("email", normalized_email).execute()
                if res.data and len(res.data) > 0:
                    d = res.data[0]
                    created_at = datetime.fromisoformat(d["created_at"].replace("Z", "+00:00"))
                    expires_at = datetime.fromisoformat(d["expires_at"].replace("Z", "+00:00"))
                    record = VerificationRecord(
                        email=d["email"],
                        code=d["code"],
                        created_at=created_at,
                        expires_at=expires_at,
                        is_verified=d.get("is_verified", False)
                    )
                    self._records[normalized_email] = record
                    return record
            except Exception as e:
                logger.debug("Could not query Supabase email_verifications: %s", e)

        return None

    def is_expired(self, email: str) -> bool:
        record = self.get_record(email)
        if not record:
            return True
        return utc_now() > record.expires_at

    def verify_code(self, email: str, code: str) -> Tuple[bool, str, bool]:
        normalized_email = email.strip().lower()
        record = self.get_record(normalized_email)

        if not record:
            client = get_supabase_client()
            if client:
                try:
                    res = client.auth.verify_otp({"email": normalized_email, "token": code.strip(), "type": "email"})
                    if res and (getattr(res, "user", None) or getattr(res, "session", None)):
                        return True, "Email verified successfully via Supabase Authentication!", False
                except Exception:
                    pass
            return False, "No verification request found for this email. Please register again.", True

        if utc_now() > record.expires_at:
            self.delete_record(normalized_email)
            return False, f"Verification expired ({self.expiration_minutes} minutes limit exceeded). Please recreate your account.", True

        # Check local generated code OR Supabase Auth OTP token
        is_code_valid = (record.code.strip() == code.strip())
        if not is_code_valid:
            client = get_supabase_client()
            if client:
                try:
                    res = client.auth.verify_otp({"email": normalized_email, "token": code.strip(), "type": "email"})
                    if res and (getattr(res, "user", None) or getattr(res, "session", None)):
                        is_code_valid = True
                except Exception as e:
                    logger.debug("Supabase OTP verify error: %s", e)

        if not is_code_valid:
            return False, "Incorrect verification code. Please check your email and try again.", False

        record.is_verified = True
        self._records[normalized_email] = record

        client = get_supabase_client()
        if client:
            try:
                client.table("email_verifications").update({"is_verified": True}).eq("email", normalized_email).execute()
            except Exception:
                pass

        return True, "Email verified successfully! You may now log in.", False

    def delete_record(self, email: str):
        normalized_email = email.strip().lower()
        self._records.pop(normalized_email, None)
        client = get_supabase_client()
        if client:
            try:
                client.table("email_verifications").delete().eq("email", normalized_email).execute()
            except Exception:
                pass

email_verification_service = EmailVerificationService(expiration_minutes=10)
