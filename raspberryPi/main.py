import secrets

import asyncio
import requests
import os
import math

from socketio import AsyncClient

from modules.breakHandler import BreakHandler
from modules.downloader import download
from modules.audio import Audio

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
]


def createTestBreak(n=0, o=2):
    from datetime import datetime, timedelta

    now = datetime.now() + timedelta(minutes=n)
    offset = now + timedelta(minutes=o)
    return (f"{now.hour}:{now.minute}", f"{offset.hour}:{offset.minute}")


BREAKS.append(createTestBreak())

print(BREAKS[-1])

breakHandler = BreakHandler(BREAKS)
socket = AsyncClient(reconnection_attempts=math.inf, reconnection_delay=5)
audio = Audio()


async def updateServer(override=False):
    await socket.emit(
        "update",
        {
            "currentDuration": -1 if override else round(audio.getDuration() / 1000),
            "video": audio.obj,
        },
    )


@breakHandler.breakStart()
async def onBreakStart():
    print(f"break started")
    while breakHandler.isBreakNow():
        if audio.isPlaying():
            await updateServer()
            await asyncio.sleep(1)
            continue
        songs = requests.get(
            ROUTE + "/songs", headers={"auth": CONNECTION_SECRET}
        ).json()
        songs.sort(key=lambda ve: ve["votes"], reverse=True)
        mostPopular = songs[0]
        done = await download(AUDIO_PATH, mostPopular["video"]["ytid"])
        print(f"Download: {done}, {mostPopular['video']['ytid']}")
        requests.delete(
            ROUTE + "/remove/" + mostPopular["video"]["ytid"],
            headers={"auth": CONNECTION_SECRET},
        )
        print("Playing")
        audio.play(
            f"{AUDIO_PATH}/{mostPopular['video']['ytid']}.mp3", mostPopular["video"]
        )


@breakHandler.breakStop()
async def onBreakStop():
    print("break stop")
    audio.stop()
    await updateServer(True)


@socket.event
async def connect():
    print("Connected to the server")
    socket.start_background_task(breakHandler.loop)


@socket.event
async def disconnect():
    print("Disconnected from the server")
    breakHandler.stopLoop = True


async def main():
    await socket.connect(SERVER, auth={"role": "python", "key": CONNECTION_SECRET})
    await socket.wait()


if __name__ == "__main__":
    asyncio.run(main())
