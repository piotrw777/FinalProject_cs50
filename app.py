
from helpers import login_required, get_latex_errors, send_mail, validate_password, csrf_authentication
import os, json
from flask import Flask, flash, get_flashed_messages, redirect, render_template, request, session, send_from_directory, jsonify, escape
from flask_session import Session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash
import random
from pylatex import Document, Package, Command
from pylatex.utils import NoEscape
import re
from datetime import datetime
from py_expression_eval import Parser

#from itsdangerous import URLSafeTimedSerializer
#from dotenv import load_dotenv
#from sqlalchemy import event
#from sqlalchemy.sql import text
#import string

#from pylatex.document import Document

USER_FILES_DIR="user_files"
PREVIEW_DIRNAME="preview"
PREVIEW_FILENAME="preview_file"

os.makedirs(USER_FILES_DIR, exist_ok=True) 

parser = Parser()

# load_dotenv()

app = Flask(__name__)
# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
#app.config['SQLALCHEMY_ECHO'] = True
app.config['SECRET_KEY'] = 'your_secret_key'

Session(app)

db = SQLAlchemy(app)
app.app_context().push()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), unique=False, nullable=False)
    verification_code = db.Column(db.Integer, unique=False, nullable=False)
    verified = db.Column(db.Boolean, unique=False, nullable=False)

