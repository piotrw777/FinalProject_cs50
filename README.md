# FinalProject_cs50
Final Project for CS50 2023 course

Bibliography

https://www.w3schools.com/js
https://bobbyhadz.com/blog/javascript-get-difference-between-two-sets
https://www.codespeedy.com/how-to-pass-javascript-variables-to-python-in-flask/
https://rahulbaran.hashnode.dev/how-to-send-json-from-javascript-to-flask-using-fetch-api
https://jeltef.github.io/PyLaTeX/current/

CS50 Web development course
https://www.youtube.com/watch?v=zFZrkCIc2Oc&t=6199s

Flask context
https://www.youtube.com/watch?v=JsZ1C9O_2XE

Python evaluation
https://pypi.org/project/py-expression-eval/

SETUP SERVER
Run the script setup_server.sh
This will install all necessary packages needed for server to run.

To run the Flask server:
Firstly, create database by running:

python3
from app import app
from app import db
db.create_all()

Then execute those commands:
source ./myenv/bin/activate
flask run

Or use the script that will do this automatically:

./start_server.txt