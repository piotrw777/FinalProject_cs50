import os, logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from itsdangerous import URLSafeTimedSerializer as Serializer
from flask_session import Session
from dotenv import load_dotenv
from py_expression_eval import Parser

USER_FILES_DIR="user_files"
PREVIEW_DIRNAME="preview"
PREVIEW_FILENAME="preview_file"
LOGFILE="logfile.txt"

app = Flask(__name__)
load_dotenv()

# Make sure necessary ENVS are set
if not os.environ.get("SECRET_KEY"):
    raise RuntimeError("SECRET_KEY not set")

if not os.environ.get("SMTP_SERVER"):
    raise RuntimeError("SMTP_SERVER not set")

if not os.environ.get("SMTP_SERVER_PORT"):
    raise RuntimeError("SMTP_SERVER_PORT not set")

if not os.environ.get("SMTP_LOGIN"):
    raise RuntimeError("SMTP_LOGIN not set")

if not os.environ.get("SMTP_PASSWORD"):
    raise RuntimeError("SMTP_PASSWORD not set")

app.config["SMTP_SERVER"] = os.environ.get("SMTP_SERVER")
app.config["SMTP_SERVER_PORT"] = os.environ.get("SMTP_SERVER_PORT")
app.config["SMTP_PASSWORD"] = os.environ.get("SMTP_PASSWORD")
app.config["SMTP_LOGIN"] = os.environ.get("SMTP_LOGIN")

# set log level
app.logger.setLevel(logging.DEBUG)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
#app.config['SQLALCHEMY_ECHO'] = True
app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY")

serializer=Serializer(app.config['SECRET_KEY'])

Session(app)
app.app_context().push()
db = SQLAlchemy(app)
parser = Parser()

os.makedirs(USER_FILES_DIR, exist_ok=True)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), unique=False, nullable=False)
    verification_code = db.Column(db.Integer, unique=False, nullable=False)
    verified = db.Column(db.Boolean, unique=False, nullable=False, default = False)
    active_reset_password_link = db.Column(db.Boolean, unique=False, nullable=True, default = None)
    reset_password_token = db.Column(db.String(120), unique=False, nullable=True, default = None)
    reset_password_random_token = db.Column(db.String(32), unique=False, nullable=True, default = None)

class Tests(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    userid = db.Column(db.String(20), nullable=False)
    filename = db.Column(db.String(256), nullable=False)
    code = db.Column(db.String(4096), nullable=False)
    date = db.Column(db.DateTime)
