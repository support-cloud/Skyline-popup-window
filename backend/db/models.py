from __future__ import annotations

from sqlalchemy import JSON, Column, Integer, MetaData, String, Table

METADATA = MetaData()


RevokedToken = Table(
    "revoked_token",
    METADATA,
    Column("uuid", String(length=128), nullable=False, index=True, unique=False),
    Column("expire", Integer, nullable=False),
)

Settings = Table(
    "settings",
    METADATA,
    Column("key", String(length=128), nullable=False, index=True, unique=True),
    Column("value", JSON, nullable=True),
)

UserLoginTimes = Table(
    "user_login_times",
    METADATA,
    Column("user_id", String(length=128), nullable=False, index=True, unique=False),
    Column("login_time", Integer, nullable=False, index=True),
)
