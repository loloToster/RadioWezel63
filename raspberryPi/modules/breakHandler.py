import asyncio
import datetime


class BadBreaksError(Exception):
    def __init__(self, arg=None):
        print(arg)


class BreakHandler:
    def __init__(self, BREAKS):
        self._validateBreaks(BREAKS)
        self.BREAKS = BREAKS
        self._onStart = []
        self._onStop = []
        self.previousBreak = self.isBreakNow()

    def _validateBreaks(self, BREAKS):
        for BREAK in BREAKS:
            BREAK = {
                "breakStart": {
                    "hour": int(BREAK[0].split(":")[0]),
                    "minute": int(BREAK[0].split(":")[1]),
                },
                "breakStop": {
                    "hour": int(BREAK[1].split(":")[0]),
                    "minute": int(BREAK[1].split(":")[1]),
                },
            }
            for i in BREAK:
                i = BREAK[i]
                if i["hour"] > 23 or i["hour"] < 0:
                    raise BadBreaksError(
                        f"'{i['hour']}' is invalid for a hour property"
                    )
                if i["minute"] > 59 or i["minute"] < 0:
                    raise BadBreaksError(
                        f"'{i['minute']}' is invalid for a minute property"
                    )

    async def loop(self):
        print("Starting BreakHandler loop")
        while True:
            isThereBreak = self.isBreakNow()
            if isThereBreak != self.previousBreak:
                if isThereBreak:
                    self._callStart()
                else:
                    self._callStop()
            self.previousBreak = isThereBreak
            await asyncio.sleep(1)

    def isBreakNow(self):
        time = datetime.datetime.now()
        for BREAK in self.BREAKS:
            breakStart = {
                "hour": int(BREAK[0].split(":")[0]),
                "minute": int(BREAK[0].split(":")[1]),
            }
            breakStop = {
                "hour": int(BREAK[1].split(":")[0]),
                "minute": int(BREAK[1].split(":")[1]),
            }
            if (
                time.hour >= breakStart["hour"]
                and time.hour <= breakStop["hour"]
                and time.minute > breakStart["minute"]
                and time.minute < breakStop["minute"]
            ):
                return True
        return False

    def _callStart(self):
        for handler in self._onStart:
            handler()

    def _callStop(self):
        for handler in self._onStop:
            handler()

    def breakStart(self):
        def registerhandler(handler):
            self._onStart.append(handler)

        return registerhandler

    def breakStop(self):
        def registerhandler(handler):
            self._onStop.append(handler)

        return registerhandler
