import os
from flask import Flask, flash, get_flashed_messages, redirect, render_template, request, session, url_for
from flask_session import Session
# from tempfile import mkdtemp
from werkzeug.security import check_password_hash, generate_password_hash
from helpers import login_required
from flask_sqlalchemy import SQLAlchemy
import random
import string
from itsdangerous import URLSafeTimedSerializer
from dotenv import load_dotenv
from sqlalchemy import event
from sqlalchemy.sql import text


# from datetime import datetime
# load ENVS from .env file

load_dotenv()

# Configure application
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True
app.config['SECRET_KEY'] = 'your_secret_key'
db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), unique=False, nullable=False)

db.create_all()

# event.listen(db.engine, "before_execute", log_sql)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
@login_required
def index():
    return render_template("index.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""
    # Forget any user_id
    session.clear()
    print(3)
    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        username = request.form.get("username")
        print(username)
        # Ensure username was submitted
        if not username:
            print(1)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return print(1)
        print(request.form.get("password"))
        # Remember which user has logged in
        session["user_id"] = 5
        session["username"] = username
        flash('You are logged in successfully')
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")

@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user"""
    if request.method == "POST":
        # get variables from the form
        name = request.form['username']
        email = request.form['email']
        password = request.form['password']

        if (User.query.filter_by(name=name).first() != None):
            flash('User already exists')
            return render_template("register.html", msg = "error")
        
        if (User.query.filter_by(email=email).first() != None):
            flash('User with given email already exists')
            return render_template("register.html", msg = "error")

        #debug
        print(f"{name} hh {email}")

        # add user to the database
        new_user = User(name=name, email=email, password=password)
        db.session.add(new_user)
        db.session.commit()
        # get dictionary users = User.query.all()
        flash('User successfully added')
        return render_template("login.html", msg = "success")
    else:
        return render_template("register.html")

if __name__ == '__main__':
    app.run(debug=True)