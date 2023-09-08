# FinalProject_cs50
Final Project for CS50 2023 course

## Setup local server (Ubuntu 18.04, Ubuntu 20.04, Ubuntu 22.04)
```
./setup_server.sh
```
This will install all necessary packages needed for server to run.

## Run Flask server:
Firstly, create database by running:
```
python3
from app import app
from app import db
db.create_all()
```
Then execute those commands:
```
source ./myenv/bin/activate
flask run
```
Or use the script that will do this automatically:
```
./start_server.txt
```

## Deployment
[https://mathtestsgenerator/piotrw777.com](https://mathtestsgenerator.piotrw777.com)

## Bibliography

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

Boostrap Modals
https://github.com/Ara225/mini-frontend-projects/blob/master/2-bootstrap-modal-without-jQuery/bootstrap-modal-without-jQuery.html

Speed up loading background image
https://wpspeedmatters.com/speed-up-background-images/

itsdangerous library
https://itsdangerous.palletsprojects.com/en/2.1.x/
