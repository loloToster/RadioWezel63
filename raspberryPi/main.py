import secrets
import asyncio
import socketio
from modules.breakHandler import BreakHandler

WS_SERVER = "http://radiowezel.herokuapp.com/"
WS_SECRET = secrets.WS_SECRET
BREAKS = [
    ("09:00", "09:10"),
    ("09:55", "10:05"),
    ("10:50", "11:00"),
    ("11:45", "11:55"),
    ("12:40", "13:00"),
    ("13:45", "14:05"),
    ("14:50", "14:55"),
    ("20:33", "20:50"),
]

breakHandler = BreakHandler(BREAKS)
socket = socketio.AsyncClient(
    reconnection_attempts=10,
    reconnection_delay=5,
)


@breakHandler.breakStart()
def onBreakStart():
    print(f"break started")


@breakHandler.breakStop()
def onBreakStop():
    print("break stop")


@socket.event
async def connect():
    print("Connected to server")
    await breakHandler.loop()


async def main():
    await socket.connect(WS_SERVER, auth={"role": "python", "key": WS_SECRET})
    await socket.wait()


if __name__ == "__main__":
    asyncio.run(main())
