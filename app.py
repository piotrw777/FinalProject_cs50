import os
import json
from flask import Flask, flash, get_flashed_messages, redirect, render_template, request, session, url_for, send_from_directory, jsonify
from flask_session import Session
# from tempfile import mkdtemp
from werkzeug.security import check_password_hash, generate_password_hash
from helpers import login_required
from flask_sqlalchemy import SQLAlchemy
import random
import string
import re
from itsdangerous import URLSafeTimedSerializer
from dotenv import load_dotenv
from sqlalchemy import event
from sqlalchemy.sql import text

from pylatex import Document, Section, Subsection, Command, Package
from pylatex.document import Document
from pylatex.utils import NoEscape

from datetime import datetime

# from datetime import datetime
# load ENVS from .env file

load_dotenv()

# Configure application
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
#app.config['SQLALCHEMY_ECHO'] = True
app.config['SECRET_KEY'] = 'your_secret_key'
db = SQLAlchemy(app)

USER_FILES_DIR="user_files"
os.makedirs(USER_FILES_DIR, exist_ok=True)
            
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), unique=False, nullable=False)

class Tests(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    userid = db.Column(db.String(20), nullable=False)
    filename = db.Column(db.String(256), nullable=False)
    code = db.Column(db.String(4096), nullable=False)
    date = db.Column(db.DateTime)

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

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        username = request.form.get("username")
        user=User.query.filter_by(name=username).first()

        if (user == None):
            flash('User does not exist')
            return render_template("login.html", msg = "error")

        if not check_password_hash(user.password, request.form.get("password")):
            flash('Wrong password')
            return render_template("login.html", msg = "error")

        # Remember which user has logged in
        session["user_id"] = user.id
        session["username"] = username
        flash('You are logged in successfully')
        return render_template("index.html", name=username)

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
        confirmation = request.form['confirmation']

        if (User.query.filter_by(name=name).first() != None):
            flash('User already exists')
            return render_template("register.html", msg = "error")
        
        if (User.query.filter_by(email=email).first() != None):
            flash('User with given email already exists')
            return render_template("register.html", msg = "error")
        
        if (password != confirmation):
            flash('Passwords don\'t match')
            return render_template("register.html", msg = "error")

        # add user to the database
        new_user = User(name=name, email=email, password=generate_password_hash(password))
        db.session.add(new_user)
        db.session.commit()

        # create users directory
        os.makedirs(f"{USER_FILES_DIR}/{name}")

        # get dictionary users = User.query.all()
        flash('User successfully added')
        return render_template("login.html", msg = "success")
    else:
        return render_template("register.html")


@app.route("/generate", methods=["GET", "POST"])
def generate():
    """generate tests"""
    if request.method == "POST":

        # get variables from the form
        latex_code = request.form.get("latex_code")

        # Get the filename from the form
        filename = request.form.get("filename")

        # Ensure whether the file already exists
        # TODO !!!

        # Create a PDF document
        doc = Document()

        # Add necessary packages
        doc.packages.append(Package('amsmath'))
        doc.packages.append(Package('amssymb'))
        doc.packages.append(Package('amsfonts'))
        doc.packages.append(Package('mathtools'))
        doc.packages.append(Package('bm'))

        # Add the LaTeX code to the document
        doc.append(NoEscape(latex_code))

        # Generate PDF
        try:
            doc.generate_pdf(f'{USER_FILES_DIR}/{session["username"]}/{filename}', clean_tex=False)
        except Exception as e:
            # There was an error generating the PDF, so redirect the user to the error page
            return redirect('/error')

        new_test = Tests(userid=session["user_id"], filename=filename, code = latex_code, date=datetime.now())

        db.session.add(new_test)
        db.session.commit()
          
    # Get the filename of the generated PDF file
    #pdf_filename = f'{fname}.pdf'

    # Get the size of the generated PDF file
    #pdf_size = os.stat(pdf_filename).st_size

    # Get the modification time of the generated PDF file
    #pdf_date = datetime.fromtimestamp(os.path.getmtime(pdf_filename)).strftime('%Y-%m-%d %H:%M:%S')

    # Render the success template with the link to the PDF file and the file size and date
    #return render_template('success.html', pdf_filename=pdf_filename, pdf_size=pdf_size, pdf_date=pdf_date)

    tests  = Tests.query.filter_by(userid = session["user_id"]).all()
    tests_pom = []

    for test in tests:
        tests_pom.append(test.__dict__)
        tests_pom[-1]["date"] = tests_pom[-1]["date"].strftime('%Y-%m-%d %H:%M:%S')


    return render_template("tests.html", tests = tests)


@app.route('/download_pdf')
def download_pdf():
    # Get the PDF filename from the request
    filename = request.args.get('filename')

    # Send the PDF file to the user
    try:
        print(os.getcwd())
        directory = f'{os.getcwd()}/{USER_FILES_DIR}/{session["username"]}'
        return send_from_directory(directory, f"{filename}.pdf", as_attachment=True)
        
    except Exception as e:
        # There was an error sending the PDF file, so redirect the user to the error page
        return redirect('/error')


@app.route('/process-data/<path:userInfo>', methods=['POST'])
def process_data(userInfo):
    userInfo = json.loads(userInfo)
    variables = userInfo['vars'].split()
    minimum_values = userInfo['mins'].split()
    maximum_values = userInfo['maxs'].split()
    code = userInfo['code']
    result_code = ""

    for group_nr in range(4):
        random.seed()
        code_1 = code
        code_1 = code_1.replace("#G#", str(group_nr))
        for var_index, var in enumerate(variables):
            # pick a random value of a variable
            print(f"hello{var}")
            random_value = random.randrange(int(minimum_values[var_index]), int(maximum_values[var_index]) + 1)
            code_1 = code_1.replace(f"#{var}#", str(random_value))    
        result_code += code_1 + "\n\\newline\n" + "\n\\newpage\n"


    print('%%%%%%%%%%%%%')    
    print(f"result code: {result_code}")
    print('%%%%%%%%%%%%%') 

    # create latex document
    doc = Document()

    # Add necessary packages
    doc.packages.append(Package('amsmath'))
    doc.packages.append(Package('amssymb'))
    doc.packages.append(Package('amsfonts'))
    doc.packages.append(Package('mathtools'))
    doc.packages.append(Package('bm'))

    # Add the LaTeX code to the document
    doc.append(NoEscape(result_code))


    filename = "test22"
    # Generate PDF
    try:
        doc.generate_pdf(f'{USER_FILES_DIR}/{session["username"]}/{filename}', clean_tex=False)
    except Exception as e:
        # There was an error generating the PDF, so redirect the user to the error page
        return redirect('/error')

    return "bobo"



if __name__ == '__main__':
    app.run(debug=True)