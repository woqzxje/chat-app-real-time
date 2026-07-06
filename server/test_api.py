import urllib.request
import urllib.error

try:
    urllib.request.urlopen('http://localhost:5000/api/reports?email=quynh0369505599@gmail.com')
except urllib.error.HTTPError as e:
    print(e.read().decode())
