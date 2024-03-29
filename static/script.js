const VARIABLES = new Set();

function removeID(_id){ 
    var e=document.getElementById(_id);
    if(e!==null) {
        e.remove();
    }
}

function setDifference(setA, setB) {
    return new Set(
      [...setA].filter(element => !setB.has(element))
    );
  }

function createForm(variable) {
    const form = document.createElement('form');
    const div1 = document.createElement('div');
    const label = document.createElement('label');
    const div2 = document.createElement('div');
    const input_min = document.createElement('input');
    const div3 = document.createElement('div');
    const input_max = document.createElement('input');
    const error_min = document.createElement('p');
    const error_max = document.createElement('p');

    form.setAttribute("id", "latex-var-" + variable)

    div1.setAttribute("class", "row align-items-center");
    div1.setAttribute("id", "variable_form_row");
    div2.setAttribute("id", "variable_div");
    div2.setAttribute("class", "col-md-12 col-3 d-flex justify-content-center");
    div3.setAttribute("class", "col-md-12 col-9");

    input_min.setAttribute("placeholder", "min value");
    input_min.setAttribute("type", "text");
    input_min.setAttribute("class", "form-control input-min-var");
    input_min.setAttribute("id", "min-" + variable);
    input_min.setAttribute("oninput","validate_data()")

    input_max.setAttribute("placeholder", "max value");
    input_max.setAttribute("type", "text");
    input_max.setAttribute("class", "form-control");
    input_max.setAttribute("id", "max-" + variable);
    input_max.setAttribute("oninput","validate_data()")

    error_min.setAttribute("id", "error-min-" + variable)
    error_min.setAttribute("class", "error")
    error_max.setAttribute("id", "error-max-" + variable)
    error_max.setAttribute("class", "error")

    label.innerHTML = "var: <strong>" + variable + "</strong>";

    document.querySelector('#variables_colum').append(form);
    form.append(div1);
    div1.append(div2);
    div1.append(div3);
    div2.append(label);
    div3.append(input_min);
    div3.append(error_min);
    div3.append(input_max);
    div3.append(error_max);
};

var date = new Date(0)

function update_variables_forms() {
    const date_now = Date.now();
    
    if (date_now - date < 100) {
        return;
    }

    const str = document.getElementById("LateXCode").value;
    const regexp = /#(.*?)#/g;
    const matches = Array.from(str.matchAll(regexp));
    const new_variables = new Set();

    let i = 0;
    while (i < matches.length) {
        const variable = matches[i][1]
        if (variable != "G") {
            new_variables.add(variable)
        }
        i += 1;
    }

    const variables_to_remove = setDifference(VARIABLES, new_variables)
    const variables_to_add = setDifference(new_variables, VARIABLES)

    variables_to_add.forEach((currentElement) => { 
        VARIABLES.add(currentElement)
        createForm(currentElement); })

    variables_to_remove.forEach((currentElement) => { 
        removeID("latex-var-" + currentElement)
        VARIABLES.delete(currentElement)})
};

function validate_filename() {
    const error_box = document.getElementById('filename-error');
    const filename = document.getElementById('filename').value;
    const regex =  /^[A-Za-z0-9\(\)\-_\[\] ]+$/;

    if (filename.length > 16) {
        error_box.innerHTML = "Filename too long"
        return false;
    }

    if (filename === "") {
        error_box.innerHTML = "Filename is empty";
        return false;
    } 

    if (!regex.test(filename)) {
        error_box.innerHTML = "Invalid characters. Only these special characters ()[]-_ are allowed";
        return false;
    }

    error_box.innerHTML = "";
    return true;
}

function validate_data() {
    console.log('validation of data')
    let ret_val = true;

    VARIABLES.forEach((currentElement) => {
        if (validate_min_max(currentElement) == false) {
            ret_val = false;
        }})
    
    return ret_val;
};

