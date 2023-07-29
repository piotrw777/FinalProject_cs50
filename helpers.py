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
