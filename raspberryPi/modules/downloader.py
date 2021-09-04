from youtube_dl import YoutubeDL
from threading import Thread
import asyncio
import os

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

result = [None]


def _downloadThread(path, id):
    YDL_OPTS["outtmpl"] = f"{path}/{id}.%(ext)s"
    with YoutubeDL(YDL_OPTS) as ydl:
        try:
            ydl.download([DEF_YT_URL + id])
            result[0] = True
        except Exception as e:
            result[0] = False


async def download(path, id):
    if os.path.isfile(f"{path}/{id}.mp3"):
        return True
    thread = Thread(
        target=_downloadThread,
        args=(
            path,
            id,
        ),
        daemon=True,
    )
    thread.start()
    while thread.is_alive():
        await asyncio.sleep(0.1)
    return result[0]