function validate_min_max(variable) {
    var ret_val = true
    const min_val = document.getElementById("min-" + variable).value.trim()
    const max_val = document.getElementById("max-" + variable).value.trim()
    error_box_min = document.getElementById("error-min-" + variable)
    error_box_max = document.getElementById("error-max-" + variable)

    const regex = /^[+-]?[0-9]+$/;

    if (!regex.test(min_val)) {
        error_box_min.innerHTML = "Provide a valid number";
        ret_val = false;
    } else {
        error_box_min.innerHTML = "";
    }

    if (!regex.test(max_val)) {
        error_box_max.innerHTML = "Provide a valid number";
        ret_val = false;
    } else {
        error_box_max.innerHTML = "";
    }

    if (ret_val == true && (Number(max_val) < Number(min_val))) {
        error_box_max.innerHTML = "Max value less than min value";
        ret_val = false;
    }

    if (ret_val == true) {
        error_box_max.innerHTML = "";
    }

    return ret_val;
};

function validate_groups() {
    let groups = Number(document.getElementById('nr_of_groups').selectedIndex)

    if (groups == 0) {
        document.getElementById('groups-error').innerHTML = "Choose nr of groups"
        return false;
    }

    document.getElementById('groups-error').innerHTML = ""
    return true;
}

function sendUserData() {
    update_variables_forms()
    let vars = "";
    let mins = "";
    let maxs = "";
    let filename = document.getElementById("filename").value.trim();
    let groups = Number(document.getElementById('nr_of_groups').selectedIndex);

    if ((validate_filename() == false) || (validate_data() == false) || validate_groups() == false) {
        return;
    }

    let code = document.getElementById("LateXCode").value

    if (code.match(/^[\s]*$/g)) {
        open_modal('error-modal', "Code must contain at least one non-white character")
        return
    }

    // prepare string with variables info
    VARIABLES.forEach((variable_name) => { 
        mins += document.getElementById("min-" + variable_name).value + ' ';
        maxs += document.getElementById("max-" + variable_name).value + ' ';
        vars += variable_name + ' ';
    })

    var userData = {
        'filename' : filename,
        'code' : code,
        'vars': vars, 
        'mins' : mins,
        'maxs' : maxs,
        'groups' : groups
    };

    csrf_token = document.getElementById('code_column').getAttribute('data-csrf-token')
    fetch(encodeURIComponent(`/process-data/${JSON.stringify(userData)}/${csrf_token}`), {
        headers : {
            'Content-Type' : 'application/json'
        },
        method : 'POST',
        body : userData
    })
    .then(function (response) {
        return response.text();
    }).then(function (text) {
        const obj = JSON.parse(text)
        if (obj["status"] === "ok") {
            window.location.assign('/download-pdf?filename=' + filename)
        } else {
            let error_msg = obj["response"].replace(/\n/g,'<br>')
            open_modal('error-modal', error_msg)
        }
    });
}

function generate_preview() {
    update_variables_forms()
    let vars = "";
    let mins = "";
    let maxs = "";

    code = document.getElementById("LateXCode").value

    if (code.match(/^[\s]*$/g)) {
        open_modal('error-modal', "Code must contain at least one non-white character")
        return
    }

    if (validate_groups() == false || validate_data() == false) {
        return;
    }

    // prepare string with variables info
    VARIABLES.forEach((variable_name) => { 
        mins += document.getElementById("min-" + variable_name).value + ' ';
        maxs += document.getElementById("max-" + variable_name).value + ' ';
        vars += variable_name + ' ';
    })

    groups = Number(document.getElementById('nr_of_groups').selectedIndex);

    var userData = {
        'code' : document.getElementById("LateXCode").value,
        'vars': vars, 
        'mins' : mins,
        'maxs' : maxs,
        'groups' : groups
    };

    csrf_token = document.getElementById('code_column').getAttribute('data-csrf-token')
    fetch(encodeURIComponent(`/generate-preview/${JSON.stringify(userData)}/${csrf_token}`), {
        headers : {
            'Content-Type' : 'application/json'
        },
        method : 'POST',
        body : userData
    })
    .then(function (response) {
        return response.text();
    }).then(function (text) {
        const obj = JSON.parse(text)
        if (obj["status"] === "ok") {
            preview = document.getElementById('preview')
            preview.setAttribute("src", `/generate_pdf?filename=preview/preview`)
        } else {
            let error_msg = obj["response"].replace(/\n/g,'<br>')
            open_modal('error-modal', error_msg)
        }
    });
}

