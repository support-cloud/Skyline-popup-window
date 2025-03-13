## Skyline Dashboard: 30days trial pop up window enabling for natively for licence part implementation

This part of implementation is only for openstack 2023.1 version.

## There are Natively implemention of the phases such as,

1. Backend
2. Frontend

Backend part: implement to store data into the DB & fetch details via API 

Frontend Part: Fetch details via API to render & showcase popup window

## Step1: Add custom function (get_login_record,record_user_login)

1. Navigate to:

```sh
cd /var/lib/kolla/venv/lib/python3.10/site-packages/skyline_apiserver/db/
```
2. Edit 'api.py' & add function (get_login_record, record_user_login):
   ```py
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
     ```
3. Edit models.py 
   ```py
   UserLoginTimes = Table(
    "user_login_times",
    METADATA,
    Column("user_id", String(length=128), nullable=False, index=True, unique=False),
    Column("login_time", Integer, nullable=False, index=True),
   )
   ```
4. Edit base.py adding some parameters for tuning
   ```py
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
   ```
5. Navigate to:
   ```sh
   cd /var/lib/kolla/venv/lib/python3.10/site-packages/skyline_apiserver/schemas/
   ```
6. Modify login.py & add some cutom parameters
   ```py
   class UserLoginTimeResponse(BaseModel):
    user_id: str
    login_time: int
   ```
7. Modify __init__.py & add some cutom parameters
   ```py
   from .login import SSO, Credential, Payload, Profile, UserLoginTimeResponse
   ```
8.  Navigate to:
   ```sh
   cd /var/lib/kolla/venv/lib/python3.10/site-packages/skyline_apiserver/api/v1/
   ```
9. Modify login.py & add custom api endpoint:
   ```py
   @router.post(
    "/login",...)
   async def login(.......)
   # ... (rest of the code remains unchanged)
   profile = await _patch_profile(profile, x_openstack_request_id)
   await db_api.record_user_login(profile.user.id, profile.exp)
    # ... (rest of the code remains unchanged)
   
   @router.get(
    "/user-login-time",
    description="Get the user's initial login time.",
    responses={
        200: {"model": schemas.UserLoginTimeResponse},
        401: {"model": schemas.UnauthorizedMessage},
    },
    response_model=schemas.UserLoginTimeResponse,
    status_code=status.HTTP_200_OK,
    response_description="OK",
    )
    async def get_user_login_time(
        profile: schemas.Profile = Depends(deps.get_profile),
    ) -> schemas.UserLoginTimeResponse:
    """Get the user's initial login time from the database."""
    try:
        LOG.info(f"Fetching login time for user_id={profile.user.id}")
        login_record = await db_api.get_login_record(profile.user.id)

        if login_record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Login time not found",
            )

        return {"user_id": profile.user.id, "login_time": login_record.login_time}
    except Exception as e:
        LOG.error(f"Error fetching login time for user_id={profile.user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
   ```
10. Table creation from DB
    1. Navigate to:
    ```sh
      cd /var/lib/kolla/venv/lib/python3.10/site-packages/skyline_apiserver/db/alembic/
    ```
    2. Edit the alembic.ini
       ```ini
       sqlalchemy.url = mysql+pymysql://skyline:[dbpassword]@[dbhost]/skyline
       ```
    3. run this command
       ```sh
       alembic revision --autogenerate -m "add_user_login_times_table"
       alembic upgrade head
       ```
    4. Check the skyline DB if the table is created
       ```
       MariaDB [skyline]> show tables;
       +-------------------+
       | Tables_in_skyline |
       +-------------------+
       | alembic_version   |
       | revoked_token     |
       | settings          |
       | user_login_times  |
       +-------------------+
       4 rows in set (0.001 sec)
       ```
    5. restart the skyline api server

  Phase1 Backend Part completed...!

  ### Step2: Add custom code for index.jsx for skyline console

  1. Navigate to:
    ```sh
    cd /skyline-console/src/components/Layout/GlobalHeader/
    ```
  2. Download `index.jsx` into the `GlobalHeader' folder.

  3. Precompile the Code
   ```sh
   cd /skyline-console
   ```

  4. Compile the code:
   ```sh
   make package
   ```

  5. Install the updated package:
     ```sh
     pip3 install --force-reinstall dist/skyline_console-*.whl
     ```

  6. Restart the skyline console service

Phase2 Frontend Part completed...!

### Final Output

![image](https://github.com/user-attachments/assets/e3358cb8-d196-4b66-a58c-9eb3c3386684)

     
     



       
       



 
