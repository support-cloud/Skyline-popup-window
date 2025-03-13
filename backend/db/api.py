from __future__ import annotations

import time
import asyncio
from functools import wraps
from typing import Any

from sqlalchemy import delete, func, insert, select, update

from skyline_apiserver.types import Fn
from skyline_apiserver.log import LOG

from skyline_apiserver.db.base import DB, inject_db
from skyline_apiserver.db.models import RevokedToken, Settings, UserLoginTimes


def check_db_connected(fn: Fn) -> Any:
    @wraps(fn)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        await inject_db()
        db = DB.get()
        assert db is not None, "Database is not connected."
        return await fn(*args, **kwargs)

    return wrapper

@check_db_connected
async def record_user_login(user_id: str, login_time: int) -> Any:
    try:
        query = insert(UserLoginTimes).values(user_id=user_id, login_time=login_time)
        db = DB.get()
        async with db.transaction():
            result = await db.execute(query)
        return result
    except Exception as e:
        raise

@check_db_connected
async def get_login_record(user_id: str) -> Any:
    try:
        query = (
            select(UserLoginTimes.c.login_time)
            .where(UserLoginTimes.c.user_id == user_id)
            .order_by(UserLoginTimes.c.login_time.asc())
        )
        db = DB.get()
        async with db.transaction():
            result = await db.fetch_one(query)
        return result
    except Exception as e:
        raise

@check_db_connected
async def check_token(token_id: str) -> bool:
    count_label = "revoked_count"
    query = (
        select([func.count(RevokedToken.c.uuid).label(count_label)])
        .select_from(RevokedToken)
        .where(RevokedToken.c.uuid == token_id)
    )
    db = DB.get()
    async with db.transaction():
        result = await db.fetch_one(query)

    count = getattr(result, count_label, 0)
    return count > 0


@check_db_connected
async def revoke_token(token_id: str, expire: int) -> Any:
    query = insert(RevokedToken)
    db = DB.get()
    async with db.transaction():
        result = await db.execute(query, {"uuid": token_id, "expire": expire})

    return result


@check_db_connected
async def purge_revoked_token() -> Any:
    now = int(time.time()) - 1
    query = delete(RevokedToken).where(RevokedToken.c.expire < now)
    db = DB.get()
    async with db.transaction():
        result = await db.execute(query)

    return result


@check_db_connected
async def list_settings() -> Any:
    query = select([Settings])
    db = DB.get()
    async with db.transaction():
        result = await db.fetch_all(query)

    return result


@check_db_connected
async def get_setting(key: str) -> Any:
    query = select([Settings]).where(Settings.c.key == key)
    db = DB.get()
    async with db.transaction():
        result = await db.fetch_one(query)

    return result


@check_db_connected
async def update_setting(key: str, value: Any) -> Any:
    get_query = (
        select([Settings.c.key, Settings.c.value]).where(Settings.c.key == key).with_for_update()
    )
    db = DB.get()
    async with db.transaction():
        is_exist = await db.fetch_one(get_query)
        if is_exist is None:
            query = insert(Settings)
            await db.execute(query, {"key": key, "value": value})
        else:
            query = update(Settings).where(Settings.c.key == key)
            await db.execute(query, {"value": value})
        result = await db.fetch_one(get_query)

    return result


@check_db_connected
async def delete_setting(key: str) -> Any:
    query = delete(Settings).where(Settings.c.key == key)
    db = DB.get()
    async with db.transaction():
        result = await db.execute(query)

    return result
