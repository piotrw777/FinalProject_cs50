import requests
from functools import wraps
from flask import redirect, render_template, request, session
import re

def login_required(f):
    """
    Decorate routes to require login.
    https://flask.palletsprojects.com/en/1.1.x/patterns/viewdecorators/
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
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