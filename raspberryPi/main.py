import secrets

import asyncio
import requests
import json
import os

from socketio import AsyncClient
from playsound import playsound

from modules.breakHandler import BreakHandler
from modules.downloader import download

PATH = os.path.dirname(os.path.realpath(__file__))
AUDIO_PATH = PATH + "/audio"
# SERVER = "http://radiowezel.herokuapp.com/"
SERVER = "http://localhost/"
ROUTE = SERVER + "rpi"
CONNECTION_SECRET = secrets.CONNECTION_SECRET

BREAKS = [
    ("09:00", "09:10"),
    ("09:55", "10:05"),
    ("10:50", "11:00"),
    ("11:45", "11:55"),
    ("12:40", "13:00"),
    ("13:45", "14:05"),
    ("14:50", "14:55"),
    ("19:57", "20:50"),
]

breakHandler = BreakHandler(BREAKS)
socket = AsyncClient(reconnection_attempts=10, reconnection_delay=5)


@breakHandler.breakStart()
async def onBreakStart():
    print(f"break started")
    songs = json.loads(
        requests.get(ROUTE + "/songs", headers={"auth": CONNECTION_SECRET}).content
    )
    mostPopular = None
    votes = 0
    for song in songs:
        if song["votes"] >= votes:
            mostPopular = song
            votes = song["votes"]
    done = await download(AUDIO_PATH, mostPopular["video"]["ytid"])
    print(f"Download: {done}, {mostPopular['video']['ytid']}")


@breakHandler.breakStop()
async def onBreakStop():
    print("break stop")


@socket.event
async def connect():
    print("Connected to server")
    await breakHandler.loop()


async def main():
    await socket.connect(SERVER, auth={"role": "python", "key": CONNECTION_SECRET})
    await socket.wait()


if __name__ == "__main__":
    asyncio.run(main())
