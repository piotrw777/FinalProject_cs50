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
    let str = document.getElementById("LateXCode").value;
    let regexp = /#(.*?)#/g;

    let matches = str.matchAll(regexp);
    matches = Array.from(matches);
    let i = 0;
    let pom = "";

    while (i < matches.length) {
        pom += matches[i][1] + ' ';
        createForm(matches[i][1]);
        i += 1;
    }

    document.getElementById("test").innerHTML = pom;
};

document.addEventListener('DOMContentLoaded', addEventListeners);