function apply_template() {
    var selected_file = document.getElementById("saved_files");

    if (selected_file.selectedIndex == 0) {
        open_modal('error-modal', 'Choose file')
        return;
    }

    var filename = selected_file.options[selected_file.selectedIndex].text;
    var latex_code = document.getElementById("LateXCode")
    var userData = {
        'filename' : filename
    };

    //get code from the server
    csrf_token = document.getElementById('code_column').getAttribute('data-csrf-token')
    fetch(encodeURIComponent(`/get-latex-code/${JSON.stringify(userData)}/${csrf_token}`), {
        headers : {
            'Content-Type' : 'application/json'
        },
        method : 'POST',
        body : userData
    })
    .then(function (response) {
        return response.text();
    }).then(function (text) {
        const obj = JSON.parse(text)
        if (obj["status"] === "ok") {
            latex_code.innerHTML = obj["response"]
            latex_code.value = obj["response"]
            update_variables_forms()
        } else {
            open_modal('error-modal', obj["response"])
        }
    });
}

function addEventListeners() {

    // assign function to download buttons
    document.querySelectorAll('.download-button').forEach(
        function(button) {
            button.onclick = function() {
                window.location.assign('/download-pdf?filename=' + button.id.substring(1)); }});

    // assign function to delete buttons
    document.querySelectorAll('.delete-button').forEach(
        function(button) {
            button.onclick = function() {
                filename = button.id.substring(8)
                open_modal('delete-file-modal', 'Are you sure to delete this file?', `Delete file ${filename}`)
                document.getElementById('delete-file-button').onclick = function() {
                    window.location.assign('/delete-pdf?filename=' + filename);}}});

    // assign funtions to get-latex-code buttons
    document.querySelectorAll('.get-tex-file-button').forEach(
        function(button) {
            button.onclick = async function() {
                let filename = button.id.substring(10)
                let response = await fetch('/get-tex-code?filename=' + filename)
                let code = await response.text()
                document.getElementById('get-tex-file-save-file-button').onclick = function() {
                    window.location.assign('/get-tex-file?filename=' + filename);
                }
                open_modal('get-tex-file-modal', JSON.parse(code)['code'].replace('\n', '<br>'), `LaTeX code (${filename})`) }});

    //closing alerts
    let closeButton = document.querySelector('.close');

    if (closeButton != null) {
        closeButton.addEventListener('click', function() {
        document.querySelector('.alert').remove(); })};
    }


function submitpass() {
    
    var password = document.getElementById("password").value
    var errormsg = false;

    if ((errormsg = validate_username(errormsg)) != true) {
        open_modal("error-modal", errormsg);
    } else if (! validate_email()) {
        open_modal("error-modal", "Invalid email address");
    } else  if (! validate_password(password)) {
        open_modal("error-modal", "Password does not satisfy conditions");
    }  else {
        open_modal("processing-data-modal", "Please wait...", "Processing data")
        var userData = {
            'username' : document.getElementById("username").value,
            'email' : document.getElementById("email").value,
            'password' : document.getElementById("password").value,
            'confirmation' : document.getElementById("confirmation").value
        };
    
        //get code from the server
        fetch(encodeURIComponent(`/register/${JSON.stringify(userData)}`), {
            headers : {
                'Content-Type' : 'application/json'
            },
            method : 'POST',
            body : userData
        })
        .then(function (response) {
            return response.text();
        }).then(function (text) {
            const obj = JSON.parse(text)
            if (obj["status"] === "ok") {
                closeModal("processing-data-modal")
                let msg = `User successfully added.<br> On email ${document.getElementById("email").value}<br> \
                we've sent verification code. Check your inbox.`
                open_modal("success-register-modal", msg)
            } else {
                closeModal("processing-data-modal")
                open_modal("error-modal", obj["response"]);
            }
        });
    }
}

