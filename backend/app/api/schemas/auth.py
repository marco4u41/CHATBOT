"""Authentication API schemas."""

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico")
    password: str = Field(..., min_length=8, max_length=128, description="Contraseña")
    confirm_password: str = Field(..., description="Confirmación de contraseña")
    display_name: str | None = Field(None, max_length=100, description="Nombre para mostrar")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        if trimmed != v:
            raise ValueError("La contraseña no debe tener espacios al inicio o final")
        return v

    @field_validator("display_name")
    @classmethod
    def normalize_display_name(cls, v: str | None) -> str | None:
        if v is not None:
            trimmed = v.strip()
            return trimmed if trimmed else None
        return v


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico")
    password: str = Field(..., min_length=1, description="Contraseña")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class AuthResponse(BaseModel):
    success: bool
    user: "UserResponse | None" = None
    error: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str | None = None
    created_at: str
    is_admin: bool = False
