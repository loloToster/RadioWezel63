import datetime


class BreakHandler:
    def __init__(self, BREAKS):
        self.BREAKS = BREAKS
        self._start()
        print(self.BREAKS)
        self._onStart = []
        self._onStop = []
        self.previousBreak = self.isBreakNow()

    def _start(self):
        for i, BREAK in enumerate(self.BREAKS):
            self.BREAKS[i] = {
                "breakStart": datetime.datetime.strptime(BREAK[0], "%H:%M").time(),
                "breakStop": datetime.datetime.strptime(BREAK[1], "%H:%M").time(),
            }

    def isBreakNow(self):
        time = datetime.datetime.now().time()
        for BREAK in self.BREAKS:
            if BREAK["breakStart"] < time < BREAK["breakStop"]:
                return True
        return False