class Tests(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    userid = db.Column(db.String(20), nullable=False)
    filename = db.Column(db.String(256), nullable=False)
    code = db.Column(db.String(4096), nullable=False)
    date = db.Column(db.DateTime)


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
    # generate CSRF token
    if not "csrf_token" in session:
        print("Generating csrf token")
        session["csrf_token"] = os.urandom(32).hex()

    csrf_token = session.get('csrf_token')

    # get list of files
    tests  = Tests.query.filter_by(userid = session["user_id"]).all()
    tests_pom = []

    for test in tests:
        tests_pom.append(test.__dict__)

    return render_template("index.html", name=session["username"], saved_files=tests_pom, csrf_token=csrf_token)


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

        session["user_id"] = user.id
        session["username"] = username

        # check verification
        if (user.verified):
            session["verified"] = True
            flash('You are logged in successfully')
            return redirect("/")
        else:
            return redirect("/verify")
    else:
        return render_template("login.html")


@app.route("/verify", methods=["GET", "POST"])
def verify():
     if request.method == "POST":
         verification_code_str =  request.form.get("verification_code")

         if (not verification_code_str.isnumeric()):
            flash('Invalid verification code')
            return render_template("verify.html", msg = "error")
         
         verification_code = int(verification_code_str)
         user=User.query.filter_by(id=session["user_id"]).first()

         if (verification_code == user.verification_code):
             user.verified = True
             db.session.commit()
             session["verified"] = True
             flash('Account verified successfully!')
             return redirect("/")
         else:
             flash('Invalid verification code')
             return render_template("verify.html", msg = "error")
     else:
         return render_template("verify.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/register", methods=["GET"])
def register_screen():
    return render_template("register.html")


@app.route("/register/<path:userInfo>", methods=["POST"])
def register_user(userInfo):
    """Register user"""
    if request.method == "POST":
        # get variables from the form
        userInfo = json.loads(userInfo)

        name = userInfo['username']
        email = userInfo['email']
        password = userInfo['password']
        confirmation = userInfo['confirmation']

        if (name == ""):
            return {
                'status' : "error",
                'response' : "Empty username"
            }
        
        if (email == ""):
            return {
                'status' : "error",
                'response' : "Empty email address"
            }

        if (User.query.filter_by(name=name).first() != None):
            return {
                'status' : "error",
                'response' : "User already exist"
            }
        
        if (User.query.filter_by(email=email).first() != None):
            return {
                'status' : "error",
                'response' : "User with given email already exists"
            }
        
        if (password != confirmation):
            return {
                'status' : "error",
                'response' : "Passwords don\'t match!"
            }

        if (validate_password(password) < 0):
            return {
                'status' : "error",
                'response' : "Passwords does not satisfy conditions"
            }

        # add user to the database
        verification_code = random.randrange(100000, 1000000)
        new_user = User(name=name, email=email, password=generate_password_hash(password), verification_code=verification_code, verified=False)
        db.session.add(new_user)
        db.session.commit()

        # create users directory
        os.makedirs(f"{USER_FILES_DIR}/{name}")
        os.makedirs(f"{USER_FILES_DIR}/{name}/{PREVIEW_DIRNAME}")
        os.makedirs(f"{USER_FILES_DIR}/{name}/solutions")

        # send email verification
        msg = f"Thank you for registration to the Math Tests Generator portal!!!\n \
You verification code is: {verification_code}."     
        
        send_mail(email, msg)

        return {
            'status' : "ok",
            'response' : ""
        }
    

@app.route('/download-pdf')
@login_required
def download_pdf():
    # Get the PDF filename from the request
    filename = request.args.get('filename')
    # Send the PDF file to the user
    try:
        directory = f'{os.getcwd()}/{USER_FILES_DIR}/{session["username"]}'
        return send_from_directory(directory, f"{filename}.pdf", as_attachment=True)
        
    except Exception as e:
        # There was an error sending the PDF file, so redirect the user to the error page
        return redirect('/error')


@app.route('/get-tex-file')
@login_required
def get_tex_file():
    # Get the PDF filename from the request
    filename = request.args.get('filename')
    directory = f'{os.getcwd()}/{USER_FILES_DIR}/{session["username"]}'
    # Send the tex file to the user
    try:
        directory = f'{os.getcwd()}/{USER_FILES_DIR}/{session["username"]}'
        return send_from_directory(directory, f"{filename}.tex", as_attachment=True)
        
    except Exception as e:
        # There was an error sending the PDF file, so redirect the user to the error page
        return redirect('/error')


@app.route('/get-tex-code')
@login_required
def get_tex_code():
    # Get the PDF filename from the request
    filename = request.args.get('filename')
    directory = f'{os.getcwd()}/{USER_FILES_DIR}/{session["username"]}'
    # Send the tex file to the user
    with open(f"{directory}/{filename}.tex",'r') as tex_code:
        tex_code_str = escape(tex_code.read())

    return {
        'status' : 'ok',
        'code' : tex_code_str
    }


@app.route('/delete-pdf')
@login_required
def delete_pdf():
    # Get the PDF filename from the request
    filename = request.args.get('filename')
    directory = f'{os.getcwd()}/{USER_FILES_DIR}/{session["username"]}'

    # remove the files
    try:
        os.remove(f"{directory}/{filename}.aux")
        os.remove(f"{directory}/{filename}.log")
        os.remove(f"{directory}/{filename}.pdf")
        os.remove(f"{directory}/{filename}.tex")
    except OSError:
        pass

    # remove the file from database
    test_record=Tests.query.filter_by(userid=session["user_id"], filename=filename).first()
    db.session.delete(test_record)
    db.session.commit()
        
    return redirect("/tests")


@app.route('/generate_pdf')
@login_required
def generate_pdf():
    # Get the PDF filename from the request
    filename = request.args.get('filename')

    directory = f'{os.getcwd()}/{USER_FILES_DIR}/{session["username"]}'
    return send_from_directory(directory, f"{filename}.pdf")


@app.route('/process-data/<path:userInfo>/<csrf_token>', methods=['POST'])
@csrf_authentication
def process_data(userInfo, csrf_token):
    userInfo = json.loads(userInfo)
    filename = userInfo['filename']
    groups = int(userInfo['groups'])
    variables = userInfo['vars'].split()
    minimum_values = userInfo['mins'].split()
    maximum_values = userInfo['maxs'].split()
    code = userInfo['code']
    groups_symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    result_code = ""

    # check if filename is already used in the database
    filename_check=Tests.query.filter_by(userid=session["user_id"], filename=filename).first()

    if (filename_check != None):
        return {
            'status' : "error",
            'response' : "Filename is already used"
        }

    for group_nr in range(groups):
        random.seed()
        code_1 = code
        code_1 = code_1.replace("#G#", groups_symbols[group_nr])
        for var_index, var in enumerate(variables):
            # pick a random value of a variable
            random_value = random.randrange(int(minimum_values[var_index]), int(maximum_values[var_index]) + 1)
            code_1 = code_1.replace(f"#{var}#", str(random_value))    
        result_code += code_1 + "\n" + "\n\\newpage\n"

    x = re.findall(r"@([^@]+)@", result_code)
    for match in x:
        try:
            parse_str = str(parser.parse(match).evaluate({}))
            result_code = result_code.replace(f"@{match}@", parse_str)
        except Exception as e:
            return {
            'status' : "error",
            'response' : "Error evaluating expression @..@"
        }   

    # set margins
    geometry_options = {"tmargin": "3cm", "lmargin": "3cm", "bmargin": "3cm", "rmargin": "3cm"}
    doc = Document(geometry_options=geometry_options, font_size='large')
    # Add necessary packages
    doc.packages.append(Package('amsmath'))
    doc.packages.append(Package('amssymb'))
    doc.packages.append(Package('amsfonts'))
    doc.packages.append(Package('mathtools'))
    doc.packages.append(Package('bm'))
    doc.packages.append(Package('setspace'))
    doc.append(Command('setstretch', arguments='1.25'))

    # Add the LaTeX code to the document
    doc.append(NoEscape(result_code))

    try:
        doc.generate_pdf(f'{USER_FILES_DIR}/{session["username"]}/{filename}', clean_tex=False)
        new_test = Tests(userid=session["user_id"], filename=filename, code = code, date=datetime.now())
        db.session.add(new_test)
        db.session.commit()
        return {
            'status' : "ok",
            'response' : "ok"
        }
    except Exception as e:
        errors = get_latex_errors(f'{USER_FILES_DIR}/{session["username"]}/{filename}.log')
        print(errors)
        #os.remove(f'{USER_FILES_DIR}/{session["username"]}/{filename}.pdf')
        return {
            'status' : "error",
            'response' : errors
        }


@app.route('/generate-preview/<path:userInfo>/<csrf_token>', methods=['POST'])
@csrf_authentication
def generate_preview(userInfo, csrf_token):
    print(f"Obtained token: {csrf_token}")
    userInfo = json.loads(userInfo)
    groups = int(userInfo['groups'])
    variables = userInfo['vars'].split()
    minimum_values = userInfo['mins'].split()
    maximum_values = userInfo['maxs'].split()
    code = userInfo['code']
    groups_symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    result_code = ""

    for group_nr in range(groups):
        random.seed()
        code_1 = code
        code_1 = code_1.replace("#G#", groups_symbols[group_nr])
        for var_index, var in enumerate(variables):
            # pick a random value of a variable
            random_value = random.randrange(int(minimum_values[var_index]), int(maximum_values[var_index]) + 1)
            code_1 = code_1.replace(f"#{var}#", str(random_value))    
        result_code += code_1 + "\n" + "\n\\newpage\n"

    expressions = re.findall(r"@([^@]+)@", result_code)
    for match in expressions:
        try:
            parse_str = str(parser.parse(match).evaluate({}))
            result_code = result_code.replace(f"@{match}@", parse_str)
        except Exception as e:
            return {
            'status' : "error",
            'response' : "Error evaluating expression @..@"
        }   

    # set margins
    geometry_options = {"tmargin": "3cm", "lmargin": "3cm", "bmargin": "3cm", "rmargin": "3cm"}
    doc = Document(geometry_options=geometry_options, font_size='large')
    # Add necessary packages
    doc.packages.append(Package('amsmath'))
    doc.packages.append(Package('amssymb'))
    doc.packages.append(Package('amsfonts'))
    doc.packages.append(Package('mathtools'))
    doc.packages.append(Package('bm'))
    doc.packages.append(Package('setspace'))
    doc.append(Command('setstretch', arguments='1.25'))

    # Add the LaTeX code to the document
    doc.append(NoEscape(result_code))

    preview_dir=f'{USER_FILES_DIR}/{session["username"]}/{PREVIEW_DIRNAME}'
    try:
        doc.generate_pdf(f'{preview_dir}/preview', clean_tex=False)
        return {
            'status' : "ok",
            'response' : "ok"
        }
    except Exception as e:
        errors = get_latex_errors(f'{preview_dir}/preview.log')
        print(errors)
        #os.remove(f'{USER_FILES_DIR}/{session["username"]}/{filename}.pdf')
        return {
            'status' : "error",
            'response' : errors
        }


@app.route('/get-latex-code/<path:userInfo>/<csrf_token>', methods=['POST'])
@csrf_authentication
def get_latex_code(userInfo, csrf_token):
    userInfo = json.loads(userInfo)
    filename = userInfo['filename']
    code=Tests.query.filter_by(userid=session["user_id"], filename=filename).first().code

    return {
        'status' : "ok",
        'response' : code
     }


@app.route("/tests")
@login_required
def tests():
    """generate tests"""
    tests  = Tests.query.filter_by(userid = session["user_id"]).all()
    tests_pom = []

    for test in tests:
        tests_pom.append(test.__dict__)
        tests_pom[-1]["date"] = tests_pom[-1]["date"].strftime('%Y-%m-%d %H:%M:%S')

    csrf_token = session["csrf_token"]
    return render_template("tests.html", tests = tests, csrf_token=csrf_token)


if __name__ == '__main__':
    app.run(debug=True)

