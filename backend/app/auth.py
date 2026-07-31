"""Autenticação: hash de senha (pbkdf2, stdlib), tokens JWT e código de convite.

Usa ``hashlib.pbkdf2_hmac`` para senhas (sem dependência nativa como bcrypt) e
PyJWT (puro Python) para os tokens — mantém o build do Docker simples e estável.
"""
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import User

SECRET_KEY = os.getenv("SECRET_KEY", "questly-dev-secret-change-me")
TOKEN_TTL_DAYS = int(os.getenv("TOKEN_TTL_DAYS", "60"))
_PBKDF2_ITERATIONS = 240_000
# Código de convite: sem caracteres ambíguos (0/O, 1/I).
_INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


# --- senhas ----------------------------------------------------------------
def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${_PBKDF2_ITERATIONS}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters, salt_hex, hash_hex = stored.split("$")
        if algo != "pbkdf2_sha256":
            return False
        dk = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), int(iters)
        )
        return hmac.compare_digest(dk.hex(), hash_hex)
    except (ValueError, TypeError):
        return False


# --- tokens ----------------------------------------------------------------
def create_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": str(user_id), "iat": now, "exp": now + timedelta(days=TOKEN_TTL_DAYS)}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def _decode_token(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(401, "Token inválido ou expirado.")


# --- tokens de redefinição de senha ----------------------------------------
def hash_token(token: str) -> str:
    """Hash (sha256) do token de reset — guardamos só o hash no banco."""
    return hashlib.sha256(token.encode()).hexdigest()


# --- login com Google -------------------------------------------------------
_GOOGLE_CERTS = "https://www.googleapis.com/oauth2/v3/certs"
_GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"]
_google_jwks = None


def google_enabled() -> bool:
    return bool(os.getenv("GOOGLE_CLIENT_ID"))


def verify_google_token(credential: str) -> dict:
    """Valida o ID token do Google e devolve os dados (sub, email, name, picture).

    Usa as chaves públicas da Google (JWKS) + PyJWT/cryptography (já instalado).
    """
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(503, "Login com Google não configurado no servidor.")
    global _google_jwks
    if _google_jwks is None:
        _google_jwks = jwt.PyJWKClient(_GOOGLE_CERTS)
    try:
        signing_key = _google_jwks.get_signing_key_from_jwt(credential)
        data = jwt.decode(
            credential,
            signing_key.key,
            algorithms=["RS256"],
            audience=client_id,
            issuer=_GOOGLE_ISSUERS,
        )
    except Exception:
        raise HTTPException(401, "Token do Google inválido.")
    if not data.get("email"):
        raise HTTPException(401, "Conta Google sem e-mail.")
    return data


# --- convite ---------------------------------------------------------------
def generate_invite_code(length: int = 6) -> str:
    return "".join(secrets.choice(_INVITE_ALPHABET) for _ in range(length))


# --- dependency ------------------------------------------------------------
def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Não autenticado.")
    token = authorization.split(" ", 1)[1].strip()
    user = db.get(User, _decode_token(token))
    if user is None:
        raise HTTPException(401, "Usuário não encontrado.")
    return user
