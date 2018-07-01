import requests
import glob

osrs = glob.glob("**/*.osr", recursive=True)
url = "http://localhost:3000/stat"
for osr in osrs:
	r =  requests.post(url, files={"osr": open(osr, "rb")})
	print(r)
	print(osr)
