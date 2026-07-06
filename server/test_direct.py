from fastapi.testclient import TestClient
from main import app
import sys

try:
    with TestClient(app) as client:
        response = client.get("/api/reports/?email=quynh0369505599@gmail.com")
        print(response.status_code)
        print(response.json())
except Exception as e:
    import traceback
    traceback.print_exc()
