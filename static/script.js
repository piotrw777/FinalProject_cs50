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

    variables_to_remove.forEach((currentElement) => { console.log(currentElement) })

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
        console.log(text)
        const obj = JSON.parse(text)
        if (obj["status"] === "ok") {
            window.location.assign('/download_pdf?filename=' + filename)
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
        console.log(text)
        const obj = JSON.parse(text)
        if (obj["status"] === "ok") {
            preview = document.getElementById('preview')
            preview.setAttribute("src", `/generate_pdf?filename=preview/preview`)
        } else {
            alert(obj["response"])
        }
    });
}

function addEventListeners() {
    setInterval(update_variables_forms, 100);
    setInterval(validate_data, 5000);
    document.querySelectorAll('.download-button').forEach(
        function(button) {
            button.onclick = function() {
                button.innerHTML = button.id;
                window.location.assign('/download_pdf?filename=' + button.id); }});

    //closing alerts
    let closeButton = document.querySelector('.close');
    closeButton.addEventListener('click', function() {
    document.querySelector('.alert').remove(); })};

document.addEventListener('DOMContentLoaded', addEventListeners);