function validate_username() {
    var username_field = document.getElementById("username")
    var username = username_field.value

    if (username === "") {
        return  "Empty username"
    } else if  (username.match(/[\s]/g)) {
        return "Username cannot contain white characters"
    } else if (username.match(/^[_\.\-].*$/g)) {
        return "Username must begin with alphanumeric symbol"
    } else if (! username.match(/^[a-zA-Z0-9][a-zA-Z0-9_\-\.]*$/g)) {
        return "Username contains invalid characters\nOnly letters, digits and '-', '_', '.' are allowed."
    } else if (! username.match(/^[a-zA-Z0-9][a-zA-Z0-9_\-\.]{0,31}$/g)) {
        return "Username exceeds 32 characters"
    } else {
        return true;
    }
}

function validate_email() {
    var email_field = document.getElementById("email")
    var email = email_field.value
    var email_regex = /^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/gm

    if  (email.match(email_regex)) {
        return true;
    }

    return false;
}

function  validate_password(password) {
    var ret_val = true;
    var password_field = document.getElementById("password")

    var small_letter_field = document.getElementById("validator-small-letter")
    var capital_letter_field = document.getElementById("validator-capital-letter")
    var digit_field = document.getElementById("validator-digit")
    var special_character_field = document.getElementById("validator-special-character")
    var length_field = document.getElementById("validator-length")

    const lower_case_letter = /[a-z]/g;
    const capital_letter = /[A-Z]/g
    const digit = /[0-9]/g
    const special_character = /[\{\}\[\]\-()@#$%^&*_+=;:"'./<>?\|`\\!]/g

    if (password.match(lower_case_letter)) {
        small_letter_field.classList.remove("validator-invalid");
        small_letter_field.classList.add("validator-valid");
      } else {
        small_letter_field.classList.remove("validator-valid");
        small_letter_field.classList.add("validator-invalid");
        ret_val = false;
    }

    if (password.match(capital_letter)) {
        capital_letter_field.classList.remove("validator-invalid");
        capital_letter_field.classList.add("validator-valid");
      } else {
        capital_letter_field.classList.remove("validator-valid");
        capital_letter_field.classList.add("validator-invalid");
        ret_val = false;
    }

    if (password.match(digit)) {
        digit_field.classList.remove("validator-invalid");
        digit_field.classList.add("validator-valid");
      } else {
        digit_field.classList.remove("validator-valid");
        digit_field .classList.add("validator-invalid");
        ret_val = false;
    }

    if (password.match(special_character)) {
        special_character_field.classList.remove("validator-invalid");
        special_character_field.classList.add("validator-valid");
      } else {
        special_character_field.classList.remove("validator-valid");
        special_character_field .classList.add("validator-invalid");
        ret_val = false;
    }

    if (password.length >= 8) {
        length_field.classList.remove("validator-invalid");
        length_field.classList.add("validator-valid");
      } else {
        length_field.classList.remove("validator-valid");
        length_field .classList.add("validator-invalid");
        ret_val = false;
    }
    return ret_val;
}

function open_modal(modal_id, message, title) {
    if (message != null) {
        document.getElementById(`${modal_id}-message`).innerHTML = message
    }

    if (title != null) {
        document.getElementById(`${modal_id}-title`).innerHTML = title
    }

    document.getElementById("backdrop").style.display = "block"
    document.getElementById(modal_id).style.display = "block"
    document.getElementById(modal_id).classList.add("show")
    document.body.classList.add("modal-open");
}

function closeModal(modal_id) {
    document.getElementById("backdrop").style.display = "none"
    document.getElementById(modal_id).style.display = "none"
    document.getElementById(modal_id).classList.remove("show")
    document.body.classList.remove("modal-open");
}

document.addEventListener('DOMContentLoaded', addEventListeners);
