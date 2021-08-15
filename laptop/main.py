import secrets
import socketio
import os

WS_SERVER = "http://localhost:8080"
SECRET = secrets.WS_SECRET

# path = os.path.dirname(os.path.abspath(__file__)).replace("\\", "/")
# with open(path + "/" + "secret.txt") as f:
#    SECRET = f.readline()

sio = socketio.Client()


@sio.event
def connect():
    print("I'm connected!")


sio.connect(WS_SERVER)
