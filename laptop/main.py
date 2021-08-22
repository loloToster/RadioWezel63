import secrets
import socketio
import os

WS_SERVER = "http://localhost:8080"
SECRET = secrets.WS_SECRET


sio = socketio.Client()


@sio.event
def connect():
    print("I'm connected!")


sio.connect(WS_SERVER, auth={"role": "python", "key": SECRET})
