from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.database import supabase
from app.core.config import SUPABASE_URL
import jwt as pyjwt
from jwt import PyJWKClient

security = HTTPBearer(auto_error=False)

_jwks_client = None

def _get_jwks_client():
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")
    return _jwks_client

def _verify_token_locally(token: str):
    try:
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = pyjwt.decode(token, signing_key.key, algorithms=["RS256"], options={"verify_exp": True})
        return payload
    except Exception:
        return None

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        return None
    payload = _verify_token_locally(credentials.credentials)
    if payload:
        return type('User', (), {
            'id': payload.get('sub'),
            'email': payload.get('email', ''),
            'user_metadata': payload.get('user_metadata', {}),
        })()
    try:
        user = supabase.auth.get_user(credentials.credentials)
        return user.user
    except Exception:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Provide a Bearer token."
        )
    payload = _verify_token_locally(credentials.credentials)
    if payload:
        return type('User', (), {
            'id': payload.get('sub'),
            'email': payload.get('email', ''),
            'user_metadata': payload.get('user_metadata', {}),
        })()
    try:
        user = supabase.auth.get_user(credentials.credentials)
        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token."
            )
        return user.user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )
