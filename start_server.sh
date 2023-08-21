#!/bin/bash

database_file_path="./instance/users.db" 

source myenv/bin/activate

if [ ! -e "$database_file_path" ]; then
    echo "Database file does not exist"
    python3 create_database.py
fi

source myenv/bin/activate
flask run
