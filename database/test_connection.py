
from sqlalchemy import text
from database.session import engine

try:
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT current_database()")
        )
        print("Connected successfully!")
        print("Database:", result.scalar())

except Exception as error:
    print("Connection failed:", error)
