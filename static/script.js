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

function addEventListeners() {
    document.querySelectorAll('.download-button').forEach(
        function(button) {
            button.onclick = function() {
                button.innerHTML = button.id;
                window.location.assign('/download_pdf?filename=' + button.id); }});

    //closing alerts
    let closeButton = document.querySelector('.close');
    closeButton.addEventListener('click', function() {
    document.querySelector('.alert').remove(); })};


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

function test() {
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

function test_url() {
    window.location.assign('/test_url/my_vars')
};

function sendUserData() {
    // get variable names
    let str = document.getElementById("LateXCode").value;
    let regexp = /#(.*?)#/g;

    let matches = str.matchAll(regexp);
    matches = Array.from(matches);
    let i = 0;
    let vars = "";

    while (i < matches.length) {
        vars += matches[i][1] + ' ';
        createForm(matches[i][1]);
        i += 1;
    }

    var x = { 'name': 'Piotr', 'type': 'admin', 'vars': vars};
    console.log(x)
    const request = new XMLHttpRequest()
    request.open('POST', `/process-data/${JSON.stringify(x)}`)
    request.onload = () => {
        const flaskmessage = request.responseText
        window.location.assign('/download_pdf?filename=' +"FDF")
    }
    request.send()

}

function myfunction() {

    // const firstname = document.getElementById("fname").value;
    // const lastname = document.getElementById("lname").value;
    const firstname = "Piotr"
    const lastname = "Wasilewski"

    const dict_values = {firstname, lastname} //Pass the javascript variables to a dictionary.
    const s = JSON.stringify(dict_values); // Stringify converts a JavaScript object or value to a JSON string
    console.log(s); // Prints the variables to console window, which are in the JSON format
    window.location.assign('/download_pdf?filename=' + button.id)
    window.alert(s)
    //$.ajax({
    //    url:"/test_url",
    //    type:"POST",
    //    contentType: "application/json",
    //    success: successFunction,
    //    error: errorFunction,
    //    data: JSON.stringify(s)});
}

function successFunction() {
    alert('Hpo')
};

function errorFunction() {
    alert('error')
};

document.addEventListener('DOMContentLoaded', addEventListeners);
