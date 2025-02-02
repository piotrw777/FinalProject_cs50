sudo apt-get update
yes | sudo apt-get upgrade
yes | sudo apt-get install python3-pip
yes | sudo apt install python3-venv texlive texlive-latex-extra
python3 -m venv myenv
source myenv/bin/activate
pip install --upgrade pip
pip install flask flask-session requests Flask-SQLAlchemy pylatex python-dotenv py_expression_eval itsdangerous markupsafe
