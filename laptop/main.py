import secrets
import os
import datetime
import socketio
from pymongo import MongoClient

BREAKS = [
    ("09:00", "09:10"),
    ("09:55", "10:05"),
    ("10:50", "11:00"),
    ("11:45", "11:55"),
    ("12:40", "13:00"),
    ("13:45", "14:05"),
    ("14:50", "14:55"),
]

WS_SERVER = "http://radiowezel.herokuapp.com/"
MONGO_URL = secrets.MONGO_URL
SECRET = secrets.WS_SECRET

cluster = MongoClient(MONGO_URL)
db = cluster["learning"]
voteElements = db["voteelements"]
# videos = [
#     {"ytid": i["video"]["ytid"], "votes": i["votes"]} for i in voteElements.find({})
# ]
# print(videos)


socket = socketio.Client(
    reconnection_attempts=3,
    reconnection_delay=5,
)
breakCurrently = False


def clock():
    global breakCurrently
    while True:
        previousBreakCurrently = breakCurrently
        time = datetime.datetime.now()
        for BREAK in BREAKS:
            breakStart = {
                "hour": int(BREAK[0].split(":")[0]),
                "minute": int(BREAK[0].split(":")[1]),
            }
            breakStop = {
                "hour": int(BREAK[1].split(":")[0]),
                "minute": int(BREAK[1].split(":")[1]),
            }
            if (
                time.hour > breakStart["hour"]
                and time.hour < breakStop["hour"]
                and time.minute > breakStart["minute"]
                and time.minute < breakStop["minute"]
            ):
                breakCurrently = True
                break
        else:
            breakCurrently = False
        if breakCurrently != previousBreakCurrently:
            print((time.hour, time.minute))
            if breakCurrently:
                onBreakStart()
            else:
                onBreakStop()
        socket.sleep(1)


def onBreakStart():
    print("break start")


def onBreakStop():
    print("break stop")


@socket.event
def connect():
    print("I'm connected!")
    socket.start_background_task(clock)


socket.connect(WS_SERVER, auth={"role": "python", "key": SECRET})
