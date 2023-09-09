import re, smtplib
from functools import wraps
from flask import redirect, render_template, session
from config import app, LOGFILE
from email.mime.text import MIMEText
from email.header import Header
from email.utils import formataddr
from datetime import datetime


def login_required(f):
    """
    Decorate routes to require login.
    https://flask.palletsprojects.com/en/1.1.x/patterns/viewdecorators/
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if ((session.get("user_id") is None) or (session.get("verified") is None)):
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function


def csrf_authentication(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print(f"got the token: {kwargs.get('csrf_token')}")
        if (session.get('csrf_token') != kwargs.get('csrf_token')):
            return {
                'status' : "error",
                 'response' : "Dupa jesteś, nie haker!"
            }
        return f(*args, **kwargs)
    return decorated_function


def get_latex_errors(filename):
    errors = ""
    pattern = "! "
    with open(filename, "r") as log_file:
        for line in log_file:
            if re.search(pattern, line):
                errors += line
    return errors


def has_digit(str):
    digits={'0','1','2','3','4','5','6','7','8','9'}
    for char in str:
        if char in digits:
            return True
    return False


def has_upper_letter(str):
    for char in str:
        if char.isupper():
            return True
    return False


def has_lower_letter(str):
    for char in str:
        if char.islower():
            return True
    return False


def has_special_symbol(str):
    specials={'}','{','!','@','#','$','%','^','&','*','(', \
')','-','_','+','=',';',':','\"','\'',',','.','/',\
'<','>','?','[',']','|','\\','`'}
    for char in str:
        if char in specials:
            return True
    return False

# validation of password
# error codes:
# -1 - length < 8
# -2 - missing lower letter
# -3 - missing upper letter
# -4 - missing digit
# -5 - missing special character
def validate_password(password):
    if len(password) < 8:
        return -1
    if not has_lower_letter(password):
        return -2
    if not has_upper_letter(password):
        return -3
    if not has_digit(password):
        return -4
    if not has_special_symbol(password):
        return -5
    return 0


def apology(msgtop="hmm", msgbottom="error"):
    """Render message as an error to user."""
    def escape(s):
        """
        Escape special characters.

        https://github.com/jacebrowning/memegen#special-characters
        """
        for old, new in [("-", "--"), (" ", "-"), ("_", "__"), ("?", "~q"),
                         ("%", "~p"), ("#", "~h"), ("/", "~s"), ("\"", "''")]:
            s = s.replace(old, new)
        return s
    return render_template("apology.html", msgtop=msgtop,msgbottom=escape(msgbottom))

def log(text):
    try:
        with open(LOGFILE, 'a') as file:
            if (session.get("username") is not None):
                file.write(f'User: {session["username"]} {datetime.now()} ### ')
                file.write(text + ' ###' + '\n')
            else:
                file.write(f'User: Unknown {datetime.now()} ### ')
                file.write(text + ' ###' + '\n')
    except Exception as e:
        print(f"An error occurred: {e}")


def send_mail(recipient, msg, topic="Registration"):
    # Define to/from
    sender = app.config["SMTP_LOGIN"]
    sender_title = "Math Tests Generator"

    # Create message
    msg = MIMEText(msg, 'plain', 'utf-8')
    msg['Subject'] =  Header(topic, 'utf-8')
    msg['From'] = formataddr((str(Header(sender_title, 'utf-8')), sender))
    msg['To'] = recipient

    server = smtplib.SMTP_SSL(app.config["SMTP_SERVER"], app.config["SMTP_SERVER_PORT"])

    # Perform operations via server
    server.login(sender, app.config["SMTP_PASSWORD"])
    server.sendmail(sender, [recipient], msg.as_string())
    server.quit()

    