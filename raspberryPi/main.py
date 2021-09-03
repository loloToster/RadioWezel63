import secrets

import asyncio
import requests
import json
import os

from socketio import AsyncClient
from playsound import playsound
from youtube_dl import YoutubeDL

from modules.breakHandler import BreakHandler

PATH = os.path.dirname(os.path.realpath(__file__))

DEF_YT_URL = "https://www.youtube.com/watch?v="
YDL_OPTS = {
    "format": "worst",
    "postprocessors": [
        {
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }
    ],
    "outtmpl": None,
    "quiet": False,
}
# SERVER = "http://radiowezel.herokuapp.com/"
SERVER = "http://localhost/"
ROUTE = "http://localhost/rpi"
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
    print(mostPopular)
    YDL_OPTS["outtmpl"] = f"{PATH}/{mostPopular['video']['ytid']}.%(ext)s"
    with YoutubeDL(YDL_OPTS) as ydl:
        try:
            ydl.download([DEF_YT_URL + mostPopular["video"]["ytid"]])
        except Exception as e:
            print(e)


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
