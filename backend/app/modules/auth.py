import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from slugify import slugify
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Store, User
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    store_name: str = Field(min_length=2, max_length=120)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class StoreOut(BaseModel):
    id: int
    name: str
    slug: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    store: StoreOut


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


def _unique_slug(db: Session, base: str) -> str:
    base = slugify(base)[:60] or "store"
    candidate = base
    for _ in range(5):
        exists = db.scalar(select(Store.id).where(Store.slug == candidate))
        if not exists:
            return candidate
        candidate = f"{base}-{secrets.token_hex(2)}"
    return f"{base}-{secrets.token_hex(4)}"


def _user_payload(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        store=StoreOut(id=user.store.id, name=user.store.name, slug=user.store.slug),
    )


@router.post("/signup", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    store = Store(name=payload.store_name, slug=_unique_slug(db, payload.store_name))
    db.add(store)
    db.flush()  # populate store.id

    user = User(store_id=store.id, email=email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user_id=user.id, store_id=store.id)
    return TokenOut(access_token=token, user=_user_payload(user))


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    token = create_access_token(user_id=user.id, store_id=user.store_id)
    return TokenOut(access_token=token, user=_user_payload(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return _user_payload(user)
