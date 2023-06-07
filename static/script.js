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

    form.setAttribute("id", "latex-var-" + variable)

    div1.setAttribute("class", "form-row align-items-center");
    div2.setAttribute("class", "col-auto");
    div3.setAttribute("class", "col-auto");

    input_min.setAttribute("placeholder", "min value");
    input_min.setAttribute("type", "text");
    input_min.setAttribute("class", "form-control mb-2");
    input_min.setAttribute("id", "min-" + variable);

    input_max.setAttribute("placeholder", "max value");
    input_max.setAttribute("type", "text");
    input_max.setAttribute("class", "form-control mb-2");
    input_max.setAttribute("id", "max-" + variable);

    label.innerHTML = "variable: " + variable;

    document.querySelector('#variables-colum').append(form);
    form.append(div1);
    div1.append(div2);
    div1.append(div3);
    div2.append(label);
    div3.append(input_min);
    div3.append(input_max);

    console.log(variable);
};

function update_variables_forms() {
    const str = document.getElementById("LateXCode").value;
    const regexp = /#(.*?)#/g;
    const matches = Array.from(str.matchAll(regexp));
    const new_variables = new Set();

    let i = 0;
    while (i < matches.length) {
        const variable = matches[i][1]
        new_variables.add(variable)
        i += 1;
    }

    const variables_to_remove = setDifference(VARIABLES, new_variables)
    const variables_to_add = setDifference(new_variables, VARIABLES)

    console.log("variables to remove:")
    console.log(variables_to_remove)
    variables_to_remove.forEach((currentElement) => { console.log(currentElement) })
    console.log("variables to add")
    console.log(variables_to_add)

    variables_to_add.forEach((currentElement) => { 
        VARIABLES.add(currentElement)
        createForm(currentElement); })

    variables_to_remove.forEach((currentElement) => { 
        removeID("latex-var-" + currentElement)
        VARIABLES.delete(currentElement)})

    console.log("VARIABLES:")
    console.log(VARIABLES)
};

function sendUserData() {
    let vars = "";
    let mins = "";
    let maxs = "";

    // prepare string with variables info
    VARIABLES.forEach((variable_name) => { 
        mins += document.getElementById("min-" + variable_name).value + ' ';
        maxs += document.getElementById("max-" + variable_name).value + ' ';
        vars += variable_name + ' ';
    })

    var userData = {
        'vars': vars, 
        'mins' : mins,
        'maxs' : maxs
    };

    const request = new XMLHttpRequest()
    request.open('POST', `/process-data/${JSON.stringify(userData)}`)
    request.onload = () => {
        const flaskmessage = request.responseText
        window.location.assign('/download_pdf?filename=' +"FDF")
    }
    request.send()
}

function addEventListeners() {
    var myInterval = setInterval(update_variables_forms, 1000);
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
