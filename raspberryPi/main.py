import secrets

import asyncio
import requests
import os
import math

from socketio import AsyncClient

from modules.breakHandler import BreakHandler
from modules.downloader import Downloader
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

BREAKS = []


def createTestBreak(n=0, o=1):
    from datetime import datetime, timedelta

    breakStart = datetime.now() + timedelta(minutes=n)
    offset = breakStart + timedelta(minutes=o)
    return (f"{breakStart.hour}:{breakStart.minute}", f"{offset.hour}:{offset.minute}")


BREAKS.append(createTestBreak(1))


breakHandler = BreakHandler(BREAKS)
socket = AsyncClient(reconnection_attempts=math.inf, reconnection_delay=5)
audio = Audio()
downloader = Downloader()


async def updateServer(override=False):
    await socket.emit(
        "update",
        {
            "currentDuration": -1 if override else round(audio.getDuration() / 1000),
            "video": audio.obj,
        },
    )


async def breakLoop():
    if audio.isPlaying():
        await updateServer()
        return
    songs = requests.get(ROUTE + "/songs", headers={"auth": CONNECTION_SECRET}).json()
    songs.sort(key=lambda ve: ve["votes"], reverse=True)
    mostPopular = songs[0]
    done = await downloader.download(AUDIO_PATH, mostPopular["video"]["ytid"])
    print(f"Download: {done}, {mostPopular['video']['ytid']}")
    requests.delete(
        ROUTE + "/remove/" + mostPopular["video"]["ytid"],
        headers={"auth": CONNECTION_SECRET},
    )
    print("Playing")
    audio.play(f"{AUDIO_PATH}/{mostPopular['video']['ytid']}.mp3", mostPopular["video"])


async def lessonLoop():
    audio.stop()
    await updateServer(True)


async def mainLoop():
    while True:
        if breakHandler.isBreakNow() or True:  #! delete `or True`
            await breakLoop()
        else:
            await lessonLoop()
        await socket.sleep(1)


@socket.event
async def connect():
    print("Connected to the server")
    socket.start_background_task(mainLoop)


@socket.event
async def disconnect():
    print("Disconnected from the server")
    breakHandler.stopLoop = True


async def main():
    await socket.connect(SERVER, auth={"role": "python", "key": CONNECTION_SECRET})
    await socket.wait()


if __name__ == "__main__":
    asyncio.run(main())
