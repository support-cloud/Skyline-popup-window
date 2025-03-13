### DB Connection pool tuning ####
from __future__ import annotations

from contextvars import ContextVar

from databases import Database, DatabaseURL, core

from skyline_apiserver.config import CONF

DATABASE = None
DB: ContextVar = ContextVar("skyline_db")


class ParallelDatabase(Database):
    def connection(self) -> core.Connection:
        return core.Connection(self._backend)


async def setup():
    db_url = DatabaseURL(CONF.default.database_url)
    global DATABASE
    if db_url.scheme == "mysql":
        DATABASE = ParallelDatabase(
            db_url,
            minsize=10,
            maxsize=200,
            pool_recycle=300,  # Recycle connections every 5 minutes
            echo=CONF.default.debug,
            charset="utf8",
            connect_timeout=10,   # Added connection timeout
            client_flag=0,
        )
    elif db_url.scheme == "sqlite":
        DATABASE = ParallelDatabase(db_url)
    else:
        raise ValueError("Unsupported database backend")
    await DATABASE.connect()


async def inject_db():
    global DATABASE
    DB.set(DATABASE)
