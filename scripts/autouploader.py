import requests
import glob

osrs = glob.glob("**/*.osr", recursive=True)
url = "http://omct.oralek.in/stat"
for osr in osrs:
	r =  requests.post(url, files={"osr": open(osr, "rb")})
	print(r)
	print(osr)
