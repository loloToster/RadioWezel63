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


class Downloader:
    def __init__(self):
        self.result = None
        self.thread = None

    async def download(self, path, id):
        if os.path.isfile(f"{path}/{id}.mp3"):
            return True
        self.thread = Thread(
            target=self._downloadThread,
            args=(
                path,
                id,
            ),
            daemon=True,
        )
        self.thread.start()
        while self.thread.is_alive():
            await asyncio.sleep(0.1)
        return self.result

    def _downloadThread(self, path, id):
        YDL_OPTS["outtmpl"] = f"{path}/{id}.%(ext)s"
        with YoutubeDL(YDL_OPTS) as ydl:
            try:
                ydl.download([DEF_YT_URL + id])
                self.result = True
            except Exception as e:
                self.result = False
