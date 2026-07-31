"""Envio de e-mail (SMTP) — usado na recuperação de senha.

Opcional: só funciona se as variáveis SMTP_* estiverem configuradas. Sem elas,
``email_enabled()`` retorna False e o app registra o link no log (fallback de dev)
em vez de enviar.

Variáveis:
- SMTP_HOST, SMTP_PORT (587 padrão; 465 usa SSL), SMTP_USER, SMTP_PASS
- SMTP_FROM (remetente; padrão = SMTP_USER)
Funciona com Gmail (app password), Resend, SendGrid, Mailgun, etc.
"""
import os
import smtplib
import ssl
from email.message import EmailMessage


def email_enabled() -> bool:
    return bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_USER") and os.getenv("SMTP_PASS"))


def send_email(to: str, subject: str, text: str, html: str | None = None) -> None:
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASS")
    sender = os.getenv("SMTP_FROM", user)

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    if html:
        msg.add_alternative(html, subtype="html")

    ctx = ssl.create_default_context()
    if port == 465:
        with smtplib.SMTP_SSL(host, port, context=ctx, timeout=15) as s:
            s.login(user, password)
            s.send_message(msg)
    else:
        with smtplib.SMTP(host, port, timeout=15) as s:
            s.ehlo()
            s.starttls(context=ctx)
            s.login(user, password)
            s.send_message(msg)
