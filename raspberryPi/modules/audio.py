import os

os.environ["PYGAME_HIDE_SUPPORT_PROMPT"] = "hide"

from pygame import mixer


mixer.init()


class Audio:
    def __init__(self):
        self.obj = None

    def setVolume(self, volume):
        return mixer.music.set_volume(volume / 100)

    def isPlaying(self):
        return mixer.music.get_busy()

    def getDuration(self):
        return mixer.music.get_pos()

    def play(self, path, obj):
        self.obj = obj
        mixer.music.load(path)
        mixer.music.play()

    def pause(self):
        mixer.music.pause()

    def unpause(self):
        mixer.music.unpause()

    def stop(self):
        mixer.music.stop()
