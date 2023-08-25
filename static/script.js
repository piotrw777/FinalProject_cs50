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

    div1.setAttribute("class", "form-row align-items-center");
    div2.setAttribute("id", "variable_div");
    div3.setAttribute("class", "col-auto");

    input_min.setAttribute("placeholder", "min value");
    input_min.setAttribute("type", "text");
    input_min.setAttribute("class", "form-control");
    input_min.setAttribute("id", "min-" + variable);

    input_max.setAttribute("placeholder", "max value");
    input_max.setAttribute("type", "text");
    input_max.setAttribute("class", "form-control");
    input_max.setAttribute("id", "max-" + variable);

    error_min.setAttribute("id", "error-min-" + variable)
    error_min.setAttribute("class", "error")
    error_max.setAttribute("id", "error-max-" + variable)
    error_max.setAttribute("class", "error")

    label.innerHTML = "variable: " + variable;

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

function update_variables_forms() {
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
        error_box_max.innerHTML = "Maximum value less than minmum value";
        ret_val = false;
    }

    if (ret_val == true) {
        error_box_max.innerHTML = "";
    }

    return ret_val;
};

function sendUserData() {
    let vars = "";
    let mins = "";
    let maxs = "";
    let filename = document.getElementById("filename").value.trim();

    if ((validate_filename() == false) || (validate_data() == false)) {
        return;
    }

    // prepare string with variables info
    VARIABLES.forEach((variable_name) => { 
        mins += document.getElementById("min-" + variable_name).value + ' ';
        maxs += document.getElementById("max-" + variable_name).value + ' ';
        vars += variable_name + ' ';
    })

    groups = Number(document.getElementById('nr_of_groups').selectedIndex) + 1;

    var userData = {
        'filename' : filename,
        'code' : document.getElementById("LateXCode").value,
        'vars': vars, 
        'mins' : mins,
        'maxs' : maxs,
        'groups' : groups
    };

    fetch(encodeURIComponent(`/process-data/${JSON.stringify(userData)}`), {
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
            alert(obj["response"])
        }
    });
}

function generate_preview() {
    let vars = "";
    let mins = "";
    let maxs = "";

    if (validate_data() == false) {
        return;
    }

    // prepare string with variables info
    VARIABLES.forEach((variable_name) => { 
        mins += document.getElementById("min-" + variable_name).value + ' ';
        maxs += document.getElementById("max-" + variable_name).value + ' ';
        vars += variable_name + ' ';
    })

    groups = Number(document.getElementById('nr_of_groups').selectedIndex) + 1;

    var userData = {
        'code' : document.getElementById("LateXCode").value,
        'vars': vars, 
        'mins' : mins,
        'maxs' : maxs,
        'groups' : groups
    };

    fetch(encodeURIComponent(`/generate-preview/${JSON.stringify(userData)}`), {
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
            alert(obj["response"])
        }
    });
}

function apply_template() {
    var selected_file = document.getElementById("saved_files");
    var filename = selected_file.options[selected_file.selectedIndex].text;
    var latex_code = document.getElementById("LateXCode")
    var userData = {
        'filename' : filename
    };

    //get code from the server
    fetch(encodeURIComponent(`/get-latex-code/${JSON.stringify(userData)}`), {
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
        } else {
            alert(obj["response"])
        }
    });

}

function addEventListeners() {
    setInterval(update_variables_forms, 100);
    setInterval(validate_data, 3000);
    setInterval(validate_filename, 3000);

    // assign function to download buttons
    document.querySelectorAll('.download-button').forEach(
        function(button) {
            button.onclick = function() {
                window.location.assign('/download-pdf?filename=' + button.id); }});

    // assign function to delete buttons
    document.querySelectorAll('.delete-button').forEach(
        function(button) {
            button.onclick = function() {
                window.location.assign('/delete-pdf?filename=' + button.id); }});

    //closing alerts
    let closeButton = document.querySelector('.close');
    closeButton.addEventListener('click', function() {
    document.querySelector('.alert').remove(); })};


function submitpass() {
    var password = document.getElementById("password").value

    if (validate_password(password)) {
        alert('password ok')

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
            window.location.assign('/login')
        } else {
            alert(obj["response"])
        }
    });
      
    } else {
        alert('password NOT OK, idziemy po ciebie.')
    }
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

document.addEventListener('DOMContentLoaded', addEventListeners);
